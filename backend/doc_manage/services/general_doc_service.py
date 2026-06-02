import io
import mimetypes

from django.db import transaction
from rest_framework.exceptions import ValidationError

from doc_manage.models import DocumentType, GeneralDocument
from doc_manage.services import minio_client
from doc_manage.services.general_doc_parser import build_general_doc_object_key, new_storage_key

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


@transaction.atomic
def upload_general_document(
    *,
    user,
    uploaded_file,
    doc_type_id,
    description: str = "",
    approver: str = "",
) -> GeneralDocument:
    filename = uploaded_file.name
    content = uploaded_file.read()
    if not content:
        raise ValidationError({"file": "上传文件为空"})

    doc_type = _resolve_doc_type(doc_type_id)
    _validate_extension(filename)

    storage_key = new_storage_key()
    object_key = build_general_doc_object_key(storage_key, filename)
    minio_client.upload_file(
        object_key,
        io.BytesIO(content),
        len(content),
        _content_type(filename),
    )

    stem = filename.rsplit(".", 1)[0] if "." in filename else filename
    approver = (approver or "").strip()
    approval_status = (
        GeneralDocument.ApprovalStatus.PENDING
        if approver
        else GeneralDocument.ApprovalStatus.DRAFT
    )

    return GeneralDocument.objects.create(
        name=stem or filename,
        doc_type=doc_type,
        version="V0.1",
        approval_status=approval_status,
        file_description=(description or "").strip(),
        approver=approver,
        uploader=_uploader_name(user),
        minio_path=object_key,
        original_filename=filename,
        file_ext=filename.rsplit(".", 1)[-1].lower() if "." in filename else "",
        file_size=len(content),
        creator=user if user and user.is_authenticated else None,
        modifier=getattr(user, "username", "") if user and user.is_authenticated else "",
    )


@transaction.atomic
def soft_delete_general_document(document: GeneralDocument) -> None:
    minio_client.remove_object(document.minio_path)
    document.is_deleted = True
    document.save(update_fields=["is_deleted", "update_datetime"])
