from django.urls import path

from . import views

urlpatterns = [
    path("projects/", views.SchemaProjectViewSet.as_view({"get": "list", "post": "create"}), name="schema-project-list"),
    path(
        "projects/<int:pk>/",
        views.SchemaProjectViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="schema-project-detail",
    ),
    path("current/", views.SchemaCurrentView.as_view(), name="schema-current"),
    path("save/", views.SchemaSaveView.as_view(), name="schema-save"),
    path("publish/", views.SchemaPublishView.as_view(), name="schema-publish"),
    path("import/", views.SchemaImportView.as_view(), name="schema-import"),
    path("export/", views.SchemaExportView.as_view(), name="schema-export"),
    path("versions/", views.SchemaVersionViewSet.as_view({"get": "list"}), name="schema-version-list"),
    path("versions/<int:pk>/", views.SchemaVersionViewSet.as_view({"get": "retrieve"}), name="schema-version-detail"),
]
