"""Orchestration helpers for KgBuildJob + 8D facade."""

from __future__ import annotations

import logging
import tempfile
import uuid
from typing import Any, Dict, Optional, Tuple

from django.utils import timezone

from kg_agent.client import EightDIntegrationClient
from kg_agent.auth.jwt_token import resolve_eight_d_org_id
from kg_agent.conf import get_eight_d_settings
from kg_agent.exceptions import EightDIntegrationError
from kg_agent.mappers.graph_viz import map_pipeline_status
from kg_agent.models import KgBuildJob

logger = logging.getLogger(__name__)

ALLOWED_UPLOAD_EXT = {".txt", ".md", ".docx", ".pdf"}


def _operator_context(user) -> Tuple[str, str]:
    """Local audit fields on KgBuildJob (8D identity comes from JWT, not request body)."""
    operator_id = str(getattr(user, "id", "") or "")
    return operator_id, resolve_eight_d_org_id(user)


def _content_type_for_name(file_name: str) -> str:
    lower = file_name.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if lower.endswith(".md"):
        return "text/markdown"
    return "text/plain"


def materialize_upload(*, uploaded_file=None, content: str = "", title: str = "") -> Tuple[str, str]:
    """Return (file_path, file_name) for 8D multipart upload."""
    if uploaded_file is not None:
        name = uploaded_file.name or "upload.bin"
        ext = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
        if ext and ext not in ALLOWED_UPLOAD_EXT:
            raise ValueError(
                f"不支持的文件类型: {ext}，允许: {', '.join(sorted(ALLOWED_UPLOAD_EXT))}"
            )
        path = tempfile.NamedTemporaryFile(delete=False, suffix=ext or ".bin").name
        with open(path, "wb") as fh:
            for chunk in uploaded_file.chunks():
                fh.write(chunk)
        return path, name

    if not (content or "").strip():
        raise ValueError("需要上传文件或文本内容")

    file_name = (title or "paste").strip()[:80] + ".txt"
    path = tempfile.NamedTemporaryFile(delete=False, suffix=".txt").name
    with open(path, "w", encoding="utf-8") as fh:
        if title:
            fh.write(f"# {title}\n\n")
        fh.write(content)
    return path, file_name


def create_build_job_from_upload(
    request,
    *,
    uploaded_file=None,
    content: str = "",
    title: str = "",
    source_record_id: Optional[str] = None,
    auto_run_pipeline: bool = True,
) -> KgBuildJob:
    import os

    cfg = get_eight_d_settings()
    operator_id, org_id = _operator_context(request.user)
    record_id = source_record_id or f"knowledge:upload:{uuid.uuid4().hex}"
    idempotency_key = f"{cfg['source_system']}:{cfg['source_module']}:{record_id}:v1"

    file_path, file_name = materialize_upload(
        uploaded_file=uploaded_file, content=content, title=title
    )

    client = EightDIntegrationClient.for_user(request.user)
    try:
        with open(file_path, "rb") as fh:
            upload_resp = client.upload_document(
                fh,
                file_name,
                source_system=cfg["source_system"],
                source_module=cfg["source_module"],
                source_record_id=record_id,
                source_record_type="knowledge_upload",
                idempotency_key=idempotency_key,
                auto_run_pipeline=auto_run_pipeline,
                content_type=_content_type_for_name(file_name),
            )
    finally:
        try:
            os.unlink(file_path)
        except OSError:
            pass

    doc_id = upload_resp.get("doc_id") or ""
    if not doc_id:
        raise EightDIntegrationError("8D 上传未返回 doc_id")

    run_id = upload_resp.get("pipeline_run_id") or upload_resp.get("run_id") or ""
    pipeline_status = upload_resp.get("pipeline_status") or "pending"
    job_status = map_pipeline_status(pipeline_status)
    if auto_run_pipeline and not run_id:
        try:
            pipe = client.trigger_pipeline(doc_id)
            run_id = pipe.get("run_id") or run_id
            job_status = map_pipeline_status(pipe.get("status") or "queued")
        except EightDIntegrationError:
            logger.warning("Auto pipeline trigger failed for doc_id=%s", doc_id, exc_info=True)

    job = KgBuildJob.objects.create(
        request=request,
        doc_id=doc_id,
        run_id=run_id,
        source_system=cfg["source_system"],
        source_module=cfg["source_module"],
        source_record_id=record_id,
        source_record_type="knowledge_upload",
        org_id=org_id,
        operator_id=operator_id,
        idempotency_key=idempotency_key,
        status=job_status,
        file_name=file_name,
    )
    return job


def apply_pipeline_status(job: KgBuildJob, remote: Dict[str, Any]) -> KgBuildJob:
    status_raw = remote.get("status") or ""
    job.status = map_pipeline_status(status_raw)
    job.current_stage = remote.get("current_stage") or ""
    job.run_id = remote.get("run_id") or job.run_id
    job.trace_id = remote.get("trace_id") or job.trace_id

    err = remote.get("error")
    if isinstance(err, dict):
        job.error_message = err.get("message") or str(err)
        job.trace_id = job.trace_id or err.get("trace_id") or ""
    elif isinstance(err, str):
        job.error_message = err

    finished = remote.get("finished_at")
    if finished and job.status in (
        KgBuildJob.Status.SUCCESS,
        KgBuildJob.Status.PARTIAL_SUCCESS,
        KgBuildJob.Status.FAILED,
    ):
        job.finished_at = timezone.now()
    job.save()
    return job


def sync_job_pipeline(job: KgBuildJob, user) -> Dict[str, Any]:
    if not job.doc_id:
        raise EightDIntegrationError("任务缺少 doc_id")
    client = EightDIntegrationClient.for_user(user)
    remote = client.get_pipeline_status(job.doc_id)
    apply_pipeline_status(job, remote)
    return remote
