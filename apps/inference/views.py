# apps/inference/views.py
from __future__ import annotations

import json
import logging
from typing import Generator, Optional
import re
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
from .serializers import (
    GenerateRequestSerializer, GenerateStreamRequestSerializer,
    LabelRequestSerializer, LabelResultSerializer
)
from django.shortcuts import get_object_or_404
from apps.models_registry.models import HFModel, ModelBackend

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

# datasets evaluation 

def _normalize_label(s: str) -> Optional[str]:
    if not s:
        return None
    t = s.strip().lower()
    pos = {"accepted", "support", "supported", "true", "yes", "correct"}
    neg = {"refuted", "reject", "rejected", "false", "no", "incorrect", "not supported"}
    if t in pos: return "Accepted"
    if t in neg: return "Refuted"
    if any(k in t for k in ["refut", "false", "not supported", "incorrect"]): return "Refuted"
    if any(k in t for k in ["accept", "support", "true", "correct", "supported"]): return "Accepted"
    return None

def _extract_label_and_justification(text: str) -> tuple[Optional[str], str]:
    if not text:
        return None, ""
    # try JSON
    try:
        j = json.loads(text)
        if isinstance(j, dict):
            lab = _normalize_label(j.get("label", ""))
            just = (j.get("justification", "") or "").strip()
            if lab:
                return lab, just
    except Exception:
        pass
    # try "Label: ...", "Justification: ..."
    m_lab = re.search(r"label\s*[:\-]\s*(.+)", text, re.I)
    m_jus = re.search(r"(justification|reason|because)\s*[:\-]\s*(.+)", text, re.I)
    lab2 = _normalize_label(m_lab.group(1)) if m_lab else None
    jus2 = (m_jus.group(2).strip() if m_jus else "").strip()
    if lab2:
        return lab2, jus2
    # heuristic: first sentence verdict + rest as reason
    parts = re.split(r"(?<=[\.\!\?])\s+", text.strip(), maxsplit=1)
    lab3 = _normalize_label(parts[0])
    jus3 = (parts[1] if len(parts) > 1 else text).strip()
    return lab3, jus3[:500]


@method_decorator(csrf_exempt, name="dispatch")
class LabelClaimView(APIView):
    """
    POST /api/inference/label/
    Body: { "claim": "...", "model_slug": "optional", "params": {...} }
    """

    MAX_JUST_LEN = 500  # keep UI tidy

    def post(self, request):
        # 1) Validate request
        s = LabelRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        claim: str = s.validated_data["claim"]
        model_slug: Optional[str] = s.validated_data.get("model_slug")
        params: dict = s.validated_data.get("params") or {}

        # 2) Resolve model (OLLAMA only)
        if model_slug:
            model = get_object_or_404(
                HFModel, slug=model_slug, is_active=True, backend=ModelBackend.OLLAMA
            )
        else:
            model = (
                HFModel.objects.filter(is_active=True, backend=ModelBackend.OLLAMA)
                .order_by("id")
                .first()
            )
            if not model:
                return Response(
                    {"error": "no_active_model", "detail": "No active OLLAMA model available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # 3) Build prompt (JSON-only response for robust parsing)
        prompt = (
            "You are a binary fact checker. Given a CLAIM, decide if it is Accepted or Refuted, "
            "and provide a BRIEF justification grounded in general knowledge.\n\n"
            f"CLAIM: {claim}\n\n"
            "Respond in JSON ONLY with keys: "
            'label (Accepted|Refuted), justification (<= 2 sentences).'
        )

        # 4) Call model
        try:
            result = generate_for_model(model, prompt, params)  # returns GenResult(text, latency_ms)
        except Exception as e:
            logger.exception("inference failed (model=%s)", getattr(model, "slug", "?"))
            return Response(
                {"error": "inference_failed", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5) Clean model text (strip whitespace & code fences)
        raw_text = (getattr(result, "text", "") or "")
        cleaned_text = raw_text.strip()
        if cleaned_text.startswith("```"):
            # remove leading ```/```json
            cleaned_text = re.sub(r"^```(?:json)?", "", cleaned_text, flags=re.I).strip()
            # remove trailing ```
            cleaned_text = re.sub(r"```$", "", cleaned_text).strip()

        # 6) Make a pretty 'raw' if it's valid JSON; otherwise return cleaned text
        pretty_raw = cleaned_text
        try:
            parsed = json.loads(cleaned_text)
            pretty_raw = json.dumps(parsed, ensure_ascii=False, indent=2)
        except Exception:
            pass  # keep cleaned_text as-is

        # 7) Extract label & justification (uses your helper)
        label, justification = _extract_label_and_justification(cleaned_text)
        if not label:
            return Response(
                {"error": "parse_failed", "raw": pretty_raw},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # 8) Final tidy of justification
        justification = (justification or "").strip().replace("\n", " ").strip('"')
        if len(justification) > self.MAX_JUST_LEN:
            justification = justification[: self.MAX_JUST_LEN - 1].rstrip() + "…"

        # 9) Build response
        payload = {
            "claim": claim,
            "candidateResponse": {
                "label": label,
                "justification": justification,
            },
            "latency_ms": getattr(result, "latency_ms", None),
            "raw": pretty_raw[:2000],  # cap size for safety
        }
        return Response(LabelResultSerializer(payload).data, status=status.HTTP_200_OK)