import logging
from ml.pipeline_schemas import PipelineRequest, PipelineResponse
from ml.nba_schemas import NextBestAction, ApplicationState
from ml.extraction import extract_citizen_information
from ml.retrieval import scheme_retriever
from ml.eligibility import evaluate_eligibility
from ml.provenance import build_provenance
from ml.nba import get_next_best_action

logger = logging.getLogger(__name__)

def run_pipeline(request: PipelineRequest) -> PipelineResponse:
    try:
        query = request.query
        
        # Fast exit on completely empty inputs
        if not query or not query.strip():
            return PipelineResponse(
                status="insufficient_information",
                query=query,
                error_message="Query cannot be empty."
            )
            
        app_state = request.application_state or ApplicationState()
        
        # 1. Extraction
        citizen_info = extract_citizen_information(query)
        
        # 2. Retrieval
        retrieval_res = scheme_retriever.retrieve(citizen_info)
        
        # 3. Handle vague or missing scheme scenarios
        if retrieval_res.status in ["no_relevant_scheme", "insufficient_information"]:
            nba = NextBestAction(
                action_type="request_information",
                title="Tell us more about what you need",
                description="We need more information to find the right government service for you.",
                priority="high",
                reason="The provided query did not contain enough specifics to match an official scheme.",
                required_item=None
            )
            return PipelineResponse(
                status=retrieval_res.status,
                query=query,
                extraction=citizen_info,
                retrieval={"results": [r.model_dump() for r in retrieval_res.results]},
                next_best_action=nba
            )
            
        # Select the highest-ranked scheme
        top_scheme_result = retrieval_res.results[0]
        selected_scheme_meta = {
            "scheme_id": top_scheme_result.scheme_id,
            "scheme_name": top_scheme_result.scheme_name
        }
        
        # Locate the full raw scheme object for the eligibility engine
        full_scheme_data = next((s for s in scheme_retriever.schemes_data if s["scheme_id"] == top_scheme_result.scheme_id), None)
        if not full_scheme_data:
            raise ValueError(f"Full scheme data not found for {top_scheme_result.scheme_id} in JSON.")
            
        # 4. Eligibility
        el_res = evaluate_eligibility(citizen_info, full_scheme_data)
        
        # 5. Provenance
        prov_res = build_provenance(citizen_info, full_scheme_data, el_res)
        
        # 6. Next Best Action
        nba = get_next_best_action(citizen_info, full_scheme_data, el_res, prov_res, app_state)
        
        return PipelineResponse(
            status="success",
            query=query,
            extraction=citizen_info,
            retrieval={"results": [r.model_dump() for r in retrieval_res.results]},
            selected_scheme=selected_scheme_meta,
            eligibility=el_res,
            provenance=prov_res,
            next_best_action=nba
        )
        
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        return PipelineResponse(
            status="error",
            query=request.query if request else "",
            error_message=str(e)
        )
