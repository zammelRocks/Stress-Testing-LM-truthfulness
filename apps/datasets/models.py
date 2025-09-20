# apps/datasets/models.py
from django.db import models


class Dataset(models.Model):
    KIND_CHOICES = [
        ("csv", "CSV"),
        ("json", "JSON"),
    ]

    name = models.CharField(max_length=200)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="csv")
    original_filename = models.CharField(max_length=255, blank=True, default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Default + nullable so existing rows won’t block migration.
    # You can tighten to null=False later after backfilling.
    file = models.FileField(
        upload_to="datasets/",
        null=True,
        blank=True,
        default=""   # satisfies NOT NULL for legacy rows if you later drop `null=True`
    )

    row_count = models.PositiveIntegerField(default=0)

    # Stores the normalized column mapping you detect at upload time
    columns_map = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.name} ({self.kind})"


class DatasetRow(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="rows")

    # Normalized fields (all default to empty for legacy rows)
    claim = models.TextField(blank=True, default="")
    reference = models.TextField(blank=True, default="")
    label = models.CharField(max_length=64, blank=True, default="")

    # Raw original row for traceability
    raw = models.JSONField(default=dict, blank=True)

    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["dataset"]),
        ]
