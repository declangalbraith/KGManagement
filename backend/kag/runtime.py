import importlib
import importlib.util
import os
import sys

from django.conf import settings

from kag.compatibility import check_runtime_compatibility
from kag import ensure_runtime_initialized


def get_project_root():
    return getattr(
        settings,
        "KAG_PROJECT_ROOT",
        os.path.join(settings.BASE_DIR, "kag", "kag_projects"),
    )


def get_project_dir(project_name):
    return os.path.join(get_project_root(), project_name)


def _load_modules_from_dir(directory, module_prefix):
    if not os.path.isdir(directory):
        return

    for filename in sorted(os.listdir(directory)):
        if not filename.endswith(".py") or filename == "__init__.py":
            continue
        module_name = f"{module_prefix}_{os.path.splitext(filename)[0]}"
        module_path = os.path.join(directory, filename)
        spec = importlib.util.spec_from_file_location(module_name, module_path)
        if spec is None or spec.loader is None:
            continue
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)


def prepare_project_runtime(project_name, include_builder=False):
    project_dir = get_project_dir(project_name)
    if not os.path.isdir(project_dir):
        raise FileNotFoundError(f"KAG project directory does not exist: {project_dir}")

    config_path = os.path.join(project_dir, "kag_config.yaml")
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"KAG config file does not exist: {config_path}")

    if project_dir not in sys.path:
        sys.path.insert(0, project_dir)

    check_runtime_compatibility(config_path)
    ensure_runtime_initialized(config_path, include_builder=include_builder)

    builder_dir = os.path.join(project_dir, "builder")
    prompt_dir = os.path.join(builder_dir, "prompt")
    if os.path.isdir(prompt_dir):
        if builder_dir not in sys.path:
            sys.path.insert(0, builder_dir)
        try:
            prompt = importlib.import_module("prompt")
            importlib.reload(prompt)
        except ImportError:
            pass
        _load_modules_from_dir(
            prompt_dir, f"_kag_project_{project_name.lower()}_builder_prompt"
        )

    solver_prompt_dir = os.path.join(project_dir, "solver", "prompt")
    _load_modules_from_dir(
        solver_prompt_dir, f"_kag_project_{project_name.lower()}_solver_prompt"
    )

    return {
        "project_dir": project_dir,
        "config_path": config_path,
        "builder_dir": builder_dir,
    }
