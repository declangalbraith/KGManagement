from django.conf import settings
from django.db import models
from django.db.models import Q

from dvadmin.utils.models import CoreModel

table_prefix = settings.TABLE_PREFIX


class SchemaProject(CoreModel):
    """Schema 设计项目 — 与 KAG 运行时解耦，按项目隔离 schema 版本。"""

    name = models.CharField(max_length=128, unique=True, verbose_name="项目标识")
    display_name = models.CharField(max_length=256, blank=True, verbose_name="显示名称")
    description = models.TextField(blank=True, verbose_name="描述")
    init_schema_path = models.CharField(
        max_length=512,
        blank=True,
        verbose_name="初始 Schema 文件路径",
        help_text="可选，首次加载当前版本时使用的 .schema 文件路径",
    )

    class Meta:
        db_table = table_prefix + "schema_project"
        verbose_name = "Schema 项目"
        verbose_name_plural = verbose_name
        ordering = ["-create_datetime"]

    def __str__(self):
        return self.display_name or self.name


class SchemaVersion(CoreModel):
    """Schema 版本 — 同时承载当前草稿和历史版本。
    snapshot JSONField 存储完整的 SchemaWorkbenchSnapshot:
        { communities: [...], entities: [...], relations: [...] }
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "草稿"
        PUBLISHED = "published", "已发布"

    project_id = models.BigIntegerField(
        db_index=True,
        default=0,
        verbose_name="Schema 项目 ID",
    )
    version = models.CharField(max_length=64, verbose_name="版本号")
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="状态",
    )
    is_current = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="是否当前版本",
    )
    snapshot = models.JSONField(default=dict, verbose_name="工作台快照")

    class Meta:
        db_table = table_prefix + "schema_version"
        verbose_name = "Schema 版本"
        verbose_name_plural = verbose_name
        ordering = ["-create_datetime"]
        constraints = [
            models.UniqueConstraint(
                fields=["project_id"],
                condition=Q(is_current=True),
                name="unique_current_schema_per_project",
            )
        ]

    def __str__(self):
        return f"{self.version} ({self.get_status_display()})"
