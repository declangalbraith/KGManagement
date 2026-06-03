from django.contrib import admin

from workflow.models import (
    WorkflowAuditLog,
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowTask,
)

admin.site.register(WorkflowDefinition)
admin.site.register(WorkflowInstance)
admin.site.register(WorkflowTask)
admin.site.register(WorkflowAuditLog)
