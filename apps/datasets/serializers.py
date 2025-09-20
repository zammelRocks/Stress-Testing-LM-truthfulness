from rest_framework import serializers
from .models import Dataset, DatasetRow

class DatasetRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetRow
        fields = ["id", "claim", "reference", "label"]

class DatasetSerializer(serializers.ModelSerializer):
    # Keep API name `created_at`, read from model field `uploaded_at`
    created_at = serializers.DateTimeField(source="uploaded_at", read_only=True)

    class Meta:
        model = Dataset
        fields = ["id", "name", "file", "kind", "row_count", "created_at"]
        read_only_fields = ("id", "row_count", "created_at")

class DatasetUploadResponseSerializer(serializers.Serializer):
    dataset = DatasetSerializer()
    inserted = serializers.IntegerField()
    sample = DatasetRowSerializer(many=True)
