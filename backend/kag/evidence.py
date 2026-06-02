"""Utilities for collecting retrieval evidence from KAG QA execution."""

import asyncio
import io
import re
import sys

captured_results = []


class TeeStdout:
    def __init__(self, original):
        self.original = original
        self.buffer = io.StringIO()

    def write(self, s):
        self.original.write(s)
        self.buffer.write(s)

    def flush(self):
        self.original.flush()

    def getvalue(self):
        return self.buffer.getvalue()


def install_executor_hooks(pipeline):
    """Patch KAGHybridRetrievalExecutor.ainvoke to capture RetrieverOutput."""
    captured_results.clear()
    originals = []

    for executor in getattr(pipeline, "executors", []) or []:
        if type(executor).__name__ != "KAGHybridRetrievalExecutor":
            continue

        if getattr(executor, "_evidence_hook_installed", False):
            originals.append((executor, executor._evidence_orig_ainvoke))
            continue

        orig = executor.ainvoke

        def make_wrapper(orig_func):
            async def wrapper(query, task, context, **kwargs):
                result = await orig_func(query, task, context, **kwargs)
                sub_q = ""
                if hasattr(task, "arguments"):
                    args = task.arguments or {}
                    sub_q = args.get("query") or args.get("sub_query") or ""
                captured_results.append({"sub_q": sub_q.strip(), "result": result})
                return result

            return wrapper

        executor.ainvoke = make_wrapper(orig)
        executor._evidence_hook_installed = True
        executor._evidence_orig_ainvoke = orig
        originals.append((executor, orig))

    return originals


def restore_executor_hooks(originals):
    for executor, orig in originals or []:
        executor.ainvoke = orig
        if hasattr(executor, "_evidence_hook_installed"):
            delattr(executor, "_evidence_hook_installed")
        if hasattr(executor, "_evidence_orig_ainvoke"):
            delattr(executor, "_evidence_orig_ainvoke")


def _short(text, n=260):
    if text is None:
        return ""
    s = str(text).replace("\n", " ").strip()
    return s if len(s) <= n else s[:n] + "..."


def _coerce_scalar(value):
    """Convert KAG model objects (Identifier, TypeInfo, etc.) to JSON-safe scalars."""
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    std = getattr(value, "std_entity_type", None)
    if std is not None:
        return str(std)
    un_std = getattr(value, "un_std_entity_type", None)
    if un_std is not None:
        return str(un_std)
    alias = getattr(value, "alias_name", None)
    if alias is not None:
        return str(alias)
    return str(value)


def sanitize_for_json(obj):
    """Recursively convert evidence/task payloads to JSON-serializable structures."""
    if obj is None or isinstance(obj, (bool, int, float, str)):
        return obj
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    return _coerce_scalar(obj)


def _extract_graph_entities(kg_graph):
    out = []
    emap = getattr(kg_graph, "entity_map", None) or {}
    for alias, ent_list in emap.items():
        if not isinstance(ent_list, list):
            ent_list = [ent_list]
        for ent in ent_list:
            name = getattr(ent, "name", None) or getattr(ent, "biz_id", None) or str(ent)
            etype = _coerce_scalar(getattr(ent, "type", None) or "?")
            biz_id = getattr(ent, "biz_id", "") or ""
            out.append(
                {
                    "alias": _coerce_scalar(alias),
                    "name": _coerce_scalar(name),
                    "type": etype,
                    "biz_id": str(biz_id),
                }
            )
    return out


def _extract_graph_edges(kg_graph):
    out = []
    emap = getattr(kg_graph, "edge_map", None) or {}
    for alias, edge_list in emap.items():
        if not isinstance(edge_list, list):
            edge_list = [edge_list]
        for edge in edge_list:
            s = getattr(edge, "from_id", None) or getattr(edge, "from_entity", None) or ""
            o = getattr(edge, "end_id", None) or getattr(edge, "to_entity", None) or ""
            p = getattr(edge, "name", None) or getattr(edge, "type", None) or "?"
            if hasattr(s, "name"):
                s = s.name
            if hasattr(o, "name"):
                o = o.name
            out.append({"s": str(s), "p": str(p), "o": str(o)})
    return out


def extract_evidence_from_retriever(retr_out):
    """Extract structured evidence from RetrieverOutput."""
    graphs = getattr(retr_out, "graphs", []) or []
    all_ents, all_edges = [], []
    for graph in graphs:
        all_ents.extend(_extract_graph_entities(graph))
        all_edges.extend(_extract_graph_edges(graph))

    chunks = getattr(retr_out, "chunks", []) or []
    chunk_list = []
    for chunk in chunks:
        chunk_list.append(
            {
                "title": getattr(chunk, "title", "") or "",
                "chunk_id": getattr(chunk, "chunk_id", "") or "",
                "score": getattr(chunk, "score", 0),
                "content": _short(getattr(chunk, "content", "") or "", 240),
            }
        )

    summary = getattr(retr_out, "summary", "") or ""
    conclusion = ""
    if summary.strip():
        match = re.search(r"结论[:：]\s*(.+?)$", summary.strip(), re.S)
        conclusion = _short(match.group(1).strip() if match else summary.strip(), 280)

    return {
        "entities": all_ents,
        "edges": all_edges,
        "chunks": chunk_list,
        "conclusion": conclusion,
    }


