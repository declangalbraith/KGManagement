from django.contrib import admin

from workflow.models import (
    WorkflowAuditLog,
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowStep,
    WorkflowTask,
)

admin.site.register(WorkflowDefinition)
admin.site.register(WorkflowStep)
admin.site.register(WorkflowInstance)
admin.site.register(WorkflowTask)
admin.site.register(WorkflowAuditLog)
