from django.core.management.base import BaseCommand, CommandError

from kag.runtime import prepare_project_runtime


class Command(BaseCommand):
    help = "执行 KAG 推理问答"

    def add_arguments(self, parser):
        parser.add_argument("--project", default="KGtestV2", help="项目名称")
        parser.add_argument("--question", required=True, help="用户问题")

    def handle(self, *args, **options):
        project_name = options["project"]
        question = options["question"]

        try:
            prepare_project_runtime(project_name, include_builder=False)
        except FileNotFoundError as exc:
            raise CommandError(str(exc)) from exc

        from kag.common.conf import KAG_CONFIG
        from kag.evidence import print_evidence_report, run_qa_with_evidence
        from kag.interface import SolverPipelineABC

        pipeline = SolverPipelineABC.from_config(
            KAG_CONFIG.all_config.get("kag_solver_pipeline", {})
        )

        answer, evidence_list = run_qa_with_evidence(question, pipeline)
        report = print_evidence_report(question, answer, evidence_list)
        self.stdout.write(report)
