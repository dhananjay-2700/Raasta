from typing import Dict, Any, List, Optional
from ml.schemas import CitizenInformation
from ml.eligibility_schemas import EligibilityResponse
from ml.evidence_schemas import OfficialEvidence, ProvenanceRecord, RuleEvidence, ProvenanceReport

def build_provenance(citizen_info: CitizenInformation, scheme: Dict[str, Any], eligibility_result: EligibilityResponse) -> ProvenanceReport:
    """
    Combines citizen facts, rules, and official evidence into a traceable provenance chain.
    """
    # 1. Map citizen entities to their provenance
    citizen_prov_map: Dict[str, ProvenanceRecord] = {}
    for field, entity in citizen_info.entities.items():
        if entity.value is not None:
            source_type = "citizen_conversation"
            # Future-proofing for OCR
            if "document" in entity.source.lower() or "ocr" in entity.source.lower():
                source_type = "document"
                
            citizen_prov_map[field] = ProvenanceRecord(
                field=field,
                value=entity.value,
                confidence=entity.confidence,
                source_type=source_type,
                source_description=entity.source
            )
            
    scheme_evidence_list = scheme.get("evidence", [])
    
    def _find_evidence(field: str) -> OfficialEvidence:
        # If no evidence array exists, explicitly return evidence_unavailable
        if not scheme_evidence_list:
            return OfficialEvidence(
                source_name="evidence_unavailable",
                source_url="evidence_unavailable",
                reference="evidence_unavailable"
            )
            
        # Attempt to find field-specific evidence
        field_clean = field.replace("_", " ").lower()
        for ev in scheme_evidence_list:
            if field_clean in ev.get("reference", "").lower() or field_clean in ev.get("title", "").lower():
                return OfficialEvidence(
                    source_name=ev.get("source_name", "evidence_unavailable"),
                    source_url=ev.get("source_url", "evidence_unavailable"),
                    reference=ev.get("reference", "evidence_unavailable")
                )
                
        # Fallback to the first available generic evidence for the scheme
        ev = scheme_evidence_list[0]
        return OfficialEvidence(
            source_name=ev.get("source_name", "evidence_unavailable"),
            source_url=ev.get("source_url", "evidence_unavailable"),
            reference=ev.get("reference", "evidence_unavailable")
        )

    # 2. Build the RuleEvidence chain based on the scheme's rules
    rule_provenance_chain = []
    rules = scheme.get("eligibility", {}).get("rules", [])
    
    for rule in rules:
        field = rule.get("field")
        operator = rule.get("operator")
        required_val = rule.get("value")
        
        off_ev = _find_evidence(field)
        
        # Check verification required state
        if str(required_val).lower() == "verification_required" or str(operator).lower() == "verification_required":
            rule_provenance_chain.append(RuleEvidence(
                field=field,
                operator=operator,
                required_value=required_val,
                result="verification_required",
                citizen_provenance=None,
                official_evidence=off_ev,
                explanation=f"{field.replace('_', ' ').capitalize()} requires verification against official government database."
            ))
            continue
            
        # Check missing state
        cit_prov = citizen_prov_map.get(field)
        if not cit_prov:
            rule_provenance_chain.append(RuleEvidence(
                field=field,
                operator=operator,
                required_value=required_val,
                result="missing",
                citizen_provenance=None,
                official_evidence=off_ev,
                explanation=f"Information for {field.replace('_', ' ')} was not provided."
            ))
            continue
            
        # Lookup result from the EligibilityResponse
        passed = False
        explanation = "Condition evaluated."
        for mr in eligibility_result.matched_rules:
            if mr.field == field:
                passed = True
                explanation = mr.explanation
                break
                
        if not passed:
            for fr in eligibility_result.failed_rules:
                if fr.field == field:
                    passed = False
                    explanation = fr.explanation
                    break
                    
        rule_provenance_chain.append(RuleEvidence(
            field=field,
            operator=operator,
            required_value=required_val,
            result="pass" if passed else "fail",
            citizen_provenance=cit_prov,
            official_evidence=off_ev,
            explanation=explanation
        ))

    return ProvenanceReport(
        scheme_id=eligibility_result.scheme_id,
        eligibility_status=eligibility_result.status,
        rule_provenance_chain=rule_provenance_chain
    )
