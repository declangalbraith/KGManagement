# -*- coding: utf-8 -*-
from django.core.exceptions import ValidationError
from django.db import models

from dvadmin.utils.models import CoreModel, table_prefix


class EngineerProfile(CoreModel):
    """工程师主档。"""

    class OriginalPu(models.TextChoices):
        MWX = "MWX", "MWX"
        KBSZ = "KBSZ", "KBSZ"
        IFE_V = "IFE-V", "IFE-V"

    name = models.CharField(max_length=100, verbose_name="姓名", help_text="工程师姓名", db_index=True)
    employee_no = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="员工号",
        help_text="与员工信息主数据对齐",
    )
    region = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="所在区域", help_text="例如华东、华南等大区"
    )
    sub_region = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="所在子区域", help_text="城市群、办事处维度"
    )
    certification = models.TextField(null=True, blank=True, verbose_name="资质", help_text="证书或资质描述")
    experience = models.TextField(null=True, blank=True, verbose_name="经验", help_text="项目或行业经验简述")
    skill_level = models.CharField(
        max_length=50, null=True, blank=True, verbose_name="技能等级", help_text="如初级/中级/高级"
    )
    skill_category = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="技能种类", help_text="如硬件、网络、软件等"
    )
    training_date = models.DateField(null=True, blank=True, verbose_name="培训日期", help_text="培训有效性计算")
    expiration_date = models.DateField(null=True, blank=True, verbose_name="过期日期", help_text="到期预警")
    customer_l1 = models.CharField(max_length=100, null=True, blank=True, verbose_name="客户L1", help_text="客户一级分类")
    customer_l2 = models.CharField(max_length=100, null=True, blank=True, verbose_name="客户L2", help_text="客户二级分类")
    customer_l3 = models.CharField(max_length=100, null=True, blank=True, verbose_name="客户L3", help_text="客户三级分类")
    residence_or_source_city = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="常驻或来源地城市",
        help_text="人员调度与属地管理",
    )
    original_pu = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=OriginalPu.choices,
        verbose_name="原属PU",
        help_text="MWX / KBSZ / IFE-V",
    )
    employment_relationship = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name="雇佣关系",
        help_text="建议接入统一字典（正式员工/外包/派遣等）",
    )
    remarks = models.TextField(null=True, blank=True, verbose_name="备注", help_text="业务补充说明")

    class Meta:
        db_table = table_prefix + "engineer_profile"
        verbose_name = "工程师主档"
        verbose_name_plural = verbose_name
        ordering = ("-update_datetime",)

    def clean(self):
        super().clean()
        if self.training_date and self.expiration_date and self.training_date > self.expiration_date:
            raise ValidationError({"expiration_date": "过期日期不能早于培训日期"})


class DepotManagement(CoreModel):
    """机务段（厂站段线）管理。"""

    class VehicleDivision(models.TextChoices):
        LRV = "LRV", "LRV"
        MT = "MT", "MT"
        LOCO = "LOCO", "LOCO"
        EMU = "EMU", "EMU"
        FC = "FC", "FC"

    class KbBuSystem(models.TextChoices):
        HVAC = "HVAC", "HVAC"
        DOOR = "Door", "Door"
        BRAKE = "Brake", "Brake"
        OTHER = "Other", "Other"

    class CustomerType(models.TextChoices):
        C = "C", "C"
        E = "E", "E"

    depot_id = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="机务段主键",
        help_text="机务段记录唯一标识",
    )
    region_l1 = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="所属5大区域", help_text="一级区域"
    )
    sub_region = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="子区域", help_text="二级区域"
    )
    service_coverage_city = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name="服务覆盖城市",
        help_text="服务半径与借调支持",
    )
    vehicle_division = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=VehicleDivision.choices,
        verbose_name="车辆类别",
        help_text="LRV / MT / LOCO / EMU / FC",
    )
    kb_bu_system = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=KbBuSystem.choices,
        verbose_name="KB设备系统",
        help_text="HVAC / Door / Brake / Other",
    )
    customer_type = models.CharField(
        max_length=30,
        null=True,
        blank=True,
        choices=CustomerType.choices,
        verbose_name="客户类型",
        help_text="C / E",
    )
    customer_org_name = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="客户组织名称", help_text="总公司/路局/地铁公司等"
    )
    official_site_name = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="厂站段线名称（官方）", help_text="官方口径名称"
    )
    site_detail_and_location = models.CharField(
        max_length=500,
        verbose_name="站点详细与位置",
        help_text="厂站段所详细名称、物理位置、所在城市（唯一标识）",
    )
    special_cert_required = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="是否需要特殊工种证件",
        help_text="True=是，False=否，NULL=未知",
    )
    special_cert_held = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="已持有特殊工种证件",
        help_text="已持有的特殊工种证件名称或编码",
    )
    first_contact_name = models.CharField(
        max_length=100, null=True, blank=True, verbose_name="第一联系人姓名", help_text="站点第一联系人"
    )
    first_contact_fse_no = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="第一联系FSE工号",
        help_text="第三方场景可为空",
        db_index=True,
    )
    work_mode = models.TextField(null=True, blank=True, verbose_name="工作模式", help_text="排班、值班、待命等")
    has_dedicated_rest_space = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="是否有KB独立休息/办公位置",
        help_text="True=是，False=否，NULL=未知",
    )
    remarks = models.TextField(null=True, blank=True, verbose_name="备注", help_text="业务补充说明")

    class Meta:
        db_table = table_prefix + "depot_management"
        verbose_name = "机务段管理"
        verbose_name_plural = verbose_name
        ordering = ("-update_datetime",)
        constraints = [
            models.UniqueConstraint(
                fields=["site_detail_and_location"],
                name="uniq_depot_mgmt_site_detail_location",
            ),
        ]
        indexes = [
            models.Index(fields=["first_contact_fse_no"], name="idx_depot_fse_no"),
        ]

    def clean(self):
        super().clean()
