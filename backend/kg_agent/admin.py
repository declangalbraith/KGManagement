from django.contrib import admin

from kg_agent.models import KgBuildJob


@admin.register(KgBuildJob)
class KgBuildJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "source_record_id",
        "doc_id",
        "status",
        "file_name",
        "create_datetime",
    )
    list_filter = ("status", "source_module")
    search_fields = ("doc_id", "source_record_id", "file_name")
    readonly_fields = ("doc_id", "run_id", "trace_id", "create_datetime", "update_datetime")
