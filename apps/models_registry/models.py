from django.db import models
from apps.inference.models import Generation 

class ModelBackend(models.TextChoices):
    HF_ENDPOINT = "hf_endpoint", "HF Inference Endpoint"
    TGI = "tgi", "Text Generation Inference"
    LOCAL = "local", "Local Transformers"
    HF_ROUTER  = "hf_router", "HF OpenAI-Compatible Router" 
    OLLAMA     = "ollama", "Ollama" 

class HFModel(models.Model):
    slug = models.SlugField(unique=True)           
    display_name = models.CharField(max_length=120)
    repo_id = models.CharField(max_length=200)      
    backend = models.CharField(max_length=20, choices=ModelBackend.choices)
    endpoint_url = models.URLField(null=True, blank=True) 
    is_active = models.BooleanField(default=True)
    default_params = models.JSONField(default=dict)  
    def __str__(self): return f"{self.display_name} ({self.backend})"

class JudgeEvaluation(models.Model):
    generation = models.ForeignKey(Generation, on_delete=models.CASCADE)
    reference = models.TextField()
    correctness = models.FloatField()
    relevance = models.FloatField()
    fluency = models.FloatField()
    overall = models.FloatField()
    judge_model = models.CharField(max_length=100, default="mistral:7b")
    prompt_version = models.CharField(max_length=20, default="v1")
    latency_ms = models.IntegerField(default=0)
    raw_text = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, default="ok")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"JudgeEval #{self.id} ({self.judge_model}) -> {self.overall}"