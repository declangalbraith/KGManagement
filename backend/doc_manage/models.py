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


class DocumentType(CoreModel):
    """文本文档类型（Control Plan、8D report、记录文档等）。"""

    code = models.CharField(max_length=64, unique=True, verbose_name="类型编码")
    name = models.CharField(max_length=128, unique=True, verbose_name="类型名称")
    sort_order = models.IntegerField(default=0, verbose_name="排序")
    is_active = models.BooleanField(default=True, db_index=True, verbose_name="是否启用")

    class Meta:
        db_table = table_prefix + "doc_document_type"
        verbose_name = "文档类型"
        verbose_name_plural = verbose_name
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name


class GeneralDocument(CoreModel):
    """文本文档（PDF/Word/Excel 等，文件存 MinIO）。"""

    is_soft_delete = True

    class ApprovalStatus(models.TextChoices):
        DRAFT = "draft", "草稿"
        PENDING = "pending", "待审批"
        APPROVED = "approved", "已审批"

    name = models.CharField(max_length=256, verbose_name="文件名称")
    doc_type = models.ForeignKey(
        DocumentType,
        on_delete=models.PROTECT,
        related_name="documents",
        verbose_name="文档类型",
    )
    version = models.CharField(max_length=32, default="V0.1", verbose_name="版本")
    approval_status = models.CharField(
        max_length=16,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.DRAFT,
        verbose_name="审批状态",
    )
    file_description = models.TextField(blank=True, default="", verbose_name="文件描述")
    approver = models.CharField(max_length=64, blank=True, default="", verbose_name="审批人")
    uploader = models.CharField(max_length=64, blank=True, default="", verbose_name="上传人")
    minio_path = models.CharField(max_length=512, verbose_name="MinIO 对象路径")
    original_filename = models.CharField(max_length=256, verbose_name="原始文件名")
    file_ext = models.CharField(max_length=16, verbose_name="文件扩展名")
    file_size = models.BigIntegerField(default=0, verbose_name="文件大小(bytes)")
    is_deleted = models.BooleanField(default=False, db_index=True, verbose_name="是否软删除")

    class Meta:
        db_table = table_prefix + "doc_general_document"
        verbose_name = "文本文档"
        verbose_name_plural = verbose_name
        ordering = ["-update_datetime"]

    def __str__(self):
        return f"{self.name} ({self.doc_type.name})"
