import re

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from dvadmin.utils.json_response import ErrorResponse
from dvadmin.utils.viewset import CustomModelViewSet

from .models import SchemaProject, SchemaVersion
from .serializers import (
    SchemaImportSerializer,
    SchemaProjectSerializer,
    SchemaPublishSerializer,
    SchemaSaveSerializer,
    SchemaVersionDetailSerializer,
    SchemaVersionListSerializer,
)


def _draft_from_published(version: str) -> str:
    """KB-ONT-V2.1.0 → KB-ONT-V2.1.1-draft"""
    match = re.match(r"^(KB-ONT-V)(\d+)\.(\d+)\.(\d+)$", version, re.IGNORECASE)
    if not match:
        return f"{version}-draft"
    patch = int(match.group(4)) + 1
    return f"{match.group(1)}{match.group(2)}.{match.group(3)}.{patch}-draft"
def _bump_publish_version(version: str) -> str:
    """KB-ONT-V2.1.0-draft → KB-ONT-V2.1.0"""
    return re.sub(r"-draft$", "", version, flags=re.IGNORECASE)


def _parse_project_id(request, *, from_body=False):
    if from_body:
        raw = request.data.get("project_id")
    else:
        raw = request.query_params.get("project_id")
    if raw in (None, ""):
        return None
    try:
        project_id = int(raw)
    except (TypeError, ValueError):
        return None
    return project_id if project_id > 0 else None


def _get_project_or_error(project_id):
    if not project_id:
        return None, ErrorResponse(msg="缺少 project_id 参数", status=status.HTTP_400_BAD_REQUEST)
    project = SchemaProject.objects.filter(id=project_id).first()
    if not project:
        return None, ErrorResponse(msg=f"Schema 项目不存在: {project_id}", status=status.HTTP_404_NOT_FOUND)
    return project, None


class SchemaProjectViewSet(CustomModelViewSet):
    """Schema 项目 CRUD。"""

    queryset = SchemaProject.objects.all()
    serializer_class = SchemaProjectSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "display_name"]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        from .schema_initializer import ensure_default_schema_project, migrate_orphan_schema_versions

        if not SchemaProject.objects.exists():
            ensure_default_schema_project(request)
        else:
            default = (
                SchemaProject.objects.filter(name="KGtestV2").first()
                or SchemaProject.objects.order_by("id").first()
            )
            if default:
                migrate_orphan_schema_versions(default)
        return super().list(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if SchemaVersion.objects.filter(project_id=instance.id).exists():
            return ErrorResponse(
                msg="该项目下仍有 Schema 版本，无法删除",
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class SchemaVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """版本历史列表 & 详情。"""

    queryset = SchemaVersion.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == "list":
            return SchemaVersionListSerializer
        return SchemaVersionDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = _parse_project_id(self.request)
        if project_id:
            qs = qs.filter(
                project_id=project_id,
                status=SchemaVersion.Status.PUBLISHED,
                is_current=False,
            )
        return qs

    def list(self, request, *args, **kwargs):
        project_id = _parse_project_id(request)
        if not project_id:
            return ErrorResponse(msg="缺少 project_id 参数", status=status.HTTP_400_BAD_REQUEST)
        _, err = _get_project_or_error(project_id)
        if err:
            return err
        return super().list(request, *args, **kwargs)


class SchemaCurrentView(APIView):
    """获取当前编辑版本，首次访问时自动从初始 schema 文件加载。"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = _parse_project_id(request)
        project, err = _get_project_or_error(project_id)
        if err:
            return err

        current = SchemaVersion.objects.filter(
            project_id=project.id, is_current=True
        ).first()
        if current:
            return Response(SchemaVersionDetailSerializer(current).data)

        from .schema_initializer import load_initial_snapshot

        snapshot = load_initial_snapshot(project)
        if not snapshot:
            return Response(None, status=status.HTTP_200_OK)

        SchemaVersion.objects.filter(project_id=project.id, is_current=True).update(
            is_current=False
        )
        record = SchemaVersion(
            project_id=project.id,
            version="KB-ONT-V1.0.0-draft",
            status=SchemaVersion.Status.DRAFT,
            is_current=True,
            description=f"从 {project.name} 初始 schema 文件初始化",
            snapshot=snapshot,
        )
        record.insert(request)
        return Response(SchemaVersionDetailSerializer(record).data)


class SchemaSaveView(APIView):
    """保存草稿：当前为草稿时就地更新，从已发布编辑时 fork 新草稿。"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SchemaSaveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        project, err = _get_project_or_error(data["project_id"])
        if err:
            return err

        current = SchemaVersion.objects.filter(
            project_id=project.id, is_current=True
        ).first()

        if current and current.status == SchemaVersion.Status.DRAFT:
            current.description = data["description"]
            current.snapshot = data["snapshot"]
            current.save()
            return Response(SchemaVersionDetailSerializer(current).data)

        if current and current.status == SchemaVersion.Status.PUBLISHED:
            current.is_current = False
            current.save(update_fields=["is_current"])
            record = SchemaVersion(
                project_id=project.id,
                version=_draft_from_published(current.version),
                status=SchemaVersion.Status.DRAFT,
                is_current=True,
                description=data["description"],
                snapshot=data["snapshot"],
            )
            record = record.insert(request)
            return Response(
                SchemaVersionDetailSerializer(record).data,
                status=status.HTTP_201_CREATED,
            )

        record = SchemaVersion(
            project_id=project.id,
            version="KB-ONT-V1.0.0-draft",
            status=SchemaVersion.Status.DRAFT,
            is_current=True,
            description=data["description"],
            snapshot=data["snapshot"],
        )
        record = record.insert(request)
        return Response(
            SchemaVersionDetailSerializer(record).data,
            status=status.HTTP_201_CREATED,
        )


class SchemaPublishView(APIView):
    """发布当前草稿。"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SchemaPublishSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        project, err = _get_project_or_error(serializer.validated_data["project_id"])
        if err:
            return err

        current = SchemaVersion.objects.filter(
            project_id=project.id,
            is_current=True,
            status=SchemaVersion.Status.DRAFT,
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

        try:
            from schema_manager.parseOpenSpgSchema import (
                getParsedSchemaStats,
                parseOpenSpgSchema,
            )
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
        project_id = _parse_project_id(request)
        project, err = _get_project_or_error(project_id)
        if err:
            return err

        current = SchemaVersion.objects.filter(
            project_id=project.id, is_current=True
        ).first()
        if not current:
            return Response(
                {"error": "没有当前版本可导出"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .schema_exporter import snapshot_to_schema_text

        text = snapshot_to_schema_text(current.snapshot, current.version)
        return Response({"version": current.version, "content": text})
