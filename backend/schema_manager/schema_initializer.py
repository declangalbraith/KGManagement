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


def _resolve_schema_file(project=None) -> str | None:
    """Resolve init schema file path for a project."""
    if project is not None:
        if project.init_schema_path and os.path.exists(project.init_schema_path):
            return project.init_schema_path
        project_root = getattr(settings, "KAG_PROJECT_ROOT", None)
        if project_root:
            candidate = os.path.join(
                project_root, project.name, "schema", f"{project.name}.schema"
            )
            if os.path.exists(candidate):
                return candidate

    init_file = getattr(settings, "SCHEMA_INIT_FILE", None)
    if init_file and os.path.exists(init_file):
        return init_file
    return None


def load_initial_snapshot(project=None) -> dict | None:
    """Return a workbench snapshot from the init schema file, or None if unavailable."""
    schema_file = _resolve_schema_file(project)
    if not schema_file:
        return None

    with open(schema_file, encoding="utf-8") as f:
        text = f.read()

    from schema_manager.parseOpenSpgSchema import parseOpenSpgSchema

    parsed = parseOpenSpgSchema(text)
    return parsed_to_workbench_snapshot(parsed)


def migrate_orphan_schema_versions(project):
    """Attach legacy global versions (project_id=0 or NULL) to the given project."""
    from django.db.models import Q

    from .models import SchemaVersion

    if not project or not project.id:
        return

    orphans = SchemaVersion.objects.filter(Q(project_id=0) | Q(project_id__isnull=True))
    # Avoid violating unique_current_schema_per_project when multiple is_current exist.
    current_orphans = list(orphans.filter(is_current=True).order_by("-update_datetime", "-id"))
    if len(current_orphans) > 1:
        for extra in current_orphans[1:]:
            extra.is_current = False
            extra.save(update_fields=["is_current"])

    orphans.update(project_id=project.id)


def ensure_default_schema_project(request):
    """Create default KGtestV2 project when table is empty."""
    from .models import SchemaProject

    existing = SchemaProject.objects.filter(name="KGtestV2").first()
    if existing:
        project = existing
    elif SchemaProject.objects.exists():
        project = SchemaProject.objects.order_by("id").first()
    else:
        project = SchemaProject(
            name="KGtestV2",
            display_name="KGtestV2",
            description="默认 Schema 项目",
        )
        project = project.insert(request)

    migrate_orphan_schema_versions(project)
    return project
