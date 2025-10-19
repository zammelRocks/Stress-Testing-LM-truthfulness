import os
import math
import requests

VLLM_API_BASE = os.getenv("VLLM_API_BASE", "http://localhost:8000/v1")
VLLM_API_KEY = os.getenv("VLLM_API_KEY", "EMPTY")

# -- 1️⃣ Full completion request (to get JSON scores)
def query_vllm_for_completion(model_name, prompt, params):
    url = f"{VLLM_API_BASE}/completions"
    headers = {"Authorization": f"Bearer {VLLM_API_KEY}"}
    payload = {
        "model": model_name,
        "prompt": prompt,
        "max_tokens": 250,
        "temperature": params.get("temperature", 0.7),
        "top_p": params.get("top_p", 0.9),
        "top_k": params.get("top_k", 40),
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["text"].strip()

# -- 2️⃣ Logits request (top token probabilities)
def get_top_logits_from_vllm(model_name, prompt, params):
    url = f"{VLLM_API_BASE}/completions"
    headers = {"Authorization": f"Bearer {VLLM_API_KEY}"}
    payload = {
        "model": model_name,
        "prompt": prompt,
        "max_tokens": 1,
        "temperature": params.get("temperature", 0.7),
        "top_p": params.get("top_p", 0.9),
        "top_k": params.get("top_k", 40),
        "logprobs": 10,
        "echo": False,
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()

    logprobs = data["choices"][0]["logprobs"]["top_logprobs"][0]
    tokens = [{"token": t, "prob": round(math.exp(v), 5)} for t, v in logprobs.items()]
    tokens.sort(key=lambda x: x["prob"], reverse=True)
    return tokens[:10]
