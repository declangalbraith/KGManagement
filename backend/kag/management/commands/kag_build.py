import os
import sys
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "执行 KAG 知识构建"

    def add_arguments(self, parser):
        parser.add_argument("--project", default="KGtestV2", help="项目名称")
        parser.add_argument("--file", default=None, help="待构建的文件路径（默认使用项目 data 目录下的首个文档）")

    def handle(self, *args, **options):
        project_name = options["project"]
        file_path = options["file"]

        project_root = getattr(settings, "KAG_PROJECT_ROOT",
                               os.path.join(settings.BASE_DIR, "kag", "kag_projects"))
        project_dir = os.path.join(project_root, project_name)

        if not os.path.isdir(project_dir):
            raise CommandError(f"项目目录不存在: {project_dir}")

        if project_dir not in sys.path:
            sys.path.insert(0, project_dir)

        import yaml
        from kag.common.conf import KAG_CONFIG
        from kag.builder.runner import BuilderChainRunner

        config_path = os.path.join(project_dir, "kag_config.yaml")
        if not os.path.exists(config_path):
            raise CommandError(f"配置文件不存在: {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            config_data = yaml.safe_load(f)

        KAG_CONFIG.all_config = config_data

        builder_dir = os.path.join(project_dir, "builder")
        if os.path.isdir(builder_dir) and builder_dir not in sys.path:
            sys.path.insert(0, builder_dir)
            try:
                import prompt
                import importlib
                importlib.reload(prompt)
            except ImportError:
                pass

        if not file_path:
            data_dir = os.path.join(project_dir, "builder", "data")
            if os.path.isdir(data_dir):
                files = [f for f in os.listdir(data_dir)
                         if f.endswith((".md", ".txt", ".pdf"))]
                if files:
                    file_path = os.path.join(data_dir, files[0])

        if not file_path or not os.path.exists(file_path):
            raise CommandError(f"待构建文件不存在: {file_path}")

        pipeline_config = KAG_CONFIG.all_config.get("kag_builder_pipeline", {})
        runner = BuilderChainRunner.from_config(pipeline_config)
        self.stdout.write(f"开始构建: {file_path}")
        runner.invoke(file_path)
        self.stdout.write(self.style.SUCCESS(f"构建完成: {file_path}"))
