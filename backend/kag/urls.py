from django.urls import path
from . import views

urlpatterns = [
    path("projects/", views.KAGProjectViewSet.as_view({
        "get": "list", "post": "create",
    })),
    path("projects/<int:pk>/", views.KAGProjectViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy",
    })),
    path("tasks/", views.KAGTaskViewSet.as_view({
        "get": "list",
    })),
    path("tasks/<int:pk>/", views.KAGTaskViewSet.as_view({
        "get": "retrieve",
    })),
    path("build/", views.BuildView.as_view(), name="kag-build"),
    path("qa/", views.QAView.as_view(), name="kag-qa"),
    path("graph/subgraph/", views.GraphSubgraphView.as_view(), name="kag-graph-subgraph"),
    path("documents/", views.KAGDocumentViewSet.as_view({
        "get": "list", "post": "create",
    })),
    path("config/", views.KAGConfigView.as_view(), name="kag-config"),
]
