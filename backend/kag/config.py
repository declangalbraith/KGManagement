import os
import logging
from pathlib import Path

import yaml
from django.conf import settings

logger = logging.getLogger(__name__)


def get_kag_config():
    """从 Django settings 构建 KAG 配置字典"""
    return {
        "llm": {
            "openie": {
                "type": getattr(settings, "KAG_LLM_OPENIE_TYPE", "maas"),
                "base_url": getattr(settings, "KAG_LLM_OPENIE_BASE_URL", "https://api.siliconflow.cn/v1"),
                "api_key": getattr(settings, "KAG_LLM_OPENIE_API_KEY", ""),
                "model": getattr(settings, "KAG_LLM_OPENIE_MODEL", "Qwen/Qwen2.5-72B-Instruct"),
            },
            "chat": {
                "type": getattr(settings, "KAG_LLM_CHAT_TYPE", "maas"),
                "base_url": getattr(settings, "KAG_LLM_CHAT_BASE_URL", "https://api.siliconflow.cn/v1"),
                "api_key": getattr(settings, "KAG_LLM_CHAT_API_KEY", ""),
                "model": getattr(settings, "KAG_LLM_CHAT_MODEL", "deepseek-ai/DeepSeek-V3.2"),
            },
        },
        "embedding": {
            "type": getattr(settings, "KAG_EMBEDDING_TYPE", "openai"),
            "base_url": getattr(settings, "KAG_EMBEDDING_BASE_URL", "https://api.siliconflow.cn/v1"),
            "api_key": getattr(settings, "KAG_EMBEDDING_API_KEY", ""),
            "model": getattr(settings, "KAG_EMBEDDING_MODEL", "BAAI/bge-m3"),
            "vector_dimensions": getattr(settings, "KAG_EMBEDDING_DIMENSIONS", 1024),
        },
        "neo4j": {
            "uri": getattr(settings, "KAG_NEO4J_URI", "bolt://localhost:7687"),
            "user": getattr(settings, "KAG_NEO4J_USER", "neo4j"),
            "password": getattr(settings, "KAG_NEO4J_PASSWORD", ""),
            "database": getattr(settings, "KAG_NEO4J_DATABASE", "kgtestv2"),
        },
        "openspg": {
            "host_addr": getattr(settings, "KAG_OPENSPG_HOST", "http://localhost:18887"),
        },
        "project_root": getattr(settings, "KAG_PROJECT_ROOT",
                                 os.path.join(settings.BASE_DIR, "kag", "kag_projects")),
    }


def bootstrap_knext_env(default_project: str = "KGtestV2") -> None:
    """Set knext import-time env vars before heavy kag/knext modules load."""
    openspg_host = getattr(settings, "KAG_OPENSPG_HOST", "http://127.0.0.1:8887")
    os.environ.setdefault("KAG_PROJECT_HOST_ADDR", openspg_host)

    project_root = getattr(
        settings,
        "KAG_PROJECT_ROOT",
        os.path.join(settings.BASE_DIR, "kag", "kag_projects"),
    )
    config_path = Path(project_root) / default_project / "kag_config.yaml"
    if not config_path.is_file():
        return

    try:
        with open(config_path, "r", encoding="utf-8") as reader:
            project_cfg = yaml.safe_load(reader) or {}
    except Exception as exc:
        logger.warning("Failed to read %s for knext bootstrap: %s", config_path, exc)
        return

    project = project_cfg.get("project", {}) or {}
    if project.get("id") is not None:
        os.environ.setdefault("KAG_PROJECT_ID", str(project["id"]))
    if project.get("namespace"):
        os.environ.setdefault("KAG_PROJECT_NAMESPACE", str(project["namespace"]))
    if project.get("host_addr"):
        os.environ.setdefault("KAG_PROJECT_HOST_ADDR", str(project["host_addr"]))


def init_kag_from_settings():
    """用 Django settings 初始化 KAG 全局配置"""
    cfg = get_kag_config()
    project_root = cfg["project_root"]
    os.environ.setdefault("KAG_PROJECT_ROOT", project_root)
    logger.info("KAG config initialized from Django settings")
    return cfg
