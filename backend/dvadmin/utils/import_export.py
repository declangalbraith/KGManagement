# -*- coding: utf-8 -*-
import os
import re
from datetime import datetime
from types import SimpleNamespace

import openpyxl
from django.conf import settings
from django.db import transaction
from django.utils.encoding import force_str
from django.utils.module_loading import import_string
from django.utils.translation import gettext_lazy as _

from dvadmin.system.models import Users
from dvadmin.utils.validator import CustomValidationError


def import_to_data(file_url, field_data, m2m_fields=None):
    """
    读取导入的excel文件
    :param file_url:
    :param field_data: 首行数据源
    :param m2m_fields: 多对多字段
    :return:
    """
    # 读取excel 文件
    file_path_dir = os.path.join(settings.BASE_DIR, file_url)
    workbook = openpyxl.load_workbook(file_path_dir)
    table = workbook[workbook.sheetnames[0]]
    theader = tuple(table.values)[0] #Excel的表头
    is_update = '更新主键(勿改)' in theader #是否导入更新
    if is_update is False: #不是更新时,删除id列
        field_data.pop('id')
    # 获取参数映射
    validation_data_dict = {}
    for key, value in field_data.items():
        if isinstance(value, dict):
            choices = value.get("choices", {})
            data_dict = {}
            if choices.get("data"):
                for k, v in choices.get("data").items():
                    data_dict[k] = v
            elif choices.get("queryset") and choices.get("values_name"):
                data_list = choices.get("queryset").values(choices.get("values_name"), "id")
                for ele in data_list:
                    data_dict[ele.get(choices.get("values_name"))] = ele.get("id")
            else:
                continue
            validation_data_dict[key] = data_dict
    # 创建一个空列表，存储Excel的数据
    tables = []
    for i, row in enumerate(range(table.max_row)):
        if i == 0:
            continue
        array = {}
        for index, item in enumerate(field_data.items()):
            items = list(item)
            key = items[0]
            values = items[1]
            value_type = 'str'
            if isinstance(values, dict):
                value_type = values.get('type','str')
            cell_value = table.cell(row=row + 1, column=index + 2).value
            if cell_value is None or cell_value=='':
                continue
            elif value_type == 'date':
                print(61, datetime.strptime(str(cell_value), '%Y-%m-%d %H:%M:%S').date())
                try:
                    cell_value = datetime.strptime(str(cell_value), '%Y-%m-%d %H:%M:%S').date()
                except:
                    raise CustomValidationError(_("Date format is incorrect"))
            elif value_type == 'datetime':
                cell_value = datetime.strptime(str(cell_value), '%Y-%m-%d %H:%M:%S')
            else:
            # 由于excel导入数字类型后，会出现数字加 .0 的，进行处理
                if type(cell_value) is float and str(cell_value).split(".")[1] == "0":
                    cell_value = int(str(cell_value).split(".")[0])
                elif type(cell_value) is str:
                    cell_value = cell_value.strip(" \t\n\r")
            if key in validation_data_dict:
                array[key] = validation_data_dict.get(key, {}).get(cell_value, None)
                if key in m2m_fields:
                    array[key] = list(
                        filter(
                            lambda x: x,
                            [
                                validation_data_dict.get(key, {}).get(value, None)
                                for value in re.split(r"[，；：|.,;:\s]\s*", cell_value)
                            ],
                        )
                    )
            else:
                array[key] = cell_value
        tables.append(array)
    data = [i for i in tables if len(i) != 0]
    return data


def build_import_request(user, path, method="POST"):
    return SimpleNamespace(
        user=user,
        path=path,
        method=method,
        query_params={},
        parser_context={"kwargs": {}},
        data={},
    )


def build_import_view(viewset_path, request):
    viewset_class = import_string(viewset_path)
    view = viewset_class()
    view.request = request
    view.action = "import_data"
    view.args = ()
    view.kwargs = {}
    view.format_kwarg = None
    return view


def get_import_queryset(view):
    queryset = view.filter_queryset(view.get_queryset())
    m2m_fields = [
        ele.name
        for ele in queryset.model._meta.get_fields()
        if hasattr(ele, "many_to_many") and ele.many_to_many is True
    ]
    import_field_dict = {"id": _("Update primary key (do not modify)"), **view.import_field_dict}
    return queryset, import_field_dict, m2m_fields


def execute_import_rows(queryset, serializer_class, import_field_dict, file_url, request, m2m_fields=None):
    data = import_to_data(file_url, import_field_dict, m2m_fields=m2m_fields or [])
    with transaction.atomic():
        for row_index, ele in enumerate(data, start=2):
            filter_dic = {"id": ele.get("id")}
            instance = filter_dic and queryset.filter(**filter_dic).first()
            serializer = serializer_class(instance, data=ele, request=request)
            if not serializer.is_valid():
                raise CustomValidationError(
                    _("Import failed at row %(row)s: %(error)s")
                    % {"row": row_index, "error": force_str(serializer.errors)}
                )
            try:
                serializer.save()
            except Exception as exc:
                raise CustomValidationError(
                    _("Import failed at row %(row)s: %(error)s")
                    % {"row": row_index, "error": force_str(exc)}
                ) from exc
    return len(data)


def execute_import_by_view(viewset_path, user_id, file_url, request_path):
    user = Users.objects.get(pk=user_id)
    request = build_import_request(user=user, path=request_path)
    view = build_import_view(viewset_path=viewset_path, request=request)
    queryset, import_field_dict, m2m_fields = get_import_queryset(view)
    return execute_import_rows(
        queryset=queryset,
        serializer_class=view.import_serializer_class,
        import_field_dict=import_field_dict,
        file_url=file_url,
        request=request,
        m2m_fields=m2m_fields,
    )
