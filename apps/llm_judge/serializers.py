from rest_framework import serializers

class EvaluationRequestSerializer(serializers.Serializer):
    system_prompt = serializers.CharField()
    user_prompt = serializers.CharField()
    reference = serializers.CharField()
    model_name = serializers.CharField()
    decoding_method = serializers.ChoiceField(
        choices=["greedy", "top_p", "top_k", "beam_search"]
    )
    temperature = serializers.FloatField(required=False, default=1.0)
    top_p = serializers.FloatField(required=False, default=0.9)
    top_k = serializers.IntegerField(required=False, default=40)
    beam_width = serializers.IntegerField(required=False, default=5)
