from rest_framework import serializers

from dvadmin.system.models import Users
from workflow.models import (
    WorkflowAuditLog,
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowStep,
    WorkflowTask,
)


class WorkflowStepSerializer(serializers.ModelSerializer):
    assignee_id = serializers.IntegerField()
    assignee_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowStep
        fields = ["id", "step_order", "step_name", "assignee_id", "assignee_name"]
        read_only_fields = ["id", "assignee_name"]

    def get_assignee_name(self, obj):
        return getattr(obj.assignee, "name", None) or obj.assignee.username

    def validate_assignee_id(self, value):
        if not Users.objects.filter(id=value).exists():
            raise serializers.ValidationError("审批人不存在")
        return value


class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    doc_type_id = serializers.IntegerField(source="doc_type.id", read_only=True, allow_null=True)
    doc_type_name = serializers.CharField(source="doc_type.name", read_only=True, allow_null=True)
    steps = WorkflowStepSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowDefinition
        fields = [
            "id",
            "code",
            "name",
            "doc_type_id",
            "doc_type_name",
            "is_active",
            "definition_json",
            "steps",
            "create_datetime",
            "update_datetime",
        ]
        read_only_fields = ["id", "create_datetime", "update_datetime"]


class WorkflowDefinitionWriteSerializer(serializers.ModelSerializer):
    doc_type_id = serializers.IntegerField(required=False, allow_null=True)
    steps = WorkflowStepSerializer(many=True, required=False)

    class Meta:
        model = WorkflowDefinition
        fields = ["id", "code", "name", "doc_type_id", "is_active", "definition_json", "steps"]
        read_only_fields = ["id"]

    def validate_doc_type_id(self, value):
        if value is None:
            return value
        from doc_manage.models import DocumentType

        if not DocumentType.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("文档类型不存在")
        return value

    def create(self, validated_data):
        steps_data = validated_data.pop("steps", [])
        doc_type_id = validated_data.pop("doc_type_id", None)
        definition = WorkflowDefinition.objects.create(
            **validated_data,
            doc_type_id=doc_type_id,
        )
        self._sync_steps(definition, steps_data)
        return definition

    def update(self, instance, validated_data):
        steps_data = validated_data.pop("steps", None)
        doc_type_id = validated_data.pop("doc_type_id", serializers.empty)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if doc_type_id is not serializers.empty:
            instance.doc_type_id = doc_type_id
        instance.save()
        if steps_data is not None:
            self._sync_steps(instance, steps_data)
        return instance

    def _sync_steps(self, definition, steps_data):
        definition.steps.all().delete()
        for item in steps_data:
            WorkflowStep.objects.create(
                definition=definition,
                step_order=item["step_order"],
                step_name=item.get("step_name", ""),
                assignee_id=item["assignee_id"],
            )


class WorkflowTaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.SerializerMethodField()
    biz_type = serializers.CharField(source="instance.biz_type", read_only=True)
    biz_id = serializers.IntegerField(source="instance.biz_id", read_only=True)
    document_name = serializers.SerializerMethodField()
    document_version = serializers.SerializerMethodField()
    workflow_name = serializers.CharField(source="instance.definition.name", read_only=True)

    class Meta:
        model = WorkflowTask
        fields = [
            "id",
            "instance_id",
            "step_order",
            "assignee_id",
            "assignee_name",
            "status",
            "comment",
            "acted_at",
            "biz_type",
            "biz_id",
            "document_name",
            "document_version",
            "workflow_name",
            "create_datetime",
        ]

    def get_assignee_name(self, obj):
        return getattr(obj.assignee, "name", None) or obj.assignee.username

    def get_document_name(self, obj):
        if obj.instance.biz_type != "general_document":
            return ""
        from doc_manage.models import GeneralDocument

        doc = GeneralDocument.objects.filter(id=obj.instance.biz_id).first()
        return doc.name if doc else ""

    def get_document_version(self, obj):
        version = obj.instance.document_version
        if not version:
            return ""
        return f"V{version.version_label}"


class WorkflowAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowAuditLog
        fields = [
            "id",
            "action",
            "operator_name",
            "message",
            "detail",
            "create_datetime",
        ]


class WorkflowTaskRejectSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)
