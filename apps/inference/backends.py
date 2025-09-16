import os, time, json, requests
from dataclasses import dataclass
from django.conf import settings
from typing import Optional, Generator
import time, json, requests


@dataclass
class GenResult:
    text: str
    latency_ms: int

def _norm_params(params: dict) -> dict:
    return {
        "temperature": float(params.get("temperature", 0.7)),
        "top_p": float(params.get("top_p", 0.9)),
        "top_k": int(params.get("top_k", 50)),
        "max_new_tokens": min(
            int(params.get("max_new_tokens", getattr(settings, "DEFAULT_MAX_NEW_TOKENS", 256))),
            getattr(settings, "ABSOLUTE_MAX_NEW_TOKENS", 1024),
        ),
    }

# 1) Hugging Face Inference Endpoints (hosted)
class HFEndpointBackend:
    def __init__(self, token: str | None = None):
        self.token = token or settings.HUGGINGFACE_TOKEN

    def generate(self, endpoint_url: str, prompt: str, params: dict) -> GenResult:
        p = _norm_params(params)
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        payload = {
            "inputs": prompt,
            "parameters": {
                "temperature": p["temperature"],
                "top_p": p["top_p"],
                "top_k": p["top_k"],
                "max_new_tokens": p["max_new_tokens"],
                "return_full_text": False,
            }
        }
        t0 = time.time()
        r = requests.post(endpoint_url, headers=headers, data=json.dumps(payload), timeout=120)
        r.raise_for_status()
        out = r.json()
        # HF Endpoint returns [{"generated_text": "..."}] typically
        text = out[0].get("generated_text", "") if isinstance(out, list) else out.get("generated_text","")
        return GenResult(text=text, latency_ms=int((time.time()-t0)*1000))

# 2) TGI (self-hosted) — https://github.com/huggingface/text-generation-inference
class TGIBackend:
    def generate(self, base_url: str, prompt: str, params: dict) -> GenResult:
        p = _norm_params(params)
        url = f"{base_url.rstrip('/')}/generate"
        payload = {
            "inputs": prompt,
            "parameters": {
                "do_sample": True,
                "temperature": p["temperature"],
                "top_p": p["top_p"],
                "top_k": p["top_k"],
                "max_new_tokens": p["max_new_tokens"]
            }
        }
        t0 = time.time()
        r = requests.post(url, json=payload, timeout=120)
        r.raise_for_status()
        data = r.json()
        text = data.get("generated_text","") or (data.get("outputs",[{}])[0].get("text",""))
        return GenResult(text=text, latency_ms=int((time.time()-t0)*1000))

# 3) Local Transformers (optional)
class LocalBackend:
    _cache = {}
    def _load(self, repo_id: str):
        if repo_id in self._cache: return self._cache[repo_id]
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        tok = AutoTokenizer.from_pretrained(repo_id)
        model = AutoModelForCausalLM.from_pretrained(repo_id, torch_dtype="auto", device_map="auto")
        self._cache[repo_id] = (tok, model)
        return self._cache[repo_id]

    def generate(self, repo_id: str, prompt: str, params: dict) -> GenResult:
        p = _norm_params(params)
        from transformers import StoppingCriteriaList
        tok, model = self._load(repo_id)
        inputs = tok(prompt, return_tensors="pt").to(model.device)
        t0 = time.time()
        gen = model.generate(
            **inputs,
            do_sample=True,
            temperature=p["temperature"],
            top_p=p["top_p"],
            top_k=p["top_k"],
            max_new_tokens=p["max_new_tokens"]
        )
        text = tok.decode(gen[0], skip_special_tokens=True)
        return GenResult(text=text, latency_ms=int((time.time()-t0)*1000))
class HFRouterOpenAIBackend:
    """OpenAI-compatible Hugging Face Router (/v1/chat/completions)."""
    def __init__(self, base_url=None, token=None):
        self.base_url = (base_url or getattr(settings, "HF_ROUTER_BASE_URL", "https://router.huggingface.co/v1")).rstrip("/")
        self.token = token or getattr(settings, "HUGGINGFACE_TOKEN", "") or os.getenv("HF_TOKEN", "")
        self.url = f"{self.base_url}/chat/completions"
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def generate(self, model_id: str, prompt: str, params: dict) -> GenResult:
        p = _norm_params(params)
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": p["temperature"],
            "top_p": p["top_p"],
            "max_tokens": p["max_new_tokens"],      # OpenAI-style field
            "extra_body": {"top_k": p["top_k"]},    # non-standard; router understands
            "stream": False
        }
        t0 = time.time()
        r = requests.post(self.url, headers=self.headers, json=payload, timeout=120)
        r.raise_for_status()
        data = r.json()
        text = (data["choices"][0]["message"]["content"] or "").strip()
        return GenResult(text=text, latency_ms=int((time.time() - t0) * 1000))

class OllamaBackend:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.url = f"{self.base_url}/api/generate"
        self.headers = {"Content-Type": "application/json"}

    def _payload(self, model: str, prompt: str, p: dict, stream: bool):
        return {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": p["temperature"],
                "top_p": p["top_p"],
                "top_k": p["top_k"],
                "num_predict": p["max_new_tokens"],
            },
        }

    def generate(self, model: str, prompt: str, params: dict) -> GenResult:
        p = _norm_params(params)
        t0 = time.time()
        r = requests.post(self.url, headers=self.headers, json=self._payload(model, prompt, p, False),
                          timeout=settings.REQUEST_TIMEOUT_SECS)
        r.raise_for_status()
        data = r.json()
        return GenResult(text=(data.get("response") or "").strip(),
                         latency_ms=int((time.time()-t0)*1000))

    def stream_generate(self, model: str, prompt: str, params: dict) -> Generator[str, None, None]:
        p = _norm_params(params)
        with requests.post(self.url, headers=self.headers, json=self._payload(model, prompt, p, True),
                           stream=True, timeout=settings.STREAM_TIMEOUT_SECS) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines(decode_unicode=True):
                if not line: continue
                try:
                    j = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if j.get("response"): yield j["response"]
                if j.get("done"): break