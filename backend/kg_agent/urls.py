from django.urls import path

from kg_agent import views

urlpatterns = [
    path("build/upload/", views.BuildUploadView.as_view(), name="kg-agent-build-upload"),
    path("build/", views.BuildListView.as_view(), name="kg-agent-build-list"),
    path("build/<int:pk>/status/", views.BuildStatusView.as_view(), name="kg-agent-build-status"),
    path("build/<int:pk>/result/", views.BuildResultView.as_view(), name="kg-agent-build-result"),
    path("graph/overview/", views.GraphOverviewView.as_view(), name="kg-agent-graph-overview"),
    path("graph/", views.GraphView.as_view(), name="kg-agent-graph"),
]
