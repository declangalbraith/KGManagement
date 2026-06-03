def build_general_doc_object_key(document_id: int, version_label: str, filename: str) -> str:
    safe_label = version_label.strip().replace("/", "_").replace("\\", "_")
    safe_name = filename.strip().replace("/", "_").replace("\\", "_")
    return f"docManage/General-Documents/{document_id}/{safe_label}/{safe_name}"
