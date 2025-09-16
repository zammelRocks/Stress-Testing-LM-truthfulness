import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "thesis.settings")
django.setup()

from apps.models_registry.models import HFModel, ModelBackend

def run():
    HFModel.objects.update_or_create(
        slug="mistral-7b-ollama",
        defaults=dict(
            display_name="Mistral 7B (Ollama)",
            repo_id="mistral:7b",
            backend=ModelBackend.OLLAMA,
            default_params={"temperature":0.7,"top_p":0.9,"top_k":50,"max_new_tokens":256},
            is_active=True,
        ),
    )
    print("Seeded: Mistral 7B (Ollama)")

if __name__ == "__main__":
    run()
