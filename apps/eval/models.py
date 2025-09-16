from django.db import models

class Evaluation(models.Model):
    generation_id = models.IntegerField()
    reference = models.TextField()
    metrics = models.JSONField(null=True, blank=True)  # {"bleu":..., "rouge1":..., "rougeL":..., "cosine":...}
    created_at = models.DateTimeField(auto_now_add=True)
    
class JudgeEvaluation(models.Model):
    generation_id = models.IntegerField()                 # or FK to history.Generation
    reference     = models.TextField()
    judge_model   = models.CharField(max_length=100, default="mistral:7b")
    scores        = models.JSONField()                    # {"correctness":..., "relevance":..., "fluency":..., "overall":...}
    created_at    = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [models.Index(fields=["judge_model", "created_at"])]

