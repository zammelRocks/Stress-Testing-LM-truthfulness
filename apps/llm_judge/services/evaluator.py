import json
import re
from .prompts import EVALUATION_PROMPT_TEMPLATE
from .vllm_client import query_vllm_for_completion, get_top_logits_from_vllm

DIMENSIONS = [
    "correctness",
    "relevance",
    "proficiency",
    "helpfulness",
    "level_of_detail",
    "creativity"
]

def parse_llm_json_output(raw_output: str):
    """
    Cleans and extracts a valid JSON object from an LLM's text output.
    Returns parsed JSON if successful, or error details otherwise.
    """
    if not raw_output or not isinstance(raw_output, str):
        return {"error": "Empty or invalid model output", "raw_output": raw_output}

    # Step 1: Strip markdown or code fences (```json ... ```)
    cleaned = re.sub(r"```(?:json)?|```", "", raw_output, flags=re.IGNORECASE).strip()

    # Step 2: Extract potential JSON portion
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(0).strip()

    # Step 3: Parse JSON safely
    try:
        parsed = json.loads(cleaned)
        expected_keys = set(DIMENSIONS + ["overall"])
        if isinstance(parsed, dict) and expected_keys.issubset(parsed.keys()):
            return parsed
        else:
            return {"error": "Missing expected fields", "raw_output": cleaned}
    except json.JSONDecodeError:
        # Try to fix trailing commas and reparse
        cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"error": "Model did not return valid JSON", "raw_output": raw_output}


def evaluate_with_vllm(model_name, candidate, reference, decoding_params):
    """
    Evaluates a candidate vs. reference using vLLM model.
    Produces structured metric scores + top token probabilities.
    """
    # 1️⃣ Build strict evaluation prompt
    formatted_prompt = EVALUATION_PROMPT_TEMPLATE.format(
        reference=reference,
        candidate=candidate
    )

    # 2️⃣ Query vLLM for structured output
    response_text = query_vllm_for_completion(model_name, formatted_prompt, decoding_params)

    # 3️⃣ Parse or recover model JSON output
    scores = parse_llm_json_output(response_text)

    # 4️⃣ Query token-level logits per dimension
    dim_logits = {}
    for dim in DIMENSIONS:
        dim_prompt = f"Rate {dim} based on the previous evaluation rubric."
        top_tokens = get_top_logits_from_vllm(model_name, dim_prompt, decoding_params)
        dim_logits[dim] = top_tokens

    # 5️⃣ Return unified result
    return {
        "model_name": model_name,
        "scores": scores,
        "dimensions": [
            {"dimension": dim, "top_tokens": dim_logits.get(dim, [])}
            for dim in DIMENSIONS
        ],
    }
