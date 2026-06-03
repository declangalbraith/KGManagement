from rest_framework import serializers

from doc_manage.models import BomDocument, DocumentType, GeneralDocument, GeneralDocumentVersion
from workflow.models import WorkflowAuditLog, WorkflowDefinition, WorkflowInstance, WorkflowTask
from workflow.services.engine import BIZ_TYPE_GENERAL_DOCUMENT, get_pending_task_for_document


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


class GeneralDocumentVersionSerializer(serializers.ModelSerializer):
    version = serializers.SerializerMethodField()

    class Meta:
        model = GeneralDocumentVersion
        fields = [
            "id",
            "version_label",
            "version",
            "original_filename",
            "file_ext",
            "file_size",
            "uploader",
            "create_datetime",
        ]

    def get_version(self, obj):
        return f"V{obj.version_label}"


class GeneralDocumentAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowAuditLog
        fields = ["id", "action", "operator_name", "message", "detail", "create_datetime"]


class GeneralDocumentSerializer(serializers.ModelSerializer):
    approval_status_display = serializers.CharField(
        source="get_approval_status_display", read_only=True
    )
    doc_type_id = serializers.IntegerField(source="doc_type.id", read_only=True)
    doc_type_name = serializers.CharField(source="doc_type.name", read_only=True)
    doc_type_code = serializers.CharField(source="doc_type.code", read_only=True)
    workflow_definition_id = serializers.IntegerField(
        source="workflow_definition.id", read_only=True, allow_null=True
    )
    workflow_definition_name = serializers.CharField(
        source="workflow_definition.name", read_only=True, allow_null=True
    )
    can_trigger_workflow = serializers.SerializerMethodField()
    pending_task_id = serializers.SerializerMethodField()
    current_assignee_name = serializers.SerializerMethodField()

    class Meta:
        model = GeneralDocument
        fields = [
            "id",
            "name",
            "doc_type_id",
            "doc_type_name",
            "doc_type_code",
            "version",
            "version_label",
            "approval_status",
            "approval_status_display",
            "file_description",
            "approver",
            "uploader",
            "workflow_definition_id",
            "workflow_definition_name",
            "can_trigger_workflow",
            "pending_task_id",
            "current_assignee_name",
            "minio_path",
            "original_filename",
            "file_ext",
            "file_size",
            "create_datetime",
            "update_datetime",
        ]

    def get_can_trigger_workflow(self, obj):
        if obj.approval_status != GeneralDocument.ApprovalStatus.DRAFT:
            return False
        if not obj.workflow_definition_id:
            return False
        return not WorkflowInstance.objects.filter(
            biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
            biz_id=obj.id,
            status=WorkflowInstance.Status.RUNNING,
        ).exists()

    def get_pending_task_id(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        if obj.approval_status != GeneralDocument.ApprovalStatus.PENDING:
            return None
        task = get_pending_task_for_document(obj, request.user)
        return task.id if task else None

    def get_current_assignee_name(self, obj):
        if obj.approval_status != GeneralDocument.ApprovalStatus.PENDING:
            return ""
        task = (
            WorkflowTask.objects.filter(
                instance__biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
                instance__biz_id=obj.id,
                instance__status=WorkflowInstance.Status.RUNNING,
                status=WorkflowTask.Status.PENDING,
            )
            .select_related("assignee")
            .order_by("step_order")
            .first()
        )
        if not task:
            return ""
        return getattr(task.assignee, "name", None) or task.assignee.username


class GeneralDocumentPatchSerializer(serializers.ModelSerializer):
    workflow_definition_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = GeneralDocument
        fields = ["file_description", "workflow_definition_id"]

    def validate(self, attrs):
        if self.instance.approval_status != GeneralDocument.ApprovalStatus.DRAFT:
            raise serializers.ValidationError("仅草稿状态可编辑")
        return attrs

    def update(self, instance, validated_data):
        workflow_definition_id = validated_data.pop("workflow_definition_id", serializers.empty)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if validated_data:
            instance.save()
        if workflow_definition_id is not serializers.empty:
            request = self.context.get("request")
            from doc_manage.services.general_doc_service import bind_workflow_definition

            return bind_workflow_definition(
                document=instance,
                workflow_definition_id=workflow_definition_id,
                user=request.user if request else None,
            )
        return instance
