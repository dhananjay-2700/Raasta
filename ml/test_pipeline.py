import unittest
from ml.pipeline_schemas import PipelineRequest
from ml.pipeline import run_pipeline

from ml.extraction import MockExtractionProvider

class TestPipeline(unittest.TestCase):
    
    def setUp(self):
        self.provider = MockExtractionProvider()
        
    def test_1_education_pipeline(self):
        req = PipelineRequest(query="My daughter got admission to college but I cannot afford the fees. My annual income is 4 lakh.")
        res = run_pipeline(req, extraction_provider=self.provider)
        
        self.assertEqual(res.status, "success")
        self.assertIsNotNone(res.extraction)
        self.assertTrue(len(res.retrieval["results"]) > 0)
        
        # Check education scheme ranked first
        self.assertIn(res.selected_scheme["scheme_id"], ["PM_USP_CSS", "PM_YASASVI_TCE"])
        self.assertIsNotNone(res.eligibility)
        self.assertIsNotNone(res.provenance)
        self.assertIsNotNone(res.next_best_action)

    def test_2_healthcare_pipeline(self):
        req = PipelineRequest(query="My father is 73 and needs hospital treatment.")
        res = run_pipeline(req, extraction_provider=self.provider)
        
        self.assertEqual(res.status, "success")
        self.assertIn("AB_PM_JAY_70_PLUS", [r["scheme_id"] for r in res.retrieval["results"]])

    def test_3_farmer_pipeline(self):
        req = PipelineRequest(query="I am a farmer and need financial assistance.")
        res = run_pipeline(req, extraction_provider=self.provider)
        
        self.assertEqual(res.status, "success")
        self.assertIn("PM_KISAN", res.selected_scheme["scheme_id"])

    def test_4_vague_query(self):
        req = PipelineRequest(query="I need government help.")
        res = run_pipeline(req, extraction_provider=self.provider)
        
        # Assert no scheme fabricated, status mapped to insufficient_information
        self.assertEqual(res.status, "insufficient_information")
        self.assertIsNone(res.selected_scheme)
        self.assertIsNone(res.eligibility)
        self.assertIsNone(res.provenance)
        self.assertEqual(res.next_best_action.action_type, "request_information")

    def test_5_missing_eligibility_information(self):
        req = PipelineRequest(query="My daughter got admission to college but I cannot afford the fees.")
        res = run_pipeline(req, extraction_provider=self.provider)
        
        self.assertEqual(res.status, "success")
        # Income is missing, so eligibility status must be needs_information
        self.assertEqual(res.eligibility.status, "needs_information")
        self.assertEqual(res.next_best_action.action_type, "request_information")
        self.assertIn(res.next_best_action.required_item, ["annual_income", "class_12_percentile", "previous_class_marks_percentage"])

if __name__ == "__main__":
    unittest.main()
