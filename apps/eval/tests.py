import json
from unittest.mock import patch
from django.test import TestCase
from apps.inference.models import Generation
from apps.eval.judge import judge_with_mistral

class JudgeSmokeTest(TestCase):
    def setUp(self):
        self.gen = Generation.objects.create(
            model="mistral:7b",
            prompt="Write a haiku about autumn.",
            output="Golden leaves descend,\nCrisp air whispers, cool and slow,\nWinter slumber nears."
        )

    @patch("apps.inference.backends.OllamaBackend.generate")
    def test_judge_with_mistral_parses_scores(self, mock_generate):
        mock_generate.return_value = {"text": json.dumps({
            "correctness": 9, "relevance": "9/10", "fluency": 8.5, "overall": 9
        })}
        scores = judge_with_mistral(self.gen.output, "Write a haiku about autumn.")
        self.assertIn("overall", scores)
        self.assertEqual(scores["correctness"], 9.0)
        self.assertEqual(scores["relevance"], 9.0)
        self.assertEqual(scores["fluency"], 8.5)
        self.assertEqual(scores["overall"], 9.0)
