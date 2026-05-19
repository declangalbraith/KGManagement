import importlib
import importlib.metadata
from pathlib import Path

import requests
import yaml


class CompatibilityError(RuntimeError):
    pass


def _load_project_config(config_path):
    with open(config_path, "r", encoding="utf-8") as reader:
        return yaml.safe_load(reader.read()) or {}


def _walk_spg_type_enums(payload):
    found = set()

    def walk(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key == "spgTypeEnum" and isinstance(item, str):
                    found.add(item)
                else:
                    walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(payload)
    return found


def get_local_runtime_info():
    import kag
    import knext

    capabilities = set()

    try:
        from knext.schema.model.base import SpgTypeEnum

        if hasattr(SpgTypeEnum, "Index"):
            capabilities.add("index_type")
    except Exception:
        pass

    try:
        import knext.graph.client  # noqa: F401

        capabilities.add("graph_client")
    except Exception:
        pass

    try:
        import knext.reasoner.rest.models.task_stream_request  # noqa: F401

        capabilities.add("task_stream_request")
    except Exception:
        pass

    try:
        from knext.schema.client import TABLE_TYPE  # noqa: F401

        capabilities.add("table_type")
    except Exception:
        pass

    try:
        dist_version = importlib.metadata.version("openspg-kag")
    except importlib.metadata.PackageNotFoundError:
        dist_version = None

    return {
        "kag_version": getattr(kag, "__version__", None),
        "openspg_kag_dist_version": dist_version,
        "knext_path": str(Path(knext.__file__).resolve()),
        "capabilities": capabilities,
    }


def get_remote_runtime_info(host_addr, project_id, timeout=8):
    endpoint = f"{host_addr.rstrip('/')}/public/v1/reason/schema"
    response = requests.get(endpoint, params={"projectId": project_id}, timeout=timeout)
    response.raise_for_status()
    payload = response.json()
    spg_type_enums = _walk_spg_type_enums(payload)

    capabilities = set()
    if "INDEX_TYPE" in spg_type_enums:
        capabilities.add("index_type")

    return {
        "schema_endpoint": endpoint,
        "spg_type_enums": spg_type_enums,
        "capabilities": capabilities,
    }


def check_runtime_compatibility(config_path, fail_fast=None):
    config = _load_project_config(config_path)
    project = config.get("project", {})
    compatibility = config.get("compatibility", {})

    if fail_fast is None:
        fail_fast = compatibility.get("fail_fast", True)

    local_info = get_local_runtime_info()

    required_capabilities = set(compatibility.get("required_knext_capabilities", []))
    remote_info = None
    remote_error = None

    host_addr = project.get("host_addr")
    project_id = project.get("id")
    if host_addr and project_id:
        try:
            remote_info = get_remote_runtime_info(host_addr, project_id)
            required_capabilities.update(remote_info["capabilities"])
        except Exception as exc:
            remote_error = exc
            if fail_fast:
                raise CompatibilityError(
                    f"Failed to probe remote OpenSPG schema for compatibility: {exc}"
                ) from exc

    expected_runtime = compatibility.get("expected_runtime", {})
    expected_version = expected_runtime.get("openspg_kag_version")
    if expected_version:
        actual_version = (
            local_info["openspg_kag_dist_version"] or local_info["kag_version"] or ""
        )
        if actual_version != expected_version:
            raise CompatibilityError(
                "Local openspg-kag version mismatch. "
                f"Expected {expected_version}, got {actual_version or 'unknown'}."
            )

    missing = sorted(required_capabilities - local_info["capabilities"])
    if missing:
        raise CompatibilityError(
            "Local knext runtime is incompatible with the configured project. "
            f"Missing capabilities: {', '.join(missing)}. "
            f"Local knext path: {local_info['knext_path']}"
        )

    return {
        "config_path": str(Path(config_path).resolve()),
        "local": local_info,
        "remote": remote_info,
        "remote_error": str(remote_error) if remote_error else None,
        "required_capabilities": sorted(required_capabilities),
    }
