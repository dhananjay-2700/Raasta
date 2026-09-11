import json
import os
import re
from typing import Union, List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ml.schemas import CitizenInformation
from ml.retrieval_schemas import RetrievalResponse, SchemeResult, Evidence

class SchemeRetriever:
    def __init__(self, schemes_file: str = "ml/schemes.json"):
        self.schemes_file = schemes_file
        self.schemes_data: List[Dict[str, Any]] = []
        self.documents: List[str] = []
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        self.tfidf_matrix = None
        self._load_and_index()

    def _load_and_index(self):
        """Loads schemes.json and builds a searchable TF-IDF document per scheme."""
        if not os.path.exists(self.schemes_file):
            raise FileNotFoundError(f"Schemes file {self.schemes_file} not found.")
            
        with open(self.schemes_file, 'r', encoding='utf-8') as f:
            self.schemes_data = json.load(f)
            
        for scheme in self.schemes_data:
            doc_parts = [
                scheme.get("name", ""),
                scheme.get("description", ""),
                scheme.get("category", ""),
                " ".join(scheme.get("target_problems", [])),
                " ".join(scheme.get("retrieval", {}).get("keywords", [])),
                " ".join(scheme.get("retrieval", {}).get("example_queries", []))
            ]
            self.documents.append(" ".join(doc_parts).lower())
            
        if self.documents:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.documents)

    def _extract_query_text(self, input_query: Union[str, CitizenInformation]) -> str:
        """Extracts a flat search string from either raw text or structured CitizenInformation."""
        if isinstance(input_query, str):
            return input_query.lower()
            
        parts = []
        if input_query.intent and input_query.intent != "unknown":
            parts.append(input_query.intent.replace("_", " "))
        if input_query.summary:
            parts.append(input_query.summary)
            
        relevant_keys = ["purpose", "education_level", "occupation", "relationship", "social_category", "trade_category"]
        for key in relevant_keys:
            if key in input_query.entities:
                parts.append(str(input_query.entities[key].value))
                
        boolean_status_keys = ["is_farmer", "is_street_vendor", "is_artisan"]
        for key in boolean_status_keys:
            if key in input_query.entities and input_query.entities[key].value is True:
                parts.append(key.replace("is_", ""))
                
        return " ".join(parts).lower()

    def _get_keyword_score(self, query_text: str, scheme: dict) -> float:
        """Calculates a score based on presence of retrieval keywords in the query."""
        keywords = scheme.get("retrieval", {}).get("keywords", [])
        if not keywords:
            return 0.0
        # Convert query to set of lowercase words for faster/exact matching
        query_words = set(re.findall(r'\w+', query_text.lower()))
        match_count = 0
        for kw in keywords:
            kw_lower = kw.lower()
            if kw_lower in query_text or kw_lower in query_words:
                match_count += 1
        return min(match_count / max(1, len(keywords) * 0.3), 1.0) # Reach 1.0 quickly if a few keywords match
        
    def _get_intent_category_score(self, input_query: Union[str, CitizenInformation], scheme: dict) -> float:
        """Grants a boost if the structured intent matches the scheme's category."""
        if isinstance(input_query, str):
            return 0.0
            
        intent_category_mapping = {
            "higher_education_financial_assistance": "education",
            "healthcare_assistance": "healthcare",
            "housing_assistance": "housing",
            "farmer_financial_assistance": "agriculture",
            "cooking_fuel_assistance": "welfare",
            "artisan_livelihood_assistance": "livelihood",
            "street_vendor_financial_assistance": "livelihood"
        }
        
        expected_category = intent_category_mapping.get(input_query.intent)
        if expected_category and expected_category == scheme.get("category"):
            return 1.0
        return 0.0

    def _extract_match_reasons(self, query_text: str, scheme: dict) -> List[str]:
        """Provides transparency on why a scheme matched."""
        reasons = []
        keywords = scheme.get("retrieval", {}).get("keywords", [])
        for kw in keywords:
            if kw.lower() in query_text:
                reasons.append(kw)
        
        if not reasons:
            reasons.append(f"Category match: {scheme.get('category', 'general')}")
            
        return list(set(reasons))[:3]

    def retrieve(self, input_query: Union[str, CitizenInformation], top_k: int = 3, threshold: float = 0.12) -> RetrievalResponse:
        """Retrieves and scores the top schemes. Returns no results if input is vague."""
        query_text = self._extract_query_text(input_query)
        
        # Guard against vague or overly short inputs
        clean_query = re.sub(r'[^a-zA-Z0-9\s]', '', query_text).strip()
        vague_queries = ["i need help", "i need government help", "help", "unknown", ""]
        
        is_vague = False
        if not clean_query or clean_query in vague_queries or len(clean_query.split()) < 3:
            is_vague = True
        elif not isinstance(input_query, str) and input_query.intent == "unknown" and len(input_query.entities) == 0:
            is_vague = True
            
        if is_vague:
            return RetrievalResponse(
                query=query_text if isinstance(input_query, str) else input_query.summary,
                results=[],
                status="insufficient_information"
            )
            
        # 1. TF-IDF Text Similarity
        query_vec = self.vectorizer.transform([query_text])
        cosine_sims = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        scored_results = []
        for idx, scheme in enumerate(self.schemes_data):
            tfidf_score = float(cosine_sims[idx])
            keyword_score = self._get_keyword_score(query_text, scheme)
            intent_score = self._get_intent_category_score(input_query, scheme)
            
            # Hybrid Formula
            final_score = (0.60 * tfidf_score) + (0.25 * keyword_score) + (0.15 * intent_score)
            
            if final_score >= threshold:
                evidence_list = []
                for ev in scheme.get("evidence", []):
                    evidence_list.append(Evidence(
                        title=ev.get("title"),
                        source_name=ev.get("source_name", ""),
                        source_url=ev.get("source_url", ""),
                        reference=ev.get("reference", "")
                    ))
                
                scored_results.append({
                    "scheme_id": scheme["scheme_id"],
                    "scheme_name": scheme["name"],
                    "score": round(final_score, 4),
                    "match_reasons": self._extract_match_reasons(query_text, scheme),
                    "evidence": evidence_list
                })
                
        # Sort and take top_k
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        top_results = scored_results[:top_k]
        
        status = "success" if top_results else "no_relevant_scheme"
        
        final_results = [SchemeResult(**r) for r in top_results]
        
        return RetrievalResponse(
            query=query_text if isinstance(input_query, str) else input_query.summary,
            results=final_results,
            status=status
        )

# Global singleton to prevent reloading json/vectorizer on every call
scheme_retriever = SchemeRetriever()

def retrieve_schemes(input_query: Union[str, CitizenInformation], top_k: int = 3) -> RetrievalResponse:
    return scheme_retriever.retrieve(input_query, top_k)
