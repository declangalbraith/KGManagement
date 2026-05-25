from rest_framework import serializers

from .models import SchemaVersion


class SchemaVersionListSerializer(serializers.ModelSerializer):
    """版本列表 —— 不含 snapshot，减少传输量。"""

    author = serializers.SerializerMethodField()

    class Meta:
        model = SchemaVersion
        fields = [
            "id",
            "version",
            "status",
            "is_current",
            "description",
            "author",
            "create_datetime",
            "update_datetime",
        ]

    def get_author(self, obj):
        return getattr(obj.creator, "name", None) or getattr(obj.creator, "username", None) or ""


class SchemaVersionDetailSerializer(serializers.ModelSerializer):
    """版本详情 —— 含完整 snapshot。"""

    author = serializers.SerializerMethodField()

    class Meta:
        model = SchemaVersion
        fields = [
            "id",
            "version",
            "status",
            "is_current",
            "description",
            "author",
            "snapshot",
            "create_datetime",
            "update_datetime",
        ]

    def get_author(self, obj):
        return getattr(obj.creator, "name", None) or getattr(obj.creator, "username", None) or ""


class SchemaSaveSerializer(serializers.Serializer):
    """保存草稿的请求体。"""

    description = serializers.CharField(required=True, max_length=500)
    snapshot = serializers.DictField(required=True)


class SchemaImportSerializer(serializers.Serializer):
    """导入 .schema 文件的请求体。"""

    file = serializers.FileField(required=True)
