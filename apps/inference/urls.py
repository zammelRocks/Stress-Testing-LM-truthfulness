# apps/inference/urls.py
from django.urls import path
from .views import GenerateView, GenerateStreamView
from .views import GenerationListView, GenerationDetailView

urlpatterns = [
    path("generate/", GenerateView.as_view(), name="generate"),
    path("generate/stream/", GenerateStreamView.as_view(), name="generate_stream"),
    path("generations/", GenerationListView.as_view(), name="generation_list"),
    path("generations/<int:pk>/", GenerationDetailView.as_view(), name="generation_detail"),
]
