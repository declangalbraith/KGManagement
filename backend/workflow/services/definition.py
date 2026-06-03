from workflow.models import WorkflowDefinition, WorkflowStep


def build_definition_snapshot(definition: WorkflowDefinition) -> dict:
    steps = (
        definition.steps.select_related("assignee")
        .order_by("step_order")
        .all()
    )
    if not steps:
        raise ValueError("审批流未配置审批步骤")
    return {
        "definition_id": definition.id,
        "code": definition.code,
        "name": definition.name,
        "steps": [
            {
                "step_order": step.step_order,
                "step_name": step.step_name,
                "assignee_id": step.assignee_id,
                "assignee_name": getattr(step.assignee, "name", None)
                or step.assignee.username,
            }
            for step in steps
        ],
    }
