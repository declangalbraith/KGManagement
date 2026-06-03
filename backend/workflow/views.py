import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from dvadmin.utils.json_response import DetailResponse, SuccessResponse
from workflow.models import WorkflowDefinition, WorkflowTask
from workflow.serializers import (
    WorkflowDefinitionSerializer,
    WorkflowDefinitionWriteSerializer,
    WorkflowDesignWriteSerializer,
    WorkflowTaskRejectSerializer,
    WorkflowTaskSerializer,
)
from workflow.services.definition import (
    collect_design_errors,
    load_design_payload,
    normalize_definition_json,
    validate_design_payload,
)
from workflow.services.engine import approve_task, reject_task

logger = logging.getLogger(__name__)


class WorkflowDefinitionViewSet(viewsets.ModelViewSet):
    queryset = WorkflowDefinition.objects.select_related("doc_type")
    permission_classes = [IsAuthenticated]
    pagination_class = None
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return WorkflowDefinitionWriteSerializer
        return WorkflowDefinitionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        doc_type_id = self.request.query_params.get("doc_type_id", "").strip()
        is_active = self.request.query_params.get("is_active", "").strip()
        if doc_type_id:
            qs = qs.filter(doc_type_id=doc_type_id)
        if is_active in ("true", "1"):
            qs = qs.filter(is_active=True)
        elif is_active in ("false", "0"):
            qs = qs.filter(is_active=False)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = WorkflowDefinitionSerializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, msg="查询成功")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = WorkflowDefinitionSerializer(instance)
        return DetailResponse(data=serializer.data, msg="查询成功")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        definition = serializer.save(
            creator=request.user if request.user.is_authenticated else None,
            modifier=getattr(request.user, "username", ""),
        )
        definition = WorkflowDefinition.objects.select_related("doc_type").get(pk=definition.pk)
        return DetailResponse(
            data=WorkflowDefinitionSerializer(definition).data,
            msg="创建成功",
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        definition = serializer.save(modifier=getattr(request.user, "username", ""))
        definition = WorkflowDefinition.objects.select_related("doc_type").get(pk=definition.pk)
        return DetailResponse(
            data=WorkflowDefinitionSerializer(definition).data,
            msg="更新成功",
        )

    partial_update = update

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return DetailResponse(data=[], msg="删除成功")

    @action(detail=True, methods=["get", "put"], url_path="design")
    def design(self, request, pk=None):
        instance = self.get_object()
        if request.method == "GET":
            return DetailResponse(data=load_design_payload(instance), msg="查询成功")

        from dvadmin.utils.json_response import ErrorResponse

        serializer = WorkflowDesignWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        node_config = data["nodeConfig"]
        errors = collect_design_errors(node_config)
        if errors:
            return ErrorResponse(data={"errors": errors}, msg="请完善流程配置", code=4000)

        payload = normalize_definition_json(instance.definition_json)
        payload["nodeConfig"] = node_config
        payload["flowPermission"] = data.get("flowPermission", payload.get("flowPermission") or [])
        if data.get("directorMaxLevel"):
            payload["directorMaxLevel"] = data["directorMaxLevel"]

        warnings = validate_design_payload(payload)
        instance.definition_json = payload
        instance.modifier = getattr(request.user, "username", "")
        instance.save(update_fields=["definition_json", "update_datetime", "modifier"])

        response_data = load_design_payload(instance)
        if warnings:
            response_data["runtime_warnings"] = warnings
        return DetailResponse(data=response_data, msg="保存成功")


class WorkflowTaskViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowTask.objects.select_related(
        "assignee",
        "instance",
        "instance__definition",
        "instance__document_version",
    )
    serializer_class = WorkflowTaskSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status", "pending").strip()
        mine = self.request.query_params.get("mine", "true").strip()
        if status_param:
            qs = qs.filter(status=status_param)
        if mine in ("true", "1", ""):
            qs = qs.filter(assignee_id=self.request.user.id)
        return qs.order_by("-create_datetime")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, msg="查询成功")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return DetailResponse(data=serializer.data, msg="查询成功")

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        task = self.get_object()
        try:
            approve_task(task=task, user=request.user)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Approve task failed")
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        task.refresh_from_db()
        return DetailResponse(data=WorkflowTaskSerializer(task).data, msg="审批通过")

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        task = self.get_object()
        serializer = WorkflowTaskRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            reject_task(
                task=task,
                user=request.user,
                comment=serializer.validated_data.get("comment", ""),
            )
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Reject task failed")
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        task.refresh_from_db()
        return DetailResponse(data=WorkflowTaskSerializer(task).data, msg="已打回")
