from collections import defaultdict
import hashlib
import re
from typing import Dict, Iterable, List, Optional, Set

from django.core.management.base import BaseCommand
from neo4j import GraphDatabase


PLACEHOLDER_TOKENS = [
    "不明确",
    "未知",
    "未提供",
    "未指定",
    "未说明",
    "暂无",
    "N/A",
    "n/a",
    "NA",
    "None",
    "none",
    "null",
    "NULL",
]

ORG_SUFFIXES = [
    "股份有限公司",
    "有限责任公司",
    "集团有限公司",
    "集团公司",
    "有限公司",
    "股份公司",
    "股份",
    "集团",
    "公司",
]

ORG_ALIAS_MAP = {
    "中车长客": "中车长春客车",
    "长客股份": "中车长春客车",
    "克诺尔公司": "克诺尔",
    "兰州地铁": "兰州轨道交通",
    "深圳地铁": "深圳轨道交通",
    "深圳市地铁": "深圳轨道交通",
}

PRIMARY_TARGETS = [
    {
        "label": "KGtestV2.ProductModel",
        "key": "modelCode",
        "display": "ProductModel",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.ProductInstance",
        "key": "serialNumber",
        "display": "ProductInstance",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.Installation",
        "key": "installationId",
        "display": "Installation",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.EightDReport",
        "key": "reportNo",
        "display": "EightDReport",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.FailureMode",
        "key": "modeCode",
        "display": "FailureMode",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.EventCategory",
        "key": "categoryCode",
        "display": "EventCategory",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.Organization",
        "key": "name",
        "display": "Organization",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.BOMPart",
        "key": "partNo",
        "display": "BOMPart",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.ProductEvent",
        "key": "name",
        "display": "ProductEvent",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.CauseItem",
        "key": "name",
        "display": "CauseItem",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.ActionItem",
        "key": "name",
        "display": "ActionItem",
        "merge": True,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.Chunk",
        "key": "name",
        "display": "Chunk(name)",
        "merge": False,
        "merge_mode": "exact",
    },
    {
        "label": "KGtestV2.Chunk",
        "key": "content",
        "display": "Chunk(content)",
        "merge": False,
        "merge_mode": "exact",
        "check_invalid": False,
        "normalizer": "content",
    },
]

WEAK_TARGETS = [
    {
        "label": "KGtestV2.ProductModel",
        "key": "modelCode",
        "display": "ProductModel(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "code_weak",
        "weak_group": "product_model",
        "reason": "编码弱归一化",
    },
    {
        "label": "KGtestV2.ProductInstance",
        "key": "serialNumber",
        "display": "ProductInstance(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "code_weak",
        "weak_group": "product_instance",
        "reason": "编码弱归一化",
    },
    {
        "label": "KGtestV2.Installation",
        "key": "installationId",
        "display": "Installation(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "code_weak",
        "weak_group": "installation",
        "reason": "编码弱归一化",
    },
    {
        "label": "KGtestV2.EightDReport",
        "key": "reportNo",
        "display": "EightDReport(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "code_weak",
        "weak_group": "report",
        "reason": "编码弱归一化",
    },
    {
        "label": "KGtestV2.FailureMode",
        "key": "modeCode",
        "display": "FailureMode(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "code_weak",
        "weak_group": "failure_mode",
        "reason": "编码弱归一化",
    },
    {
        "label": "KGtestV2.EventCategory",
        "key": "categoryCode",
        "display": "EventCategory(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "code_weak",
        "weak_group": "event_category",
        "reason": "编码弱归一化",
    },
    {
        "label": "KGtestV2.Organization",
        "key": "name",
        "display": "Organization(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "org_weak",
        "weak_group": "organization",
        "reason": "组织别名/后缀弱归一化",
    },
    {
        "label": "KGtestV2.ProductEvent",
        "key": "name",
        "display": "ProductEvent(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "entity_weak",
        "weak_group": "product_event",
        "reason": "名称弱归一化",
    },
    {
        "label": "KGtestV2.CauseItem",
        "key": "name",
        "display": "CauseItem(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "entity_weak",
        "weak_group": "cause_item",
        "reason": "名称弱归一化",
    },
    {
        "label": "KGtestV2.ActionItem",
        "key": "name",
        "display": "ActionItem(weak)",
        "merge": False,
        "merge_mode": "weak",
        "check_invalid": False,
        "perform_cleanup": False,
        "normalizer": "entity_weak",
        "weak_group": "action_item",
        "reason": "名称弱归一化",
    },
]

TARGETS = PRIMARY_TARGETS + WEAK_TARGETS


