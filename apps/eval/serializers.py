from rest_framework import serializers

class EvaluateRequestSerializer(serializers.Serializer):
    generation_id = serializers.IntegerField()
    reference     = serializers.CharField()
    metrics       = serializers.ListField(
        child=serializers.ChoiceField(choices=["bleu", "rouge", "cosine"]),
        allow_empty=False
    )


class JudgeRequestSerializer(serializers.Serializer):
    generation_id = serializers.IntegerField()
    reference = serializers.CharField()
    judge_model = serializers.CharField(required=False, allow_blank=True)
    candidate = serializers.CharField(required=False, allow_blank=True)  # <-- NEW

class CombinedEvalSerializer(serializers.Serializer):
    generation_id = serializers.IntegerField()
    reference     = serializers.CharField()
    metrics       = serializers.ListField(
        child=serializers.ChoiceField(choices=["bleu", "rouge", "cosine"]),
        allow_empty=False
    )
    judge_model   = serializers.CharField(required=False)

    def validate(self, attrs):
        # ensure at least one classic metric or a judge is requested
        if not attrs.get("metrics") and not attrs.get("judge_model"):
            raise serializers.ValidationError("Provide metrics and/or judge_model.")
        return attrs
