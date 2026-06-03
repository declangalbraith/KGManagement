import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from dvadmin.utils.json_response import DetailResponse, ErrorResponse
from dvadmin.utils.pagination import CustomPagination

from kg_agent.client import EightDIntegrationClient
from kg_agent.exceptions import EightDIntegrationError
from kg_agent.mappers.graph_viz import graph_response_to_viz, result_response_to_viz
from kg_agent.models import KgBuildJob
from kg_agent.serializers import KgBuildJobSerializer
from kg_agent.services.build_job import create_build_job_from_upload, sync_job_pipeline
from kg_agent.services.graph_overview import fetch_eight_d_graph_overview

logger = logging.getLogger(__name__)


class BuildUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded = request.FILES.get("file")
        content = request.data.get("content") or ""
        title = request.data.get("title") or ""
        if not uploaded and not str(content).strip():
            return ErrorResponse(msg="需要上传文件或文本内容", code=4000)

        try:
            job = create_build_job_from_upload(
                request,
                uploaded_file=uploaded,
                content=str(content),
                title=str(title),
                auto_run_pipeline=True,
            )
        except ValueError as exc:
            return ErrorResponse(msg=str(exc), code=4000)
        except EightDIntegrationError as exc:
            return ErrorResponse(
                msg=str(exc),
                code=4000,
                data={"trace_id": exc.trace_id, "error_code": exc.code},
            )
        except Exception as exc:
            logger.exception("8D build upload failed")
            return ErrorResponse(msg=str(exc), code=5000)

        return DetailResponse(
            data={
                "job_id": job.id,
                "doc_id": job.doc_id,
                "run_id": job.run_id,
                "status": job.status,
                "source_record_id": job.source_record_id,
            },
            msg="上传成功，构建任务已创建",
        )


class BuildListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = KgBuildJob.objects.all().order_by("-create_datetime")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = CustomPagination()
        page_qs = paginator.paginate_queryset(qs, request, view=self)
        serializer = KgBuildJobSerializer(page_qs, many=True)
        if page_qs is not None:
            return paginator.get_paginated_response(serializer.data)
        return DetailResponse(data=serializer.data)


class BuildStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        job = get_object_or_404(KgBuildJob, pk=pk)
        if not job.doc_id:
            return ErrorResponse(msg="任务缺少 doc_id", code=4000)

        try:
            remote = sync_job_pipeline(job, request.user)
        except EightDIntegrationError as exc:
            return ErrorResponse(
                msg=str(exc),
                code=4000,
                data={"trace_id": exc.trace_id, "job_id": job.id},
            )

        err = remote.get("error")
        error_message = job.error_message
        if isinstance(err, dict):
            error_message = err.get("message") or error_message

        return DetailResponse(
            data={
                "job_id": job.id,
                "doc_id": job.doc_id,
                "run_id": job.run_id,
                "status": job.status,
                "current_stage": job.current_stage,
                "trace_id": job.trace_id,
                "error": error_message or None,
                "finished_at": job.finished_at.isoformat() if job.finished_at else None,
            }
        )


class BuildResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        job = get_object_or_404(KgBuildJob, pk=pk)
        if job.status not in (KgBuildJob.Status.SUCCESS, KgBuildJob.Status.PARTIAL_SUCCESS):
            try:
                sync_job_pipeline(job, request.user)
            except EightDIntegrationError as exc:
                return ErrorResponse(msg=str(exc), code=4000, data={"trace_id": exc.trace_id})
            if job.status not in (KgBuildJob.Status.SUCCESS, KgBuildJob.Status.PARTIAL_SUCCESS):
                return ErrorResponse(
                    msg="构建尚未完成",
                    code=4000,
                    data={"status": job.status, "current_stage": job.current_stage},
                )

        if not job.doc_id:
            return ErrorResponse(msg="任务缺少 doc_id", code=4000)

        try:
            client = EightDIntegrationClient.for_user(request.user)
            raw = client.get_result(job.doc_id)
            viz = result_response_to_viz(raw)
            stats = raw.get("stats") or {}
            job.stats = stats if isinstance(stats, dict) else {}
            job.save(update_fields=["stats", "update_datetime"])
        except EightDIntegrationError as exc:
            return ErrorResponse(
                msg=str(exc),
                code=4000,
                data={"trace_id": exc.trace_id, "job_id": job.id},
            )

        return DetailResponse(
            data={
                "job_id": job.id,
                "doc_id": job.doc_id,
                "subgraph": viz,
                "stats": {
                    "nodeCount": len(viz.get("nodes") or []),
                    "edgeCount": len(viz.get("links") or []),
                    **(job.stats or {}),
                },
                "schema_version": raw.get("schema_version"),
                "extraction_version": raw.get("extraction_version"),
            }
        )


class GraphOverviewView(APIView):
    """8D knowledge graph overview for builder page (not KAG Neo4j)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit") or 80)
        except (TypeError, ValueError):
            limit = 80
        limit = max(1, min(limit, 500))
        try:
            max_docs = int(request.query_params.get("max_docs") or 8)
        except (TypeError, ValueError):
            max_docs = 8
        max_docs = max(1, min(max_docs, 20))

        try:
            viz = fetch_eight_d_graph_overview(
                request.user, max_nodes=limit, max_docs=max_docs
            )
        except EightDIntegrationError as exc:
            return ErrorResponse(
                msg=str(exc),
                code=4000,
                data={"trace_id": exc.trace_id, "error_code": exc.code},
            )
        except Exception as exc:
            logger.exception("8D graph overview failed")
            return ErrorResponse(msg=str(exc), code=5000)

        if not (viz.get("nodes") or []):
            return ErrorResponse(
                msg="8D 图谱暂无数据，请先在构建页上传文档并完成构建",
                code=4000,
            )

        return DetailResponse(
            data={
                "subgraph": viz,
                "stats": {
                    "nodeCount": len(viz.get("nodes") or []),
                    "edgeCount": len(viz.get("links") or []),
                    "mergedDocCount": viz.get("merged_doc_count") or 0,
                },
                "doc_ids": viz.get("doc_ids") or [],
                "source": viz.get("source"),
            }
        )


class GraphView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doc_id = request.query_params.get("doc_id")
        job_id = request.query_params.get("job_id")

        if job_id and not doc_id:
            job = get_object_or_404(KgBuildJob, pk=job_id)
            doc_id = job.doc_id

        if not doc_id:
            return ErrorResponse(msg="需要 doc_id 或 job_id", code=4000)

        try:
            client = EightDIntegrationClient.for_user(request.user)
            raw = client.get_graph(doc_id)
            viz = graph_response_to_viz(raw)
        except EightDIntegrationError as exc:
            return ErrorResponse(
                msg=str(exc),
                code=4000,
                data={"trace_id": exc.trace_id},
            )

        return DetailResponse(data={"doc_id": doc_id, **viz})
