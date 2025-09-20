from __future__ import annotations
import csv, io, json, os, logging
from typing import Iterable

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from .models import Dataset, DatasetRow
from .serializers import DatasetSerializer, DatasetRowSerializer, DatasetUploadResponseSerializer

logger = logging.getLogger(__name__)

def _normalize_row(record: dict) -> dict | None:
    """
    Normalize input keys to lowercase and map to: claim, reference, label.
    (We DO NOT lowercase the VALUES; only the keys/column names.)
    """
    if not isinstance(record, dict):
        return None

    lowered = { (k or "").strip().lower(): v for k, v in record.items() }

    claim = lowered.get("claim") or lowered.get("fact") or lowered.get("statement") or lowered.get("text")
    reference = lowered.get("reference") or lowered.get("ref") or lowered.get("evidence") or lowered.get("gold")
    label = lowered.get("label") or lowered.get("verdict") or lowered.get("class")

    if claim is None and reference is None and label is None:
        return None

    return {
        "claim": str(claim or "").strip(),
        "reference": str(reference or "").strip(),
        "label": str(label or "").strip(),
    }

def _paginate(request, queryset, serializer_cls, default_limit=50, max_limit=500):
    try:
        limit = min(int(request.GET.get("limit", default_limit)), max_limit)
    except ValueError:
        limit = default_limit
    try:
        offset = int(request.GET.get("offset", 0))
    except ValueError:
        offset = 0

    count = queryset.count()
    items = queryset[offset: offset + limit]
    data = serializer_cls(items, many=True).data

    def _url(new_offset: int) -> str | None:
        if new_offset < 0 or new_offset >= count:
            return None
        path = request.path
        q = request.GET.copy()
        q["limit"] = str(limit)
        q["offset"] = str(new_offset)
        return f"{path}?{q.urlencode()}"

    return {
        "count": count,
        "next": _url(offset + limit),
        "previous": _url(max(offset - limit, 0)),
        "results": data,
    }

class DatasetListView(APIView):
    """GET /api/datasets/ — list datasets (paginated)"""
    def get(self, request):
        qs = Dataset.objects.all()
        return Response(_paginate(request, qs, DatasetSerializer), status=200)

class DatasetDetailView(APIView):
    """GET /api/datasets/<id>/ — dataset details"""
    def get(self, request, pk: int):
        ds = get_object_or_404(Dataset, pk=pk)
        return Response(DatasetSerializer(ds).data, status=200)

class DatasetRowListView(APIView):
    """GET /api/datasets/<id>/rows/ — rows (paginated); optional ?q= text search & ?label= filter"""
    def get(self, request, pk: int):
        ds = get_object_or_404(Dataset, pk=pk)
        qs = ds.rows.all()

        q = (request.GET.get("q") or "").strip()
        if q:
            qs = qs.filter(claim__icontains=q) | qs.filter(reference__icontains=q)

        label = (request.GET.get("label") or "").strip()
        if label:
            qs = qs.filter(label=label)

        return Response(_paginate(request, qs, DatasetRowSerializer), status=200)

class DatasetUploadView(APIView):
    """
    POST /api/datasets/upload/
    form-data:
      - file: <CSV|JSON|JSONL|NDJSON>
      - name: optional dataset name

    Response 201:
    {
      "dataset": {id, name, file, kind, row_count, created_at},
      "inserted": <int>,
      "sample": [ {id, claim, reference, label}, ... up to 5 ]
    }
    """
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        f = request.FILES.get("file")
        if not f:
            return Response({"error": "no_file", "detail": "Upload a file under the 'file' field."}, status=400)

        name = getattr(f, "name", "") or ""
        _, ext = os.path.splitext(name)        # ext like '.csv' or '.jsonl'
        ext = (ext or "").lower().lstrip(".")      # 'csv', 'jsonl', 'json', 'ndjson'

        if ext in {"csv"}:
            kind = "csv"
        elif ext in {"json", "jsonl", "ndjson"}:
            kind = "json"
        else:
            return Response(
                {"error": "unsupported_type",
                "detail": f".{ext or '?'} not supported (csv/json/jsonl/ndjson only)."},
                status=400,
                     )
        ds = Dataset.objects.create(name=name, file=f, kind=kind)

        # ensure we read from the beginning
        try:
            f.seek(0)
        except Exception:
            pass

        inserted = 0
        batch: list[DatasetRow] = []

        try:
            if kind == "csv":
                # Use underlying binary to wrap as text for DictReader
                binary = getattr(f, "file", f)
                try:
                    binary.seek(0)
                except Exception:
                    pass
                text = io.TextIOWrapper(binary, encoding="utf-8", errors="replace")
                reader = csv.DictReader(text)
                for rec in reader:
                    norm = _normalize_row(rec)
                    if not norm:
                        continue
                    batch.append(DatasetRow(dataset=ds, **norm))
                    if len(batch) >= 1000:
                        DatasetRow.objects.bulk_create(batch)
                        inserted += len(batch)
                        batch.clear()
            else:
                # JSON: either array/object or JSONL
                data_bytes = f.read()
                txt = data_bytes.decode("utf-8", errors="replace").strip()
                iterable: Iterable[dict]
                try:
                    loaded = json.loads(txt)
                    if isinstance(loaded, dict):
                        loaded = [loaded]
                    if not isinstance(loaded, list):
                        return Response({"error": "bad_json", "detail": "JSON must be an object or an array of objects."}, status=400)
                    iterable = loaded
                except json.JSONDecodeError:
                    # NDJSON/JSONL
                    parsed = []
                    for line in txt.splitlines():
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            parsed.append(json.loads(line))
                        except json.JSONDecodeError:
                            logger.warning("Skipping invalid JSON line")
                    iterable = parsed

                for rec in iterable:
                    if not isinstance(rec, dict):
                        continue
                    norm = _normalize_row(rec)
                    if not norm:
                        continue
                    batch.append(DatasetRow(dataset=ds, **norm))
                    if len(batch) >= 1000:
                        DatasetRow.objects.bulk_create(batch)
                        inserted += len(batch)
                        batch.clear()

            if batch:
                DatasetRow.objects.bulk_create(batch)
                inserted += len(batch)

            ds.row_count = inserted
            ds.save(update_fields=["row_count"])

            sample = ds.rows.all()[:5]
            payload = {
                "dataset": DatasetSerializer(ds).data,
                "inserted": inserted,
                "sample": DatasetRowSerializer(sample, many=True).data,
            }
            # Validate envelope against your response serializer
            return Response(DatasetUploadResponseSerializer(payload).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception("Upload failed")
            # automatic rollback due to @transaction.atomic
            return Response({"error": "upload_failed", "detail": str(e)}, status=400)
