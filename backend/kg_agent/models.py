from django.db import models

from dvadmin.utils.models import CoreModel, table_prefix


class KgBuildJob(CoreModel):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "已上传"
        QUEUED = "queued", "排队中"
        RUNNING = "running", "运行中"
        SUCCESS = "success", "成功"
        PARTIAL_SUCCESS = "partial_success", "部分成功"
        FAILED = "failed", "失败"

    doc_id = models.CharField(max_length=64, blank=True, default="", db_index=True, verbose_name="8D 文档 ID")
    run_id = models.CharField(max_length=64, blank=True, default="", verbose_name="Pipeline Run ID")
    trace_id = models.CharField(max_length=64, blank=True, default="", verbose_name="Trace ID")

    source_system = models.CharField(max_length=64, default="django-main", verbose_name="来源系统")
    source_module = models.CharField(max_length=64, default="knowledge", verbose_name="来源模块")
    source_record_id = models.CharField(max_length=128, db_index=True, verbose_name="来源业务键")
    source_record_type = models.CharField(max_length=64, default="knowledge_upload", verbose_name="来源类型")
    org_id = models.CharField(max_length=64, blank=True, default="", verbose_name="组织 ID")
    operator_id = models.CharField(max_length=64, blank=True, default="", verbose_name="操作人 ID")
    idempotency_key = models.CharField(max_length=256, blank=True, default="", db_index=True, verbose_name="幂等键")

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.UPLOADED,
        db_index=True,
        verbose_name="任务状态",
    )
    current_stage = models.CharField(max_length=64, blank=True, default="", verbose_name="当前阶段")
    error_message = models.TextField(blank=True, default="", verbose_name="错误信息")
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name="完成时间")

    file_name = models.CharField(max_length=512, blank=True, default="", verbose_name="文件名")
    stats = models.JSONField(default=dict, blank=True, verbose_name="统计信息")

    class Meta:
        db_table = table_prefix + "kg_build_job"
        verbose_name = "8D 知识构建任务"
        verbose_name_plural = verbose_name
        ordering = ["-create_datetime"]

    def __str__(self):
        return f"{self.source_record_id} ({self.status})"
