from django.urls import path

from doc_manage.views import BomDocumentViewSet

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
]
