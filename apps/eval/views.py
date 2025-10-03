# apps/eval/views.py
from __future__ import annotations
from typing import Any, Dict
import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.history.models import Generation
from .models import Evaluation, JudgeEvaluation
from .serializers import (
    EvaluateRequestSerializer,
    JudgeRequestSerializer,
    CombinedEvalSerializer,
)
from .metrics import bleu as _bleu, rouge as _rouge, cosine as _cosine
from .judge import judge_with_mistral

logger = logging.getLogger(__name__)


def _judge_model_has_scores_field() -> bool:
    """Detect if JudgeEvaluation has a JSONField named 'scores'."""
    try:
        for f in JudgeEvaluation._meta.get_fields():
            if getattr(f, "name", None) == "scores":
                return True
    except Exception:
        pass
    return False


def _persist_judge(
    *,
    generation_id: int,
    reference: str,
    judge_model: str,
    scores: Dict[str, Any],
    prompt_version: str | None = None,
    raw_text: str | None = None,
    row_status: str | None = None,
) -> JudgeEvaluation:
    """
    Save a JudgeEvaluation row in a way that works for either schema:
    - JSONField: scores
    - or explicit numeric columns: correctness/relevance/fluency/overall
    """
    has_scores_json = _judge_model_has_scores_field()

    base_kwargs = dict(
        generation_id=generation_id,
        reference=reference,
        judge_model=judge_model,
    )
    if prompt_version is not None:
        base_kwargs["prompt_version"] = prompt_version
    if row_status is not None:
        base_kwargs["status"] = row_status
    if raw_text is not None:
        base_kwargs["raw_text"] = raw_text

    if has_scores_json:
        return JudgeEvaluation.objects.create(scores=scores, **base_kwargs)

    # Fallback to explicit numeric columns
    return JudgeEvaluation.objects.create(
        correctness=float(scores.get("correctness", 0)),
        relevance=float(scores.get("relevance", 0)),
        fluency=float(scores.get("fluency", 0)),
        overall=float(scores.get("overall", 0)),
        **base_kwargs,
    )