def strip_outer_quotes(value):
    if not isinstance(value, str):
        return value

    previous = None
    current = value.strip()
    quote_pairs = {('"', '"'), ("'", "'"), ("“", "”"), ("‘", "’")}
    while previous != current and len(current) >= 2:
        previous = current
        if (current[0], current[-1]) in quote_pairs:
            current = current[1:-1].strip()
    return current


def normalize_text(value) -> str:
    if value is None:
        return ""
    cleaned = strip_outer_quotes(value)
    if not isinstance(cleaned, str):
        cleaned = str(cleaned)
    return " ".join(cleaned.split()).strip()


def normalize_content(value) -> str:
    text = normalize_text(value)
    if not text:
        return ""
    return "".join(text.split())


def normalize_code(value) -> str:
    text = normalize_text(value).upper()
    if not text:
        return ""
    return re.sub(r"[\s\-_/.,，。()（）]+", "", text)


def normalize_entity_name(value) -> str:
    text = normalize_text(value)
    if not text:
        return ""
    text = text.lower()
    return re.sub(r"[\s\-_/.,，。;；:：()（）\"'“”‘’]+", "", text)


def normalize_org_name(value) -> str:
    text = normalize_text(value)
    if not text:
        return ""

    compact = re.sub(r"[\s\-_/.,，。;；:：()（）\"'“”‘’]+", "", text)
    compact = compact.replace("股份有限责任公司", "股份有限公司")
    compact = ORG_ALIAS_MAP.get(compact, compact)
    compact = re.sub(r"^(.*)市地铁$", r"\1轨道交通", compact)
    compact = re.sub(r"^(.*)地铁$", r"\1轨道交通", compact)
    compact = re.sub(r"^(.*)市轨道交通$", r"\1轨道交通", compact)

    for suffix in ORG_SUFFIXES:
        if compact.endswith(suffix):
            compact = compact[: -len(suffix)]
            break

    compact = ORG_ALIAS_MAP.get(compact, compact)
    return compact


def content_fingerprint(value) -> str:
    normalized = normalize_content(value)
    if not normalized:
        return ""
    return hashlib.sha1(normalized.encode("utf-8")).hexdigest()


def is_invalid_key(value) -> bool:
    normalized = normalize_text(value)
    if not normalized:
        return True
    return any(token in normalized for token in PLACEHOLDER_TOKENS)


def preview(value, limit: int = 80) -> str:
    text = normalize_text(value)
    if len(text) <= limit:
        return text
    return f"{text[:limit]}..."


def build_key(raw_value, normalizer: Optional[str]) -> str:
    if normalizer == "content":
        return content_fingerprint(raw_value)
    if normalizer == "code_weak":
        return normalize_code(raw_value)
    if normalizer == "entity_weak":
        return normalize_entity_name(raw_value)
    if normalizer == "org_weak":
        return normalize_org_name(raw_value)
    return normalize_text(raw_value)


def parse_weak_merge_groups(raw_value: str) -> Set[str]:
    if not raw_value:
        return set()
    groups = {item.strip().lower() for item in raw_value.split(",") if item.strip()}
    if "all" in groups:
        return {target["weak_group"] for target in WEAK_TARGETS}
    return groups


