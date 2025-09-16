from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import HFModel
from .serializers import ModelSerializer

class ListModelsView(APIView):
    def get(self, request):
        data = list(HFModel.objects.values("slug","display_name","backend","repo_id"))
        return Response(ModelSerializer(data, many=True).data)


