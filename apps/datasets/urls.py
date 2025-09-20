from django.urls import path
from .views import (
    DatasetListView,
    DatasetUploadView,
    DatasetDetailView,
    DatasetRowListView,
)

app_name = "datasets"

urlpatterns = [
    path("", DatasetListView.as_view(), name="list"),                 # GET /api/datasets/
    path("upload/", DatasetUploadView.as_view(), name="upload"),      # POST /api/datasets/upload/
    path("ingest/", DatasetUploadView.as_view(), name="ingest"),      # (alias) POST /api/datasets/ingest/
    path("<int:pk>/", DatasetDetailView.as_view(), name="detail"),    # GET /api/datasets/<id>/
    path("<int:pk>/rows/", DatasetRowListView.as_view(), name="rows") # GET /api/datasets/<id>/rows/
]
