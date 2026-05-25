"""Export SchemaWorkbenchSnapshot back to OpenSPG .schema DSL text."""


def snapshot_to_schema_text(snapshot: dict, version: str) -> str:
    namespace = _extract_namespace(snapshot)
    lines = [f"namespace {namespace}", ""]

    for entity in snapshot.get("entities", []):
        name_en = entity.get("nameEn", entity.get("id", "Unknown"))
        name_zh = entity.get("name", name_en)
        lines.append(f"{name_en}({name_zh}): EntityType")
        if entity.get("domain"):
            lines.append(f"    desc: {entity['domain']}")

        props = entity.get("properties", [])
        if props:
            lines.append("    properties:")
            for p in props:
                p_name = p.get("name", "")
                p_type = p.get("type", "Text")
                safe_name = p_name.split("(")[0].strip() if "(" in p_name else p_name
                safe_name = safe_name.replace(" ", "_") or "prop"
                lines.append(f"        {safe_name}({p_name}): {p_type}")
                if p.get("required"):
                    lines.append("            constraint: NotNull")

        # Relations are stored top-level in the workbench, not per-entity in snapshot,
        # so we skip per-entity relation export here.
        lines.append("")

    return "\n".join(lines)


def _extract_namespace(snapshot: dict) -> str:
    communities = snapshot.get("communities", [])
    if communities:
        name = communities[0].get("name", "")
        # Remove non-alphanumeric chars for namespace
        import re
        ns = re.sub(r"[^A-Za-z0-9_]", "", name)
        if ns:
            return ns
    return "KGDefault"
