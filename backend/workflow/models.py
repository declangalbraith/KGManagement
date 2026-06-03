from django.conf import settings
from django.db import models

from dvadmin.utils.models import CoreModel

table_prefix = settings.TABLE_PREFIX


class WorkflowDefinition(CoreModel):
    """审批流定义（模板）。"""

    code = models.CharField(max_length=64, unique=True, verbose_name="编码")
    name = models.CharField(max_length=128, verbose_name="名称")
    doc_type = models.ForeignKey(
        "doc_manage.DocumentType",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="workflow_definitions",
        verbose_name="绑定文档类型",
    )
    is_active = models.BooleanField(default=True, db_index=True, verbose_name="是否启用")
    definition_json = models.JSONField(null=True, blank=True, verbose_name="流程定义(JSON)")

    class Meta:
        db_table = table_prefix + "workflow_definition"
        verbose_name = "审批流定义"
        verbose_name_plural = verbose_name
        ordering = ["-update_datetime"]

    def __str__(self):
        return self.name


class WorkflowInstance(CoreModel):
    """审批流运行实例。"""

    class Status(models.TextChoices):
        RUNNING = "running", "进行中"
        APPROVED = "approved", "已通过"
        REJECTED = "rejected", "已打回"
        CANCELLED = "cancelled", "已取消"

    definition = models.ForeignKey(
        WorkflowDefinition,
        on_delete=models.PROTECT,
        related_name="instances",
        verbose_name="流程定义",
    )
    definition_snapshot = models.JSONField(verbose_name="定义快照")
    biz_type = models.CharField(max_length=32, db_index=True, verbose_name="业务类型")
    biz_id = models.BigIntegerField(db_index=True, verbose_name="业务ID")
    document_version = models.ForeignKey(
        "doc_manage.GeneralDocumentVersion",
        on_delete=models.PROTECT,
        related_name="workflow_instances",
        verbose_name="文档版本",
    )
    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="initiated_workflows",
        verbose_name="发起人",
        db_constraint=False,
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.RUNNING,
        db_index=True,
        verbose_name="状态",
    )
    current_step_order = models.PositiveIntegerField(default=1, verbose_name="当前步骤")
    started_at = models.DateTimeField(auto_now_add=True, verbose_name="开始时间")
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name="结束时间")

    class Meta:
        db_table = table_prefix + "workflow_instance"
        verbose_name = "审批流实例"
        verbose_name_plural = verbose_name
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.biz_type}:{self.biz_id} ({self.status})"


class WorkflowTask(CoreModel):
    """待办/已办审批任务。"""

    class Status(models.TextChoices):
        PENDING = "pending", "待处理"
        APPROVED = "approved", "已通过"
        REJECTED = "rejected", "已打回"

    instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        related_name="tasks",
        verbose_name="流程实例",
    )
    step_order = models.PositiveIntegerField(verbose_name="步骤序号")
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="workflow_tasks",
        verbose_name="审批人",
        db_constraint=False,
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        verbose_name="状态",
    )
    comment = models.TextField(blank=True, default="", verbose_name="意见")
    acted_at = models.DateTimeField(null=True, blank=True, verbose_name="处理时间")

    class Meta:
        db_table = table_prefix + "workflow_task"
        verbose_name = "审批任务"
        verbose_name_plural = verbose_name
        ordering = ["step_order", "id"]

    def __str__(self):
        return f"Task #{self.id} ({self.status})"


class WorkflowAuditLog(models.Model):
    """审批与版本审计日志。"""

    biz_type = models.CharField(max_length=32, db_index=True, verbose_name="业务类型")
    biz_id = models.BigIntegerField(db_index=True, verbose_name="业务ID")
    instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        verbose_name="流程实例",
    )
    document_version = models.ForeignKey(
        "doc_manage.GeneralDocumentVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        verbose_name="文档版本",
    )
    action = models.CharField(max_length=32, db_index=True, verbose_name="动作")
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workflow_audit_logs",
        verbose_name="操作人",
        db_constraint=False,
    )
    operator_name = models.CharField(max_length=64, blank=True, default="", verbose_name="操作人姓名")
    message = models.CharField(max_length=256, blank=True, default="", verbose_name="摘要")
    detail = models.TextField(blank=True, default="", verbose_name="详情")
    create_datetime = models.DateTimeField(auto_now_add=True, verbose_name="时间")

    class Meta:
        db_table = table_prefix + "workflow_audit_log"
        verbose_name = "审批审计日志"
        verbose_name_plural = verbose_name
        ordering = ["-create_datetime"]

    def __str__(self):
        return f"{self.action} @ {self.create_datetime}"
