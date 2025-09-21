# apps/inference/serializers.py
from rest_framework import serializers
from apps.history.models import Generation 

class GenerationParamsSerializer(serializers.Serializer):
    temperature     = serializers.FloatField(required=False, min_value=0.0, max_value=2.0, default=0.7)
    top_p           = serializers.FloatField(required=False, min_value=0.0, max_value=1.0, default=0.9)
    top_k           = serializers.IntegerField(required=False, min_value=0, default=50)
    max_new_tokens  = serializers.IntegerField(required=False, min_value=1, default=256)

class GenerateRequestSerializer(serializers.Serializer):
    model_slug = serializers.CharField(required=False)  # optional, can use default
    prompt     = serializers.CharField()
    params     = GenerationParamsSerializer(required=False)

# only if you also have a streaming endpoint:
class GenerateStreamRequestSerializer(GenerateRequestSerializer):
    pass

class GenerationSerializer(serializers.ModelSerializer):
    generation_id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = Generation
        fields = ["generation_id", "prompt", "output", "model_slug", "created_at"]
        read_only_fields = fields


# evaluation module of datasets
class CandidateResponseSerializer(serializers.Serializer):
    label = serializers.ChoiceField(choices=["Accepted", "Refuted"])
    justification = serializers.CharField()

class LabelRequestSerializer(serializers.Serializer):
    claim = serializers.CharField()
    model_slug = serializers.CharField(required=False)                 # optional; default model if omitted
    params = GenerationParamsSerializer(required=False)                # reuse your gen params

class LabelResultSerializer(serializers.Serializer):
    claim = serializers.CharField()
    candidateResponse = CandidateResponseSerializer()
    latency_ms = serializers.IntegerField(required=False)              # useful for UI/metrics
    raw = serializers.CharField(required=False, allow_blank=True)      # (optional) raw model text for audit


class InferenceModelSerializer(serializers.Serializer):
    slug = serializers.CharField()
    repo_id = serializers.CharField()
    backend = serializers.CharField()
    is_active = serializers.BooleanField()
    display_name = serializers.SerializerMethodField()

    def get_display_name(self, obj):
        # nice label for dropdowns
        return f"{obj.slug} ({obj.repo_id})"