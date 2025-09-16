# apps/eval/management/commands/batch_judge.py
from django.core.management.base import BaseCommand
from apps.models_registry.models import Generation
from apps.eval.judge import judge_with_mistral
from apps.eval.models import JudgeEvaluation

class Command(BaseCommand):
    help = "Batch judge generations"

    def add_arguments(self, parser):
        parser.add_argument("--ref", required=True)
        parser.add_argument("--model", default="mistral:7b")
        parser.add_argument("--since-id", type=int)
        parser.add_argument("--limit", type=int)

    def handle(self, *args, **opts):
        qs = Generation.objects.order_by("id")
        if opts.get("since_id"):
            qs = qs.filter(id__gt=opts["since_id"])
        if opts.get("limit"):
            qs = qs[:opts["limit"]]

        for gen in qs.iterator(chunk_size=100):
            scores = judge_with_mistral(gen.output or "", opts["ref"], judge_model=opts["model"])
            status = "ok" if "error" not in scores else scores["error"]
            JudgeEvaluation.objects.create(
                generation=gen,
                reference=opts["ref"],
                correctness=scores.get("correctness", 0),
                relevance=scores.get("relevance", 0),
                fluency=scores.get("fluency", 0),
                overall=scores.get("overall", 0),
                judge_model=opts["model"],
                prompt_version="v1",
                raw_text=scores.get("raw", ""),
                status=status,
            )
            self.stdout.write(f"gen {gen.id}: {status}")
