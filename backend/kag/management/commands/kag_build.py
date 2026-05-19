import os

from django.core.management.base import BaseCommand, CommandError

from kag.runtime import prepare_project_runtime


class Command(BaseCommand):
    help = "执行 KAG 知识构建"

    def add_arguments(self, parser):
        parser.add_argument("--project", default="KGtestV2", help="项目名称")
        parser.add_argument("--file", default=None, help="待构建的文件路径")

    def handle(self, *args, **options):
        project_name = options["project"]
        file_path = options["file"]

        try:
            runtime = prepare_project_runtime(project_name, include_builder=True)
        except FileNotFoundError as exc:
            raise CommandError(str(exc)) from exc

        from kag.builder.runner import BuilderChainRunner
        from kag.common.conf import KAG_CONFIG

        if not file_path:
            data_dir = os.path.join(runtime["project_dir"], "builder", "data")
            if os.path.isdir(data_dir):
                files = [
                    name
                    for name in os.listdir(data_dir)
                    if name.endswith((".md", ".txt", ".pdf"))
                ]
                if files:
                    file_path = os.path.join(data_dir, files[0])

        if not file_path or not os.path.exists(file_path):
            raise CommandError(f"待构建文件不存在: {file_path}")

        pipeline_config = KAG_CONFIG.all_config.get("kag_builder_pipeline", {})
        if not pipeline_config:
            raise CommandError("KAG builder pipeline is not configured")

        runner = BuilderChainRunner.from_config(pipeline_config)
        self.stdout.write(f"开始构建: {file_path}")
        runner.invoke(file_path)
        self.stdout.write(self.style.SUCCESS(f"构建完成: {file_path}"))
