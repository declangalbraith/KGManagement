import io
import mimetypes

from django.db import transaction
from rest_framework.exceptions import ValidationError

from doc_manage.models import BomDocument
from doc_manage.services.bom_parser import build_minio_object_key, parse_bom_file
from doc_manage.services import minio_client


def _uploader_name(user) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return ""
    return getattr(user, "name", None) or getattr(user, "username", "") or ""


def _content_type(filename: str) -> str:
    guessed, _ = mimetypes.guess_type(filename)
    if guessed:
        return guessed
    lower = filename.lower()
    if lower.endswith(".csv"):
        return "text/csv"
    if lower.endswith(".xlsx"):
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return "application/octet-stream"


@transaction.atomic
def upload_bom_document(*, user, uploaded_file) -> BomDocument:
    filename = uploaded_file.name
    content = uploaded_file.read()
    if not content:
        raise ValidationError({"file": "上传文件为空"})

    fields = parse_bom_file(filename, content)
    object_key = build_minio_object_key(fields.number, filename)

    existing = (
        BomDocument.objects.filter(number=fields.number, is_deleted=False).first()
    )
    old_minio_path = existing.minio_path if existing else None

    minio_client.upload_file(
        object_key,
        io.BytesIO(content),
        len(content),
        _content_type(filename),
    )

    if existing and old_minio_path and old_minio_path != object_key:
        minio_client.remove_object(old_minio_path)

    uploader = _uploader_name(user)
    if existing:
        existing.state = fields.state
        existing.type_designation = fields.type_designation
        existing.description_en = fields.description_en
        existing.uploader = uploader
        existing.graph_status = BomDocument.GraphStatus.PENDING
        existing.minio_path = object_key
        existing.original_filename = filename
        existing.file_type = filename.rsplit(".", 1)[-1].lower()
        existing.file_size = len(content)
        if user and user.is_authenticated:
            existing.modifier = getattr(user, "username", "") or str(user.pk)
        existing.save()
        return existing

    return BomDocument.objects.create(
        number=fields.number,
        state=fields.state,
        type_designation=fields.type_designation,
        description_en=fields.description_en,
        uploader=uploader,
        graph_status=BomDocument.GraphStatus.PENDING,
        minio_path=object_key,
        original_filename=filename,
        file_type=filename.rsplit(".", 1)[-1].lower(),
        file_size=len(content),
        creator=user if user and user.is_authenticated else None,
        modifier=getattr(user, "username", "") if user and user.is_authenticated else "",
    )


@transaction.atomic
def soft_delete_bom_document(document: BomDocument) -> None:
    minio_client.remove_object(document.minio_path)
    document.is_deleted = True
    document.save(update_fields=["is_deleted", "update_datetime"])
