from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model

from workflow.models import WorkflowDefinition

User = get_user_model()

DEFAULT_DIRECTOR_MAX_LEVEL = 4


def default_definition_json() -> dict[str, Any]:
    return {
        "nodeConfig": {
            "nodeName": "发起人",
            "type": 0,
            "priorityLevel": "",
            "settype": "",
            "selectMode": "",
            "selectRange": "",
            "directorLevel": "",
            "examineMode": "",
            "noHanderAction": "",
            "examineEndDirectorLevel": "",
            "ccSelfSelectFlag": "",
            "conditionList": [],
            "nodeUserList": [],
            "childNode": None,
        },
        "flowPermission": [],
        "directorMaxLevel": DEFAULT_DIRECTOR_MAX_LEVEL,
    }


def normalize_definition_json(raw: dict[str, Any] | None) -> dict[str, Any]:
    if not raw or not isinstance(raw, dict):
        return default_definition_json()
    base = default_definition_json()
    node_config = raw.get("nodeConfig") if isinstance(raw.get("nodeConfig"), dict) else raw
    base["nodeConfig"] = {**base["nodeConfig"], **node_config}
    if isinstance(raw.get("flowPermission"), list):
        base["flowPermission"] = raw["flowPermission"]
    if raw.get("directorMaxLevel"):
        base["directorMaxLevel"] = raw["directorMaxLevel"]
    return base


def get_node_config(definition: WorkflowDefinition) -> dict[str, Any]:
    payload = normalize_definition_json(definition.definition_json)
    return payload["nodeConfig"]


def load_design_payload(definition: WorkflowDefinition) -> dict[str, Any]:
    payload = normalize_definition_json(definition.definition_json)
    return {
        "tableId": definition.id,
        "workFlowDef": {
            "id": definition.id,
            "name": definition.name,
            "code": definition.code,
        },
        "nodeConfig": payload["nodeConfig"],
        "flowPermission": payload.get("flowPermission") or [],
        "directorMaxLevel": payload.get("directorMaxLevel") or DEFAULT_DIRECTOR_MAX_LEVEL,
    }


def _resolve_user_name(user_id: int) -> str:
    user = User.objects.filter(id=user_id).first()
    if not user:
        return str(user_id)
    return getattr(user, "name", None) or user.username


def extract_linear_approvers(node_config: dict[str, Any] | None) -> list[dict[str, Any]]:
    """Phase 2a: main-chain approver nodes with settype=1 (指定成员) only."""
    steps: list[dict[str, Any]] = []
    node = node_config
    while node:
        node_type = node.get("type")
        if node_type == 4:
            node = node.get("childNode")
            continue
        if node_type == 1 and node.get("settype") == 1:
            users = node.get("nodeUserList") or []
            step_name = (node.get("nodeName") or "审核人").strip()
            for user in users:
                target_id = user.get("targetId")
                if not target_id:
                    continue
                steps.append(
                    {
                        "step_order": len(steps) + 1,
                        "step_name": step_name,
                        "assignee_id": int(target_id),
                        "assignee_name": user.get("name") or _resolve_user_name(int(target_id)),
                    }
                )
        node = node.get("childNode")
    return steps


def steps_summary(definition: WorkflowDefinition) -> list[dict[str, Any]]:
    try:
        return extract_linear_approvers(get_node_config(definition))
    except Exception:
        return []


def build_definition_snapshot(definition: WorkflowDefinition) -> dict[str, Any]:
    steps = extract_linear_approvers(get_node_config(definition))
    if not steps:
        raise ValueError("审批流未配置可运行的线性审批人（画布中需添加「指定成员」审批节点）")
    return {
        "definition_id": definition.id,
        "code": definition.code,
        "name": definition.name,
        "steps": steps,
    }


def validate_design_payload(payload: dict[str, Any]) -> list[str]:
    """Collect validation messages for unsupported runtime nodes."""
    warnings: list[str] = []
    node = payload.get("nodeConfig")

    def walk(n: dict[str, Any] | None) -> None:
        if not n:
            return
        if n.get("type") == 1 and n.get("settype") != 1:
            warnings.append(f"节点「{n.get('nodeName', '审核人')}」使用了暂未支持的审批人类型，运行时将被忽略")
        if n.get("type") == 2:
            warnings.append("抄送节点暂不参与运行时审批")
        if n.get("type") == 4:
            warnings.append("条件分支暂不支持运行时，仅保存设计")
        for cond in n.get("conditionNodes") or []:
            walk(cond.get("childNode"))
        walk(n.get("childNode"))

    walk(node)
    steps = extract_linear_approvers(payload.get("nodeConfig"))
    if not steps:
        warnings.insert(0, "请至少配置一个「指定成员」审批节点")
    return warnings


def collect_design_errors(node_config: dict[str, Any] | None) -> list[dict[str, str]]:
    """Mirror OSS reErr for required node configuration."""
    errors: list[dict[str, str]] = []

    def walk(node: dict[str, Any] | None) -> None:
        if not node:
            return
        node_type = node.get("type")
        if node_type in (1, 2):
            if node.get("error"):
                label = "审核人" if node_type == 1 else "抄送人"
                errors.append({"name": node.get("nodeName") or label, "type": label})
            walk(node.get("childNode"))
        elif node_type == 3:
            walk(node.get("childNode"))
        elif node_type == 4:
            walk(node.get("childNode"))
            for cond in node.get("conditionNodes") or []:
                if cond.get("error"):
                    errors.append({"name": cond.get("nodeName") or "条件", "type": "条件"})
                walk(cond)

    walk(node_config)
    return errors
