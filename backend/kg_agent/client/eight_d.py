"""HTTP client for 8D integration facade (/api/v1/integration/8d/*)."""

from __future__ import annotations

import logging
from typing import Any, BinaryIO, Dict, Optional

import requests

from kg_agent.conf import get_eight_d_settings
from kg_agent.exceptions import EightDIntegrationError

logger = logging.getLogger(__name__)

FACADE_PREFIX = "/integration/8d"


class EightDIntegrationClient:
    def __init__(self, *, base_url: Optional[str] = None, token: str):
        if not token:
            raise ValueError("8D integration client 需要 Bearer JWT，请使用 EightDIntegrationClient.for_user()")
        cfg = get_eight_d_settings()
        self.base_url = (base_url or cfg["base_url"]).rstrip("/")
        self.token = token
        self.timeout = cfg["timeout_sec"]
        self.upload_timeout = cfg["upload_timeout_sec"]

    @classmethod
    def for_user(cls, user, *, base_url: Optional[str] = None) -> "EightDIntegrationClient":
        from kg_agent.auth.jwt_token import issue_integration_token

        return cls(base_url=base_url, token=issue_integration_token(user))

    def _headers(self, *, json_body: bool = True) -> Dict[str, str]:
        headers: Dict[str, str] = {"Authorization": f"Bearer {self.token}"}
        if json_body:
            headers["Accept"] = "application/json"
        return headers

    def _url(self, path: str) -> str:
        path = path if path.startswith("/") else f"/{path}"
        if not path.startswith(FACADE_PREFIX):
            path = f"{FACADE_PREFIX}{path}"
        return f"{self.base_url}{path}"

    def _handle_response(self, resp: requests.Response) -> Any:
        if resp.status_code == 204:
            return None
        try:
            payload = resp.json()
        except ValueError:
            payload = None

        if resp.ok:
            return payload

        if isinstance(payload, dict) and "error" in payload:
            err = payload["error"] or {}
            raise EightDIntegrationError(
                err.get("message") or resp.reason or "8D request failed",
                code=err.get("code") or "",
                trace_id=err.get("trace_id") or resp.headers.get("X-Trace-Id", ""),
                status_code=resp.status_code,
            )
        text = (payload or resp.text or "")[:500]
        raise EightDIntegrationError(
            text or resp.reason or "8D request failed",
            status_code=resp.status_code,
            trace_id=resp.headers.get("X-Trace-Id", ""),
        )

    def upload_document(
        self,
        file_obj: BinaryIO,
        file_name: str,
        *,
        source_system: str,
        source_module: str,
        source_record_id: str,
        source_record_type: str,
        idempotency_key: str = "",
        sensitivity: Optional[str] = None,
        auto_run_pipeline: bool = True,
        content_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        cfg = get_eight_d_settings()
        # Identity from Bearer JWT only (do not send operator_id/org_id — see token claims doc).
        data = {
            "source_system": source_system,
            "source_module": source_module,
            "source_record_id": source_record_id,
            "source_record_type": source_record_type,
            "sensitivity": sensitivity or cfg["default_sensitivity"],
            "auto_run_pipeline": "true" if auto_run_pipeline else "false",
        }
        if idempotency_key:
            data["idempotency_key"] = idempotency_key

        files = {"file": (file_name, file_obj, content_type or "application/octet-stream")}
        resp = requests.post(
            self._url("/documents"),
            headers=self._headers(json_body=False),
            data=data,
            files=files,
            timeout=self.upload_timeout,
        )
        return self._handle_response(resp) or {}

    def trigger_pipeline(self, doc_id: str, *, force: bool = False) -> Dict[str, Any]:
        body: Dict[str, Any] = {"force": force}
        resp = requests.post(
            self._url(f"/documents/{doc_id}/pipeline"),
            headers=self._headers(),
            json=body,
            timeout=self.timeout,
        )
        return self._handle_response(resp) or {}

    def get_pipeline_status(self, doc_id: str) -> Dict[str, Any]:
        resp = requests.get(
            self._url(f"/documents/{doc_id}/pipeline"),
            headers=self._headers(),
            timeout=self.timeout,
        )
        return self._handle_response(resp) or {}

    def get_result(self, doc_id: str) -> Dict[str, Any]:
        resp = requests.get(
            self._url(f"/documents/{doc_id}/result"),
            headers=self._headers(),
            timeout=self.timeout,
        )
        return self._handle_response(resp) or {}

    def get_graph(self, doc_id: str) -> Dict[str, Any]:
        resp = requests.get(
            self._url(f"/documents/{doc_id}/graph"),
            headers=self._headers(),
            timeout=self.timeout,
        )
        return self._handle_response(resp) or {}

    def get_graphs_overview(self, *, max_nodes: int = 200) -> Dict[str, Any]:
        """Facade overview graph (optional; 404 if 8D has not deployed /graphs yet)."""
        resp = requests.get(
            self._url("/graphs"),
            headers=self._headers(),
            params={"max_nodes": max_nodes},
            timeout=self.timeout,
        )
        if resp.status_code in (404, 405, 501):
            raise EightDIntegrationError(
                "graphs overview not available",
                code="GRAPHS_OVERVIEW_NOT_FOUND",
                status_code=resp.status_code,
            )
        return self._handle_response(resp) or {}

    def list_documents(
        self,
        *,
        source_system: Optional[str] = None,
        source_module: Optional[str] = None,
        source_record_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "page_size": page_size}
        if source_system:
            params["source_system"] = source_system
        if source_module:
            params["source_module"] = source_module
        if source_record_id:
            params["source_record_id"] = source_record_id
        resp = requests.get(
            self._url("/documents"),
            headers=self._headers(),
            params=params,
            timeout=self.timeout,
        )
        return self._handle_response(resp) or {}
