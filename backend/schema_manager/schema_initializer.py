"""Initialize schema from an OpenSPG .schema file when DB is empty."""

import math
import os

from django.conf import settings


def _layout_position(index: int, total: int) -> dict:
    cols = max(1, math.ceil(math.sqrt(total)))
    col = index % cols
    row = index // cols
    return {"x": 80 + col * 260, "y": 80 + row * 160}


def parsed_to_workbench_snapshot(parsed: dict) -> dict:
    """Convert parsed OpenSPG schema to SchemaWorkbenchSnapshot format."""
    namespace = parsed["namespace"]
    entities = parsed["entities"]
    community_id = f"com-{namespace}"

    communities = [
        {
            "id": community_id,
            "name": namespace,
            "nameEn": namespace,
            "domain": "Schema Namespace",
            "members": len(entities),
            "desc": f"从 .schema 导入的 Namespace「{namespace}」",
            "owner": "Schema 导入",
        }
    ]

    entity_id_set = {e.nameEn for e in entities}
    workbench_entities = []
    for i, entity in enumerate(entities):
        pos = _layout_position(i, len(entities))
        prop_count = len(entity.properties)
        if prop_count >= 6:
            risk = "High"
        elif prop_count >= 3:
            risk = "Medium"
        else:
            risk = "Low"

        workbench_entities.append(
            {
                "id": entity.nameEn,
                "name": entity.nameZh or entity.nameEn,
                "nameEn": entity.nameEn,
                "domain": entity.desc or namespace,
                "communities": [community_id],
                "x": pos["x"],
                "y": pos["y"],
                "properties": [
                    {
                        "name": f"{p.nameZh} ({p.nameEn})" if p.nameZh else p.nameEn,
                        "type": p.type,
                        "required": any(
                            c == "NotNull" or "NotNull" in c for c in p.constraints
                        ),
                    }
                    for p in entity.properties
                ],
                "impact": {"instances": 0, "models": 0, "risk": risk},
            }
        )

    workbench_relations = []
    rel_index = 0
    for entity in entities:
        for rel in entity.relations:
            if rel.targetType not in entity_id_set:
                continue
            workbench_relations.append(
                {
                    "id": f"rel-{entity.nameEn}-{rel.nameEn}-{rel_index}",
                    "name": rel.nameZh or rel.nameEn,
                    "nameEn": rel.nameEn,
                    "sourceId": entity.nameEn,
                    "targetId": rel.targetType,
                    "semantics": {
                        "desc": f"{entity.nameEn}.{rel.nameEn} → {rel.targetType}",
                        "multiValue": True,
                        "required": False,
                        "inverse": False,
                    },
                    "usage": {"communities": [community_id], "instanceCount": 0},
                    "impact": {"instances": 0, "models": 0, "risk": "Low"},
                }
            )
            rel_index += 1

    return {
        "communities": communities,
        "entities": workbench_entities,
        "relations": workbench_relations,
    }


def load_initial_snapshot() -> dict | None:
    """Return a workbench snapshot from the initial schema file, or None if unavailable."""
    init_file = getattr(settings, "SCHEMA_INIT_FILE", None)
    if not init_file or not os.path.exists(init_file):
        return None

    with open(init_file, encoding="utf-8") as f:
        text = f.read()

    from schema_manager.parseOpenSpgSchema import parseOpenSpgSchema

    parsed = parseOpenSpgSchema(text)
    return parsed_to_workbench_snapshot(parsed)
