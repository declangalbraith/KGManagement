import logging
from typing import BinaryIO, Optional

from django.conf import settings
from minio import Minio
from minio.error import S3Error

logger = logging.getLogger(__name__)

_client: Optional[Minio] = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        endpoint = f"{settings.MINIO_IP}:{settings.MINIO_PORT}"
        _client = Minio(
            endpoint,
            access_key=settings.MINIO_ACCOUNT,
            secret_key=settings.MINIO_PASSWORD,
            secure=getattr(settings, "MINIO_SECURE", False),
        )
    return _client


def ensure_bucket() -> None:
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)


def upload_file(object_key: str, file_obj: BinaryIO, size: int, content_type: str) -> None:
    ensure_bucket()
    client = get_minio_client()
    if hasattr(file_obj, "seek"):
        file_obj.seek(0)
    client.put_object(
        settings.MINIO_BUCKET,
        object_key,
        file_obj,
        length=size,
        content_type=content_type,
    )


def remove_object(object_key: str) -> None:
    if not object_key:
        return
    client = get_minio_client()
    try:
        client.remove_object(settings.MINIO_BUCKET, object_key)
    except S3Error as exc:
        logger.warning("MinIO remove_object failed for %s: %s", object_key, exc)


def get_object_stream(object_key: str):
    client = get_minio_client()
    return client.get_object(settings.MINIO_BUCKET, object_key)


def get_object_bytes(object_key: str) -> bytes:
    response = get_object_stream(object_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def object_to_tempfile(object_key: str, suffix: str = "") -> str:
    """Download object to a temporary file for parsing/cleaning."""
    import tempfile

    data = get_object_bytes(object_key)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(data)
    tmp.close()
    return tmp.name
