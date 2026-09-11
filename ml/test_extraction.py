import unittest
from ml.extraction import extract_citizen_information, MockExtractionProvider

class TestCitizenExtraction(unittest.TestCase):
    
    def setUp(self):
        # We explicitly use the mock provider since we don't have a live Gemma server.
        self.provider = MockExtractionProvider()

    def test_1_higher_education(self):
        text = "My daughter got admission to college but I cannot afford the fees. My annual income is around 5 lakh."
        result = extract_citizen_information(text, provider=self.provider)
        
        self.assertEqual(result.intent, "higher_education_financial_assistance")
        self.assertIn("relationship", result.entities)
        self.assertEqual(result.entities["relationship"].value, "daughter")
        self.assertIn("education_level", result.entities)
        self.assertEqual(result.entities["education_level"].value, "college")
        self.assertIn("annual_income", result.entities)
        self.assertEqual(result.entities["annual_income"].value, 500000)

    def test_2_healthcare(self):
        text = "My father is 73 years old and needs help with hospital treatment."
        result = extract_citizen_information(text, provider=self.provider)
        
        self.assertEqual(result.intent, "healthcare_assistance")
        self.assertIn("age", result.entities)
        self.assertEqual(result.entities["age"].value, 73)
        self.assertIn("relationship", result.entities)
        self.assertEqual(result.entities["relationship"].value, "father")
        self.assertIn("purpose", result.entities)
        self.assertEqual(result.entities["purpose"].value, "healthcare/treatment")

    def test_3_farmer(self):
        text = "I am a farmer and own agricultural land. I need financial assistance."
        result = extract_citizen_information(text, provider=self.provider)
        
        self.assertEqual(result.intent, "farmer_financial_assistance")
        self.assertIn("is_farmer", result.entities)
        self.assertTrue(result.entities["is_farmer"].value)
        self.assertIn("landholding_status", result.entities)
        self.assertEqual(result.entities["landholding_status"].value, "present/owned")

    def test_4_ujjwala(self):
        text = "I am a 28 year old woman and we don't have an LPG connection at home."
        result = extract_citizen_information(text, provider=self.provider)
        
        self.assertIn(result.intent, ["cooking_fuel_assistance", "general_government_service"])
        self.assertIn("age", result.entities)
        self.assertEqual(result.entities["age"].value, 28)
        self.assertIn("gender", result.entities)
        self.assertEqual(result.entities["gender"].value, "female")
        self.assertIn("has_existing_lpg_connection", result.entities)
        self.assertFalse(result.entities["has_existing_lpg_connection"].value)

    def test_5_unknown(self):
        text = "I need help."
        result = extract_citizen_information(text, provider=self.provider)
        
        self.assertIn(result.intent, ["unknown", "general_government_service"])
        # No fabricated citizen attributes
        self.assertEqual(len(result.entities), 0)

    def test_empty_input(self):
        result = extract_citizen_information("", provider=self.provider)
        self.assertEqual(result.intent, "unknown")
        self.assertEqual(len(result.entities), 0)

if __name__ == "__main__":
    unittest.main()
