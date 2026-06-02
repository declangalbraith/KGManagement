import uuid


def build_general_doc_object_key(storage_key: str, filename: str) -> str:
    safe_key = storage_key.strip().replace("/", "_").replace("\\", "_")
    safe_name = filename.strip().replace("/", "_").replace("\\", "_")
    return f"docManage/General-Documents/{safe_key}/{safe_name}"


def new_storage_key() -> str:
    return uuid.uuid4().hex[:16]
