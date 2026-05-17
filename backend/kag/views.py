import os
import io
import re
import json
import asyncio
import logging
from pathlib import Path

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import KAGProject, KAGTask, KAGDocument
from .serializers import (
    KAGProjectSerializer, KAGTaskSerializer, KAGDocumentSerializer,
    QARequestSerializer,
)
from .config import get_kag_config

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
                "vector_dimensions": cfg.get("embedding", {}).get("vector_dimensions", 1024),
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
            return Response({"error": "需要 project_id 或 project_name"}, status=status.HTTP_400_BAD_REQUEST)

        task = KAGTask.objects.create(
            project=project, task_type=KAGTask.TaskType.BUILD,
            params={"file_path": file_path} if file_path else {},
            created_by=str(request.user),
        )

        try:
            result = self._run_build(project, file_path)
            task.status = KAGTask.Status.COMPLETED
            task.result = {"message": "构建成功", "detail": str(result)[:1000]}
            task.save()
            return Response({"task_id": task.id, "status": "completed", "result": task.result})
        except Exception as e:
            task.status = KAGTask.Status.FAILED
            task.error_message = str(e)
            task.save()
            logger.exception("Build failed for project %s", project.name)
            return Response({"task_id": task.id, "status": "failed", "error": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _run_build(self, project, file_path):
        cfg = get_kag_config()
        from kag.common.conf import KAG_CONFIG
        from kag.builder.runner import BuilderChainRunner

        project_dir = os.path.join(cfg["project_root"], project.name)
        config_path = os.path.join(project_dir, "kag_config.yaml")
        if os.path.exists(config_path):
            import yaml
            with open(config_path, "r", encoding="utf-8") as f:
                config_data = yaml.safe_load(f)
            if config_data and "kag_builder_pipeline" in config_data:
                pipeline_config = config_data["kag_builder_pipeline"]
                runner = BuilderChainRunner.from_config(pipeline_config)
                target_file = file_path or os.path.join(project_dir, "builder", "data")
                runner.invoke(target_file)
                return {"invoked": target_file}
        return {"error": "配置不存在"}


class QAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QARequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data["question"]
        project_id = serializer.validated_data.get("project_id")
        project_name = request.data.get("project_name")
        include_evidence = request.data.get("include_evidence", False)

        project = None
        if project_id:
            project = get_object_or_404(KAGProject, id=project_id)
            project_name = project.name

        task = KAGTask.objects.create(
            project=project or KAGProject.objects.filter(name=project_name).first() or
                    KAGProject.objects.create(name=project_name or "default", display_name=project_name or "默认项目"),
            task_type=KAGTask.TaskType.SOLVE,
            params={"question": question},
            created_by=str(request.user),
        )

        try:
            answer, evidence_list = self._run_qa(
                question, project_name or "KGtestV2", include_evidence
            )
            task.status = KAGTask.Status.COMPLETED
            result = {"answer": answer}
            if include_evidence:
                result["evidence"] = evidence_list
            task.result = result
            task.save()
            resp = {"answer": answer, "task_id": task.id}
            if include_evidence:
                resp["evidence"] = evidence_list
            return Response(resp)
        except Exception as e:
            task.status = KAGTask.Status.FAILED
            task.error_message = str(e)
            task.save()
            logger.exception("QA failed for question: %s", question)
            return Response({"error": str(e), "task_id": task.id},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _run_qa(self, question, project_name, include_evidence=False):
        cfg = get_kag_config()
        project_dir = os.path.join(cfg["project_root"], project_name)
        config_path = os.path.join(project_dir, "kag_config.yaml")

        import sys
        if project_dir not in sys.path:
            sys.path.insert(0, project_dir)

        import yaml
        from kag.common.conf import KAG_CONFIG
        from kag.interface import SolverPipelineABC

        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                config_data = yaml.safe_load(f)
            if config_data:
                KAG_CONFIG.all_config = config_data

        builder_dir = os.path.join(project_dir, "builder")
        if os.path.isdir(builder_dir):
            prompt_dir = os.path.join(builder_dir, "prompt")
            if os.path.isdir(prompt_dir) and prompt_dir not in sys.path:
                sys.path.insert(0, builder_dir)
                import importlib
                try:
                    import prompt
                    importlib.reload(prompt)
                except ImportError:
                    pass

        pipeline = SolverPipelineABC.from_config(
            KAG_CONFIG.all_config.get("kag_solver_pipeline", {})
        )

        from kag.evidence import run_qa_with_evidence
        answer, evidence_list = run_qa_with_evidence(question, pipeline)
        if not include_evidence:
            return answer, []
        return answer, evidence_list
