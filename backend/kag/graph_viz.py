"""Convert OpenSPG graph structures to frontend visualization payloads."""

from __future__ import annotations

import logging
from collections import deque
from typing import Any, Dict, List, Optional, Set, Tuple

from kag.common.tools.graph_api.graph_api_abc import GraphApiABC
from kag.common.tools.graph_api.impl.openspg_graph_api import OpenSPGGraphApi
from kag.common.utils import generate_biz_id_with_type
from kag.interface.common.model.retriever_data import EntityData, OneHopGraphData, RelationData
from kag.interface.solver.model.schema_utils import SchemaUtils

logger = logging.getLogger(__name__)

DEFAULT_CLUSTER_MAX_NODES = 40
HIGHLIGHT_CLUSTER_MAX_NODES = 40
QA_SUBGRAPH_EDGE_LIMIT = 500
MULTI_HOP_MAX_DEPTH = 12

# SPG short type name (without namespace prefix) -> viz bucket
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

KNOWN_SPG_TYPES = sorted(SPG_TYPE_VIZ_MAP.keys(), key=len, reverse=True)


def normalize_type_name(type_name: str, schema: Optional[SchemaUtils] = None) -> str:
    short = spg_type_short(type_name, schema)
    if schema is not None:
        try:
            return schema.get_label_within_prefix(short)
        except Exception:
            pass
    return type_name


def node_viz_id(biz_id: str, spg_type: str, schema: Optional[SchemaUtils] = None) -> str:
    return generate_biz_id_with_type(biz_id, normalize_type_name(spg_type, schema))


