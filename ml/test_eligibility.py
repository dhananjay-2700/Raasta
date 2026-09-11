import unittest
from ml.schemas import CitizenInformation, EntityExtraction
from ml.eligibility import evaluate_eligibility

class TestEligibilityEngine(unittest.TestCase):
    
    def setUp(self):
        self.pm_usp_scheme = {
            "scheme_id": "PM_USP_CSS",
            "name": "PM-USP",
            "eligibility": {
                "rules": [
                    {"field": "annual_income", "operator": "<=", "value": 450000, "description": "Max income 4.5L"}
                ]
            }
        }
        
        self.pm_jay_70_scheme = {
            "scheme_id": "PM_JAY_70",
            "name": "PM-JAY 70+",
            "eligibility": {
                "rules": [
                    {"field": "age", "operator": ">=", "value": 70, "description": "Must be 70+"}
                ]
            }
        }
        
        self.pmuy_scheme = {
            "scheme_id": "PMUY_2",
            "name": "PMUY 2.0",
            "eligibility": {
                "rules": [
                    {"field": "gender", "operator": "==", "value": "female"},
                    {"field": "age", "operator": ">=", "value": 18},
                    {"field": "has_existing_lpg_connection", "operator": "==", "value": False}
                ]
            }
        }
        
        self.verification_scheme = {
            "scheme_id": "VERIF_SCHEME",
            "name": "Verification Scheme",
            "eligibility": {
                "rules": [
                    {"field": "is_secc_2011_deprived", "operator": "==", "value": "verification_required"}
                ]
            }
        }

    def _make_citizen(self, entities_dict) -> CitizenInformation:
        entities = {}
        for k, v in entities_dict.items():
            entities[k] = EntityExtraction(value=v, confidence=0.9, source="test")
        return CitizenInformation(intent="test", summary="test", entities=entities)

    def test_1_pm_usp_eligible(self):
        citizen = self._make_citizen({"annual_income": 400000})
        res = evaluate_eligibility(citizen, self.pm_usp_scheme)
        self.assertEqual(res.status, "eligible")
        self.assertEqual(len(res.matched_rules), 1)
        self.assertEqual(len(res.failed_rules), 0)

    def test_2_pm_usp_ineligible(self):
        citizen = self._make_citizen({"annual_income": 500000})
        res = evaluate_eligibility(citizen, self.pm_usp_scheme)
        self.assertEqual(res.status, "ineligible")
        self.assertEqual(len(res.failed_rules), 1)

    def test_3_pm_usp_missing_info(self):
        citizen = self._make_citizen({}) # missing income
        res = evaluate_eligibility(citizen, self.pm_usp_scheme)
        self.assertEqual(res.status, "needs_information")
        self.assertEqual(len(res.missing_information), 1)

    def test_4_pm_jay_70_eligible(self):
        citizen = self._make_citizen({"age": 73})
        res = evaluate_eligibility(citizen, self.pm_jay_70_scheme)
        self.assertEqual(res.status, "eligible")

    def test_5_pm_jay_70_ineligible(self):
        citizen = self._make_citizen({"age": 65})
        res = evaluate_eligibility(citizen, self.pm_jay_70_scheme)
        self.assertEqual(res.status, "ineligible")

    def test_6_pmuy_eligible_boolean_logic(self):
        citizen = self._make_citizen({
            "gender": "female", 
            "age": 28, 
            "has_existing_lpg_connection": False
        })
        res = evaluate_eligibility(citizen, self.pmuy_scheme)
        self.assertEqual(res.status, "eligible")

    def test_7_pmuy_missing_lpg(self):
        citizen = self._make_citizen({
            "gender": "female", 
            "age": 28
        }) # Missing has_existing_lpg_connection
        res = evaluate_eligibility(citizen, self.pmuy_scheme)
        self.assertEqual(res.status, "needs_information")

    def test_8_multiple_rules_one_fails(self):
        citizen = self._make_citizen({
            "gender": "female", 
            "age": 16, # FAILS
            "has_existing_lpg_connection": False
        })
        res = evaluate_eligibility(citizen, self.pmuy_scheme)
        self.assertEqual(res.status, "ineligible")
        self.assertEqual(len(res.failed_rules), 1)
        self.assertEqual(len(res.matched_rules), 2)

    def test_9_multiple_rules_one_missing_none_fail(self):
        citizen = self._make_citizen({
            "gender": "female", 
            # age is missing
            "has_existing_lpg_connection": False
        })
        res = evaluate_eligibility(citizen, self.pmuy_scheme)
        self.assertEqual(res.status, "needs_information")
        self.assertEqual(len(res.failed_rules), 0)

    def test_10_verification_required(self):
        citizen = self._make_citizen({"is_secc_2011_deprived": True})
        res = evaluate_eligibility(citizen, self.verification_scheme)
        # It must NOT be eligible, it should be needs_information due to verification
        self.assertEqual(res.status, "needs_information")
        self.assertEqual(len(res.verification_required), 1)
        self.assertEqual(len(res.matched_rules), 0)

if __name__ == "__main__":
    unittest.main()
