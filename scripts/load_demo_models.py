import os, sys, pathlib, django
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path: sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "thesis.settings")
django.setup()

from apps.models_registry.models import HFModel, ModelBackend

def run():
    HFModel.objects.update_or_create(
        slug="gpt-oss-20b-ollama",
        defaults=dict(
            display_name="gpt-oss:20b(Ollama)",
            repo_id="gpt-oss:20b",              # <-- Ollama model name
            backend=ModelBackend.OLLAMA,
            endpoint_url=None,
            default_params={"temperature": 0.7, "top_p": 0.9, "top_k": 50},
            is_active=True,
        ),
    )
    print("gpt-oss:20b(Ollama) model created or updated.")

if __name__ == "__main__":
    run()
