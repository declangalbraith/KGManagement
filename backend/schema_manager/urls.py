from django.urls import path

from . import views

urlpatterns = [
    path("current/", views.SchemaCurrentView.as_view(), name="schema-current"),
    path("save/", views.SchemaSaveView.as_view(), name="schema-save"),
    path("publish/", views.SchemaPublishView.as_view(), name="schema-publish"),
    path("import/", views.SchemaImportView.as_view(), name="schema-import"),
    path("export/", views.SchemaExportView.as_view(), name="schema-export"),
    path("versions/", views.SchemaVersionViewSet.as_view({"get": "list"}), name="schema-version-list"),
    path("versions/<int:pk>/", views.SchemaVersionViewSet.as_view({"get": "retrieve"}), name="schema-version-detail"),
]
