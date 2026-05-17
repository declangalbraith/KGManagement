import os
import yaml
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)


def find_project_dir(name):
    """在 kag_projects/ 下查找项目目录"""
    base = getattr(settings, "KAG_PROJECT_ROOT", None)
    if not base:
        base = os.path.join(settings.BASE_DIR, "kag", "kag_projects")
    project_dir = os.path.join(base, name)
    if os.path.isdir(project_dir):
        return project_dir
    # 搜索 kag_projects 下的子目录
    if os.path.isdir(base):
        for d in os.listdir(base):
            if d == name:
                return os.path.join(base, d)
    return None


def load_project_config(name):
    """加载项目的 kag_config.yaml"""
    project_dir = find_project_dir(name)
    if not project_dir:
        return None
    config_path = os.path.join(project_dir, "kag_config.yaml")
    if not os.path.exists(config_path):
        return None
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_kag_config_yaml(project_name):
    """获取项目配置 YAML 内容"""
    config = load_project_config(project_name)
    if config:
        return yaml.dump(config, allow_unicode=True, default_flow_style=False)
    return ""
