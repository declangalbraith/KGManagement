from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from doc_manage.models import GeneralDocument, GeneralDocumentVersion
from workflow.models import WorkflowDefinition, WorkflowInstance, WorkflowTask
from workflow.services.audit import log_audit
from workflow.services.definition import build_definition_snapshot
from workflow.services.version_label import bump_major_on_approve, display_version

BIZ_TYPE_GENERAL_DOCUMENT = "general_document"


def _get_running_instance(document: GeneralDocument) -> WorkflowInstance | None:
    return (
        WorkflowInstance.objects.filter(
            biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
            biz_id=document.id,
            status=WorkflowInstance.Status.RUNNING,
        )
        .order_by("-id")
        .first()
    )


def _sync_document_file_fields(document: GeneralDocument) -> None:
    version = document.current_version
    if not version:
        return
    document.minio_path = version.minio_path
    document.original_filename = version.original_filename
    document.file_ext = version.file_ext
    document.file_size = version.file_size
    document.version = display_version(document.version_label)


@transaction.atomic
def trigger_workflow(*, document: GeneralDocument, user) -> WorkflowInstance:
    document = GeneralDocument.objects.select_for_update().get(pk=document.pk)

    if document.approval_status != GeneralDocument.ApprovalStatus.DRAFT:
        raise ValidationError({"detail": "仅草稿状态可触发审批流"})

    if not document.workflow_definition_id:
        raise ValidationError({"detail": "请先绑定审批流"})

    if _get_running_instance(document):
        raise ValidationError({"detail": "已有进行中的审批流"})

    if not document.current_version_id:
        raise ValidationError({"detail": "文档缺少文件版本"})

    definition = (
        WorkflowDefinition.objects.filter(
            id=document.workflow_definition_id,
            is_active=True,
        )
        .first()
    )
    if not definition:
        raise ValidationError({"detail": "审批流不存在或已禁用"})

    try:
        snapshot = build_definition_snapshot(definition)
    except ValueError as exc:
        raise ValidationError({"detail": str(exc)}) from exc
    first_step = snapshot["steps"][0]

    instance = WorkflowInstance.objects.create(
        definition=definition,
        definition_snapshot=snapshot,
        biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
        biz_id=document.id,
        document_version=document.current_version,
        initiator=user,
        status=WorkflowInstance.Status.RUNNING,
        current_step_order=first_step["step_order"],
        creator=user if user.is_authenticated else None,
        modifier=getattr(user, "username", "") if user.is_authenticated else "",
    )

    WorkflowTask.objects.create(
        instance=instance,
        step_order=first_step["step_order"],
        assignee_id=first_step["assignee_id"],
        status=WorkflowTask.Status.PENDING,
        creator=user if user.is_authenticated else None,
        modifier=getattr(user, "username", "") if user.is_authenticated else "",
    )

    document.approval_status = GeneralDocument.ApprovalStatus.PENDING
    document.save(update_fields=["approval_status", "update_datetime"])

    log_audit(
        biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
        biz_id=document.id,
        action="workflow_started",
        operator=user,
        message="触发审批流",
        detail=definition.name,
        instance=instance,
        document_version=document.current_version,
    )

    return instance


