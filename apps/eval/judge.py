# apps/eval/judge.py
from __future__ import annotations
from typing import Dict, Any
import json

from django.conf import settings
from apps.inference.backends import OllamaBackend

PROMPT_TEMPLATE = """You are a strict evaluator.
Compare the CANDIDATE answer to the REFERENCE answer.

Return ONLY a JSON object with numeric scores 0–10 (no prose, no code fences):
{{"correctness": 0-10, "relevance": 0-10, "fluency": 0-10, "overall": 0-10}}

REFERENCE:
{reference}

CANDIDATE:
{candidate}
"""

def _extract_json(text: str) -> Dict[str, Any]:
    """
    Pull the first {...} JSON-looking block from the model output and parse it.
    Returns {"error": "...", "raw": "..."} on failure.
    """
    if not isinstance(text, str):
        return {"error": "non_string_response", "raw": repr(text)}

    cleaned = text.strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return {"error": "no_json_found", "raw": cleaned[:800]}
    block = cleaned[start:end + 1]

    try:
        return json.loads(block)
    except Exception as e:
        try:
            compact = " ".join(block.split())
            return json.loads(compact)
        except Exception:
            return {"error": "bad_json", "detail": str(e), "raw": block[:800]}

def _coerce_scores(d: Dict[str, Any]) -> Dict[str, float]:
    """
    Coerce fields to floats in [0,10]. If overall is missing, average the three.
    Accepts '8/10' strings, etc.
    """
    def to_float(x):
        try:
            if isinstance(x, str) and "/" in x:
                num, denom = x.split("/", 1)
                return (float(num) / float(denom)) * 10.0
            return float(x)
        except Exception:
            return 0.0

    out: Dict[str, float] = {}
    out["correctness"] = max(0.0, min(10.0, to_float(d.get("correctness"))))
    out["relevance"]   = max(0.0, min(10.0, to_float(d.get("relevance"))))
    out["fluency"]     = max(0.0, min(10.0, to_float(d.get("fluency"))))

    overall_val = d.get("overall")
    if overall_val is None:
        overall_val = (out["correctness"] + out["relevance"] + out["fluency"]) / 3.0
    else:
        overall_val = to_float(overall_val)
    out["overall"] = max(0.0, min(10.0, overall_val))

    for k in out:
        out[k] = round(out[k], 1)
    return out

def judge_with_mistral(candidate: str, reference: str, *, judge_model: str | None = None) -> Dict[str, Any]:
    """
    Evaluate candidate vs reference using an Ollama model (default: settings.JUDGE_MODEL_OLLAMA or 'mistral:7b').
    Returns either a dict of scores {correctness, relevance, fluency, overall} or {"error": "...", "raw": "..."}.
    """
    model = judge_model or getattr(settings, "JUDGE_MODEL_OLLAMA", "mistral:7b")
    client = OllamaBackend()

    prompt = PROMPT_TEMPLATE.format(
        reference=reference.strip(),
        candidate=candidate.strip(),
    )

    res = client.generate(
        model,
        prompt,
        {
            "temperature": 0.0,   # reduce drift
            "top_p": 0.9,
            "top_k": 50,
            "max_new_tokens": 128,
        },
    )

    try:
        if isinstance(res, dict):
            text = res.get("text") or res.get("response") or res.get("output") or json.dumps(res)
        else:
            text = getattr(res, "text", None) or getattr(res, "response", None) or str(res)

        data = _extract_json(text)
        if "error" in data:
            return {"error": "parse_error", **data}

        scores = _coerce_scores(data)
        return scores
    except Exception as e:
        return {"error": str(e), "raw": (text if "text" in locals() else repr(res))}
