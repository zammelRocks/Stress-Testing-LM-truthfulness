from django.db import models
from django.utils import timezone

class Generation(models.Model):
    model = models.CharField(max_length=100)        # slug (e.g. "gemma3-4b-ollama")
    prompt = models.TextField()
    output = models.TextField(blank=True, null=True)
    latency_ms = models.IntegerField(null=True, blank=True)
    finish_reason = models.CharField(max_length=50, blank=True, null=True)
    usage = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.model} #{self.id} ({len(self.output or '')} chars)"

