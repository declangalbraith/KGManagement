from rest_framework import serializers
from .models import KAGProject, KAGTask, KAGDocument


class KAGProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = KAGProject
        fields = ["id", "name", "display_name", "description", "namespace",
                  "config_yaml", "neo4j_database", "is_active", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class KAGTaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = KAGTask
        fields = ["id", "project", "project_name", "task_type", "status",
                  "params", "result", "error_message", "created_at", "updated_at"]
        read_only_fields = ["status", "result", "error_message", "created_at", "updated_at"]


class KAGDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KAGDocument
        fields = ["id", "project", "title", "file_path", "file_type",
                  "file_size", "content_preview", "is_processed", "created_at"]
        read_only_fields = ["file_size", "is_processed", "created_at"]


class QARequestSerializer(serializers.Serializer):
    question = serializers.CharField(required=True, min_length=1)
    project_id = serializers.IntegerField(required=False)
    top_k = serializers.IntegerField(default=5, min_value=1, max_value=50)


class QAResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    evidence = serializers.ListField(child=serializers.DictField(), required=False)
    task_id = serializers.IntegerField(required=False)


class BuildExtractSerializer(serializers.Serializer):
    project_name = serializers.CharField(required=False, default="KGtestV2")
    project_id = serializers.IntegerField(required=False, allow_null=True)
    content = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True)


class BuildCommitNodeSerializer(serializers.Serializer):
    id = serializers.CharField()
    label = serializers.CharField()
    spgType = serializers.CharField()
    vizType = serializers.CharField(required=False)
    group = serializers.IntegerField(required=False)
    properties = serializers.DictField(required=False)


class BuildCommitLinkSerializer(serializers.Serializer):
    source = serializers.CharField()
    target = serializers.CharField()
    label = serializers.CharField(required=False, allow_blank=True)
    properties = serializers.DictField(required=False)


class BuildCommitSerializer(serializers.Serializer):
    project_name = serializers.CharField(required=False, default="KGtestV2")
    project_id = serializers.IntegerField(required=False, allow_null=True)
    nodes = BuildCommitNodeSerializer(many=True)
    links = BuildCommitLinkSerializer(many=True, required=False, default=list)