def parse_raw_evidence(retr_out):
    """Format RetrieverOutput as CLI text."""
    ev = extract_evidence_from_retriever(retr_out)
    lines = []
    lines.append(f"      图谱召回: {len(ev['entities'])} 个实体, {len(ev['edges'])} 条关系")
    if ev["entities"]:
        by_type = {}
        for ent in ev["entities"]:
            by_type.setdefault(ent["type"], []).append(ent)
        for etype, ents in by_type.items():
            lines.append(f"         - [{etype}]")
            for ent in ents[:8]:
                tag = (
                    f"  (id={ent['biz_id']})"
                    if ent["biz_id"] and ent["biz_id"] != ent["name"]
                    else ""
                )
                lines.append(f"             - {ent['name']}{tag}")
            if len(ents) > 8:
                lines.append(f"             - ... 还有 {len(ents) - 8} 个")
    if ev["edges"]:
        lines.append("      命中关系:")
        for edge in ev["edges"][:10]:
            lines.append(f"         - {edge['s']} --[{edge['p']}]--> {edge['o']}")
        if len(ev["edges"]) > 10:
            lines.append(f"         - ... 还有 {len(ev['edges']) - 10} 条")
    lines.append(f"      文档片段: {len(ev['chunks'])} 段")
    for i, chunk in enumerate(ev["chunks"][:3], 1):
        lines.append(f"         [{i}] score={chunk['score']}  来源={chunk['title']}")
        lines.append(f"             chunk_id={chunk['chunk_id'][:32]}...")
        lines.append(f"             原文: {chunk['content']}")
    if len(ev["chunks"]) > 3:
        lines.append(f"         ... 还有 {len(ev['chunks']) - 3} 段已省略")
    if ev["conclusion"]:
        lines.append(f"      阶段总结: {ev['conclusion']}")
    return "\n".join(lines)


def _split_sub_tasks(tasks_repr):
    s = tasks_repr.strip().lstrip("[").rstrip("]")
    parts, depth, buf, i = [], 0, [], 0
    while i < len(s):
        ch = s[i]
        if ch in "[{(":
            depth += 1
        elif ch in "]})":
            depth -= 1
        if depth == 0 and ch == "}" and i + 3 < len(s) and s[i + 1 : i + 3] == ", " and s[i + 3] == "{":
            buf.append(ch)
            parts.append("".join(buf))
            buf = []
            i += 3
            continue
        buf.append(ch)
        i += 1
    if buf:
        parts.append("".join(buf))
    return parts


def _extract_evidence(raw):
    match_lf = re.search(r"logic_form_node':\s*(\w+)\(", raw)
    if not match_lf or match_lf.group(1) != "Retriever":
        return None
    match_q = re.search(r"'query':\s*'([^']*)'", raw)
    sub_q = match_q.group(1).strip() if match_q else ""
    match_src = re.search(
        r"(?:在|从)?(?:文档|报告)[的中]?\s*([^。\n]{4,40}?(?:节|章|部分|分析|描述|摘要))",
        raw,
    )
    source = match_src.group(1).strip() if match_src else ""
    return {"sub_q": sub_q, "source": source}


def _find_raw_for(sub_q):
    if not sub_q:
        return None
    for item in captured_results:
        if item["sub_q"].strip() == sub_q.strip():
            return item["result"]
    for item in captured_results:
        if sub_q.strip() in item["sub_q"] or item["sub_q"].strip() in sub_q:
            return item["result"]
    return None


def run_qa_with_evidence(question, pipeline):
    """Execute QA and return (answer, evidence_list)."""
    captured_results.clear()
    originals = install_executor_hooks(pipeline)

    tee = TeeStdout(sys.stdout)
    sys.stdout = tee
    try:
        final_answer = pipeline.ainvoke(question)
        if asyncio.iscoroutine(final_answer):
            final_answer = asyncio.run(final_answer)
    finally:
        sys.stdout = tee.original
        restore_executor_hooks(originals)
    captured_text = tee.getvalue()

    evidence_list = []
    match = re.search(r"Tasks:\s*\n+(\[.*?\])\n+Final Answer:", captured_text, re.S)
    if match:
        sub_tasks = _split_sub_tasks(match.group(1))
        for raw in sub_tasks:
            evidence = _extract_evidence(raw)
            if evidence is None:
                continue
            raw_obj = _find_raw_for(evidence["sub_q"])
            row = {"sub_query": evidence["sub_q"], "source": evidence["source"]}
            if raw_obj is not None:
                row["retrieval"] = extract_evidence_from_retriever(raw_obj)
            evidence_list.append(row)

    answer = str(final_answer).strip() if not isinstance(final_answer, str) else final_answer.strip()
    return answer, evidence_list


def print_evidence_report(question, answer, evidence_list):
    """Render a CLI evidence report."""
    lines = []
    lines.append("\n" + "=" * 80)
    lines.append(f"问题: {question}")
    lines.append("=" * 80)

    lines.append("\n" + "-" * 80)
    lines.append("一、检索证据")
    lines.append("-" * 80)

    if evidence_list:
        for i, ev in enumerate(evidence_list, 1):
            lines.append(f"\n【证据 {i}】")
            lines.append(f"  检索问题: {ev['sub_query']}")
            if ev.get("source"):
                lines.append(f"  来源定位: {ev['source']}")
            if ev.get("retrieval"):
                lines.append("  原始检索结果:")
                ret = ev["retrieval"]
                lines.append(
                    f"    实体: {len(ret['entities'])} 个, 关系: {len(ret['edges'])} 条, 片段: {len(ret['chunks'])} 段"
                )
                for ent in ret["entities"][:5]:
                    lines.append(f"      - [{ent['type']}] {ent['name']}")
                for edge in ret["edges"][:5]:
                    lines.append(f"      - {edge['s']} --[{edge['p']}]--> {edge['o']}")
                if ret["conclusion"]:
                    lines.append(f"    阶段总结: {ret['conclusion']}")
    else:
        lines.append("(未能解析检索过程)")

    lines.append("\n" + "-" * 80)
    lines.append("二、综合答案")
    lines.append("-" * 80)
    lines.append(answer)
    lines.append("")

    return "\n".join(lines)
