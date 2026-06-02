"""Parser for OpenSPG .schema DSL — ported from the frontend parseOpenSpgSchema.ts."""

import re
from dataclasses import dataclass, field


@dataclass
class ParsedSchemaProperty:
    nameEn: str
    nameZh: str
    type: str
    index: str | None = None
    constraints: list[str] = field(default_factory=list)


@dataclass
class ParsedSchemaRelation:
    nameEn: str
    nameZh: str
    targetType: str


@dataclass
class ParsedSchemaEntity:
    nameEn: str
    nameZh: str
    desc: str | None = None
    properties: list[ParsedSchemaProperty] = field(default_factory=list)
    relations: list[ParsedSchemaRelation] = field(default_factory=list)


ENTITY_HEADER_RE = re.compile(r"^([A-Za-z_]\w*)\(([^)]*)\):\s*EntityType\s*$")
NAMED_FIELD_RE = re.compile(r"^(\w+)\(([^)]*)\):\s*(\S+)\s*$")
NAMESPACE_RE = re.compile(r"^namespace\s+([A-Za-z_]\w*)\s*$")


def _strip_comments(line: str) -> str:
    idx = line.find("#")
    return line[:idx] if idx >= 0 else line


def _leading_indent(line: str) -> int:
    return len(line) - len(line.lstrip())


def parseOpenSpgSchema(raw: str) -> dict:
    text = raw.lstrip("﻿").replace("\r\n", "\n")
    lines = text.split("\n")

    namespace = None
    entities: list[ParsedSchemaEntity] = []
    current: ParsedSchemaEntity | None = None
    section: str = "none"  # "none" | "properties" | "relations"
    last_property: ParsedSchemaProperty | None = None
    entity_section_indent = 0

    for i, raw_line in enumerate(lines):
        line = _strip_comments(raw_line).rstrip()
        trimmed = line.strip()
        if not trimmed:
            continue

        indent = _leading_indent(line)

        ns_match = NAMESPACE_RE.match(trimmed)
        if ns_match:
            if entities or current:
                raise SyntaxError(
                    f"Line {i + 1}: 'namespace' must appear before entity definitions."
                )
            namespace = ns_match.group(1)
            continue

        entity_match = ENTITY_HEADER_RE.match(trimmed)
        if entity_match and indent == 0:
            current = ParsedSchemaEntity(
                nameEn=entity_match.group(1),
                nameZh=entity_match.group(2).strip(),
            )
            entities.append(current)
            section = "none"
            last_property = None
            entity_section_indent = 0
            continue

        if current is None:
            if namespace is None:
                raise SyntaxError(
                    f"Line {i + 1}: Missing 'namespace' definition at the beginning of the file."
                )
            raise SyntaxError(f"Line {i + 1}: Unexpected content before first EntityType.")

        if trimmed.startswith("desc:"):
            current.desc = trimmed.removeprefix("desc:").strip()
            continue

        if trimmed == "properties:":
            section = "properties"
            entity_section_indent = indent
            last_property = None
            continue

        if trimmed == "relations:":
            section = "relations"
            entity_section_indent = indent
            last_property = None
            continue

        if trimmed.startswith("index:") and last_property and section == "properties":
            last_property.index = trimmed.removeprefix("index:").strip()
            continue

        if trimmed.startswith("constraint:") and last_property and section == "properties":
            last_property.constraints = [
                c.strip() for c in trimmed.removeprefix("constraint:").split(",") if c.strip()
            ]
            continue

        field_match = NAMED_FIELD_RE.match(trimmed)
        if field_match and indent > entity_section_indent:
            name_en, name_zh, type_ = field_match.groups()
            if section == "properties":
                prop = ParsedSchemaProperty(
                    nameEn=name_en,
                    nameZh=name_zh.strip(),
                    type=type_,
                )
                current.properties.append(prop)
                last_property = prop
            elif section == "relations":
                current.relations.append(
                    ParsedSchemaRelation(
                        nameEn=name_en,
                        nameZh=name_zh.strip(),
                        targetType=type_,
                    )
                )
                last_property = None
            continue

    if namespace is None:
        raise SyntaxError("Missing 'namespace' definition at the beginning of the file.")
    if not entities:
        raise SyntaxError("No EntityType definitions found in schema file.")

    return {
        "namespace": namespace,
        "entities": entities,
    }


def getParsedSchemaStats(parsed: dict) -> dict:
    entities = parsed["entities"]
    properties = 0
    constraint = 0
    index_count = 0
    relations = 0

    for entity in entities:
        properties += len(entity.properties)
        relations += len(entity.relations)
        for prop in entity.properties:
            if prop.constraints:
                constraint += 1
            if prop.index:
                index_count += 1

    return {
        "namespace": parsed["namespace"],
        "entities": len(entities),
        "relations": relations,
        "properties": properties,
        "constraint": constraint,
        "indexCount": index_count,
    }
