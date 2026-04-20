from django.core.exceptions import ValidationError
from django.db import models

from dvadmin.utils.models import CoreModel, table_prefix


class DeviceInfo(CoreModel):
    nation = models.CharField(max_length=64, verbose_name="国家", help_text="国家")
    bureau = models.CharField(max_length=64, verbose_name="局", help_text="局")
    type = models.CharField(max_length=64, verbose_name="车型/类型", help_text="车型/类型")
    device_description = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="设备描述", help_text="设备描述"
    )
    functional_location = models.CharField(
        max_length=128,
        verbose_name="功能位置编码",
        help_text="Functional Location",
        unique=True,
    )
    train_number = models.CharField(
        max_length=64, null=True, blank=True, verbose_name="列车编号", help_text="列车编号", db_index=True
    )
    car_number = models.CharField(
        max_length=64, null=True, blank=True, verbose_name="车号", help_text="车号", db_index=True
    )
    system_type = models.CharField(max_length=64, null=True, blank=True, verbose_name="系统类型", help_text="系统类型")
    sub_system_type = models.CharField(
        max_length=64, null=True, blank=True, verbose_name="子系统类型", help_text="子系统类型"
    )
    project_number = models.CharField(max_length=64, null=True, blank=True, verbose_name="项目号", help_text="项目号")
    oe_project_number = models.CharField(
        max_length=64, null=True, blank=True, verbose_name="OE项目号", help_text="OE项目号"
    )
    cust_wrty_start = models.DateField(null=True, blank=True, verbose_name="客户保修开始", help_text="客户保修开始")
    cust_wrty_end = models.DateField(null=True, blank=True, verbose_name="客户保修结束", help_text="客户保修结束")
    warranty = models.BooleanField(
        null=True, blank=True, verbose_name="是否保修", help_text="True=是，False=否，NULL=未知"
    )
    depot = models.CharField(max_length=64, null=True, blank=True, verbose_name="车库/段所", help_text="车库/段所")
    cars_number = models.PositiveIntegerField(null=True, blank=True, verbose_name="编组辆数", help_text="编组辆数")
    train_platform = models.CharField(max_length=64, null=True, blank=True, verbose_name="车辆平台", help_text="车辆平台")
    train_type = models.CharField(max_length=64, null=True, blank=True, verbose_name="列车类型", help_text="列车类型")
    division = models.CharField(max_length=64, null=True, blank=True, verbose_name="事业部", help_text="事业部")
    sub_region = models.CharField(max_length=64, null=True, blank=True, verbose_name="子区域", help_text="子区域")
    city = models.CharField(max_length=64, null=True, blank=True, verbose_name="城市", help_text="城市")
    remarks = models.TextField(null=True, blank=True, verbose_name="备注", help_text="备注")

    class Meta:
        db_table = table_prefix + "device_info"
        verbose_name = "设备信息"
        verbose_name_plural = verbose_name
        ordering = ("-create_datetime",)
        indexes = [
            models.Index(fields=["train_number"], name="idx_device_info_train_no"),
            models.Index(fields=["car_number"], name="idx_device_info_car_no"),
        ]

    def clean(self):
        if self.cars_number is not None and self.cars_number <= 0:
            raise ValidationError({"cars_number": "编组辆数必须为正整数"})
        if self.cust_wrty_start and self.cust_wrty_end and self.cust_wrty_start > self.cust_wrty_end:
            raise ValidationError({"cust_wrty_end": "客户保修结束日期不能早于开始日期"})


class TrainInfo(CoreModel):
    nation = models.CharField(max_length=64, verbose_name="国家", help_text="国家")
    bureau = models.CharField(max_length=64, verbose_name="局", help_text="局（Bureau）")
    type = models.CharField(max_length=64, verbose_name="车型/类型", help_text="车型/类型")
    functional_location = models.CharField(
        max_length=128,
        verbose_name="功能位置编码",
        help_text="Functional Location",
        db_index=True,
    )
    train_number = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="车号",
        help_text="Train Number，建议全局唯一",
    )
    depot = models.CharField(max_length=64, verbose_name="车库/段所", help_text="车库/段所")
    train_platform = models.CharField(max_length=64, verbose_name="车辆平台", help_text="Train Platform")
    train_type = models.CharField(max_length=64, verbose_name="列车类型", help_text="Train Type")
    division = models.CharField(max_length=64, verbose_name="事业部", help_text="Division")
    sub_region = models.CharField(max_length=64, verbose_name="子区域", help_text="Sub Region")
    city = models.CharField(max_length=64, verbose_name="城市", help_text="City")

    class Meta:
        db_table = table_prefix + "train_info"
        verbose_name = "列车信息"
        verbose_name_plural = verbose_name
        ordering = ("-create_datetime",)
