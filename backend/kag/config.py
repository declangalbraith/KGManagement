import os
import logging
from pathlib import Path
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


def init_kag_from_settings():
    """用 Django settings 初始化 KAG 全局配置"""
    cfg = get_kag_config()
    project_root = cfg["project_root"]
    os.environ.setdefault("KAG_PROJECT_ROOT", project_root)
    logger.info("KAG config initialized from Django settings")
    return cfg
