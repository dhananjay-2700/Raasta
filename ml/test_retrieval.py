import unittest
from ml.retrieval import retrieve_schemes

class TestSchemeRetrieval(unittest.TestCase):
    
    def test_1_education(self):
        query = "My daughter got admission to college but I cannot afford the fees. My annual income is around 5 lakh."
        response = retrieve_schemes(query)
        self.assertEqual(response.status, "success")
        self.assertTrue(len(response.results) > 0)
        
        # Expect an education or scholarship scheme to rank highly
        top_scheme_id = response.results[0].scheme_id
        # PM_USP_CSS or PM_YASASVI_TCE
        self.assertIn(top_scheme_id, ["PM_USP_CSS", "PM_YASASVI_TCE"])

    def test_2_healthcare(self):
        query = "My father is 73 years old and needs help with hospital treatment."
        response = retrieve_schemes(query)
        self.assertEqual(response.status, "success")
        self.assertTrue(len(response.results) > 0)
        
        # Expect AB_PM_JAY_70_PLUS to be highly ranked
        scheme_ids = [res.scheme_id for res in response.results]
        self.assertIn("AB_PM_JAY_70_PLUS", scheme_ids)

    def test_3_farmer(self):
        query = "I am a farmer and need financial assistance."
        response = retrieve_schemes(query)
        self.assertEqual(response.status, "success")
        self.assertTrue(len(response.results) > 0)
        
        scheme_ids = [res.scheme_id for res in response.results]
        self.assertIn("PM_KISAN", scheme_ids)

    def test_4_ujjwala(self):
        query = "I am a woman and we don't have an LPG connection at home."
        response = retrieve_schemes(query)
        self.assertEqual(response.status, "success")
        self.assertTrue(len(response.results) > 0)
        
        scheme_ids = [res.scheme_id for res in response.results]
        self.assertIn("PMUY_2", scheme_ids)

    def test_5_housing(self):
        query = "I want help buying a house and I don't own a pucca house."
        response = retrieve_schemes(query)
        self.assertEqual(response.status, "success")
        self.assertTrue(len(response.results) > 0)
        
        scheme_ids = [res.scheme_id for res in response.results]
        self.assertIn("PMAY_U_2", scheme_ids)

    def test_6_vague_query(self):
        query = "I need government help."
        response = retrieve_schemes(query)
        
        # Because it's < 3 words excluding vague terms, it should return insufficient_information
        self.assertEqual(response.status, "insufficient_information")
        self.assertEqual(len(response.results), 0)

if __name__ == "__main__":
    unittest.main()
