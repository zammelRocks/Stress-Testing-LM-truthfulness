from rest_framework import serializers

class ModelSerializer(serializers.Serializer):
    slug = serializers.CharField()
    display_name = serializers.CharField()
    backend = serializers.CharField()
    repo_id = serializers.CharField()
