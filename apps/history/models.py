from django.db import models
from django.conf import settings

class Generation(models.Model):
    user = models.ForeignKey(getattr(settings, "AUTH_USER_MODEL", "auth.User"),
                             null=True, blank=True, on_delete=models.SET_NULL)
    model_slug = models.SlugField()
    prompt = models.TextField()
    params = models.JSONField(default=dict)
    output = models.TextField(blank=True)
    latency_ms = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
