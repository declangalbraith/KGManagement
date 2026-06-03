"""Map 8D integration facade DTOs to frontend GraphSubgraphPayload."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Tuple

# Mirrors kag/graph_viz SPG_TYPE_VIZ_MAP for consistent legend colors
SPG_TYPE_VIZ_MAP: Dict[str, str] = {
    "EightDReport": "report",
    "ProductEvent": "event",
    "CauseItem": "cause",
    "ActionItem": "action",
    "ProductModel": "product",
    "ProductInstance": "product",
    "BOMPart": "part",
    "PartSerial": "part",
    "FailureMode": "failure",
    "Organization": "org",
    "Installation": "installation",
    "EventCategory": "category",
    "Chunk": "chunk",
    "Part": "part",
    "DefectOccurrence": "event",
    "RootCause": "cause",
}

VIZ_TYPE_LEGEND: Dict[str, Dict[str, Any]] = {
    "report": {"label": "8D报告", "color": "#4f46e5", "icon": "📄", "group": 7},
    "event": {"label": "产品事件", "color": "#ef4444", "icon": "⚠", "group": 1},
    "cause": {"label": "原因项", "color": "#f59e0b", "icon": "🔍", "group": 3},
    "action": {"label": "措施项", "color": "#10b981", "icon": "✓", "group": 4},
    "product": {"label": "产品", "color": "#06b6d4", "icon": "🚆", "group": 6},
    "part": {"label": "部件", "color": "#3b82f6", "icon": "⚙", "group": 2},
    "failure": {"label": "失效模式", "color": "#dc2626", "icon": "!", "group": 1},
    "org": {"label": "组织", "color": "#a855f7", "icon": "🏢", "group": 5},
    "installation": {"label": "安装记录", "color": "#64748b", "icon": "🔧", "group": 2},
    "category": {"label": "事件分类", "color": "#94a3b8", "icon": "📂", "group": 5},
    "chunk": {"label": "文档片段", "color": "#cbd5e1", "icon": "📝", "group": 7},
    "other": {"label": "其他", "color": "#9ca3af", "icon": "•", "group": 5},
}


def _resolve_viz_type(entity_type: str) -> str:
    short = entity_type.split(".")[-1] if entity_type else ""
    return SPG_TYPE_VIZ_MAP.get(short, "other")


def _node_id(entity: Dict[str, Any]) -> str:
    eid = entity.get("entity_id") or entity.get("id") or entity.get("business_key")
    etype = entity.get("entity_type") or entity.get("label") or "Entity"
    if not eid:
        return ""
    short = etype.split(".")[-1] if etype else "Entity"
    return f"{eid}_{short}"


def _node_label(entity: Dict[str, Any]) -> str:
    return (
        entity.get("title")
        or entity.get("name")
        or (entity.get("attributes") or {}).get("issue_title")
        or entity.get("business_key")
        or entity.get("entity_id")
        or ""
    )


def _entity_to_viz_node(entity: Dict[str, Any], seen_types: Set[str]) -> Optional[Dict[str, Any]]:
    nid = _node_id(entity)
    if not nid:
        return None
    spg_type = (entity.get("entity_type") or entity.get("label") or "Entity").split(".")[-1]
    viz_type = _resolve_viz_type(spg_type)
    seen_types.add(viz_type)
    legend = VIZ_TYPE_LEGEND.get(viz_type, VIZ_TYPE_LEGEND["other"])
    return {
        "id": nid,
        "label": str(_node_label(entity)),
        "spgType": spg_type,
        "vizType": viz_type,
        "group": legend["group"],
        "properties": entity.get("attributes") or {},
    }


def _graph_node_to_viz(node: Dict[str, Any], seen_types: Set[str]) -> Optional[Dict[str, Any]]:
    nid = node.get("id")
    if not nid:
        return None
    label = node.get("title") or node.get("name") or nid
    spg_type = (node.get("label") or "Entity").split(".")[-1]
    viz_type = _resolve_viz_type(spg_type)
    seen_types.add(viz_type)
    legend = VIZ_TYPE_LEGEND.get(viz_type, VIZ_TYPE_LEGEND["other"])
    props = node.get("properties") if isinstance(node.get("properties"), dict) else {}
    return {
        "id": str(nid),
        "label": str(label),
        "spgType": spg_type,
        "vizType": viz_type,
        "group": legend["group"],
        "properties": props,
    }


def _build_type_legend(seen_types: Set[str]) -> Dict[str, Dict[str, Any]]:
    legend: Dict[str, Dict[str, Any]] = {}
    for viz_type in seen_types:
        item = VIZ_TYPE_LEGEND.get(viz_type, VIZ_TYPE_LEGEND["other"])
        legend[viz_type] = {
            "label": item["label"],
            "color": item["color"],
            "icon": item["icon"],
        }
    if not legend:
        legend["other"] = {
            "label": VIZ_TYPE_LEGEND["other"]["label"],
            "color": VIZ_TYPE_LEGEND["other"]["color"],
            "icon": VIZ_TYPE_LEGEND["other"]["icon"],
        }
    return legend


def result_response_to_viz(payload: Dict[str, Any]) -> Dict[str, Any]:
    """IntegrationResultResponse -> nodes/links (explicit relationships only)."""
    entities: List[Dict[str, Any]] = payload.get("entities") or []
    relationships: List[Dict[str, Any]] = payload.get("relationships") or []

    seen_types: Set[str] = set()
    nodes_map: Dict[str, Dict[str, Any]] = {}
    for ent in entities:
        node = _entity_to_viz_node(ent, seen_types)
        if node:
            nodes_map[node["id"]] = node

    links: List[Dict[str, Any]] = []
    link_keys: Set[str] = set()
    for rel in relationships:
        from_id = rel.get("from_id")
        to_id = rel.get("to_id")
        from_type = (rel.get("from_type") or "Entity").split(".")[-1]
        to_type = (rel.get("to_type") or "Entity").split(".")[-1]
        if not from_id or not to_id:
            continue
        src = f"{from_id}_{from_type}"
        tgt = f"{to_id}_{to_type}"
        if src not in nodes_map:
            stub = _entity_to_viz_node(
                {"entity_id": from_id, "entity_type": from_type, "title": from_id},
                seen_types,
            )
            if stub:
                nodes_map[src] = stub
        if tgt not in nodes_map:
            stub = _entity_to_viz_node(
                {"entity_id": to_id, "entity_type": to_type, "title": to_id},
                seen_types,
            )
            if stub:
                nodes_map[tgt] = stub
        rel_type = rel.get("rel_type") or rel.get("type") or "RELATED"
        key = f"{src}|{rel_type}|{tgt}"
        if key in link_keys:
            continue
        link_keys.add(key)
        links.append({"source": src, "target": tgt, "label": str(rel_type)})

    meta = payload.get("stats") or {}
    truncated = bool(meta.get("truncated")) if isinstance(meta, dict) else False
    return {
        "nodes": list(nodes_map.values()),
        "links": links,
        "typeLegend": _build_type_legend(seen_types),
        "truncated": truncated,
        "source": "8d_result",
    }


def graph_response_to_viz(payload: Dict[str, Any]) -> Dict[str, Any]:
    """IntegrationGraphResponse -> nodes/links."""
    raw_nodes: List[Dict[str, Any]] = payload.get("nodes") or []
    raw_edges: List[Dict[str, Any]] = payload.get("edges") or []
    meta = payload.get("meta") or {}

    seen_types: Set[str] = set()
    nodes_map: Dict[str, Dict[str, Any]] = {}
    for raw in raw_nodes:
        node = _graph_node_to_viz(raw, seen_types)
        if node:
            nodes_map[node["id"]] = node

    links: List[Dict[str, Any]] = []
    link_keys: Set[str] = set()
    for edge in raw_edges:
        src = edge.get("source")
        tgt = edge.get("target")
        if not src or not tgt:
            continue
        label = edge.get("type") or edge.get("label") or "RELATED"
        key = f"{src}|{label}|{tgt}"
        if key in link_keys:
            continue
        link_keys.add(key)
        links.append({"source": str(src), "target": str(tgt), "label": str(label)})
        nodes_map.setdefault(str(src), {
            "id": str(src),
            "label": str(src),
            "spgType": "Entity",
            "vizType": "other",
            "group": VIZ_TYPE_LEGEND["other"]["group"],
            "properties": {},
        })
        nodes_map.setdefault(str(tgt), {
            "id": str(tgt),
            "label": str(tgt),
            "spgType": "Entity",
            "vizType": "other",
            "group": VIZ_TYPE_LEGEND["other"]["group"],
            "properties": {},
        })

    truncated = bool(meta.get("truncated")) if isinstance(meta, dict) else False
    return {
        "nodes": list(nodes_map.values()),
        "links": links,
        "typeLegend": _build_type_legend(seen_types),
        "truncated": truncated,
        "source": "8d_graph",
    }


def merge_viz_graphs(
    raw_parts: List[Dict[str, Any]],
    *,
    max_nodes: int = 80,
    source: str = "8d_merged",
) -> Dict[str, Any]:
    """Merge multiple per-document 8D graphs; each part is one report subgraph."""
    seen_types: Set[str] = set()
    nodes_map: Dict[str, Dict[str, Any]] = {}
    links: List[Dict[str, Any]] = []
    link_keys: Set[str] = set()
    truncated = False

    viz_list = [graph_response_to_viz(raw) for raw in raw_parts if raw]
    if not viz_list:
        return {
            "nodes": [],
            "links": [],
            "typeLegend": _build_type_legend(seen_types),
            "truncated": False,
            "source": source,
        }

    # Fair quota per document so one report does not consume the entire node budget.
    doc_count = len(viz_list)
    per_doc_budget = max(8, max_nodes // doc_count)

    for viz in viz_list:
        truncated = truncated or bool(viz.get("truncated"))
        doc_nodes = (viz.get("nodes") or [])[:per_doc_budget]
        doc_ids = {str(n["id"]) for n in doc_nodes if n.get("id")}
        for node in doc_nodes:
            nid = node.get("id")
            if not nid:
                continue
            nodes_map[str(nid)] = node
            seen_types.add(node.get("vizType") or "other")
        for link in viz.get("links") or []:
            src, tgt, label = link.get("source"), link.get("target"), link.get("label") or "RELATED"
            if not src or not tgt:
                continue
            if str(src) not in doc_ids or str(tgt) not in doc_ids:
                continue
            key = f"{src}|{label}|{tgt}"
            if key in link_keys:
                continue
            link_keys.add(key)
            links.append({"source": str(src), "target": str(tgt), "label": str(label)})

    node_list = list(nodes_map.values())
    if len(node_list) > max_nodes:
        truncated = True
        node_list = node_list[:max_nodes]
        keep_ids = {n["id"] for n in node_list}
        links = [
            l
            for l in links
            if l["source"] in keep_ids and l["target"] in keep_ids
        ]

    return {
        "nodes": node_list,
        "links": links,
        "typeLegend": _build_type_legend(seen_types),
        "truncated": truncated,
        "source": source,
        "merged_doc_count": doc_count,
    }


def map_pipeline_status(remote_status: str) -> str:
    """Map 8D pipeline status to KgBuildJob.Status."""
    mapping = {
        "queued": "queued",
        "running": "running",
        "success": "success",
        "succeeded": "success",
        "partial_success": "partial_success",
        "failed": "failed",
        "committed": "success",
        "completed": "success",
        "done": "success",
        "pending": "queued",
        "uploaded": "queued",
    }
    return mapping.get((remote_status or "").lower(), "running")
