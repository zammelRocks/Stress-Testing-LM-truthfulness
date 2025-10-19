from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.evaluator import evaluate_with_vllm

class JudgeEvaluationView(APIView):
    def post(self, request):
        try:
            data = request.data
            result = evaluate_with_vllm(
                model_name=data.get("model_name", "facebook/opt-125m"),
                candidate=data.get("user_prompt"),
                reference=data.get("reference"),
                decoding_params={
                    "temperature": data.get("temperature", 0.7),
                    "top_p": data.get("top_p", 0.9),
                    "top_k": data.get("top_k", 40),
                },
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
