# apps/inference/router.py
from functools import lru_cache
from apps.models_registry.models import HFModel, ModelBackend
from .backends import OllamaBackend, GenResult

@lru_cache(maxsize=1)
def get_ollama() -> OllamaBackend:
    return OllamaBackend()

def generate_for_model(model: HFModel, prompt: str, params: dict) -> GenResult:
    if model.backend != ModelBackend.OLLAMA:
        raise ValueError(f"Only OLLAMA is supported. Got backend={model.backend}.")
    return get_ollama().generate(model.repo_id, prompt, params)

def stream_for_model(model: HFModel, prompt: str, params: dict):
    if model.backend != ModelBackend.OLLAMA:
        raise ValueError(f"Only OLLAMA streaming is supported.")
    return get_ollama().stream_generate(model.repo_id, prompt, params)
