import unittest
from ml.nba_schemas import ApplicationState
from ml.nba import get_next_best_action
from ml.schemas import CitizenInformation
from ml.eligibility_schemas import EligibilityResponse, MissingInformation, VerificationRequired
from ml.evidence_schemas import ProvenanceReport

class TestNextBestAction(unittest.TestCase):
    
    def setUp(self):
        self.dummy_cit = CitizenInformation(intent="test", summary="test", entities={})
        self.dummy_prov = ProvenanceReport(scheme_id="test", eligibility_status="eligible", rule_provenance_chain=[])
        
    def _make_eligibility(self, status, missing=None, verif=None):
        return EligibilityResponse(
            scheme_id="test",
            scheme_name="Test Scheme",
            status=status,
            matched_rules=[],
            failed_rules=[],
            missing_information=missing or [],
            verification_required=verif or [],
            explanation="Test"
        )

    def test_1_missing_information(self):
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("needs_information", missing=[MissingInformation(field="annual_income", explanation="Missing")])
        app_state = ApplicationState(uploaded_documents=[])
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "request_information")
        self.assertEqual(nba.required_item, "annual_income")

    def test_2_missing_document(self):
        scheme = {"required_documents": ["Income Certificate"]}
        # No missing information, status is eligible
        el_res = self._make_eligibility("eligible")
        app_state = ApplicationState(uploaded_documents=[]) # Missing doc
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "upload_document")
        self.assertEqual(nba.required_item, "Income Certificate")

    def test_3_verification_required(self):
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("needs_information", verif=[VerificationRequired(field="secc_db", explanation="Verify")])
        app_state = ApplicationState(uploaded_documents=["Income Certificate"]) # Has doc
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "verify_information")
        self.assertEqual(nba.required_item, "secc_db")

    def test_4_eligible_needs_review(self):
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("eligible")
        app_state = ApplicationState(uploaded_documents=["Income Certificate"], reviewed=False)
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "review_application")

    def test_5_reviewed_needs_consent(self):
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("eligible")
        app_state = ApplicationState(uploaded_documents=["Income Certificate"], reviewed=True, consent_given=False)
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "give_consent")

    def test_6_consent_given_needs_submit(self):
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("eligible")
        app_state = ApplicationState(uploaded_documents=["Income Certificate"], reviewed=True, consent_given=True, submitted=False)
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "submit_application")

    def test_7_submitted_track(self):
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("eligible")
        app_state = ApplicationState(uploaded_documents=["Income Certificate"], reviewed=True, consent_given=True, submitted=True, application_id="APP123")
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "track_application")
        self.assertEqual(nba.required_item, "APP123")

    def test_8_ineligible(self):
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("ineligible")
        app_state = ApplicationState(uploaded_documents=[]) # Missing doc
        
        # Even if doc is missing, inelasticity takes absolute priority 0
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "no_action")
        self.assertEqual(nba.priority, "low")

    def test_9_fact_provided_doc_missing(self):
        # Fact is provided (so missing_information is empty), but doc is missing
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility("eligible")
        app_state = ApplicationState(uploaded_documents=[])
        
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "upload_document")

    def test_10_multiple_unresolved_priorities(self):
        # Missing info + Missing doc + Verification Required
        scheme = {"required_documents": ["Income Certificate"]}
        el_res = self._make_eligibility(
            status="needs_information", 
            missing=[MissingInformation(field="annual_income", explanation="Missing")],
            verif=[VerificationRequired(field="secc_db", explanation="Verify")]
        )
        app_state = ApplicationState(uploaded_documents=[], reviewed=False)
        
        # Missing info is Priority 1, so it should trigger first
        nba = get_next_best_action(self.dummy_cit, scheme, el_res, self.dummy_prov, app_state)
        self.assertEqual(nba.action_type, "request_information")
        self.assertEqual(nba.required_item, "annual_income")

if __name__ == "__main__":
    unittest.main()
