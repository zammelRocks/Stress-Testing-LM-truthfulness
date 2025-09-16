# apps/inference/urls.py
from django.urls import path
from .views import GenerateView, GenerateStreamView

urlpatterns = [
    path("generate/", GenerateView.as_view(), name="generate"),
    path("generate/stream/", GenerateStreamView.as_view(), name="generate_stream"),
]
