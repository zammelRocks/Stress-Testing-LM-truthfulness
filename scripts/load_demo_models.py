import os, sys, pathlib, django
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path: sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "thesis.settings")
django.setup()

from apps.models_registry.models import HFModel, ModelBackend

def run():
    HFModel.objects.update_or_create(
        slug="gemma3-4b-ollama",
        defaults=dict(
            display_name="Gemma 3 4B (Ollama)",
            repo_id="gemma3:4b",              # <-- Ollama model name
            backend=ModelBackend.OLLAMA,
            endpoint_url=None,
            default_params={"temperature": 0.7, "top_p": 0.9, "top_k": 50},
            is_active=True,
        ),
    )
    print("Seeded Gemma 3 4B (Ollama).")

if __name__ == "__main__":
    run()
