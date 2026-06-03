from django.urls import path

from doc_manage.views import (
    BomDocumentViewSet,
    DocumentTypeViewSet,
    GeneralDocumentViewSet,
)

urlpatterns = [
    path(
        "bom/",
        BomDocumentViewSet.as_view({"get": "list", "post": "create"}),
        name="doc-manage-bom-list",
    ),
    path(
        "bom/<int:pk>/",
        BomDocumentViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="doc-manage-bom-detail",
    ),
    path(
        "bom/<int:pk>/download/",
        BomDocumentViewSet.as_view({"get": "download"}),
        name="doc-manage-bom-download",
    ),
    path(
        "document-types/",
        DocumentTypeViewSet.as_view({"get": "list"}),
        name="doc-manage-document-type-list",
    ),
    path(
        "general-doc/",
        GeneralDocumentViewSet.as_view({"get": "list", "post": "create"}),
        name="doc-manage-general-doc-list",
    ),
    path(
        "general-doc/<int:pk>/",
        GeneralDocumentViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="doc-manage-general-doc-detail",
    ),
    path(
        "general-doc/<int:pk>/revise/",
        GeneralDocumentViewSet.as_view({"post": "revise"}),
        name="doc-manage-general-doc-revise",
    ),
    path(
        "general-doc/<int:pk>/trigger-workflow/",
        GeneralDocumentViewSet.as_view({"post": "trigger_workflow_action"}),
        name="doc-manage-general-doc-trigger-workflow",
    ),
    path(
        "general-doc/<int:pk>/versions/",
        GeneralDocumentViewSet.as_view({"get": "versions"}),
        name="doc-manage-general-doc-versions",
    ),
    path(
        "general-doc/<int:pk>/audit-logs/",
        GeneralDocumentViewSet.as_view({"get": "audit_logs"}),
        name="doc-manage-general-doc-audit-logs",
    ),
    path(
        "general-doc/<int:pk>/approve/",
        GeneralDocumentViewSet.as_view({"post": "approve"}),
        name="doc-manage-general-doc-approve",
    ),
    path(
        "general-doc/<int:pk>/reject/",
        GeneralDocumentViewSet.as_view({"post": "reject"}),
        name="doc-manage-general-doc-reject",
    ),
    path(
        "general-doc/<int:pk>/download/",
        GeneralDocumentViewSet.as_view({"get": "download"}),
        name="doc-manage-general-doc-download",
    ),
]