def parse_center_id(center_id: str) -> Tuple[str, str]:
    """Parse '{biz_id}_{SpgType}' where biz_id may contain underscores."""
    for spg_type in KNOWN_SPG_TYPES:
        suffix = f"_{spg_type}"
        if center_id.endswith(suffix):
            biz_id = center_id[: -len(suffix)]
            if biz_id:
                return biz_id, spg_type
    parts = center_id.rsplit("_", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    raise ValueError(f"Invalid center_id: {center_id}")


def spg_type_short(type_name: str, schema: Optional[SchemaUtils] = None) -> str:
    if schema is not None:
        return schema.get_label_without_prefix(type_name)
    if "." in type_name:
        return type_name.split(".")[-1]
    return type_name


def resolve_viz_type(spg_type_short_name: str) -> str:
    return SPG_TYPE_VIZ_MAP.get(spg_type_short_name, "other")


def _entity_label(entity: EntityData) -> str:
    if entity.name:
        return entity.name
    if entity.prop is not None:
        props = entity.prop.get_properties_map()
        for key in (
            "issueTitle",
            "问题标题",
            "symptom",
            "现象描述",
            "title",
            "标题",
            "reportNo",
            "8D编号",
            "modeCode",
            "失效模式编码",
        ):
            if key in props and props[key]:
                return str(props[key])
    return entity.biz_id or entity.get_short_name()


def _entity_properties(entity: EntityData) -> Dict[str, Any]:
    if entity.prop is None:
        return {}
    return entity.prop.get_properties_map()


def entity_to_node(entity: EntityData, schema: Optional[SchemaUtils] = None) -> Dict[str, Any]:
    short_type = spg_type_short(entity.type, schema)
    viz_type = resolve_viz_type(short_type)
    legend = VIZ_TYPE_LEGEND[viz_type]
    return {
        "id": node_viz_id(entity.biz_id, entity.type, schema),
        "label": _entity_label(entity),
        "spgType": short_type,
        "vizType": viz_type,
        "group": legend["group"],
        "properties": _entity_properties(entity),
    }


def _relation_label(rel: RelationData) -> str:
    if rel.type_zh:
        return rel.type_zh
    if rel.type:
        return rel.type
    return "关联"


def _iter_relations(one_hop: OneHopGraphData):
    for rel_list in (one_hop.out_relations or {}).values():
        for rel in rel_list:
            yield rel
    for rel_list in (one_hop.in_relations or {}).values():
        for rel in rel_list:
            yield rel


def one_hop_graphs_to_payload(
    cached_map: Dict[str, OneHopGraphData],
    schema: Optional[SchemaUtils] = None,
    limit: int = 500,
) -> Dict[str, Any]:
    nodes_map: Dict[str, Dict[str, Any]] = {}
    links: List[Dict[str, Any]] = []
    link_keys: Set[str] = set()
    truncated = False

    for one_hop in cached_map.values():
        if one_hop is None or one_hop.s is None:
            continue
        center = one_hop.s
        nodes_map[node_viz_id(center.biz_id, center.type)] = entity_to_node(center, schema)

        for rel in _iter_relations(one_hop):
            if rel.from_entity is None or rel.end_entity is None:
                continue
            src = entity_to_node(rel.from_entity, schema)
            tgt = entity_to_node(rel.end_entity, schema)
            nodes_map[src["id"]] = src
            nodes_map[tgt["id"]] = tgt
            key = f"{src['id']}|{rel.type}|{tgt['id']}"
            rev = f"{tgt['id']}|{rel.type}|{src['id']}"
            if key in link_keys or rev in link_keys:
                continue
            link_keys.add(key)
            links.append(
                {
                    "source": src["id"],
                    "target": tgt["id"],
                    "label": _relation_label(rel),
                }
            )
            if len(links) >= limit:
                truncated = True
                break
        if truncated:
            break

    return build_payload(list(nodes_map.values()), links, truncated=truncated)


def _entity_data_key(ent: EntityData, schema: Optional[SchemaUtils] = None) -> str:
    if not getattr(ent, "biz_id", None):
        return ""
    return node_viz_id(ent.biz_id, ent.type or "", schema)


def _neighbors_from_one_hop(one_hop: OneHopGraphData) -> List[EntityData]:
    seen: Set[str] = set()
    neighbors: List[EntityData] = []
    for rel in _iter_relations(one_hop):
        for ent in (rel.from_entity, rel.end_entity):
            if ent is None or not getattr(ent, "biz_id", None):
                continue
            key = generate_biz_id_with_type(ent.biz_id, ent.type or "")
            if key in seen:
                continue
            seen.add(key)
            neighbors.append(ent)
    return neighbors


def _merge_one_hop_into_maps(
    one_hop: OneHopGraphData,
    nodes_map: Dict[str, Dict[str, Any]],
    links: List[Dict[str, Any]],
    link_keys: Set[str],
    schema: Optional[SchemaUtils],
    edge_limit: int,
) -> bool:
    """Merge one-hop graph into accumulators; return True if edge limit hit."""
    if one_hop is None or one_hop.s is None:
        return False
    center = one_hop.s
    nodes_map[node_viz_id(center.biz_id, center.type, schema)] = entity_to_node(
        center, schema
    )
    truncated = False
    for rel in _iter_relations(one_hop):
        if rel.from_entity is None or rel.end_entity is None:
            continue
        src = entity_to_node(rel.from_entity, schema)
        tgt = entity_to_node(rel.end_entity, schema)
        nodes_map[src["id"]] = src
        nodes_map[tgt["id"]] = tgt
        key = f"{src['id']}|{rel.type}|{tgt['id']}"
        rev = f"{tgt['id']}|{rel.type}|{src['id']}"
        if key in link_keys or rev in link_keys:
            continue
        link_keys.add(key)
        links.append(
            {
                "source": src["id"],
                "target": tgt["id"],
                "label": _relation_label(rel),
            }
        )
        if len(links) >= edge_limit:
            return True
    return truncated


def multi_hop_expand_openspg(
    graph_api: OpenSPGGraphApi,
    schema: SchemaUtils,
    seed_entities: List[EntityData],
    max_nodes: int = DEFAULT_CLUSTER_MAX_NODES,
    max_edges: int = QA_SUBGRAPH_EDGE_LIMIT,
    max_depth: int = MULTI_HOP_MAX_DEPTH,
) -> Dict[str, Any]:
    """BFS multi-hop expansion via get_entity_one_hop until max_nodes or max_depth."""
    if not seed_entities:
        return build_payload([], [], truncated=False)

    nodes_map: Dict[str, Dict[str, Any]] = {}
    links: List[Dict[str, Any]] = []
    link_keys: Set[str] = set()
    truncated = False
    visited: Set[str] = set()
    queue: deque = deque()

    for ent in seed_entities:
        if ent and getattr(ent, "biz_id", None):
            queue.append((ent, 0))

    while queue and len(nodes_map) < max_nodes:
        ent, depth = queue.popleft()
        ek = _entity_data_key(ent, schema)
        if not ek or ek in visited:
            continue
        visited.add(ek)

        one_hop = graph_api.get_entity_one_hop(ent)
        if one_hop is None:
            continue

        if _merge_one_hop_into_maps(
            one_hop, nodes_map, links, link_keys, schema, max_edges
        ):
            truncated = True

        if len(nodes_map) >= max_nodes:
            truncated = True
            break

        if depth >= max_depth:
            continue

        for neighbor in _neighbors_from_one_hop(one_hop):
            if len(nodes_map) >= max_nodes:
                truncated = True
                break
            nk = _entity_data_key(neighbor, schema)
            if nk and nk not in visited:
                queue.append((neighbor, depth + 1))

    if len(nodes_map) > max_nodes:
        truncated = True
        keep_ids = set(list(nodes_map.keys())[:max_nodes])
        nodes_map = {k: v for k, v in nodes_map.items() if k in keep_ids}
        links = [
            l
            for l in links
            if l["source"] in keep_ids and l["target"] in keep_ids
        ]

    return build_payload(list(nodes_map.values()), links, truncated=truncated)


def multi_hop_expand_neo4j(
    seed_specs: List[Tuple[str, str]],
    schema: Optional[SchemaUtils] = None,
    namespace: str = "KGtestV2",
    max_nodes: int = DEFAULT_CLUSTER_MAX_NODES,
    max_edges: int = QA_SUBGRAPH_EDGE_LIMIT,
    max_depth: int = MULTI_HOP_MAX_DEPTH,
) -> Dict[str, Any]:
    """BFS multi-hop on Neo4j from (biz_id, spg_short_type) seeds."""
    from neo4j import GraphDatabase

    if not seed_specs:
        return build_payload([], [], truncated=False)

    cfg = _get_neo4j_session_config(namespace)
    driver = GraphDatabase.driver(cfg["uri"], auth=(cfg["user"], cfg["password"]))
    all_rows: List[dict] = []
    truncated = False
    try:
        with driver.session(database=cfg["database"]) as session:
            visited: Set[str] = set()
            queue: deque = deque()
            for biz_id, short_type in seed_specs:
                if biz_id and short_type:
                    queue.append((biz_id, short_type, 0))

            while queue and len(visited) < max_nodes:
                biz_id, short_type, depth = queue.popleft()
                full_label = f"{namespace}.{short_type}"
                if schema is not None:
                    try:
                        full_label = schema.get_label_within_prefix(short_type)
                    except Exception:
                        pass
                vid = node_viz_id(biz_id, short_type, schema)
                if vid in visited:
                    continue
                visited.add(vid)

                result = session.run(
                    f"""
                    MATCH (s:`{full_label}` {{id: $biz_id}})-[r]-(o)
                    WHERE o.id IS NOT NULL
                    RETURN s, type(r) AS rel_type, o
                    LIMIT $limit
                    """,
                    biz_id=biz_id,
                    limit=min(80, max_edges),
                )
                rows = _collect_neo4j_rows(result, ("s", "rel_type", "o"))
                all_rows.extend(rows)
                if len(all_rows) >= max_edges:
                    truncated = True
                    break
                if len(visited) >= max_nodes:
                    truncated = True
                    break
                if depth >= max_depth:
                    continue

                for row in rows:
                    for side in ("s", "o"):
                        payload = _neo4j_node_payload(
                            row.get(side), schema, namespace
                        )
                        if not payload:
                            continue
                        nid = payload["id"]
                        if nid in visited or len(visited) >= max_nodes:
                            continue
                        nbiz = (payload.get("properties") or {}).get("id")
                        ntype = payload.get("spgType")
                        if nbiz and ntype:
                            queue.append((str(nbiz), ntype, depth + 1))
    finally:
        driver.close()

    if not all_rows:
        return build_payload([], [], truncated=False)
    payload = _rows_to_neo4j_payload(
        all_rows,
        schema=schema,
        namespace=namespace,
        limit=max_edges,
    )
    if truncated or len(payload.get("nodes") or []) > max_nodes:
        payload = focus_cluster_payload(
            payload,
            seed_ids=[
                node_viz_id(b, t, schema) for b, t in seed_specs if b and t
            ],
            max_nodes=max_nodes,
        )
        payload["truncated"] = True
    return payload


def build_type_legend(nodes: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    legend: Dict[str, Dict[str, Any]] = {}
    for node in nodes:
        spg_type = node.get("spgType")
        if not spg_type or spg_type in legend:
            continue
        viz_type = node.get("vizType", "other")
        base = VIZ_TYPE_LEGEND.get(viz_type, VIZ_TYPE_LEGEND["other"])
        legend[spg_type] = {
            "label": base["label"],
            "color": base["color"],
            "icon": base["icon"],
        }
    return legend


def build_payload(
    nodes: List[Dict[str, Any]],
    links: List[Dict[str, Any]],
    truncated: bool = False,
) -> Dict[str, Any]:
    return {
        "nodes": nodes,
        "links": links,
        "typeLegend": build_type_legend(nodes),
        "truncated": truncated,
    }


def _pick_cluster_seeds(
    nodes: List[Dict[str, Any]], seed_ids: Optional[List[str]] = None
) -> List[str]:
    node_ids = {n["id"] for n in nodes if n.get("id")}
    seeds = [s for s in (seed_ids or []) if s in node_ids]
    if seeds:
        return seeds
    for n in nodes:
        spg = str(n.get("spgType") or "")
        if n.get("vizType") == "report" or spg.endswith("EightDReport") or spg == "EightDReport":
            return [n["id"]]
    if nodes:
        return [nodes[0]["id"]]
    return []


def _bfs_cluster(
    adj: Dict[str, Set[str]],
    all_ids: Set[str],
    starts: List[str],
    max_nodes: int,
) -> Set[str]:
    visited: Set[str] = set()
    queue: deque = deque()
    for sid in starts:
        if sid in all_ids:
            queue.append(sid)
    unlimited = max_nodes <= 0
    while queue and (unlimited or len(visited) < max_nodes):
        nid = queue.popleft()
        if nid in visited:
            continue
        visited.add(nid)
        for nb in adj.get(nid, ()):
            if nb not in visited and (unlimited or len(visited) < max_nodes):
                queue.append(nb)
    return visited


def focus_cluster_payload(
    payload: Dict[str, Any],
    seed_ids: Optional[List[str]] = None,
    max_nodes: int = DEFAULT_CLUSTER_MAX_NODES,
) -> Dict[str, Any]:
    """Keep a single connected cluster (BFS from seeds), capped at max_nodes."""
    nodes = payload.get("nodes") or []
    links = payload.get("links") or []
    if not nodes:
        return payload

    adj: Dict[str, Set[str]] = {}
    for link in links:
        s, t = link.get("source"), link.get("target")
        if not s or not t:
            continue
        adj.setdefault(s, set()).add(t)
        adj.setdefault(t, set()).add(s)

    node_by_id = {n["id"]: n for n in nodes if n.get("id")}
    all_ids = set(node_by_id.keys())
    seeds = _pick_cluster_seeds(nodes, seed_ids)

    if seed_ids:
        seed_set = set(seed_ids)
        best = _bfs_cluster(adj, all_ids, seeds, max_nodes)
        best_hit = len(best & seed_set)
        for sid in seeds:
            comp = _bfs_cluster(adj, all_ids, [sid], max_nodes)
            hit = len(comp & seed_set)
            if hit > best_hit or (hit == best_hit and len(comp) > len(best)):
                best, best_hit = comp, hit
        cluster = best
    else:
        cluster = _bfs_cluster(adj, all_ids, seeds, max_nodes)

    fnodes = [node_by_id[i] for i in cluster if i in node_by_id]
    flinks = [
        l
        for l in links
        if l.get("source") in cluster and l.get("target") in cluster
    ]
    truncated = bool(payload.get("truncated")) or len(nodes) > len(fnodes)
    return build_payload(fnodes, flinks, truncated=truncated)


def get_graph_api(project_name: str = "KGtestV2") -> OpenSPGGraphApi:
    from kag import ensure_runtime_initialized
    from kag.common.conf import KAG_CONFIG
    from kag.runtime import prepare_project_runtime

    runtime = prepare_project_runtime(project_name, include_builder=False)
    ensure_runtime_initialized(runtime["config_path"], include_builder=False)
    project_cfg = KAG_CONFIG.all_config.get("project", {}) or {}
    return GraphApiABC.from_config(
        {
            "type": "openspg_graph_api",
            "project_id": project_cfg.get("id"),
            "host_addr": project_cfg.get("host_addr"),
        }
    )


def _normalize_neo4j_uri(uri: str) -> str:
    """Fix common typos like bolt://host/:17687 -> bolt://host:17687."""
    if not uri:
        return "bolt://localhost:7687"
    fixed = uri.replace("/:", ":").replace(":///", "://")
    if fixed != uri:
        logger.warning("Normalized Neo4j URI from %s to %s", uri, fixed)
    return fixed


def _get_neo4j_session_config(namespace: str = "KGtestV2"):
    from kag.config import get_kag_config

    n4j = get_kag_config().get("neo4j", {})
    uri = _normalize_neo4j_uri(n4j.get("uri", "bolt://localhost:7687"))
    logger.info("Neo4j graph_viz using uri=%s database=%s", uri, n4j.get("database", "kgtestv2"))
    return {
        "uri": uri,
        "user": n4j.get("user", "neo4j"),
        "password": n4j.get("password", ""),
        "database": n4j.get("database", "kgtestv2"),
        "namespace": namespace,
    }


def _primary_neo4j_label(labels: List[str], namespace: str) -> str:
    for label in labels:
        if label.startswith(f"{namespace}."):
            return label
    return labels[0] if labels else f"{namespace}.Entity"


def _neo4j_display_label(props: Dict[str, Any], fallback: str) -> str:
    for key in (
        "name",
        "issueTitle",
        "问题标题",
        "title",
        "标题",
        "symptom",
        "现象描述",
        "reportNo",
        "8D编号",
        "modeCode",
        "失效模式编码",
        "eventCode",
        "事件编码",
    ):
        val = props.get(key)
        if val is not None and str(val).strip():
            return str(val).strip()
    node_id = props.get("id")
    if node_id is not None and str(node_id).strip():
        return str(node_id).strip()
    return fallback


def _parse_neo4j_node_raw(
    neo4j_node: Any,
    default_label: Optional[str] = None,
) -> Tuple[List[str], Dict[str, Any]]:
    """Parse neo4j.graph.Node or dict from session.run().data()."""
    if neo4j_node is None:
        return [], {}

    if hasattr(neo4j_node, "labels"):
        try:
            labels = list(neo4j_node.labels)
        except Exception:
            labels = []
        props: Dict[str, Any] = {}
        if hasattr(neo4j_node, "items"):
            try:
                props = dict(neo4j_node.items())
            except TypeError:
                props = dict(neo4j_node)
        return labels, props

    if isinstance(neo4j_node, dict):
        labels = neo4j_node.get("labels")
        if labels is None:
            labels = neo4j_node.get("label")
        if isinstance(labels, str):
            labels = [labels]
        elif labels is None:
            labels = []
        elif not isinstance(labels, list):
            labels = list(labels)

        props = neo4j_node.get("properties")
        if not isinstance(props, dict):
            skip = {
                "labels",
                "label",
                "element_id",
                "elementId",
                "type",
                "id",
            }
            props = {
                k: v
                for k, v in neo4j_node.items()
                if k not in skip and not str(k).startswith("_")
            }
        if not labels and default_label:
            labels = [default_label]
        return labels, props

    return [], {}


def _neo4j_node_payload(
    neo4j_node: Any,
    schema: Optional[SchemaUtils] = None,
    namespace: str = "KGtestV2",
    default_label: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    if neo4j_node is None:
        return None
    labels, props = _parse_neo4j_node_raw(neo4j_node, default_label=default_label)
    if not labels:
        return None
    full_label = _primary_neo4j_label(labels, namespace)
    biz_id = props.get("id")
    if biz_id is None or str(biz_id).strip() == "":
        return None
    biz_id = str(biz_id).strip()
    short_type = spg_type_short(full_label, schema)
    viz_type = resolve_viz_type(short_type)
    legend = VIZ_TYPE_LEGEND[viz_type]
    type_for_id = normalize_type_name(full_label, schema)
    clean_props = {
        k: v
        for k, v in props.items()
        if not str(k).startswith("_") and k not in ("name_vector",)
    }
    return {
        "id": generate_biz_id_with_type(biz_id, type_for_id),
        "label": _neo4j_display_label(props, biz_id),
        "spgType": short_type,
        "vizType": viz_type,
        "group": legend["group"],
        "properties": clean_props,
    }


def _collect_neo4j_rows(result, keys: Tuple[str, ...]) -> List[dict]:
    """Prefer live records so nodes stay neo4j.graph.Node; fallback to .data()."""
    rows: List[dict] = []
    try:
        for record in result:
            rows.append({k: record[k] for k in keys if k in record.keys()})
        if rows:
            return rows
    except Exception as exc:
        logger.debug("Neo4j record iteration failed, fallback to data(): %s", exc)
    return result.data() if hasattr(result, "data") else []


def _rows_to_neo4j_payload(
    rows: List[dict],
    schema: Optional[SchemaUtils] = None,
    namespace: str = "KGtestV2",
    limit: int = 200,
    source_default_label: Optional[str] = None,
) -> Dict[str, Any]:
    nodes_map: Dict[str, Dict[str, Any]] = {}
    links: List[Dict[str, Any]] = []
    link_keys: Set[str] = set()
    truncated = False

    for row in rows:
        s_node = row.get("s")
        o_node = row.get("o")
        rel_type = row.get("rel_type") or "关联"
        src = _neo4j_node_payload(
            s_node, schema, namespace, default_label=source_default_label
        )
        tgt = _neo4j_node_payload(o_node, schema, namespace)
        if not src or not tgt:
            continue
        nodes_map[src["id"]] = src
        nodes_map[tgt["id"]] = tgt
        key = f"{src['id']}|{rel_type}|{tgt['id']}"
        rev = f"{tgt['id']}|{rel_type}|{src['id']}"
        if key in link_keys or rev in link_keys:
            continue
        link_keys.add(key)
        links.append({"source": src["id"], "target": tgt["id"], "label": str(rel_type)})
        if len(links) >= limit:
            truncated = True
            break

    return build_payload(list(nodes_map.values()), links, truncated=truncated)


def overview_subgraph_neo4j(
    schema: Optional[SchemaUtils] = None,
    namespace: str = "KGtestV2",
    limit: int = 200,
) -> Dict[str, Any]:
    from neo4j import GraphDatabase

    cfg = _get_neo4j_session_config(namespace)
    try:
        driver = GraphDatabase.driver(cfg["uri"], auth=(cfg["user"], cfg["password"]))
    except Exception as exc:
        logger.exception("Neo4j driver init failed: %s", exc)
        return build_payload([], [], truncated=False)
    rows: List[dict] = []
    try:
        with driver.session(database=cfg["database"]) as session:
            eight_d_label = f"{namespace}.EightDReport"
            seed_result = session.run(
                f"""
                MATCH (s:`{eight_d_label}`)
                WHERE s.id IS NOT NULL
                RETURN s
                LIMIT 1
                """
            )
            seed_rows = _collect_neo4j_rows(seed_result, ("s",))
            seed_specs: List[Tuple[str, str]] = []
            for row in seed_rows:
                payload = _neo4j_node_payload(
                    row.get("s"),
                    schema,
                    namespace,
                    default_label=eight_d_label,
                )
                if payload:
                    biz = (payload.get("properties") or {}).get("id")
                    stype = payload.get("spgType")
                    if biz and stype:
                        seed_specs.append((str(biz), stype))
            if seed_specs:
                return multi_hop_expand_neo4j(
                    seed_specs,
                    schema=schema,
                    namespace=namespace,
                    max_nodes=min(limit, DEFAULT_CLUSTER_MAX_NODES),
                )
            result = session.run(
                """
                MATCH (s)-[r]-(o)
                WHERE any(l IN labels(s) WHERE l STARTS WITH $ns)
                  AND any(l IN labels(o) WHERE l STARTS WITH $ns)
                  AND s.id IS NOT NULL AND o.id IS NOT NULL
                RETURN s, type(r) AS rel_type, o
                LIMIT $limit
                """,
                ns=f"{namespace}.",
                limit=int(limit),
            )
            rows = _collect_neo4j_rows(result, ("s", "rel_type", "o"))
        if not rows:
            logger.warning(
                "Neo4j overview returned no rows (database=%s, namespace=%s)",
                cfg["database"],
                namespace,
            )
            return build_payload([], [], truncated=False)
        logger.info("Neo4j overview loaded %d relationship rows", len(rows))
        return _rows_to_neo4j_payload(
            rows,
            schema=schema,
            namespace=namespace,
            limit=limit,
            source_default_label=eight_d_label,
        )
    except Exception as exc:
        from neo4j.exceptions import AuthError, ServiceUnavailable

        if isinstance(exc, AuthError):
            logger.error(
                "Neo4j authentication failed (uri=%s user=%s). "
                "Check KAG_NEO4J_USER / KAG_NEO4J_PASSWORD in backend/conf/env.py",
                cfg["uri"],
                cfg["user"],
            )
            payload = build_payload([], [], truncated=False)
            payload["source"] = "empty"
            payload["error"] = (
                "Neo4j 认证失败，请检查 backend/conf/env.py 中的 "
                "KAG_NEO4J_USER 与 KAG_NEO4J_PASSWORD 是否与服务器一致。"
            )
            return payload
        if isinstance(exc, ServiceUnavailable):
            logger.error("Neo4j unreachable at %s: %s", cfg["uri"], exc)
            payload = build_payload([], [], truncated=False)
            payload["source"] = "empty"
            payload["error"] = f"无法连接 Neo4j（{cfg['uri']}），请确认地址与端口。"
            return payload
        logger.exception("Neo4j overview query failed: %s", exc)
        payload = build_payload([], [], truncated=False)
        payload["source"] = "empty"
        payload["error"] = str(exc)
        return payload
    finally:
        driver.close()


def _overview_via_report_multihop(
    graph_api: OpenSPGGraphApi,
    schema: SchemaUtils,
    report_limit: int = 1,
    max_nodes: int = DEFAULT_CLUSTER_MAX_NODES,
) -> Optional[Dict[str, Any]]:
    """Expand the first EightDReport with multi-hop BFS for default overview."""
    label = schema.get_label_within_prefix("EightDReport")
    dsl = f"""
    MATCH (s:`{label}`)
    RETURN s,s.id
    LIMIT {int(report_limit)}
    """
    table = graph_api.execute_dsl(dsl)
    if not table.data:
        return None

    s_idx = table.header.index("s") if "s" in table.header else 0
    cached_map: Dict[str, OneHopGraphData] = {}
    entities: List[EntityData] = []
    for row in table.data:
        try:
            ent = graph_api.convert_raw_data_to_node(row[s_idx], True, cached_map)
            if ent.biz_id:
                entities.append(ent)
        except Exception as exc:
            logger.debug("Skip report row parse error: %s", exc)

    if not entities:
        return None
    payload = multi_hop_expand_openspg(
        graph_api,
        schema,
        entities[: max(1, report_limit)],
        max_nodes=max_nodes,
    )
    if not payload.get("nodes"):
        return None
    return focus_cluster_payload(payload, max_nodes=max_nodes)


def _overview_subgraph_openspg(
    graph_api: OpenSPGGraphApi,
    schema: SchemaUtils,
    limit: int = 200,
) -> Dict[str, Any]:
    if graph_api.rc is None:
        logger.warning("OpenSPG ReasonerClient unavailable (rc is None)")
        return build_payload([], [], truncated=False)

    payload = _overview_via_report_multihop(graph_api, schema, max_nodes=limit)
    if payload and payload.get("nodes"):
        return payload

    label = schema.get_label_within_prefix("EightDReport")
    dsl = f"""
    MATCH (s:`{label}`)-[p:rdf_expand()]-(o:Entity)
    RETURN s,p,o,s.id,o.id
    LIMIT {int(limit)}
    """
    table = graph_api.execute_dsl(dsl)
    if not table.data:
        dsl_fallback = f"""
        MATCH (s:Entity)-[p:rdf_expand()]-(o:Entity)
        RETURN s,p,o,s.id,o.id
        LIMIT {int(limit)}
        """
        table = graph_api.execute_dsl(dsl_fallback)
    if not table.data:
        return build_payload([], [], truncated=False)
    cached_map = graph_api.convert_spo_to_one_graph(table)
    payload = one_hop_graphs_to_payload(cached_map, schema=schema, limit=limit)
    return focus_cluster_payload(payload, max_nodes=min(limit, DEFAULT_CLUSTER_MAX_NODES))


def overview_subgraph(
    graph_api: OpenSPGGraphApi,
    schema: SchemaUtils,
    limit: int = DEFAULT_CLUSTER_MAX_NODES,
    namespace: str = "KGtestV2",
) -> Dict[str, Any]:
    cap = min(limit, DEFAULT_CLUSTER_MAX_NODES)
    payload = _overview_subgraph_openspg(graph_api, schema, limit=cap)
    if payload.get("nodes"):
        payload = focus_cluster_payload(payload, max_nodes=cap)
        payload["source"] = "openspg"
        return payload
    logger.info("OpenSPG overview empty, falling back to Neo4j")
    neo_payload = overview_subgraph_neo4j(schema=schema, namespace=namespace, limit=cap)
    if neo_payload.get("nodes"):
        neo_payload = focus_cluster_payload(neo_payload, max_nodes=cap)
    neo_payload["source"] = "neo4j" if neo_payload.get("nodes") else "empty"
    return neo_payload


def expand_subgraph_neo4j(
    biz_id: str,
    spg_type: str,
    schema: Optional[SchemaUtils] = None,
    namespace: str = "KGtestV2",
    limit: int = 200,
) -> Dict[str, Any]:
    from neo4j import GraphDatabase

    full_label = f"{namespace}.{spg_type}"
    if schema is not None:
        try:
            full_label = schema.get_label_within_prefix(spg_type)
        except Exception:
            pass
    cfg = _get_neo4j_session_config(namespace)
    driver = GraphDatabase.driver(cfg["uri"], auth=(cfg["user"], cfg["password"]))
    try:
        with driver.session(database=cfg["database"]) as session:
            result = session.run(
                f"""
                MATCH (s:`{full_label}` {{id: $biz_id}})-[r]-(o)
                WHERE o.id IS NOT NULL
                RETURN s, type(r) AS rel_type, o
                LIMIT $limit
                """,
                biz_id=biz_id,
                limit=int(limit),
            )
            rows = _collect_neo4j_rows(result, ("s", "rel_type", "o"))
        if not rows:
            node = {
                "id": node_viz_id(biz_id, full_label, schema),
                "label": biz_id,
                "spgType": spg_type,
                "vizType": resolve_viz_type(spg_type),
                "group": VIZ_TYPE_LEGEND[resolve_viz_type(spg_type)]["group"],
                "properties": {"id": biz_id},
            }
            return build_payload([node], [], truncated=False)
        return _rows_to_neo4j_payload(
            rows,
            schema=schema,
            namespace=namespace,
            limit=limit,
            source_default_label=full_label,
        )
    finally:
        driver.close()


def expand_subgraph(
    graph_api: OpenSPGGraphApi,
    schema: SchemaUtils,
    center_id: str,
    limit: int = 200,
    namespace: str = "KGtestV2",
) -> Dict[str, Any]:
    biz_id, spg_type = parse_center_id(center_id)
    label = schema.get_label_within_prefix(spg_type)
    entity = EntityData(entity_id=biz_id, node_type=label)
    entity.biz_id = biz_id
    entity.type = label
    max_nodes = min(limit, DEFAULT_CLUSTER_MAX_NODES)
    payload = multi_hop_expand_openspg(
        graph_api,
        schema,
        [entity],
        max_nodes=max_nodes,
        max_edges=limit,
    )
    if payload.get("nodes"):
        return payload
    payload = multi_hop_expand_neo4j(
        [(biz_id, spg_type)],
        schema=schema,
        namespace=namespace,
        max_nodes=max_nodes,
        max_edges=limit,
    )
    if payload.get("nodes"):
        return payload
    node = entity_to_node(entity, schema)
    return build_payload([node], [], truncated=False)


def collect_entities_from_evidence(evidence_list: List[dict]) -> List[Dict[str, str]]:
    entities: List[Dict[str, str]] = []
    seen: Set[str] = set()
    for row in evidence_list or []:
        retrieval = row.get("retrieval") or {}
        for ent in retrieval.get("entities") or []:
            biz_id = (ent.get("biz_id") or "").strip()
            etype = (ent.get("type") or "").strip()
            if not biz_id or not etype:
                name = (ent.get("name") or "").strip()
                if not name:
                    continue
                continue
            key = f"{biz_id}|{etype}"
            if key in seen:
                continue
            seen.add(key)
            entities.append({"biz_id": biz_id, "type": etype, "name": ent.get("name") or ""})
    return entities


def collect_highlight_from_evidence(
    evidence_list: List[dict], schema: Optional[SchemaUtils] = None
) -> List[str]:
    ids: List[str] = []
    seen: Set[str] = set()
    for ent in collect_entities_from_evidence(evidence_list):
        vid = node_viz_id(ent["biz_id"], ent["type"], schema)
        if vid not in seen:
            seen.add(vid)
            ids.append(vid)
    return ids


def _entities_from_evidence_specs(
    entities: List[Dict[str, str]], schema: SchemaUtils
) -> List[EntityData]:
    out: List[EntityData] = []
    for ent in entities:
        biz_id = ent["biz_id"]
        etype = ent["type"]
        label = normalize_type_name(etype, schema)
        entity = EntityData(entity_id=biz_id, node_type=label)
        entity.biz_id = biz_id
        entity.type = label
        if ent.get("name"):
            entity.name = ent["name"]
        out.append(entity)
    return out


def subgraph_delta_from_evidence(
    graph_api: OpenSPGGraphApi,
    schema: SchemaUtils,
    evidence_list: List[dict],
    existing_node_ids: Optional[Set[str]] = None,
    limit: int = 200,
    namespace: str = "KGtestV2",
) -> Dict[str, Any]:
    entities = collect_entities_from_evidence(evidence_list)
    seed_entities = _entities_from_evidence_specs(entities[:30], schema)
    max_nodes = min(HIGHLIGHT_CLUSTER_MAX_NODES, DEFAULT_CLUSTER_MAX_NODES)

    full = multi_hop_expand_openspg(
        graph_api,
        schema,
        seed_entities,
        max_nodes=max_nodes,
        max_edges=limit,
    )
    if not full.get("nodes") and entities:
        seed_specs = [
            (ent["biz_id"], spg_type_short(ent["type"], schema))
            for ent in entities[:30]
            if ent.get("biz_id") and ent.get("type")
        ]
        full = multi_hop_expand_neo4j(
            seed_specs,
            schema=schema,
            namespace=namespace,
            max_nodes=max_nodes,
            max_edges=limit,
        )

    highlight = collect_highlight_from_evidence(evidence_list, schema)
    focused = focus_cluster_payload(
        full,
        seed_ids=highlight,
        max_nodes=max_nodes,
    )
    return focused


def qa_graph_bundle(
    graph_api: OpenSPGGraphApi,
    schema: SchemaUtils,
    evidence_list: List[dict],
    existing_node_ids: Optional[Set[str]] = None,
    namespace: str = "KGtestV2",
) -> Dict[str, Any]:
    highlight = collect_highlight_from_evidence(evidence_list, schema)
    delta = subgraph_delta_from_evidence(
        graph_api,
        schema,
        evidence_list,
        existing_node_ids=existing_node_ids,
        limit=QA_SUBGRAPH_EDGE_LIMIT,
        namespace=namespace,
    )
    return {"highlight_node_ids": highlight, "subgraph_delta": delta}


def _subgraph_node_label(node) -> str:
    """Display label for a builder SubGraph node."""
    props = node.properties or {}
    for key in (
        "name",
        "issueTitle",
        "问题标题",
        "symptom",
        "现象描述",
        "title",
        "标题",
        "reportNo",
        "8D编号",
    ):
        if props.get(key):
            return str(props[key])
    if node.name:
        return str(node.name)
    return str(node.id)


def subgraph_to_viz(
    sub_graph,
    schema: Optional[SchemaUtils] = None,
    namespace: str = "KGtestV2",
) -> Dict[str, Any]:
    """Convert builder SubGraph to frontend GraphSubgraphPayload shape."""
    nodes_map: Dict[str, Dict[str, Any]] = {}
    links: List[Dict[str, Any]] = []
    link_keys: Set[str] = set()

    for node in sub_graph.nodes or []:
        short_type = spg_type_short(node.label, schema)
        viz_type = resolve_viz_type(short_type)
        legend = VIZ_TYPE_LEGEND[viz_type]
        viz_id = node_viz_id(node.id, node.label, schema)
        nodes_map[viz_id] = {
            "id": viz_id,
            "label": _subgraph_node_label(node),
            "spgType": short_type,
            "vizType": viz_type,
            "group": legend["group"],
            "properties": dict(node.properties or {}),
        }

    for edge in sub_graph.edges or []:
        src_id = node_viz_id(edge.from_id, edge.from_type, schema)
        tgt_id = node_viz_id(edge.to_id, edge.to_type, schema)
        if src_id not in nodes_map:
            short = spg_type_short(edge.from_type, schema)
            viz_type = resolve_viz_type(short)
            legend = VIZ_TYPE_LEGEND[viz_type]
            nodes_map[src_id] = {
                "id": src_id,
                "label": edge.from_id,
                "spgType": short,
                "vizType": viz_type,
                "group": legend["group"],
                "properties": {},
            }
        if tgt_id not in nodes_map:
            short = spg_type_short(edge.to_type, schema)
            viz_type = resolve_viz_type(short)
            legend = VIZ_TYPE_LEGEND[viz_type]
            nodes_map[tgt_id] = {
                "id": tgt_id,
                "label": edge.to_id,
                "spgType": short,
                "vizType": viz_type,
                "group": legend["group"],
                "properties": {},
            }
        key = f"{src_id}|{edge.label}|{tgt_id}"
        rev = f"{tgt_id}|{edge.label}|{src_id}"
        if key in link_keys or rev in link_keys:
            continue
        link_keys.add(key)
        links.append({"source": src_id, "target": tgt_id, "label": edge.label or "关联"})

    return build_payload(list(nodes_map.values()), links, truncated=False)


def _parse_viz_node_id(viz_id: str, spg_type: str, namespace: str) -> str:
    """Extract biz id from frontend viz node id."""
    for suffix in (
        f"_{namespace}.{spg_type}",
        f"_{spg_type}",
    ):
        if viz_id.endswith(suffix):
            biz_id = viz_id[: -len(suffix)]
            if biz_id:
                return biz_id
    try:
        biz_id, _ = parse_center_id(viz_id)
        return biz_id
    except ValueError:
        return viz_id


def _format_spg_label(spg_type: str, namespace: str) -> str:
    if "." in spg_type:
        return spg_type
    if spg_type.split(".")[0] == namespace:
        return spg_type
    return f"{namespace}.{spg_type}"


def viz_to_subgraph(
    nodes: List[Dict[str, Any]],
    links: List[Dict[str, Any]],
    namespace: str = "KGtestV2",
):
    """Convert approved frontend viz nodes/links back to builder SubGraph."""
    from kag.interface.common.model.sub_graph import SubGraph, Node, Edge

    node_by_viz_id: Dict[str, Node] = {}
    for item in nodes:
        spg_type = item.get("spgType") or "Thing"
        biz_id = _parse_viz_node_id(item["id"], spg_type, namespace)
        label = _format_spg_label(spg_type, namespace)
        props = item.get("properties") or {}
        display = item.get("label") or biz_id
        props = {**props, "name": display}
        node = Node(_id=biz_id, name=display, label=label, properties=props)
        node_by_viz_id[item["id"]] = node

    sub_nodes = list({n.hash_key: n for n in node_by_viz_id.values()}.values())
    sub_edges: List[Edge] = []
    for link in links:
        src = node_by_viz_id.get(link["source"])
        tgt = node_by_viz_id.get(link["target"])
        if not src or not tgt:
            continue
        sub_edges.append(
            Edge(
                _id="",
                from_node=src,
                to_node=tgt,
                label=link.get("label") or "关联",
                properties=link.get("properties") or {},
            )
        )
    return SubGraph(nodes=sub_nodes, edges=sub_edges)
