import unittest
from ml.schemas import CitizenInformation, EntityExtraction
from ml.eligibility_schemas import EligibilityResponse, RuleEvaluation, VerificationRequired, MissingInformation
from ml.provenance import build_provenance

class TestProvenanceLayer(unittest.TestCase):
    
    def setUp(self):
        self.scheme_with_evidence = {
            "scheme_id": "TEST_SCHEME",
            "eligibility": {
                "rules": [
                    {"field": "annual_income", "operator": "<=", "value": 450000}
                ]
            },
            "evidence": [
                {
                    "source_name": "Official Gov Portal",
                    "source_url": "https://gov.in/scheme",
                    "reference": "Annual income must be <= 450000"
                }
            ]
        }
        
        self.scheme_no_evidence = {
            "scheme_id": "NO_EV_SCHEME",
            "eligibility": {
                "rules": [
                    {"field": "annual_income", "operator": "<=", "value": 450000}
                ]
            }
        }
        
        self.verification_scheme = {
            "scheme_id": "VERIF_SCHEME",
            "eligibility": {
                "rules": [
                    {"field": "is_secc_2011_deprived", "operator": "==", "value": "verification_required"}
                ]
            },
            "evidence": [
                {
                    "source_name": "SECC Database",
                    "source_url": "https://secc.gov.in",
                    "reference": "Requires SECC verification"
                }
            ]
        }

    def _make_citizen(self, entities_dict) -> CitizenInformation:
        entities = {}
        for k, v in entities_dict.items():
            entities[k] = EntityExtraction(value=v, confidence=0.94, source="Citizen Conversation")
        return CitizenInformation(intent="test", summary="test", entities=entities)

    def test_1_citizen_provides_info(self):
        cit = self._make_citizen({"annual_income": 400000})
        # Dummy eligibility result
        el_res = EligibilityResponse(
            scheme_id="TEST_SCHEME",
            scheme_name="Test",
            status="eligible",
            matched_rules=[RuleEvaluation(field="annual_income", citizen_value=400000, operator="<=", required_value=450000, result="pass", explanation="Passed")],
            failed_rules=[], missing_information=[], verification_required=[], explanation="Pass"
        )
        
        prov = build_provenance(cit, self.scheme_with_evidence, el_res)
        rule_prov = prov.rule_provenance_chain[0]
        
        self.assertIsNotNone(rule_prov.citizen_provenance)
        self.assertEqual(rule_prov.citizen_provenance.source_type, "citizen_conversation")
        self.assertEqual(rule_prov.citizen_provenance.confidence, 0.94)

    def test_2_official_evidence_propagated(self):
        cit = self._make_citizen({"annual_income": 400000})
        el_res = EligibilityResponse(
            scheme_id="TEST_SCHEME",
            scheme_name="Test",
            status="eligible",
            matched_rules=[RuleEvaluation(field="annual_income", citizen_value=400000, operator="<=", required_value=450000, result="pass", explanation="Passed")],
            failed_rules=[], missing_information=[], verification_required=[], explanation="Pass"
        )
        prov = build_provenance(cit, self.scheme_with_evidence, el_res)
        rule_prov = prov.rule_provenance_chain[0]
        
        self.assertIsNotNone(rule_prov.official_evidence)
        self.assertEqual(rule_prov.official_evidence.source_url, "https://gov.in/scheme")

    def test_3_evidence_unavailable(self):
        cit = self._make_citizen({"annual_income": 400000})
        el_res = EligibilityResponse(
            scheme_id="NO_EV_SCHEME",
            scheme_name="Test",
            status="eligible",
            matched_rules=[RuleEvaluation(field="annual_income", citizen_value=400000, operator="<=", required_value=450000, result="pass", explanation="Passed")],
            failed_rules=[], missing_information=[], verification_required=[], explanation="Pass"
        )
        prov = build_provenance(cit, self.scheme_no_evidence, el_res)
        rule_prov = prov.rule_provenance_chain[0]
        
        self.assertEqual(rule_prov.official_evidence.source_url, "evidence_unavailable")

    def test_4_citizen_information_missing(self):
        cit = self._make_citizen({}) # missing
        el_res = EligibilityResponse(
            scheme_id="TEST_SCHEME",
            scheme_name="Test",
            status="needs_information",
            matched_rules=[], failed_rules=[], 
            missing_information=[MissingInformation(field="annual_income", explanation="missing")], 
            verification_required=[], explanation="Needs info"
        )
        prov = build_provenance(cit, self.scheme_with_evidence, el_res)
        rule_prov = prov.rule_provenance_chain[0]
        
        self.assertIsNone(rule_prov.citizen_provenance) # No fabricated value
        self.assertEqual(rule_prov.result, "missing")

    def test_5_rule_passes(self):
        cit = self._make_citizen({"annual_income": 400000})
        el_res = EligibilityResponse(
            scheme_id="TEST_SCHEME",
            scheme_name="Test",
            status="eligible",
            matched_rules=[RuleEvaluation(field="annual_income", citizen_value=400000, operator="<=", required_value=450000, result="pass", explanation="Passed")],
            failed_rules=[], missing_information=[], verification_required=[], explanation="Pass"
        )
        prov = build_provenance(cit, self.scheme_with_evidence, el_res)
        rule_prov = prov.rule_provenance_chain[0]
        
        self.assertEqual(rule_prov.result, "pass")
        self.assertIsNotNone(rule_prov.citizen_provenance)
        self.assertIsNotNone(rule_prov.official_evidence)

    def test_6_rule_fails(self):
        cit = self._make_citizen({"annual_income": 500000})
        el_res = EligibilityResponse(
            scheme_id="TEST_SCHEME",
            scheme_name="Test",
            status="ineligible",
            matched_rules=[],
            failed_rules=[RuleEvaluation(field="annual_income", citizen_value=500000, operator="<=", required_value=450000, result="fail", explanation="Failed")],
            missing_information=[], verification_required=[], explanation="Fail"
        )
        prov = build_provenance(cit, self.scheme_with_evidence, el_res)
        rule_prov = prov.rule_provenance_chain[0]
        
        self.assertEqual(rule_prov.result, "fail")
        self.assertIsNotNone(rule_prov.official_evidence) # Even on failure, official evidence is preserved

    def test_7_verification_required(self):
        cit = self._make_citizen({"is_secc_2011_deprived": True})
        el_res = EligibilityResponse(
            scheme_id="VERIF_SCHEME",
            scheme_name="Test",
            status="needs_information",
            matched_rules=[], failed_rules=[], missing_information=[],
            verification_required=[VerificationRequired(field="is_secc_2011_deprived", explanation="Verify")], 
            explanation="Needs Info"
        )
        prov = build_provenance(cit, self.verification_scheme, el_res)
        rule_prov = prov.rule_provenance_chain[0]
        
        self.assertEqual(rule_prov.result, "verification_required")
        self.assertIsNone(rule_prov.citizen_provenance) # Not using citizen value since it needs official DB

if __name__ == "__main__":
    unittest.main()
