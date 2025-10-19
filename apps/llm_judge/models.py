from django.db import models

class EvaluationLog(models.Model):
    model_name = models.CharField(max_length=256)
    dimension = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    top_tokens = models.JSONField()
