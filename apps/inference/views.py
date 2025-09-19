# apps/inference/views.py
from __future__ import annotations

import json
import logging
from typing import Generator, Optional

from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.models_registry.models import HFModel
from .serializers import GenerateRequestSerializer, GenerateStreamRequestSerializer
from .router import generate_for_model, stream_for_model
from apps.inference.backends import OllamaBackend 

from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.history.models import Generation  # adjust if needed
from .serializers import GenerationSerializer

logger = logging.getLogger(__name__)

# History is optional: if the app/model isn't present yet, we just skip persisting.
try:
    from apps.history.models import Generation  # type: ignore
except Exception:  # pragma: no cover
    Generation = None  # type: ignore


def _sse(data: dict, event: Optional[str] = None) -> str:
    """
    Server-Sent Events formatter. One event per yield.
    """
    payload = json.dumps(data, ensure_ascii=False)
    lines = []
    if event:
        lines.append(f"event: {event}")
    lines.append(f"data: {payload}")
    lines.append("")  # blank line terminates the SSE event
    return "\n".join(lines) + "\n"


@method_decorator(csrf_exempt, name="dispatch")  # dev-friendly; remove in prod if using CSRF/SessionAuth
class GenerateView(APIView):
    """
    JSON in:
      {
        "model_slug": "gemma3-4b-ollama",
        "prompt": "...",
        "params": {"temperature":0.7, "top_p":0.9, "top_k":40, "max_new_tokens":64}
      }

    JSON out (200):
      {
        "generation_id": 123,      # if history app is installed
        "model": "gemma3-4b-ollama",
        "latency_ms": 842,
        "finish_reason": "stop",   # when available from backend
        "usage": {...},            # when available from backend
        "output": "..."
      }
    """
    def post(self, request):
        # Validate request
        serializer = GenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Load model and inputs
        model = get_object_or_404(HFModel, slug=serializer.validated_data["model_slug"], is_active=True)
        prompt: str = serializer.validated_data["prompt"]
        params: dict = serializer.validated_data.get("params") or {}

        # Call backend
        try:
            result = generate_for_model(model, prompt, params)
        except Exception as e:
            logger.exception("Inference failed for slug=%s", model.slug)
            # Return a readable error instead of a 500
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Optionally persist to history
        gen_id: Optional[int] = None
        if Generation is not None:
            try:
                gen = Generation.objects.create(
                    user=request.user if getattr(request, "user", None) and request.user.is_authenticated else None,
                    model_slug=model.slug,
                    prompt=prompt,
                    params=params,
                    output=getattr(result, "text", "") or "",
                    latency_ms=getattr(result, "latency_ms", None),
                )
                gen_id = gen.id
            except Exception:
                logger.exception("Failed to persist generation history (non-fatal).")
        # apps/inference/views.py (inside post)

        
        return Response(
            {
                "generation_id": gen_id,
                "model": model.slug,
                "latency_ms": getattr(result, "latency_ms", None),
                "finish_reason": getattr(result, "finish_reason", None),
                "usage": getattr(result, "usage", None),
                "output": getattr(result, "text", "") or "",
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_exempt, name="dispatch")  # dev-friendly; remove in prod if using CSRF/SessionAuth
class GenerateStreamView(APIView):
    """
    SSE streaming endpoint. Emits:
      event: start -> {"status":"start"}
      (many)        -> {"token":"..."}  one small chunk per message
      event: done  -> {"status":"done"}

    JSON in is identical to GenerateView.
    """
    def post(self, request):
        serializer = GenerateStreamRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        model = get_object_or_404(HFModel, slug=serializer.validated_data["model_slug"], is_active=True)
        prompt: str = serializer.validated_data["prompt"]
        params: dict = serializer.validated_data.get("params") or {}

        try:
            token_gen = stream_for_model(model, prompt, params)
        except Exception as e:
            logger.exception("Streaming setup failed for slug=%s", model.slug)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        def event_stream() -> Generator[str, None, None]:
            # Start event
            yield _sse({"status": "start"}, event="start")
            try:
                for token in token_gen:
                    # Each chunk/token as its own SSE event (default event type)
                    if token:
                        yield _sse({"token": token})
            except Exception as e:
                logger.exception("Streaming error for slug=%s", model.slug)
                # Send an SSE error event before closing
                yield _sse({"error": str(e)}, event="error")
            # Done event
            yield _sse({"status": "done"}, event="done")

        resp = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        # Recommended headers for SSE
        resp["Cache-Control"] = "no-cache"
        resp["X-Accel-Buffering"] = "no"
        resp["Connection"] = "keep-alive"
        return resp

class GenerationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class GenerationListView(ListAPIView):
    """
    GET /api/inference/generations/?search=haiku&ordering=-created_at&page=1&page_size=20
    """
    serializer_class = GenerationSerializer
    pagination_class = GenerationPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["prompt", "output", "model_slug"]
    ordering_fields = ["created_at", "id"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Generation.objects.all()


class GenerationDetailView(RetrieveAPIView):
    """
    GET /api/inference/generations/<id>/
    """
    serializer_class = GenerationSerializer
    queryset = Generation.objects.all()