@transaction.atomic
def approve_task(*, task: WorkflowTask, user) -> WorkflowTask:
    task = (
        WorkflowTask.objects.select_for_update()
        .select_related("instance", "instance__document_version")
        .get(pk=task.pk)
    )

    if task.status != WorkflowTask.Status.PENDING:
        raise ValidationError({"detail": "任务已处理"})

    if task.assignee_id != user.id:
        raise ValidationError({"detail": "无权审批该任务"})

    instance = WorkflowInstance.objects.select_for_update().get(pk=task.instance_id)
    if instance.status != WorkflowInstance.Status.RUNNING:
        raise ValidationError({"detail": "流程已结束"})

    document = GeneralDocument.objects.select_for_update().get(
        pk=instance.biz_id,
        is_deleted=False,
    )

    if document.approval_status != GeneralDocument.ApprovalStatus.PENDING:
        raise ValidationError({"detail": "文档不在审批中"})

    if document.current_version_id != instance.document_version_id:
        raise ValidationError({"detail": "文档版本已变更，无法审批"})

    now = timezone.now()
    task.status = WorkflowTask.Status.APPROVED
    task.acted_at = now
    task.modifier = getattr(user, "username", "")
    task.save(update_fields=["status", "acted_at", "update_datetime", "modifier"])

    log_audit(
        biz_type=instance.biz_type,
        biz_id=instance.biz_id,
        action="workflow_step_approved",
        operator=user,
        message=f"第 {task.step_order} 步审批通过",
        instance=instance,
        document_version=instance.document_version,
    )

    steps = instance.definition_snapshot.get("steps", [])
    next_steps = [s for s in steps if s["step_order"] > task.step_order]

    if next_steps:
        next_step = sorted(next_steps, key=lambda s: s["step_order"])[0]
        instance.current_step_order = next_step["step_order"]
        instance.save(update_fields=["current_step_order", "update_datetime"])
        WorkflowTask.objects.create(
            instance=instance,
            step_order=next_step["step_order"],
            assignee_id=next_step["assignee_id"],
            status=WorkflowTask.Status.PENDING,
            creator=user,
            modifier=getattr(user, "username", ""),
        )
        return task

    instance.status = WorkflowInstance.Status.APPROVED
    instance.finished_at = now
    instance.save(update_fields=["status", "finished_at", "update_datetime"])

    old_label = document.version_label
    new_label = bump_major_on_approve(old_label)
    old_version = document.current_version

    new_version = GeneralDocumentVersion.objects.create(
        document=document,
        version_label=new_label,
        minio_path=old_version.minio_path,
        original_filename=old_version.original_filename,
        file_ext=old_version.file_ext,
        file_size=old_version.file_size,
        uploader=old_version.uploader,
        creator=user if user.is_authenticated else None,
        modifier=getattr(user, "username", ""),
    )

    document.version_label = new_label
    document.current_version = new_version
    document.approval_status = GeneralDocument.ApprovalStatus.APPROVED
    _sync_document_file_fields(document)
    document.save(
        update_fields=[
            "version_label",
            "current_version",
            "approval_status",
            "version",
            "minio_path",
            "original_filename",
            "file_ext",
            "file_size",
            "update_datetime",
        ]
    )

    log_audit(
        biz_type=instance.biz_type,
        biz_id=instance.biz_id,
        action="workflow_completed",
        operator=user,
        message="审批完成",
        detail=f"{display_version(old_label)} → {display_version(document.version_label)}",
        instance=instance,
        document_version=instance.document_version,
    )

    return task


@transaction.atomic
def reject_task(*, task: WorkflowTask, user, comment: str = "") -> WorkflowTask:
    task = (
        WorkflowTask.objects.select_for_update()
        .select_related("instance")
        .get(pk=task.pk)
    )

    if task.status != WorkflowTask.Status.PENDING:
        raise ValidationError({"detail": "任务已处理"})

    if task.assignee_id != user.id:
        raise ValidationError({"detail": "无权审批该任务"})

    instance = WorkflowInstance.objects.select_for_update().get(pk=task.instance_id)
    if instance.status != WorkflowInstance.Status.RUNNING:
        raise ValidationError({"detail": "流程已结束"})

    document = GeneralDocument.objects.select_for_update().get(
        pk=instance.biz_id,
        is_deleted=False,
    )

    if document.current_version_id != instance.document_version_id:
        raise ValidationError({"detail": "文档版本已变更，无法审批"})

    now = timezone.now()
    task.status = WorkflowTask.Status.REJECTED
    task.comment = (comment or "").strip()
    task.acted_at = now
    task.modifier = getattr(user, "username", "")
    task.save(
        update_fields=["status", "comment", "acted_at", "update_datetime", "modifier"]
    )

    instance.status = WorkflowInstance.Status.REJECTED
    instance.finished_at = now
    instance.save(update_fields=["status", "finished_at", "update_datetime"])

    WorkflowTask.objects.filter(
        instance=instance,
        status=WorkflowTask.Status.PENDING,
    ).update(status=WorkflowTask.Status.REJECTED, acted_at=now)

    document.approval_status = GeneralDocument.ApprovalStatus.DRAFT
    document.save(update_fields=["approval_status", "update_datetime"])

    log_audit(
        biz_type=instance.biz_type,
        biz_id=instance.biz_id,
        action="workflow_rejected",
        operator=user,
        message="审批打回",
        detail=task.comment or "无意见",
        instance=instance,
        document_version=instance.document_version,
    )

    return task


def get_pending_task_for_document(document: GeneralDocument, user) -> WorkflowTask | None:
    return (
        WorkflowTask.objects.filter(
            instance__biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
            instance__biz_id=document.id,
            instance__status=WorkflowInstance.Status.RUNNING,
            status=WorkflowTask.Status.PENDING,
            assignee_id=user.id,
        )
        .select_related("instance")
        .first()
    )
