"""8D knowledge graph overview (multi-document merge or facade /graphs)."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from kg_agent.client import EightDIntegrationClient
from kg_agent.exceptions import EightDIntegrationError
from kg_agent.mappers.graph_viz import graph_response_to_viz, merge_viz_graphs
from kg_agent.models import KgBuildJob

logger = logging.getLogger(__name__)

# Facade list may use `status` (e.g. extracted) or `pipeline_status` (e.g. committed).
READY_DOC_STATUSES = frozenset(
    {
        "committed",
        "success",
        "succeeded",
        "partial_success",
        "completed",
        "extracted",
        "done",
    }
)
SUCCESS_JOB = frozenset(
    {
        KgBuildJob.Status.SUCCESS,
        KgBuildJob.Status.PARTIAL_SUCCESS,
    }
)


def _doc_ids_from_8d_list(payload: Dict[str, Any], max_docs: int, *, seen: Optional[set[str]] = None) -> List[str]:
    items = payload.get("items") or []
    ids: List[str] = []
    seen = seen if seen is not None else set()
    for item in items:
        if not isinstance(item, dict):
            continue
        doc_id = item.get("doc_id") or ""
        status = (item.get("pipeline_status") or item.get("status") or "").lower()
        run_status = (item.get("latest_run_status") or "").lower()
        if not doc_id or doc_id in seen:
            continue
        if run_status == "failed":
            continue
        if status and status not in READY_DOC_STATUSES:
            continue
        seen.add(doc_id)
        ids.append(str(doc_id))
        if len(ids) >= max_docs:
            break
    return ids


def _collect_doc_ids_from_8d(client: EightDIntegrationClient, max_docs: int) -> List[str]:
    """Paginate facade document list to include all committed docs (up to max_docs)."""
    seen: set[str] = set()
    collected: List[str] = []
    page = 1
    while len(collected) < max_docs and page <= 10:
        listed = client.list_documents(page=page, page_size=50)
        batch = _doc_ids_from_8d_list(listed, max_docs - len(collected), seen=seen)
        collected.extend(batch)
        items = listed.get("items") or []
        if len(items) < 50:
            break
        page += 1
    return collected


def _doc_ids_from_build_jobs(max_docs: int) -> List[str]:
    ids: List[str] = []
    seen: set[str] = set()
    qs = (
        KgBuildJob.objects.filter(status__in=SUCCESS_JOB)
        .exclude(doc_id="")
        .order_by("-create_datetime")[: max_docs * 2]
    )
    for job in qs:
        if job.doc_id in seen:
            continue
        seen.add(job.doc_id)
        ids.append(job.doc_id)
        if len(ids) >= max_docs:
            break
    return ids


def fetch_eight_d_graph_overview(
    user,
    *,
    max_nodes: int = 80,
    max_docs: int = 20,
) -> Dict[str, Any]:
    """
    Load 8D KG overview for builder / QA fallback.

    1) Try facade GET /integration/8d/graphs (if deployed on 8D)
    2) Else merge graphs from recent committed documents + local build jobs
    """
    client = EightDIntegrationClient.for_user(user)
    limit = max(1, min(max_nodes, 500))
    docs_cap = max(1, min(max_docs, 20))

    try:
        raw = client.get_graphs_overview(max_nodes=limit)
        if raw and (raw.get("nodes") or raw.get("edges")):
            viz = graph_response_to_viz(raw)
            viz["source"] = "8d_graphs_facade"
            return viz
    except EightDIntegrationError as exc:
        if exc.status_code not in (404, 405, 501):
            logger.info("8D /graphs not used (%s), merging per-doc graphs", exc.code or exc.status_code)

    doc_ids: List[str] = []
    try:
        doc_ids = _collect_doc_ids_from_8d(client, docs_cap)
    except EightDIntegrationError:
        logger.warning("8D list_documents failed for overview", exc_info=True)

    if not doc_ids:
        doc_ids = _doc_ids_from_build_jobs(docs_cap)

    if not doc_ids:
        return {
            "nodes": [],
            "links": [],
            "typeLegend": {},
            "truncated": False,
            "source": "8d_overview_empty",
            "merged_doc_count": 0,
            "doc_ids": [],
        }

    parts: List[Dict[str, Any]] = []
    loaded_ids: List[str] = []
    for doc_id in doc_ids:
        try:
            parts.append(client.get_graph(doc_id))
            loaded_ids.append(doc_id)
        except EightDIntegrationError:
            logger.warning("get_graph failed for doc_id=%s", doc_id, exc_info=True)

    if not parts:
        raise EightDIntegrationError("无法从 8D 获取任何文档子图", code="GRAPH_OVERVIEW_EMPTY")

    merged = merge_viz_graphs(parts, max_nodes=limit, source="8d_overview_merged")
    merged["doc_ids"] = loaded_ids
    merged["merged_doc_count"] = len(loaded_ids)
    return merged
