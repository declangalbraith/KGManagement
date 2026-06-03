from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class DeprecatedKagBuildView(APIView):
    """KAG build/graph endpoints migrated to kg_agent."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return self._gone()

    def post(self, request, *args, **kwargs):
        return self._gone()

    def _gone(self):
        return Response(
            {
                "error": "此接口已迁移，请使用 /api/kg-agent/（8D integration facade）",
                "migrate_to": {
                    "upload": "/api/kg-agent/build/upload/",
                    "status": "/api/kg-agent/build/{id}/status/",
                    "result": "/api/kg-agent/build/{id}/result/",
                    "graph": "/api/kg-agent/graph/",
                },
            },
            status=status.HTTP_410_GONE,
        )
