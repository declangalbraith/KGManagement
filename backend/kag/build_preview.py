"""HITL preview extract and commit for knowledge graph builder."""

from __future__ import annotations

import copy
import logging
import os
import tempfile
import uuid
from typing import Any, Dict, List, Optional, Tuple

from kag.builder.model.sub_graph import SubGraph
from .graph_viz import get_graph_api, subgraph_to_viz, viz_to_subgraph
from .runtime import prepare_project_runtime

logger = logging.getLogger(__name__)

ALLOWED_UPLOAD_EXT = {".txt", ".md", ".docx"}


def _save_text_source(work_dir: str, content: str, title: Optional[str] = None) -> str:
    filename = f"preview_{uuid.uuid4().hex[:12]}.txt"
    path = os.path.join(work_dir, filename)
    with open(path, "w", encoding="utf-8") as fh:
        if title:
            fh.write(f"# {title}\n\n")
        fh.write(content)
    return path


def _save_uploaded_file(work_dir: str, uploaded_file) -> str:
    ext = os.path.splitext(uploaded_file.name or "")[1].lower()
    if ext not in ALLOWED_UPLOAD_EXT:
        raise ValueError(f"不支持的文件类型: {ext or '(无扩展名)'}，允许: {', '.join(sorted(ALLOWED_UPLOAD_EXT))}")
    filename = f"upload_{uuid.uuid4().hex[:12]}{ext}"
    path = os.path.join(work_dir, filename)
    with open(path, "wb") as fh:
        for chunk in uploaded_file.chunks():
            fh.write(chunk)
    return path


def _read_plain_text(source_path: str) -> str:
    """Read upload as plain text — same input shape txt_reader would see."""
    ext = os.path.splitext(source_path)[1].lower()
    if ext in (".txt", ".md"):
        with open(source_path, "r", encoding="utf-8") as fh:
            return fh.read()
    if ext == ".docx":
        from docx import Document

        doc = Document(source_path)
        parts = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
        if not parts:
            raise ValueError("docx 文件未提取到文本内容")
        return "\n\n".join(parts)
    raise ValueError(f"不支持的文件类型: {ext}")


def _normalize_source_to_txt(source_path: str) -> str:
    """Align with kag_config txt_reader: whole document → length_splitter, no md/docx pre-chunking."""
    ext = os.path.splitext(source_path)[1].lower()
    if ext == ".txt":
        return source_path
    txt_path = os.path.join(
        os.path.dirname(source_path),
        f"normalized_{uuid.uuid4().hex[:12]}.txt",
    )
    with open(txt_path, "w", encoding="utf-8") as fh:
        fh.write(_read_plain_text(source_path))
    return txt_path


def _build_preview_chain():
    from kag.common.conf import KAG_CONFIG
    from kag.interface import KAGBuilderChain

    pipeline_config = KAG_CONFIG.all_config.get("kag_builder_pipeline", {})
    if not pipeline_config:
        raise RuntimeError("KAG builder pipeline is not configured")

    chain_config = copy.deepcopy(pipeline_config.get("chain") or {})
    # 预览不写库、不向量化；其余 reader/splitter/extractor/post_processor 与 kag_config.yaml 一致
    chain_config.pop("writer", None)
    chain_config.pop("vectorizer", None)
    return KAGBuilderChain.from_config(chain_config), pipeline_config


def _collect_subgraphs(items: Any) -> SubGraph:
    """Unwrap BuilderComponentData / nested lists and merge SubGraph outputs."""
    from kag.interface.builder.base import BuilderComponentData

    merged = SubGraph([], [])
    if items is None:
        return merged
    if isinstance(items, SubGraph):
        merged.merge(items)
        return merged
    if isinstance(items, BuilderComponentData):
        return _collect_subgraphs(items.data)
    if isinstance(items, (list, tuple)):
        for item in items:
            part = _collect_subgraphs(item)
            if part.nodes or part.edges:
                merged.merge(part)
        return merged
    return merged


def _merge_subgraphs(items: List[Any]) -> SubGraph:
    return _collect_subgraphs(items)


def run_extract_preview(
    project_name: str,
    *,
    content: Optional[str] = None,
    uploaded_file=None,
    title: Optional[str] = None,
) -> Tuple[Dict[str, Any], SubGraph]:
    if not content and not uploaded_file:
        raise ValueError("需要 content 或 file")

    runtime = prepare_project_runtime(project_name, include_builder=True)

    # txt_reader 需要文件路径；用系统临时目录，抽取结束后自动删除，不污染 kag_projects
    with tempfile.TemporaryDirectory(prefix="kag_preview_") as work_dir:
        if uploaded_file is not None:
            source_path = _save_uploaded_file(work_dir, uploaded_file)
        else:
            source_path = _save_text_source(work_dir, content or "", title=title)

        # .md/.docx 先归一化为 .txt，走 txt_reader + length_splitter(8000)，与正式 build 一致
        source_path = _normalize_source_to_txt(source_path)
        plain_text = _read_plain_text(source_path)

        chain, pipeline_config = _build_preview_chain()
        max_workers = pipeline_config.get("num_threads_per_chain") or 1
        results = chain.invoke(
            source_path, max_workers=max_workers, write_ckpt=False
        )
        sub_graph = _merge_subgraphs(results)
        logger.info(
            "Extract preview: source=%s chunks_result=%d nodes=%d edges=%d",
            source_path,
            len(results) if results else 0,
            len(sub_graph.nodes),
            len(sub_graph.edges),
        )
        if not sub_graph.nodes and not sub_graph.edges:
            if len(plain_text) < 10:
                raise ValueError("源文档内容过短，无法抽取")
            raise ValueError(
                "抽取未得到实体/关系，请检查 LLM 配置或文档内容是否与 KGtestV2 schema 匹配"
            )

        from kag.common.conf import KAG_CONFIG

        namespace = (KAG_CONFIG.all_config.get("project", {}) or {}).get("namespace", project_name)
        graph_api = get_graph_api(project_name)
        schema = graph_api.schema
        viz_payload = subgraph_to_viz(sub_graph, schema=schema, namespace=namespace)
        viz_payload["source"] = "extract"
        return viz_payload, sub_graph


def commit_subgraph(
    project_name: str,
    nodes: List[Dict[str, Any]],
    links: List[Dict[str, Any]],
) -> Dict[str, Any]:
    if not nodes:
        raise ValueError("没有可入库的节点")

    runtime = prepare_project_runtime(project_name, include_builder=True)
    from kag.common.conf import KAG_CONFIG

    namespace = (KAG_CONFIG.all_config.get("project", {}) or {}).get("namespace", project_name)
    sub_graph = viz_to_subgraph(nodes, links, namespace=namespace)

    from kag.builder.component.writer.kg_writer import KGWriter

    writer = KGWriter()
    writer.invoke(sub_graph, write_ckpt=False)

    pipeline_config = KAG_CONFIG.all_config.get("kag_builder_pipeline", {})
    vectorizer_config = (pipeline_config.get("chain") or {}).get("vectorizer")
    if vectorizer_config:
        from kag.interface import VectorizerABC

        vectorizer = VectorizerABC.from_config(vectorizer_config)
        vectorizer.invoke(sub_graph, write_ckpt=False)

    return {
        "nodes": len(sub_graph.nodes),
        "edges": len(sub_graph.edges),
        "source_path": runtime["project_dir"],
    }
