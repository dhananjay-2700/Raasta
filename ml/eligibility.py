import re
from typing import Any, Dict, List, Optional
from ml.schemas import CitizenInformation
from ml.eligibility_schemas import EligibilityResponse, RuleEvaluation, MissingInformation, VerificationRequired
from ml.extraction import _normalize_value

def _evaluate_condition(citizen_val: Any, operator: str, rule_val: Any) -> bool:
    """Deterministically evaluates a single condition."""
    try:
        c_val = _normalize_value(citizen_val)
        r_val = _normalize_value(rule_val)
        
        if operator == '==':
            return c_val == r_val
        if operator == '!=':
            return c_val != r_val
        if operator == '<=':
            return c_val <= r_val
        if operator == '>=':
            return c_val >= r_val
        if operator == '<':
            return c_val < r_val
        if operator == '>':
            return c_val > r_val
        if operator == 'in':
            if not isinstance(r_val, list):
                r_val = [r_val]
            return c_val in [_normalize_value(v) for v in r_val]
        if operator == 'exists':
            return c_val is not None and str(c_val).strip() != ""
            
    except TypeError:
        # e.g., comparing string to int
        return False
        
    return False

def _generate_rule_explanation(field: str, citizen_val: Any, operator: str, rule_val: Any, passed: bool) -> str:
    """Generates a human-readable explanation of a rule evaluation."""
    field_name = field.replace("_", " ").capitalize()
    if passed:
        if operator in ["<=", "<", "=="]:
            return f"{field_name} of {citizen_val} satisfies the requirement ({operator} {rule_val})."
        elif operator in [">=", ">"]:
            return f"{field_name} of {citizen_val} meets the minimum requirement ({operator} {rule_val})."
        else:
            return f"{field_name} '{citizen_val}' matches the requirement."
    else:
        if operator in ["<=", "<"]:
            return f"{field_name} of {citizen_val} exceeds the maximum limit of {rule_val}."
        elif operator in [">=", ">"]:
            return f"{field_name} of {citizen_val} is below the minimum requirement of {rule_val}."
        else:
            return f"{field_name} '{citizen_val}' does not match the required value '{rule_val}'."

def evaluate_eligibility(citizen: CitizenInformation, scheme: Dict[str, Any]) -> EligibilityResponse:
    """
    Evaluates the extracted citizen facts against the deterministic rules of a scheme.
    """
    rules = scheme.get("eligibility", {}).get("rules", [])
    
    matched_rules = []
    failed_rules = []
    missing_info = []
    verification_req = []
    
    # Extract native dictionary mapping from CitizenInformation for easier lookup
    citizen_entities = {k: v.value for k, v in citizen.entities.items() if v.value is not None}
    
    for rule in rules:
        field = rule.get("field")
        operator = rule.get("operator")
        rule_val = rule.get("value")
        desc = rule.get("description", "")
        source_ref = rule.get("source_reference")
        
        # 1. Handle Verification Required
        if str(rule_val).lower() == "verification_required" or str(operator).lower() == "verification_required":
            verification_req.append(VerificationRequired(
                field=field,
                explanation=desc if desc else f"{field.replace('_', ' ').capitalize()} requires verification against official government database."
            ))
            continue
            
        # 2. Handle Missing Information
        if field not in citizen_entities:
            missing_info.append(MissingInformation(
                field=field,
                explanation=f"{field.replace('_', ' ').capitalize()} is required to verify this eligibility condition."
            ))
            continue
            
        citizen_val = citizen_entities[field]
        
        # 3. Evaluate Rule
        passed = _evaluate_condition(citizen_val, operator, rule_val)
        explanation = _generate_rule_explanation(field, citizen_val, operator, rule_val, passed)
        
        rule_eval = RuleEvaluation(
            field=field,
            citizen_value=citizen_val,
            operator=operator,
            required_value=rule_val,
            result="pass" if passed else "fail",
            explanation=explanation,
            source_reference=source_ref
        )
        
        if passed:
            matched_rules.append(rule_eval)
        else:
            failed_rules.append(rule_eval)
            
    # 4. Final Status Resolution
    # Priority: INELIGIBLE > NEEDS_INFORMATION > ELIGIBLE
    if len(failed_rules) > 0:
        status = "ineligible"
        explanation = "Citizen is ineligible because one or more required conditions were not met."
    elif len(missing_info) > 0 or len(verification_req) > 0:
        status = "needs_information"
        explanation = "More information or official verification is needed to definitively determine eligibility."
    else:
        status = "eligible"
        explanation = "Citizen meets all stated eligibility criteria for this scheme."
        
    return EligibilityResponse(
        scheme_id=scheme.get("scheme_id", "UNKNOWN"),
        scheme_name=scheme.get("name", "Unknown Scheme"),
        status=status,
        matched_rules=matched_rules,
        failed_rules=failed_rules,
        missing_information=missing_info,
        verification_required=verification_req,
        explanation=explanation
    )
