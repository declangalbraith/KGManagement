from django.core.management.base import BaseCommand

from kag.compatibility import check_runtime_compatibility
from kag.runtime import get_project_dir


class Command(BaseCommand):
    help = "Check whether the local KAG/knext runtime is compatible with a project and its remote OpenSPG service."

    def add_arguments(self, parser):
        parser.add_argument("--project", required=True, help="KAG project name")

    def handle(self, *args, **options):
        project_name = options["project"]
        project_dir = get_project_dir(project_name)
        config_path = f"{project_dir}\\kag_config.yaml"
        result = check_runtime_compatibility(config_path)

        self.stdout.write(self.style.SUCCESS("KAG runtime compatibility check passed."))
        self.stdout.write(f"Config: {result['config_path']}")
        self.stdout.write(f"Local knext: {result['local']['knext_path']}")
        self.stdout.write(
            f"Local openspg-kag version: {result['local']['openspg_kag_dist_version'] or result['local']['kag_version']}"
        )
        self.stdout.write(
            f"Required capabilities: {', '.join(result['required_capabilities']) or '(none)'}"
        )
        if result["remote"]:
            self.stdout.write(
                f"Remote schema enums: {', '.join(sorted(result['remote']['spg_type_enums']))}"
            )