class Command(BaseCommand):
    help = "KGtestV2 图谱清洗与去重检查"

    def add_arguments(self, parser):
        parser.add_argument("--uri", default="bolt://117.62.232.51:17688")
        parser.add_argument("--user", default="neo4j")
        parser.add_argument("--password", default="neo4j@openspg")
        parser.add_argument("--database", default="kgtestv2")
        parser.add_argument("--dry-run", action="store_true", default=False)
        parser.add_argument(
            "--sample-size",
            type=int,
            default=5,
            help="每个标签最多打印多少组重复样例",
        )
        parser.add_argument(
            "--apply-weak-merge",
            default="all",
            help=(
                "按标签启用弱语义合并，逗号分隔。可选值: "
                "product_model,product_instance,installation,report,"
                "failure_mode,event_category,organization,product_event,"
                "cause_item,action_item,all"
            ),
        )
        parser.add_argument(
            "--exact-only",
            action="store_true",
            default=False,
            help="只执行精确清洗与精确合并，不执行弱语义合并",
        )

    def handle(self, *args, **options):
        driver = GraphDatabase.driver(
            options["uri"], auth=(options["user"], options["password"])
        )
        dry_run = options["dry_run"]
        sample_size = options["sample_size"]
        weak_merge_groups = (
            set()
            if options["exact_only"]
            else parse_weak_merge_groups(options["apply_weak_merge"])
        )

        with driver.session(database=options["database"]) as session:
            for target in TARGETS:
                self._handle_target(
                    session,
                    target,
                    dry_run=dry_run,
                    sample_size=sample_size,
                    weak_merge_groups=weak_merge_groups,
                )

        driver.close()
        self.stdout.write(self.style.SUCCESS("清洗检查完成"))

    def _handle_target(
        self,
        session,
        target: Dict,
        dry_run: bool,
        sample_size: int,
        weak_merge_groups: Set[str],
    ):
        label = target["label"]
        key = target["key"]
        display = target["display"]
        merge_mode = target.get("merge_mode", "exact")
        can_merge = target.get("merge", True)
        check_invalid = target.get("check_invalid", True)
        normalizer = target.get("normalizer")
        perform_cleanup = target.get("perform_cleanup", True)
        weak_group = target.get("weak_group")
        reason = target.get("reason", "精确匹配")

        weak_merge_enabled = (
            merge_mode == "weak" and weak_group in weak_merge_groups
        )
        effective_merge = can_merge or weak_merge_enabled

        self.stdout.write(f"\n[{display}] label={label} key={key}")
        if merge_mode == "weak":
            self.stdout.write(
                f"  弱规则原因: {reason} | 自动合并: {'是' if weak_merge_enabled else '否'}"
            )

        rows = session.run(
            f"MATCH (n:`{label}`) "
            f"RETURN elementId(n) AS eid, properties(n) AS props, n.`{key}` AS raw_key"
        ).data()
        self.stdout.write(f"  节点数: {len(rows)}")

        fix_count = 0
        invalid_ids: List[str] = []
        key_rows: List[Dict] = []

        for row in rows:
            eid = row["eid"]
            props = row["props"] or {}
            updates = {}
            if perform_cleanup:
                for prop_name, prop_value in props.items():
                    if isinstance(prop_value, str):
                        cleaned = strip_outer_quotes(prop_value)
                        if cleaned != prop_value:
                            updates[prop_name] = cleaned

            raw_key = row.get("raw_key")
            normalized_key = build_key(raw_key, normalizer)
            key_rows.append(
                {
                    "eid": eid,
                    "raw_key": raw_key,
                    "normalized_key": normalized_key,
                    "name": props.get("name"),
                    "content": props.get("content"),
                }
            )

            if perform_cleanup and check_invalid and is_invalid_key(raw_key):
                invalid_ids.append(eid)

            if perform_cleanup and updates:
                fix_count += 1
                if not dry_run:
                    session.run(
                        "MATCH (n) WHERE elementId(n) = $eid SET n += $updates",
                        eid=eid,
                        updates=updates,
                    )

        self.stdout.write(f"  需去引号属性修复: {fix_count}")
        self.stdout.write(f"  无效主键待删除: {len(invalid_ids)}")
        if perform_cleanup and not dry_run and invalid_ids:
            session.run(
                "MATCH (n) WHERE elementId(n) IN $ids DETACH DELETE n",
                ids=invalid_ids,
            )

        duplicate_groups = self._build_duplicate_groups(key_rows)
        self.stdout.write(f"  重复分组: {len(duplicate_groups)}")
        self._print_duplicate_samples(
            duplicate_groups.values(),
            key=key,
            sample_size=sample_size,
        )

        if dry_run or not effective_merge or not duplicate_groups:
            return

        merged_count = 0
        for group in duplicate_groups.values():
            ids = [item["eid"] for item in group]
            session.run(
                "MATCH (n) WHERE elementId(n) IN $ids "
                "WITH collect(n) AS ns "
                "CALL apoc.refactor.mergeNodes(ns, {properties:'discard', mergeRels:true}) "
                "YIELD node RETURN node",
                ids=ids,
            )
            merged_count += 1

        self.stdout.write(f"  已合并分组: {merged_count}")

    @staticmethod
    def _build_duplicate_groups(rows: Iterable[Dict]) -> Dict[str, List[Dict]]:
        groups: Dict[str, List[Dict]] = defaultdict(list)
        for row in rows:
            normalized_key = row["normalized_key"]
            if normalized_key:
                groups[normalized_key].append(row)
        return {
            group_key: items
            for group_key, items in groups.items()
            if len(items) > 1
        }

    def _print_duplicate_samples(
        self,
        groups: Iterable[List[Dict]],
        key: str,
        sample_size: int,
    ):
        for index, group in enumerate(groups):
            if index >= sample_size:
                break

            normalized_key = group[0]["normalized_key"]
            labels = []
            for item in group:
                if key == "content":
                    shown_key = preview(item.get("content"))
                else:
                    shown_key = preview(item.get("raw_key"))
                labels.append(f"{shown_key}<{item['eid']}>")

            self.stdout.write(f"    - count={len(group)}")
            self.stdout.write(f"      原值: {' | '.join(labels)}")
            self.stdout.write(f"      归一化: {preview(normalized_key, limit=120)}")
