from rest_framework import serializers

from workflow.models import (
    WorkflowAuditLog,
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowTask,
)
from workflow.services.definition import default_definition_json, steps_summary


class WorkflowStepSummarySerializer(serializers.Serializer):
    step_order = serializers.IntegerField()
    step_name = serializers.CharField()
    assignee_id = serializers.IntegerField()
    assignee_name = serializers.CharField()


class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    doc_type_id = serializers.IntegerField(source="doc_type.id", read_only=True, allow_null=True)
    doc_type_name = serializers.CharField(source="doc_type.name", read_only=True, allow_null=True)
    steps = serializers.SerializerMethodField()

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

    def get_steps(self, obj):
        return WorkflowStepSummarySerializer(steps_summary(obj), many=True).data


class WorkflowDefinitionWriteSerializer(serializers.ModelSerializer):
    doc_type_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = WorkflowDefinition
        fields = ["id", "code", "name", "doc_type_id", "is_active"]
        read_only_fields = ["id"]

    def validate_doc_type_id(self, value):
        if value is None:
            return value
        from doc_manage.models import DocumentType

        if not DocumentType.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("文档类型不存在")
        return value

    def create(self, validated_data):
        doc_type_id = validated_data.pop("doc_type_id", None)
        definition = WorkflowDefinition.objects.create(
            **validated_data,
            doc_type_id=doc_type_id,
            definition_json=default_definition_json(),
        )
        return definition

    def update(self, instance, validated_data):
        doc_type_id = validated_data.pop("doc_type_id", serializers.empty)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if doc_type_id is not serializers.empty:
            instance.doc_type_id = doc_type_id
        instance.save()
        return instance


class WorkflowDesignWriteSerializer(serializers.Serializer):
    nodeConfig = serializers.JSONField()
    flowPermission = serializers.JSONField(required=False)
    directorMaxLevel = serializers.IntegerField(required=False)


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
