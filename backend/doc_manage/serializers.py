from rest_framework import serializers

from doc_manage.models import BomDocument


class BomDocumentSerializer(serializers.ModelSerializer):
    graph_status_display = serializers.CharField(
        source="get_graph_status_display", read_only=True
    )
    upload_time = serializers.DateTimeField(source="create_datetime", read_only=True)

    class Meta:
        model = BomDocument
        fields = [
            "id",
            "number",
            "state",
            "type_designation",
            "description_en",
            "uploader",
            "graph_status",
            "graph_status_display",
            "minio_path",
            "original_filename",
            "file_type",
            "file_size",
            "upload_time",
            "create_datetime",
            "update_datetime",
        ]
        read_only_fields = [
            "id",
            "number",
            "state",
            "type_designation",
            "description_en",
            "uploader",
            "minio_path",
            "original_filename",
            "file_type",
            "file_size",
            "upload_time",
            "create_datetime",
            "update_datetime",
        ]


class BomDocumentPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = BomDocument
        fields = ["graph_status"]

    def validate_graph_status(self, value):
        allowed = {choice.value for choice in BomDocument.GraphStatus}
        if value not in allowed:
            raise serializers.ValidationError("graph_status 仅允许 pending 或 extracted")
        return value
