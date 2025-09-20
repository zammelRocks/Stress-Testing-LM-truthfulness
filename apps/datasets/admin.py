# apps/datasets/admin.py
from django.contrib import admin
from .models import Dataset, DatasetRow


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "kind", "row_count", "uploaded_at")
    list_filter = ("kind", "uploaded_at")
    search_fields = ("name", "original_filename")
    readonly_fields = ("uploaded_at",)
    ordering = ("-uploaded_at",)
    date_hierarchy = "uploaded_at"


@admin.register(DatasetRow)
class DatasetRowAdmin(admin.ModelAdmin):
    def short_claim(self, obj):
        txt = (obj.claim or "").strip()
        return (txt[:80] + "…") if len(txt) > 80 else txt
    short_claim.short_description = "Claim"

    list_display = ("id", "dataset", "short_claim", "label", "added_at")
    list_filter = ("dataset", "label", "added_at")
    search_fields = ("claim", "reference", "label")
    readonly_fields = ("added_at",)
    ordering = ("-added_at",)
    date_hierarchy = "added_at"
