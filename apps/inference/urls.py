# apps/inference/urls.py
from django.urls import path
from .views import GenerateView, GenerateStreamView,GenerationListView, GenerationDetailView
from .views import LabelClaimView, LabelDatasetView
urlpatterns = [
    path("generate/", GenerateView.as_view(), name="generate"),
    path("generate/stream/", GenerateStreamView.as_view(), name="generate_stream"),
    path("generations/", GenerationListView.as_view(), name="generation_list"),
    path("generations/<int:pk>/", GenerationDetailView.as_view(), name="generation_detail"),
    path("label/", LabelClaimView.as_view(), name="label_claim"),
    path("label_dataset/", LabelDatasetView.as_view(), name="label_dataset")
]
