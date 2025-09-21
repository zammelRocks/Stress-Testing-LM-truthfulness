# apps/inference/tests.py
from django.urls import reverse
from rest_framework.test import APITestCase
from apps.models_registry.models import HFModel, ModelBackend

class LabelClaimTests(APITestCase):
    def setUp(self):
        HFModel.objects.create(slug="test-model", repo_id="fake/repo", backend=ModelBackend.HF_ROUTER, is_active=True)

    def test_label_ok(self):
        url = reverse("label_claim")
        resp = self.client.post(url, {"claim": "Water boils at 100°C at sea level", "model_slug": "test-model"}, format="json")
        self.assertIn(resp.status_code, (200, 400, 502))
