from django.db import models


class KAGProject(models.Model):
    name = models.CharField(max_length=128, unique=True, verbose_name="项目名称")
    display_name = models.CharField(max_length=256, blank=True, verbose_name="显示名称")
    description = models.TextField(blank=True, verbose_name="描述")
    namespace = models.CharField(max_length=128, blank=True, verbose_name="SPG 命名空间")
    schema_file = models.CharField(max_length=512, blank=True, verbose_name="Schema 文件路径")
    config_yaml = models.TextField(blank=True, verbose_name="kag_config.yaml 内容")
    neo4j_database = models.CharField(max_length=128, blank=True, default="kgtestv2", verbose_name="Neo4j 数据库名")
    is_active = models.BooleanField(default=True, verbose_name="是否启用")
    created_by = models.CharField(max_length=64, blank=True, default="", verbose_name="创建人")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "KAG 项目"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return self.display_name or self.name


class KAGTask(models.Model):
    class TaskType(models.TextChoices):
        BUILD = "build", "知识构建"
        INDEX = "index", "索引构建"
        SOLVE = "solve", "推理问答"
        VECTORIZE = "vectorize", "向量化"
        CLEANUP = "cleanup", "图谱清洗"
        PATCH_RELATIONS = "patch_relations", "补写关系"

    class Status(models.TextChoices):
        PENDING = "pending", "等待中"
        RUNNING = "running", "运行中"
        COMPLETED = "completed", "已完成"
        FAILED = "failed", "失败"

    project = models.ForeignKey(KAGProject, on_delete=models.CASCADE, related_name="tasks", verbose_name="所属项目")
    task_type = models.CharField(max_length=32, choices=TaskType.choices, verbose_name="任务类型")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="状态")
    params = models.JSONField(default=dict, blank=True, verbose_name="任务参数")
    result = models.JSONField(null=True, blank=True, verbose_name="执行结果")
    error_message = models.TextField(blank=True, verbose_name="错误信息")
    log_path = models.CharField(max_length=512, blank=True, verbose_name="日志路径")
    created_by = models.CharField(max_length=64, blank=True, default="", verbose_name="创建人")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "KAG 任务"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.get_task_type_display()}] {self.project.name} - {self.get_status_display()}"


class KAGDocument(models.Model):
    project = models.ForeignKey(KAGProject, on_delete=models.CASCADE, related_name="documents", verbose_name="所属项目")
    title = models.CharField(max_length=256, verbose_name="文档标题")
    file_path = models.CharField(max_length=1024, verbose_name="文件路径")
    file_type = models.CharField(max_length=32, default="md", verbose_name="文件类型")
    file_size = models.IntegerField(default=0, verbose_name="文件大小(bytes)")
    content_preview = models.TextField(blank=True, verbose_name="内容预览")
    uploaded_by = models.CharField(max_length=64, blank=True, default="", verbose_name="上传人")
    is_processed = models.BooleanField(default=False, verbose_name="是否已处理")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "KAG 文档"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
