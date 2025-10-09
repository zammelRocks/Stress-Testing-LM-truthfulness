# apps/eval/judge.py
from __future__ import annotations
from typing import Dict, Any
import json

from django.conf import settings
from apps.inference.backends import OllamaBackend

PROMPT_TEMPLATE = """
You are a strict evaluator.
Compare the CANDIDATE answer to the REFERENCE answer and assign numeric scores from 1 to 5 for each metric.

Return ONLY a JSON object in this exact format (no explanations, no text, no code fences):
{{"correctness": 1-5, "relevance": 1-5, "fluency": 1-5, "overall": 1-5}}

REFERENCE:
{reference}

CANDIDATE:
{candidate}

SCORING CRITERIA:

1. CORRECTNESS (1–5)
How factually and semantically accurate the candidate answer is compared to the reference.
- 1 = Completely incorrect or contradicts the reference.
- 2 = Mostly incorrect; misses key facts or introduces major errors.
- 3 = Partially correct; captures some ideas but with notable omissions or inaccuracies.
- 4 = Mostly correct; small factual or interpretive errors.
- 5 = Fully correct; meaning and facts align perfectly with the reference.

2. RELEVANCE (1–5)
How focused the candidate answer is on the same content and intent as the reference.
- 1 = Entirely off-topic or irrelevant.
- 2 = Minimally relevant; includes large portions of unrelated content.
- 3 = Partially relevant; covers some aspects but misses key focus points.
- 4 = Mostly relevant; minor digressions or slight lack of focus.
- 5 = Fully relevant; directly matches the purpose and content of the reference.

3. FLUENCY (1–5)
How clear, grammatical, and natural the candidate answer is.
- 1 = Unreadable or incoherent.
- 2 = Poorly written; many grammatical or structural issues.
- 3 = Understandable but awkward phrasing or flow.
- 4 = Clear and readable; minor issues only.
- 5 = Highly fluent, polished, and well-structured.

4. OVERALL (1–5)
Compute using the following guideline:
- overall = round(0.5*correctness + 0.3*relevance + 0.2*fluency)
- If correctness = 1 or relevance = 1, set overall = 1.

INSTRUCTIONS:
1. Read REFERENCE and CANDIDATE carefully.
2. Score each metric (1–5) according to the rubric above.
3. Compute overall using the given formula.
4. Return ONLY the JSON object — no commentary, no extra text.

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
