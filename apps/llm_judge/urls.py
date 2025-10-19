from django.urls import path
from .views import JudgeEvaluationView
urlpatterns = [
    path("evaluate/", JudgeEvaluationView.as_view(), name="judge-evaluate"),
]
