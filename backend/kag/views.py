import logging
import os

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .config import get_kag_config
from .models import KAGDocument, KAGProject, KAGTask
from .graph_viz import (
    expand_subgraph,
    get_graph_api,
    overview_subgraph,
    qa_graph_bundle,
)
from .evidence import sanitize_for_json
from .runtime import prepare_project_runtime
from .serializers import (
    KAGDocumentSerializer,
    KAGProjectSerializer,
    KAGTaskSerializer,
    QARequestSerializer,
)

logger = logging.getLogger(__name__)


class KAGProjectViewSet(viewsets.ModelViewSet):
    queryset = KAGProject.objects.all()
    serializer_class = KAGProjectSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "display_name"]


class KAGTaskViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = KAGTask.objects.all()
    serializer_class = KAGTaskSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project", "task_type", "status"]


class KAGDocumentViewSet(viewsets.ModelViewSet):
    queryset = KAGDocument.objects.all()
    serializer_class = KAGDocumentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project"]


class KAGConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cfg = get_kag_config()
        safe = {
            "llm": cfg.get("llm", {}),
            "embedding": {
                "model": cfg.get("embedding", {}).get("model", ""),
                "vector_dimensions": cfg.get("embedding", {}).get(
                    "vector_dimensions", 1024
                ),
            },
            "neo4j": {
                "uri": cfg.get("neo4j", {}).get("uri", ""),
                "database": cfg.get("neo4j", {}).get("database", ""),
            },
        }
        return Response(safe)


class BuildView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        project_name = request.data.get("project_name")
        file_path = request.data.get("file_path")

        if project_id:
            project = get_object_or_404(KAGProject, id=project_id)
        elif project_name:
            project, _ = KAGProject.objects.get_or_create(
                name=project_name,
                defaults={"display_name": project_name, "created_by": str(request.user)},
            )
        else:
            return Response(
                {"error": "需要 project_id 或 project_name"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = KAGTask.objects.create(
            project=project,
            task_type=KAGTask.TaskType.BUILD,
            params={"file_path": file_path} if file_path else {},
            created_by=str(request.user),
        )

        try:
            result = self._run_build(project, file_path)
            if "error" in result:
                raise RuntimeError(result["error"])
            task.status = KAGTask.Status.COMPLETED
            task.result = {"message": "构建成功", "detail": str(result)[:1000]}
            task.save()
            return Response(
                {"task_id": task.id, "status": "completed", "result": task.result}
            )
        except Exception as exc:
            task.status = KAGTask.Status.FAILED
            task.error_message = str(exc)
            task.save()
            logger.exception("Build failed for project %s", project.name)
            return Response(
                {"task_id": task.id, "status": "failed", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _run_build(self, project, file_path):
        runtime = prepare_project_runtime(project.name, include_builder=True)
        from kag.builder.runner import BuilderChainRunner
        from kag.common.conf import KAG_CONFIG

        pipeline_config = KAG_CONFIG.all_config.get("kag_builder_pipeline", {})
        if not pipeline_config:
            return {"error": "KAG builder pipeline is not configured"}

        runner = BuilderChainRunner.from_config(pipeline_config)
        target_file = file_path or os.path.join(runtime["project_dir"], "builder", "data")
        runner.invoke(target_file)
        return {"invoked": target_file}


class GraphSubgraphView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_name = request.query_params.get("project_name") or "KGtestV2"
        mode = request.query_params.get("mode") or "overview"
        center_id = request.query_params.get("center_id")
        default_limit = 40 if mode == "overview" else 200
        try:
            limit = int(request.query_params.get("limit") or default_limit)
        except (TypeError, ValueError):
            limit = default_limit
        limit = max(1, min(limit, 500))

        try:
            graph_api = get_graph_api(project_name)
            schema = graph_api.schema
            from kag.common.conf import KAG_CONFIG

            namespace = (KAG_CONFIG.all_config.get("project", {}) or {}).get(
                "namespace", project_name
            )
            if mode == "expand":
                if not center_id:
                    return Response(
                        {"error": "expand 模式需要 center_id"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                payload = expand_subgraph(
                    graph_api, schema, center_id, limit=limit, namespace=namespace
                )
            else:
                payload = overview_subgraph(
                    graph_api, schema, limit=limit, namespace=namespace
                )
            return Response(payload)
        except Exception as exc:
            logger.exception("Graph subgraph failed for project %s", project_name)
            return Response(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class QAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QARequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data["question"]
        project_id = serializer.validated_data.get("project_id")
        project_name = request.data.get("project_name") or "KGtestV2"
        include_evidence = request.data.get("include_evidence", False)
        include_graph = request.data.get("include_graph", False)
        if include_graph:
            include_evidence = True

        if project_id:
            project = get_object_or_404(KAGProject, id=project_id)
            project_name = project.name
        else:
            project, _ = KAGProject.objects.get_or_create(
                name=project_name,
                defaults={"display_name": project_name, "created_by": str(request.user)},
            )

        task = KAGTask.objects.create(
            project=project,
            task_type=KAGTask.TaskType.SOLVE,
            params={"question": question},
            created_by=str(request.user),
        )

        try:
            answer, evidence_list = self._run_qa(
                question, project_name, include_evidence
            )
            task.status = KAGTask.Status.COMPLETED
            safe_evidence = (
                sanitize_for_json(evidence_list) if include_evidence else None
            )
            result = {"answer": answer}
            if include_evidence:
                result["evidence"] = safe_evidence
            task.result = result
            task.save()
            response = {"answer": answer, "task_id": task.id}
            if include_evidence:
                response["evidence"] = safe_evidence
            if include_graph:
                from kag.common.conf import KAG_CONFIG

                graph_api = get_graph_api(project_name)
                namespace = (KAG_CONFIG.all_config.get("project", {}) or {}).get(
                    "namespace", project_name
                )
                bundle = qa_graph_bundle(
                    graph_api,
                    graph_api.schema,
                    evidence_list,
                    namespace=namespace,
                )
                response["highlight_node_ids"] = bundle["highlight_node_ids"]
                response["subgraph_delta"] = bundle["subgraph_delta"]
            return Response(response)
        except Exception as exc:
            task.status = KAGTask.Status.FAILED
            task.error_message = str(exc)
            task.save()
            logger.exception("QA failed for question: %s", question)
            return Response(
                {"error": str(exc), "task_id": task.id},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _run_qa(self, question, project_name, include_evidence=False):
        prepare_project_runtime(project_name, include_builder=False)
        from kag.common.conf import KAG_CONFIG
        from kag.interface import SolverPipelineABC

        pipeline = SolverPipelineABC.from_config(
            KAG_CONFIG.all_config.get("kag_solver_pipeline", {})
        )

        from kag.evidence import run_qa_with_evidence

        answer, evidence_list = run_qa_with_evidence(question, pipeline)
        if not include_evidence:
            return answer, []
        return answer, evidence_list
