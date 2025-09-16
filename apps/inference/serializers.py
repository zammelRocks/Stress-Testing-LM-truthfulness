# apps/inference/serializers.py
from rest_framework import serializers

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
