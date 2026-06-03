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
            "operator_id",
            "status",
            "current_stage",
            "error_message",
            "finished_at",
            "file_name",
            "stats",
            "create_datetime",
            "update_datetime",
        ]
        read_only_fields = fields
