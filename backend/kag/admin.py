from django.contrib import admin
from .models import KAGProject, KAGTask, KAGDocument


@admin.register(KAGProject)
class KAGProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "display_name", "namespace", "is_active", "created_at"]
    search_fields = ["name", "display_name"]


@admin.register(KAGTask)
class KAGTaskAdmin(admin.ModelAdmin):
    list_display = ["project", "task_type", "status", "created_at", "updated_at"]
    list_filter = ["task_type", "status"]
    search_fields = ["project__name"]


@admin.register(KAGDocument)
class KAGDocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "file_type", "is_processed", "created_at"]
    list_filter = ["file_type", "is_processed"]
