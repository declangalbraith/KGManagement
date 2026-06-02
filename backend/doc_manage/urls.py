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
        "general-doc/<int:pk>/download/",
        GeneralDocumentViewSet.as_view({"get": "download"}),
        name="doc-manage-general-doc-download",
    ),
]
