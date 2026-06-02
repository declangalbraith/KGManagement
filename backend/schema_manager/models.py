from django.conf import settings
from django.db import models

from dvadmin.utils.models import CoreModel

table_prefix = settings.TABLE_PREFIX


class SchemaVersion(CoreModel):
    """Schema 版本 — 同时承载当前草稿和历史版本。
    snapshot JSONField 存储完整的 SchemaWorkbenchSnapshot:
        { communities: [...], entities: [...], relations: [...] }
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "草稿"
        PUBLISHED = "published", "已发布"

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

    def __str__(self):
        return f"{self.version} ({self.get_status_display()})"
