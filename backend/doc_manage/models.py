from django.conf import settings
from django.db import models

from dvadmin.utils.models import CoreModel

table_prefix = settings.TABLE_PREFIX


class BomDocument(CoreModel):
    """BOM 文档元数据（文件存 MinIO）。"""

    is_soft_delete = True

    class GraphStatus(models.TextChoices):
        PENDING = "pending", "待提取"
        EXTRACTED = "extracted", "已提取"

    number = models.CharField(max_length=64, verbose_name="Number", db_index=True)
    state = models.CharField(max_length=32, blank=True, default="", verbose_name="State")
    type_designation = models.CharField(
        max_length=256, blank=True, default="", verbose_name="Type Designation"
    )
    description_en = models.CharField(
        max_length=512, blank=True, default="", verbose_name="Description1 (EN)"
    )
    uploader = models.CharField(max_length=64, blank=True, default="", verbose_name="上传人")
    graph_status = models.CharField(
        max_length=16,
        choices=GraphStatus.choices,
        default=GraphStatus.PENDING,
        verbose_name="图谱状态",
    )
    minio_path = models.CharField(max_length=512, verbose_name="MinIO 对象路径")
    original_filename = models.CharField(max_length=256, verbose_name="原始文件名")
    file_type = models.CharField(max_length=16, verbose_name="文件类型")
    file_size = models.BigIntegerField(default=0, verbose_name="文件大小(bytes)")
    is_deleted = models.BooleanField(default=False, db_index=True, verbose_name="是否软删除")

    class Meta:
        db_table = table_prefix + "doc_bom_document"
        verbose_name = "BOM 文档"
        verbose_name_plural = verbose_name
        ordering = ["-create_datetime"]

    def __str__(self):
        return f"{self.number} ({self.original_filename})"