@method_decorator(csrf_exempt, name="dispatch")  # dev-friendly
class EvaluateView(APIView):
    """
    POST body:
      { "generation_id": 4, "reference": "...", "metrics": ["bleu","rouge","cosine"] }
    """
    def post(self, request):
        s = EvaluateRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        gen = get_object_or_404(Generation, id=s.validated_data["generation_id"])
        candidate = gen.output or ""
        reference = s.validated_data["reference"]
        want = set(s.validated_data["metrics"])

        try:
            out: Dict[str, Any] = {}
            if "bleu" in want:
                out["bleu"] = _bleu(candidate, reference)
            if "rouge" in want:
                out.update(_rouge(candidate, reference))  # expected: rouge1, rougeL
            if "cosine" in want:
                out["cosine"] = _cosine(candidate, reference)

            ev = Evaluation.objects.create(
                generation_id=gen.id, reference=reference, metrics=out
            )
            return Response(
                {"evaluation_id": ev.id, "metrics": out},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            logger.exception("Evaluation failed")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class JudgeView(APIView):
    """
    POST body:
      {
        "generation_id"?: 4,          # optional if candidate is provided
        "reference": "...",
        "candidate"?: "override",     # required if no generation_id
        "judge_model"?: "mistral:7b"
      }
    """
    def post(self, request):
        s = JudgeRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        reference = s.validated_data["reference"]
        judge_model = s.validated_data.get("judge_model") or "mistral:7b"

        # Try to get candidate from Generation if generation_id is given
        candidate = None
        gen = None
        gen_id = s.validated_data.get("generation_id")

        if gen_id is not None:
            try:
                gen = Generation.objects.get(id=gen_id)
                candidate = s.validated_data.get("candidate") or (gen.output or "")
            except Generation.DoesNotExist:
                # Fallback: only use candidate if provided
                candidate = s.validated_data.get("candidate")

        else:
            candidate = s.validated_data.get("candidate")

        if not candidate:
            return Response(
                {"error": "missing_candidate", "detail": "No candidate text provided"},
                status=400,
            )

        # Run LLM judge
        scores = judge_with_mistral(candidate, reference, judge_model=judge_model)
        if isinstance(scores, dict) and "error" in scores:
            return Response({"error": "judge_failed", "detail": scores}, status=400)

        # Persist only if we have a valid Generation
        if gen is not None:
            _persist_judge(
                generation_id=gen.id,
                reference=reference,
                judge_model=judge_model,
                scores=scores,
            )

        return Response(scores, status=200)



@method_decorator(csrf_exempt, name="dispatch")
class CombinedEvalView(APIView):
    """
    POST:
    {
      "generation_id": 4,
      "reference": "...",
      "metrics": ["bleu","rouge","cosine"],
      "judge_model": "mistral:7b"   # optional
    }
    """
    def post(self, request):
        # 1) Validate payload WITHOUT throwing, so we can return errors explicitly
        s = CombinedEvalSerializer(data=request.data)
        if not s.is_valid():
            return Response(
                {"error": "serializer_invalid", "detail": s.errors, "received": request.data},
                status=status.HTTP_400_BAD_REQUEST,
            )

        gen_id = s.validated_data["generation_id"]
        ref = s.validated_data["reference"]
        want = set(s.validated_data["metrics"])
        judge_model = s.validated_data.get("judge_model")

        # 2) Fetch candidate
        try:
            gen = get_object_or_404(Generation, id=gen_id)
        except Exception as e:
            return Response(
                {"error": "not_found", "detail": str(e), "generation_id": gen_id},
                status=status.HTTP_404_NOT_FOUND,
            )
        cand = gen.output or ""

        # 3) Compute classic metrics (each guarded)
        out_metrics: Dict[str, Any] = {}
        try:
            if "bleu" in want:
                out_metrics["bleu"] = _bleu(cand, ref)
        except Exception as e:
            return Response(
                {"error": "metrics_failed", "metric": "bleu", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if "rouge" in want:
                out_metrics.update(_rouge(cand, ref))  # adds rouge1, rougeL
        except Exception as e:
            return Response(
                {"error": "metrics_failed", "metric": "rouge", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if "cosine" in want:
                out_metrics["cosine"] = _cosine(cand, ref)
        except Exception as e:
            return Response(
                {"error": "metrics_failed", "metric": "cosine", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save classic metrics row (optional)
        try:
            ev = Evaluation.objects.create(
                generation_id=gen.id, reference=ref, metrics=out_metrics
            )
        except Exception as e:
            logger.exception("Failed to persist Evaluation")
            return Response(
                {"error": "persist_failed", "detail": str(e), "metrics": out_metrics},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4) Judge (optional)
        judge_scores: Dict[str, Any] | None = None
        if judge_model:
            try:
                scores = judge_with_mistral(cand, ref, judge_model=judge_model)
                if isinstance(scores, dict) and "error" in scores:
                    return Response({"error": "judge_failed", "detail": scores}, status=400)

                judge_scores = scores
                _persist_judge(
                    generation_id=gen.id,
                    reference=ref,
                    judge_model=judge_model,
                    scores=judge_scores,
                )
            except Exception as e:
                return Response({"error": "judge_failed", "detail": str(e)}, status=400)

        return Response(
            {"evaluation_id": ev.id, "metrics": out_metrics, "judge_scores": judge_scores},
            status=200,
        )


@method_decorator(csrf_exempt, name="dispatch")
class RejudgeView(APIView):
    """
    POST:
      {
        "generation_ids": [1,2,3],
        "reference": "...",
        "judge_model": "mistral:7b",
        "prompt_version": "v2"
      }
    """
    def post(self, request):
        ids = request.data.get("generation_ids") or []
        reference = request.data.get("reference")
        if not reference:
            return Response({"error": "missing_reference"}, status=400)

        judge_model = request.data.get("judge_model") or "mistral:7b"
        prompt_version = request.data.get("prompt_version") or "v2"

        results = []
        for gid in ids:
            gen = get_object_or_404(Generation, id=gid)
            scores = judge_with_mistral(gen.output or "", reference, judge_model=judge_model)
            row_status = "ok" if (isinstance(scores, dict) and "error" not in scores) else "error"

            _persist_judge(
                generation_id=gid,
                reference=reference,
                judge_model=judge_model,
                scores=(scores if isinstance(scores, dict) else {}),
                prompt_version=prompt_version,
                raw_text=(scores.get("raw") if isinstance(scores, dict) else None),
                row_status=row_status,
            )
            results.append({"generation_id": gid, "status": row_status})

        return Response({"results": results}, status=200)
