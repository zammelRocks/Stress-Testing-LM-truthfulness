from django.urls import path
from .views import ListModelsView
urlpatterns = [ path("", ListModelsView.as_view(), name="models_list") ]
