from rest_framework import serializers

from doc_manage.models import BomDocument, DocumentType, GeneralDocument


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


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ["id", "code", "name", "sort_order", "is_active"]


class GeneralDocumentSerializer(serializers.ModelSerializer):
    approval_status_display = serializers.CharField(
        source="get_approval_status_display", read_only=True
    )
    doc_type_id = serializers.IntegerField(source="doc_type.id", read_only=True)
    doc_type_name = serializers.CharField(source="doc_type.name", read_only=True)
    doc_type_code = serializers.CharField(source="doc_type.code", read_only=True)

    class Meta:
        model = GeneralDocument
        fields = [
            "id",
            "name",
            "doc_type_id",
            "doc_type_name",
            "doc_type_code",
            "version",
            "approval_status",
            "approval_status_display",
            "file_description",
            "approver",
            "uploader",
            "minio_path",
            "original_filename",
            "file_ext",
            "file_size",
            "create_datetime",
            "update_datetime",
        ]


class GeneralDocumentPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralDocument
        fields = ["approval_status"]

    def validate_approval_status(self, value):
        allowed = {choice.value for choice in GeneralDocument.ApprovalStatus}
        if value not in allowed:
            raise serializers.ValidationError(
                "approval_status 仅允许 draft、pending 或 approved"
            )
        return value
