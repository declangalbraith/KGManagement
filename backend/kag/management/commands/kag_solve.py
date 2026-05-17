import os
import sys
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "执行 KAG 推理问答（两段式：检索证据 + 综合答案）"

    def add_arguments(self, parser):
        parser.add_argument("--project", default="KGtestV2", help="项目名称")
        parser.add_argument("--question", required=True, help="用户问题")

    def handle(self, *args, **options):
        project_name = options["project"]
        question = options["question"]

        project_root = getattr(settings, "KAG_PROJECT_ROOT",
                               os.path.join(settings.BASE_DIR, "kag", "kag_projects"))
        project_dir = os.path.join(project_root, project_name)

        if not os.path.isdir(project_dir):
            raise CommandError(f"项目目录不存在: {project_dir}")

        if project_dir not in sys.path:
            sys.path.insert(0, project_dir)

        import yaml
        from kag.common.conf import KAG_CONFIG
        from kag.interface import SolverPipelineABC

        config_path = os.path.join(project_dir, "kag_config.yaml")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                config_data = yaml.safe_load(f)
            if config_data:
                KAG_CONFIG.all_config = config_data

        builder_dir = os.path.join(project_dir, "builder")
        if os.path.isdir(builder_dir):
            prompt_dir = os.path.join(builder_dir, "prompt")
            if os.path.isdir(prompt_dir):
                if builder_dir not in sys.path:
                    sys.path.insert(0, builder_dir)
                try:
                    import prompt as builder_prompt
                    import importlib
                    importlib.reload(builder_prompt)
                except ImportError:
                    pass

        pipeline = SolverPipelineABC.from_config(
            KAG_CONFIG.all_config.get("kag_solver_pipeline", {})
        )

        from kag.evidence import run_qa_with_evidence, print_evidence_report

        answer, evidence_list = run_qa_with_evidence(question, pipeline)
        report = print_evidence_report(question, answer, evidence_list)
        self.stdout.write(report)
