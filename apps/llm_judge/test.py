from django.test import TestCase
from rest_framework.test import APIClient

class LlmJudgeApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_evaluate_endpoint(self):
        payload = {
            "system_prompt": "You are an evaluator.",
            "user_prompt": "The sun orbits the Earth.",
            "reference": "The Earth orbits the Sun.",
            "model_name": "facebook/opt-125m",
            "decoding_method": "top_p",
        }
        res = self.client.post("/api/judge/evaluate/", payload, format="json")
        self.assertEqual(res.status_code, 200)
