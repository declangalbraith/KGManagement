import logging
import mimetypes

from django.http import StreamingHttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from doc_manage.models import BomDocument, DocumentType, GeneralDocument
from doc_manage.serializers import (
    BomDocumentPatchSerializer,
    BomDocumentSerializer,
    DocumentTypeSerializer,
    GeneralDocumentAuditLogSerializer,
    GeneralDocumentPatchSerializer,
    GeneralDocumentSerializer,
    GeneralDocumentVersionSerializer,
)
from doc_manage.services import minio_client
from doc_manage.services.bom_service import soft_delete_bom_document, upload_bom_document
from doc_manage.services.general_doc_service import (
    revise_general_document,
    soft_delete_general_document,
    upload_general_document,
)
from workflow.models import WorkflowAuditLog
from workflow.services.engine import BIZ_TYPE_GENERAL_DOCUMENT, trigger_workflow

logger = logging.getLogger(__name__)


class BomDocumentViewSet(viewsets.ModelViewSet):
    queryset = BomDocument.objects.all()
    serializer_class = BomDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return BomDocumentPatchSerializer
        return BomDocumentSerializer

    def get_queryset(self):
        qs = BomDocument.objects.filter(is_deleted=False)
        search = self.request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q

            qs = qs.filter(
                Q(number__icontains=search)
                | Q(description_en__icontains=search)
                | Q(type_designation__icontains=search)
                | Q(uploader__icontains=search)
                | Q(state__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"file": ["请上传 BOM 文件"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            document = upload_bom_document(user=request.user, uploaded_file=uploaded)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("BOM upload failed")
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BomDocumentSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        soft_delete_bom_document(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        document = self.get_object()
        try:
            obj = minio_client.get_object_stream(document.minio_path)
        except Exception as exc:
            logger.exception("BOM download failed for id=%s", pk)
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        content_type, _ = mimetypes.guess_type(document.original_filename)
        response = StreamingHttpResponse(
            streaming_content=obj.stream(32 * 1024),
            content_type=content_type or "application/octet-stream",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{document.original_filename}"'
        )
        return response


class DocumentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentType.objects.filter(is_active=True)
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class GeneralDocumentViewSet(viewsets.ModelViewSet):
    queryset = GeneralDocument.objects.select_related(
        "doc_type", "workflow_definition", "current_version"
    ).all()
    serializer_class = GeneralDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return GeneralDocumentPatchSerializer
        return GeneralDocumentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        qs = GeneralDocument.objects.select_related(
            "doc_type", "workflow_definition", "current_version"
        ).filter(is_deleted=False)
        search = self.request.query_params.get("search", "").strip()
        doc_type_id = self.request.query_params.get("doc_type_id", "").strip()
        if doc_type_id:
            qs = qs.filter(doc_type_id=doc_type_id)
        if search:
            from django.db.models import Q

            qs = qs.filter(
                Q(name__icontains=search)
                | Q(doc_type__name__icontains=search)
                | Q(file_description__icontains=search)
                | Q(uploader__icontains=search)
            )
        return qs

    def create(self, request, *args, **kwargs):
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"file": ["请上传文档文件"]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            document = upload_general_document(
                user=request.user,
                uploaded_file=uploaded,
                doc_type_id=request.data.get("doc_type_id"),
                description=request.data.get("description", ""),
                workflow_definition_id=request.data.get("workflow_definition_id"),
            )
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("General document upload failed")
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        document = self.get_queryset().get(pk=document.pk)
        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        document = self.get_queryset().get(pk=document.pk)
        return Response(GeneralDocumentSerializer(document, context=self.get_serializer_context()).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        soft_delete_general_document(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="revise", parser_classes=[MultiPartParser, FormParser])
    def revise(self, request, pk=None):
        document = self.get_object()
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"file": ["请上传文档文件"]}, status=status.HTTP_400_BAD_REQUEST)
        content = uploaded.read()
        try:
            document = revise_general_document(
                user=request.user,
                document=document,
                uploaded_file_name=uploaded.name,
                content=content,
                description=request.data.get("description", ""),
            )
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        document = self.get_queryset().get(pk=document.pk)
        return Response(GeneralDocumentSerializer(document, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"], url_path="trigger-workflow")
    def trigger_workflow_action(self, request, pk=None):
        document = self.get_object()
        try:
            trigger_workflow(document=document, user=request.user)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        document = self.get_queryset().get(pk=document.pk)
        return Response(GeneralDocumentSerializer(document, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["get"], url_path="versions")
    def versions(self, request, pk=None):
        document = self.get_object()
        items = document.versions.all().order_by("-create_datetime")
        return Response(GeneralDocumentVersionSerializer(items, many=True).data)

    @action(detail=True, methods=["get"], url_path="audit-logs")
    def audit_logs(self, request, pk=None):
        document = self.get_object()
        logs = WorkflowAuditLog.objects.filter(
            biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
            biz_id=document.id,
        ).order_by("-create_datetime")
        return Response(GeneralDocumentAuditLogSerializer(logs, many=True).data)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        document = self.get_object()
        try:
            obj = minio_client.get_object_stream(document.minio_path)
        except Exception as exc:
            logger.exception("General document download failed for id=%s", pk)
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        content_type, _ = mimetypes.guess_type(document.original_filename)
        response = StreamingHttpResponse(
            streaming_content=obj.stream(32 * 1024),
            content_type=content_type or "application/octet-stream",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{document.original_filename}"'
        )
        return response

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        from workflow.models import WorkflowTask
        from workflow.services.engine import approve_task, get_pending_task_for_document

        document = self.get_object()
        task = get_pending_task_for_document(document, request.user)
        if not task:
            return Response({"detail": "当前无待办审批任务"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            approve_task(task=task, user=request.user)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        document = self.get_queryset().get(pk=document.pk)
        return Response(GeneralDocumentSerializer(document, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        from workflow.services.engine import get_pending_task_for_document, reject_task

        document = self.get_object()
        task = get_pending_task_for_document(document, request.user)
        if not task:
            return Response({"detail": "当前无待办审批任务"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            reject_task(
                task=task,
                user=request.user,
                comment=request.data.get("comment", ""),
            )
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        document = self.get_queryset().get(pk=document.pk)
        return Response(GeneralDocumentSerializer(document, context=self.get_serializer_context()).data)
