from rest_framework import serializers

from kg_agent.models import KgBuildJob


class KgBuildJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = KgBuildJob
        fields = [
            "id",
            "doc_id",
            "run_id",
            "trace_id",
            "source_system",
            "source_module",
            "source_record_id",
            "source_record_type",
            "org_id",
            "project_id",
            "operator_id",
            "idempotency_key",
            "status",
            "current_stage",
            "cancellable",
            "retryable",
            "error_message",
            "error_detail",
            "finished_at",
            "file_name",
            "stats",
            "draft_id",
            "draft_version",
            "review_status",
            "committed_at",
            "create_datetime",
            "update_datetime",
        ]
        read_only_fields = fields
