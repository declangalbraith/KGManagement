from django.utils import timezone

from workflow.models import WorkflowAuditLog, WorkflowInstance


def _operator_name(user) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return ""
    return getattr(user, "name", None) or getattr(user, "username", "") or ""


def log_audit(
    *,
    biz_type: str,
    biz_id: int,
    action: str,
    operator=None,
    message: str = "",
    detail: str = "",
    instance: WorkflowInstance | None = None,
    document_version=None,
) -> WorkflowAuditLog:
    return WorkflowAuditLog.objects.create(
        biz_type=biz_type,
        biz_id=biz_id,
        instance=instance,
        document_version=document_version,
        action=action,
        operator=operator if operator and operator.is_authenticated else None,
        operator_name=_operator_name(operator),
        message=message,
        detail=detail,
        create_datetime=timezone.now(),
    )
