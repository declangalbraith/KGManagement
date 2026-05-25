import re

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SchemaVersion
from .serializers import (
    SchemaImportSerializer,
    SchemaSaveSerializer,
    SchemaVersionDetailSerializer,
    SchemaVersionListSerializer,
)


def _bump_draft_version(version: str) -> str:
    """KB-ONT-V2.1.0-draft → KB-ONT-V2.1.1-draft"""
    match = re.match(r"^(KB-ONT-V)(\d+)\.(\d+)\.(\d+)(-draft)?$", version, re.IGNORECASE)
    if not match:
        return f"{version}-saved"
    patch = int(match.group(4)) + 1
    return f"{match.group(1)}{match.group(2)}.{match.group(3)}.{patch}-draft"


def _bump_publish_version(version: str) -> str:
    """KB-ONT-V2.1.0-draft → KB-ONT-V2.1.0"""
    return re.sub(r"-draft$", "", version, flags=re.IGNORECASE)


class SchemaVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """版本历史列表 & 详情。"""

    queryset = SchemaVersion.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == "list":
            return SchemaVersionListSerializer
        return SchemaVersionDetailSerializer


class SchemaCurrentView(APIView):
    """获取当前编辑版本，首次访问时自动从初始 schema 文件加载。"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        current = SchemaVersion.objects.filter(is_current=True).first()
        if current:
            return Response(SchemaVersionDetailSerializer(current).data)

        # 表空 → 从初始 schema 文件加载
        from .schema_initializer import load_initial_snapshot

        snapshot = load_initial_snapshot()
        if not snapshot:
            return Response(None, status=status.HTTP_200_OK)

        SchemaVersion.objects.filter(is_current=True).update(is_current=False)
        record = SchemaVersion(
            version="KB-ONT-V1.0.0-draft",
            status=SchemaVersion.Status.DRAFT,
            is_current=True,
            description="从 KGtestV2.schema 初始化",
            snapshot=snapshot,
        )
        record.insert(request)
        return Response(SchemaVersionDetailSerializer(record).data)


class SchemaSaveView(APIView):
    """保存为新草稿版本。"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SchemaSaveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # 取当前版本的 version 号用于递增
        current = SchemaVersion.objects.filter(is_current=True).first()
        if current:
            new_version = _bump_draft_version(current.version)
        else:
            new_version = "KB-ONT-V1.0.0-draft"

        # 清除旧的 is_current
        SchemaVersion.objects.filter(is_current=True).update(is_current=False)

        record = SchemaVersion(
            version=new_version,
            status=SchemaVersion.Status.DRAFT,
            is_current=True,
            description=data["description"],
            snapshot=data["snapshot"],
        )
        record.insert(request)
        return Response(
            SchemaVersionDetailSerializer(record).data,
            status=status.HTTP_201_CREATED,
        )


class SchemaPublishView(APIView):
    """发布当前草稿。"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = SchemaVersion.objects.filter(
            is_current=True, status=SchemaVersion.Status.DRAFT
        ).first()
        if not current:
            return Response(
                {"error": "没有可发布的草稿"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current.status = SchemaVersion.Status.PUBLISHED
        current.version = _bump_publish_version(current.version)
        current.save()
        return Response(SchemaVersionDetailSerializer(current).data)


class SchemaImportView(APIView):
    """解析上传的 .schema 文件，返回 ParsedOpenSpgSchema 结构。
    不直接替换工作台数据，由前端 applySchemaText 处理。
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SchemaImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data["file"]
        try:
            text = file.read().decode("utf-8")
        except UnicodeDecodeError:
            return Response(
                {"error": "文件编码错误，请使用 UTF-8"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 解析 schema 文本并转为 workbench snapshot
        try:
            from schema_manager.parseOpenSpgSchema import parseOpenSpgSchema, getParsedSchemaStats
            from schema_manager.schema_initializer import parsed_to_workbench_snapshot

            parsed = parseOpenSpgSchema(text)
            stats = getParsedSchemaStats(parsed)
            snapshot = parsed_to_workbench_snapshot(parsed)
        except Exception as e:
            return Response(
                {"error": f"Schema 解析失败: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "snapshot": snapshot,
                "stats": stats,
            }
        )


class SchemaExportView(APIView):
    """导出当前 schema 为 .schema 文本。"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        current = SchemaVersion.objects.filter(is_current=True).first()
        if not current:
            return Response(
                {"error": "没有当前版本可导出"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .schema_exporter import snapshot_to_schema_text

        text = snapshot_to_schema_text(current.snapshot, current.version)
        return Response({"version": current.version, "content": text})
