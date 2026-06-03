import io
import mimetypes

from django.db import transaction
from rest_framework.exceptions import ValidationError

from doc_manage.models import DocumentType, GeneralDocument, GeneralDocumentVersion
from doc_manage.services import minio_client
from doc_manage.services.general_doc_parser import build_general_doc_object_key
from workflow.models import WorkflowDefinition, WorkflowInstance
from workflow.services.audit import log_audit
from workflow.services.engine import BIZ_TYPE_GENERAL_DOCUMENT
from workflow.services.version_label import (
    bump_revision,
    display_version,
    initial_version_label,
)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xlsx", ".xls"}


def _uploader_name(user) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return ""
    return getattr(user, "name", None) or getattr(user, "username", "") or ""


def _content_type(filename: str) -> str:
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or "application/octet-stream"


def _validate_extension(filename: str) -> None:
    lower = filename.lower()
    if not any(lower.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise ValidationError(
            {"file": "仅支持 PDF、Word（.doc/.docx）或 Excel（.xlsx/.xls）文件"}
        )


def _resolve_doc_type(doc_type_id) -> DocumentType:
    try:
        doc_type_id = int(doc_type_id)
    except (TypeError, ValueError):
        raise ValidationError({"doc_type_id": ["请选择文档类型"]}) from None

    doc_type = DocumentType.objects.filter(id=doc_type_id, is_active=True).first()
    if not doc_type:
        raise ValidationError({"doc_type_id": ["文档类型不存在或已禁用"]})
    return doc_type


def _resolve_workflow_definition(workflow_definition_id, doc_type: DocumentType):
    if workflow_definition_id in (None, "", "null"):
        return None
    try:
        workflow_definition_id = int(workflow_definition_id)
    except (TypeError, ValueError):
        raise ValidationError({"workflow_definition_id": ["审批流无效"]}) from None

    definition = WorkflowDefinition.objects.filter(
        id=workflow_definition_id,
        is_active=True,
    ).first()
    if not definition:
        raise ValidationError({"workflow_definition_id": ["审批流不存在或已禁用"]})
    if definition.doc_type_id and definition.doc_type_id != doc_type.id:
        raise ValidationError({"workflow_definition_id": ["审批流与文档类型不匹配"]})
    return definition


def _parse_filename(filename: str) -> tuple[str, str, str]:
    stem = filename.rsplit(".", 1)[0] if "." in filename else filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return stem or filename, ext, filename


def _upload_bytes_to_minio(document_id: int, version_label: str, filename: str, content: bytes) -> str:
    object_key = build_general_doc_object_key(document_id, version_label, filename)
    minio_client.upload_file(
        object_key,
        io.BytesIO(content),
        len(content),
        _content_type(filename),
    )
    return object_key


def _sync_document_from_version(document: GeneralDocument, version: GeneralDocumentVersion) -> None:
    document.current_version = version
    document.version_label = version.version_label
    document.version = display_version(version.version_label)
    document.minio_path = version.minio_path
    document.original_filename = version.original_filename
    document.file_ext = version.file_ext
    document.file_size = version.file_size


def _has_running_workflow(document: GeneralDocument) -> bool:
    return WorkflowInstance.objects.filter(
        biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
        biz_id=document.id,
        status=WorkflowInstance.Status.RUNNING,
    ).exists()


def _create_version(
    *,
    document: GeneralDocument,
    version_label: str,
    filename: str,
    content: bytes,
    user,
) -> GeneralDocumentVersion:
    object_key = _upload_bytes_to_minio(document.id, version_label, filename, content)
    _, ext, original = _parse_filename(filename)
    version = GeneralDocumentVersion.objects.create(
        document=document,
        version_label=version_label,
        minio_path=object_key,
        original_filename=original,
        file_ext=ext,
        file_size=len(content),
        uploader=_uploader_name(user),
        creator=user if user and user.is_authenticated else None,
        modifier=getattr(user, "username", "") if user and user.is_authenticated else "",
    )
    _sync_document_from_version(document, version)
    return version


@transaction.atomic
def upload_general_document(
    *,
    user,
    uploaded_file,
    doc_type_id,
    description: str = "",
    workflow_definition_id=None,
) -> GeneralDocument:
    filename = uploaded_file.name
    content = uploaded_file.read()
    if not content:
        raise ValidationError({"file": "上传文件为空"})

    doc_type = _resolve_doc_type(doc_type_id)
    _validate_extension(filename)
    workflow_definition = _resolve_workflow_definition(workflow_definition_id, doc_type)
    name, _, original_filename = _parse_filename(filename)

    existing = (
        GeneralDocument.objects.select_for_update()
        .filter(doc_type=doc_type, name=name, is_deleted=False)
        .first()
    )

    if existing:
        return revise_general_document(
            user=user,
            document=existing,
            uploaded_file_name=filename,
            content=content,
            description=description,
            workflow_definition=workflow_definition,
        )

    document = GeneralDocument.objects.create(
        name=name,
        doc_type=doc_type,
        version_label=initial_version_label(),
        version=display_version(initial_version_label()),
        approval_status=GeneralDocument.ApprovalStatus.DRAFT,
        file_description=(description or "").strip(),
        approver="",
        uploader=_uploader_name(user),
        minio_path="",
        original_filename=original_filename,
        file_ext=original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "",
        file_size=len(content),
        workflow_definition=workflow_definition,
        creator=user if user and user.is_authenticated else None,
        modifier=getattr(user, "username", "") if user and user.is_authenticated else "",
    )

    version = _create_version(
        document=document,
        version_label=document.version_label,
        filename=filename,
        content=content,
        user=user,
    )
    document.save(
        update_fields=[
            "current_version",
            "version_label",
            "version",
            "minio_path",
            "original_filename",
            "file_ext",
            "file_size",
            "update_datetime",
        ]
    )

    log_audit(
        biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
        biz_id=document.id,
        action="file_created",
        operator=user,
        message="创建文档",
        detail=display_version(version.version_label),
        document_version=version,
    )
    if workflow_definition:
        log_audit(
            biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
            biz_id=document.id,
            action="workflow_bound",
            operator=user,
            message="绑定审批流",
            detail=workflow_definition.name,
        )

    return document


@transaction.atomic
def revise_general_document(
    *,
    user,
    document: GeneralDocument,
    uploaded_file_name: str,
    content: bytes,
    description: str = "",
    workflow_definition: WorkflowDefinition | None = None,
) -> GeneralDocument:
    document = GeneralDocument.objects.select_for_update().get(pk=document.pk)

    if document.approval_status == GeneralDocument.ApprovalStatus.PENDING:
        raise ValidationError({"file": ["文档审批中，无法更新文件"]})

    _, _, original_filename = _parse_filename(uploaded_file_name)
    if original_filename != document.original_filename:
        raise ValidationError(
            {"file": ["文件名与扩展名必须与当前文档完全一致（区分大小写）"]}
        )

    old_label = document.version_label
    new_label = bump_revision(old_label)

    if description:
        document.file_description = description.strip()
    if workflow_definition is not None:
        document.workflow_definition = workflow_definition

    document.version_label = new_label
    document.approval_status = GeneralDocument.ApprovalStatus.DRAFT
    document.uploader = _uploader_name(user)
    document.modifier = getattr(user, "username", "") if user and user.is_authenticated else ""

    version = _create_version(
        document=document,
        version_label=new_label,
        filename=uploaded_file_name,
        content=content,
        user=user,
    )
    document.save()

    log_audit(
        biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
        biz_id=document.id,
        action="file_revised",
        operator=user,
        message="更新文档文件",
        detail=f"{display_version(old_label)} → {display_version(new_label)}",
        document_version=version,
    )

    return document


@transaction.atomic
def bind_workflow_definition(
    *,
    document: GeneralDocument,
    workflow_definition_id,
    user,
) -> GeneralDocument:
    document = GeneralDocument.objects.select_for_update().get(pk=document.pk)

    if document.approval_status != GeneralDocument.ApprovalStatus.DRAFT:
        raise ValidationError({"detail": "仅草稿状态可绑定或更换审批流"})

    if _has_running_workflow(document):
        raise ValidationError({"detail": "审批进行中，无法更换审批流"})

    if workflow_definition_id in (None, "", "null"):
        document.workflow_definition = None
        document.modifier = getattr(user, "username", "") if user and user.is_authenticated else ""
        document.save(update_fields=["workflow_definition", "modifier", "update_datetime"])
        return document

    definition = _resolve_workflow_definition(workflow_definition_id, document.doc_type)
    document.workflow_definition = definition
    document.modifier = getattr(user, "username", "") if user and user.is_authenticated else ""
    document.save(update_fields=["workflow_definition", "modifier", "update_datetime"])

    if definition:
        log_audit(
            biz_type=BIZ_TYPE_GENERAL_DOCUMENT,
            biz_id=document.id,
            action="workflow_bound",
            operator=user,
            message="绑定审批流",
            detail=definition.name,
        )
    return document


@transaction.atomic
def soft_delete_general_document(document: GeneralDocument) -> None:
    document.is_deleted = True
    document.save(update_fields=["is_deleted", "update_datetime"])
