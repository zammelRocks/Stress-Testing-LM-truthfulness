from django.urls import path
from .views import EvaluateView, JudgeView, CombinedEvalView, RejudgeView


urlpatterns = [
    path("", EvaluateView.as_view(), name="evaluate"),
    path("judge/", JudgeView.as_view(), name="judge"),
    path("combined/", CombinedEvalView.as_view(), name="combined"),
    path("rejudge/", RejudgeView.as_view(), name="rejudge"),
    
]
