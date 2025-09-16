from django.contrib import admin
import json
from .models import JudgeEvaluation


@admin.register(JudgeEvaluation)
class JudgeEvaluationAdmin(admin.ModelAdmin):
    # Use method names in list_display so it works even if fields are missing
    list_display = (
        "id",
        "generation_id_display",
        "overall_display",
        "correctness_display",
        "relevance_display",
        "fluency_display",
        "created_display",
        "reference_preview",
        "candidate_preview",
    )
    search_fields = ("reference", "candidate")
    list_filter = ("created_at",)
    ordering = ("-created_at",)

    # ---------- helpers ----------
    def _scores_dict(self, obj):
        """
        Return a dict of scores from either explicit fields or a JSON/str field (e.g. obj.scores).
        """
        # If model has explicit fields, short-circuit with a dict built from them.
        explicit = {}
        for k in ("correctness", "relevance", "fluency", "overall"):
            if hasattr(obj, k):
                explicit[k] = getattr(obj, k)
        if explicit:
            return explicit

        # Otherwise try common container fields
        for attr in ("scores", "score", "data", "payload"):
            if hasattr(obj, attr):
                val = getattr(obj, attr)
                if isinstance(val, dict):
                    return val
                if isinstance(val, str):
                    try:
                        return json.loads(val)
                    except Exception:
                        return {}
        return {}

    def _score_val(self, obj, key):
        # Prefer explicit attribute, else fall back to the parsed dict
        if hasattr(obj, key):
            try:
                return round(float(getattr(obj, key)), 1)
            except Exception:
                return getattr(obj, key)
        d = self._scores_dict(obj)
        v = d.get(key)
        try:
            return round(float(v), 1) if v is not None else "-"
        except Exception:
            return v if v is not None else "-"

    # ---------- list_display methods ----------
    def generation_id_display(self, obj):
        return getattr(obj, "generation_id", "") or "-"
    generation_id_display.short_description = "Gen ID"

    def overall_display(self, obj):
        return self._score_val(obj, "overall")
    overall_display.short_description = "Overall"

    def correctness_display(self, obj):
        return self._score_val(obj, "correctness")
    correctness_display.short_description = "Correctness"

    def relevance_display(self, obj):
        return self._score_val(obj, "relevance")
    relevance_display.short_description = "Relevance"

    def fluency_display(self, obj):
        return self._score_val(obj, "fluency")
    fluency_display.short_description = "Fluency"

    def created_display(self, obj):
        # Works whether the model has created_at or not
        return getattr(obj, "created_at", None) or getattr(obj, "created", None) or "-"
    created_display.short_description = "Created"

    def reference_preview(self, obj):
        return (getattr(obj, "reference", "") or "")[:60]
    reference_preview.short_description = "Reference"

    def candidate_preview(self, obj):
        return (getattr(obj, "candidate", "") or "")[:60]
    candidate_preview.short_description = "Candidate"
