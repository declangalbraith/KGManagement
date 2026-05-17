from django.core.management.base import BaseCommand
from neo4j import GraphDatabase

PLACEHOLDER_TOKENS = [
    "不明确", "未知", "未提供", "未指定", "未说明", "暂无",
    "N/A", "n/a", "NA", "None", "none", "null", "NULL",
]

TARGETS = [
    ("KGtestV2.ProductModel", "modelCode"),
    ("KGtestV2.ProductInstance", "serialNumber"),
    ("KGtestV2.Installation", "installationId"),
    ("KGtestV2.EightDReport", "reportNo"),
    ("KGtestV2.FailureMode", "modeCode"),
    ("KGtestV2.EventCategory", "categoryCode"),
    ("KGtestV2.Organization", "name"),
    ("KGtestV2.BOMPart", "partNo"),
    ("KGtestV2.ProductEvent", "name"),
    ("KGtestV2.CauseItem", "name"),
    ("KGtestV2.ActionItem", "name"),
]


def strip_outer_quotes(s):
    if not isinstance(s, str):
        return s
    prev, cur = None, s.strip()
    while prev != cur:
        prev = cur
        if len(cur) >= 2 and ((cur[0] == '"' and cur[-1] == '"')
                              or (cur[0] == "'" and cur[-1] == "'")
                              or (cur[0] == "“" and cur[-1] == "”")):
            cur = cur[1:-1].strip()
    return cur


def is_invalid_key(s):
    if s is None or s == "":
        return True
    s2 = strip_outer_quotes(s) if isinstance(s, str) else s
    if not s2:
        return True
    return any(tok in str(s2) for tok in PLACEHOLDER_TOKENS)


class Command(BaseCommand):
    help = "KGtestV2 图谱清洗 + 去重"

    def add_arguments(self, parser):
        parser.add_argument("--uri", default="bolt://106.13.174.178:17688")
        parser.add_argument("--user", default="neo4j")
        parser.add_argument("--password", default="neo4j@openspg")
        parser.add_argument("--database", default="kgtestv2")
        parser.add_argument("--dry-run", action="store_true", default=False)

    def handle(self, *args, **options):
        driver = GraphDatabase.driver(options["uri"], auth=(options["user"], options["password"]))
        dry_run = options["dry_run"]

        with driver.session(database=options["database"]) as sess:
            for label, key in TARGETS:
                self.stdout.write(f"\n[{label}] 主键={key}")
                rows = sess.run(
                    f"MATCH (n:`{label}`) RETURN elementId(n) AS eid, properties(n) AS props"
                ).data()
                self.stdout.write(f"  节点数: {len(rows)}")

                # 去引号
                fix_count = 0
                for row in rows:
                    eid, props = row["eid"], row["props"]
                    updates = {}
                    for k, v in props.items():
                        if isinstance(v, str):
                            cleaned = strip_outer_quotes(v)
                            if cleaned != v:
                                updates[k] = cleaned
                    if updates:
                        fix_count += 1
                        if not dry_run:
                            sess.run("MATCH (n) WHERE elementId(n)=$eid SET n += $updates",
                                     eid=eid, updates=updates)
                self.stdout.write(f"  去引号: {fix_count}")

                # 删除无效主键
                if not dry_run:
                    rows = sess.run(
                        f"MATCH (n:`{label}`) RETURN elementId(n) AS eid, n.`{key}` AS k"
                    ).data()
                to_delete = [row["eid"] for row in rows if is_invalid_key(row.get("k"))]
                self.stdout.write(f"  无效主键(待删除): {len(to_delete)}")
                if not dry_run and to_delete:
                    sess.run("MATCH (n) WHERE elementId(n) IN $ids DETACH DELETE n", ids=to_delete)

                # 合并
                if not dry_run:
                    dups = sess.run(
                        f"MATCH (n:`{label}`) WHERE n.`{key}` IS NOT NULL AND n.`{key}` <> '' "
                        f"WITH n.`{key}` AS k, collect(n) AS nodes WHERE size(nodes) > 1 "
                        f"RETURN k, [x IN nodes | elementId(x)] AS ids"
                    ).data()
                    self.stdout.write(f"  合并组: {len(dups)}")
                    for d in dups:
                        sess.run(
                            "MATCH (n) WHERE elementId(n) IN $ids "
                            "WITH collect(n) AS ns "
                            "CALL apoc.refactor.mergeNodes(ns, "
                            "{properties:'discard', mergeRels:true}) YIELD node "
                            "RETURN node", ids=d["ids"])

        driver.close()
        self.stdout.write(self.style.SUCCESS("清洗完成"))
