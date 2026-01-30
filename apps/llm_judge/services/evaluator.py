import json
import math
from .prompts import EVALUATION_PROMPT_TEMPLATE
from .vllm_client import query_vllm_for_completion, get_top_logits_from_vllm

DIMENSIONS = [
    "correctness",
    "relevance",
    "proficiency",
    "helpfulness",
    "level_of_detail",
    "creativity",
]


def safe_parse_json(text):
    """Try to parse model output into valid JSON."""
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end != -1:
            return json.loads(text[start:end])
    except Exception:
        pass
    return {"error": "Model did not return valid JSON", "raw_output": text}


def evaluate_with_vllm(model_name, candidate, reference, decoding_params):
    # 1️⃣ Format evaluation prompt
    formatted_prompt = EVALUATION_PROMPT_TEMPLATE.format(
        reference=reference,
        candidate=candidate,
    )

    # 2️⃣ Query vLLM for the JSON scores
    response_text = query_vllm_for_completion(model_name, formatted_prompt, decoding_params)
    scores = safe_parse_json(response_text)

    # 3️⃣ For each dimension, query logits focused on numeric score tokens
    dim_logits = {}
    for dim in DIMENSIONS:
        dim_prompt = f"""
Given the following context, assign a score from 1 to 5 for **{dim}**.
REFERENCE: {reference}
CANDIDATE: {candidate}
Respond ONLY with a single number from 1 to 5.
"""
        top_tokens = get_top_logits_from_vllm(model_name, dim_prompt, decoding_params)

        # Filter to numeric tokens and normalize probabilities
        numeric_tokens = [
            t for t in top_tokens if t["token"].strip() in ["1", "2", "3", "4", "5"]
        ]
        s = sum(t["prob"] for t in numeric_tokens) or 1
        normalized = [
            {"token": t["token"].strip(), "prob": round(t["prob"] / s, 3)}
            for t in numeric_tokens
        ]

        dim_logits[dim] = normalized

    # 4️⃣ Return structured result
    result = {
        "model_name": model_name,
        "scores": scores,
        "dimensions": [
            {"dimension": dim, "top_tokens": dim_logits.get(dim, [])}
            for dim in DIMENSIONS
        ],
    }

    return result
