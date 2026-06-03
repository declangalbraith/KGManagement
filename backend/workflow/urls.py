from django.urls import path

from workflow.views import WorkflowDefinitionViewSet, WorkflowTaskViewSet

urlpatterns = [
    path(
        "definitions/",
        WorkflowDefinitionViewSet.as_view({"get": "list", "post": "create"}),
        name="workflow-definition-list",
    ),
    path(
        "definitions/<int:pk>/",
        WorkflowDefinitionViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="workflow-definition-detail",
    ),
    path(
        "tasks/",
        WorkflowTaskViewSet.as_view({"get": "list"}),
        name="workflow-task-list",
    ),
    path(
        "tasks/<int:pk>/approve/",
        WorkflowTaskViewSet.as_view({"post": "approve"}),
        name="workflow-task-approve",
    ),
    path(
        "tasks/<int:pk>/reject/",
        WorkflowTaskViewSet.as_view({"post": "reject"}),
        name="workflow-task-reject",
    ),
]
