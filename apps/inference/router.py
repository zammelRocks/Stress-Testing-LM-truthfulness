# apps/inference/router.py
from functools import lru_cache
from apps.models_registry.models import HFModel, ModelBackend
from .backends import HFRouterOpenAIBackend, GenResult, OllamaBackend

@lru_cache(maxsize=1)
def get_hf_router() -> HFRouterOpenAIBackend:
    return HFRouterOpenAIBackend()

def generate_for_model(model: HFModel, prompt: str, params: dict) -> GenResult:
    if model.backend == ModelBackend.HF_ROUTER:
        return get_hf_router().generate(model.repo_id, prompt, params)
    raise ValueError(f"Unknown backend {model.backend}")

def stream_for_model(model: HFModel, prompt: str, params: dict):
    if model.backend == ModelBackend.HF_ROUTER:
        return get_hf_router().stream_generate(model.repo_id, prompt, params)
    raise ValueError(f"Streaming not supported for backend {model.backend}.")

@lru_cache(maxsize=1)
def get_ollama() -> OllamaBackend:
    return OllamaBackend()

def generate_for_model(model: HFModel, prompt: str, params: dict) -> GenResult:
    if model.backend == ModelBackend.OLLAMA:
        return get_ollama().generate(model.repo_id, prompt, params)
    raise ValueError(f"Unknown backend {model.backend}")

def stream_for_model(model: HFModel, prompt: str, params: dict):
    if model.backend == ModelBackend.OLLAMA:
        return get_ollama().stream_generate(model.repo_id, prompt, params)
    raise ValueError(f"Streaming not supported for backend {model.backend}.")