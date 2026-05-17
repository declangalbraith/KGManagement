import os
import json
import glob
import re
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from neo4j import GraphDatabase

logger = logging.getLogger(__name__)
NS = "KGtestV2"


def norm(s):
    if s is None:
        return ""
    s = str(s).lower()
    s = s.replace("（", "(").replace("）", ")").replace("，", ",").replace("。", ".")
    s = s.replace("：", ":").replace("；", ";").replace("　", " ")
    s = re.sub(r'[\s"\'`()【】《》<>_\-—,.，。、:：;；!！?？]', "", s)
    return s


def find_actual(label, raw_name, node_index, min_prefix_len=6):
    target = norm(raw_name)
    actual = node_index.get((label, target))
    if actual is not None:
        return actual
    if len(target) < min_prefix_len:
        return None
    candidates = [(k_norm, real) for (lbl, k_norm), real in node_index.items()
                  if lbl == label and (target in k_norm or k_norm in target)]
    if not candidates:
        return None
    candidates.sort(key=lambda x: len(x[0]))
    return candidates[0][1]


class Command(BaseCommand):
    help = "将 LLM 抽取的五元组关系写入 Neo4j"

    def add_arguments(self, parser):
        parser.add_argument("--project", default="KGtestV2", help="项目名称")
        parser.add_argument("--uri", default="bolt://106.13.174.178:17688", help="Neo4j URI")
        parser.add_argument("--user", default="neo4j", help="Neo4j 用户名")
        parser.add_argument("--password", default="neo4j@openspg", help="Neo4j 密码")
        parser.add_argument("--database", default="kgtestv2", help="Neo4j 数据库名")
        parser.add_argument("--n-latest", type=int, default=10, help="读取最近 N 个 relations.json")

    def handle(self, *args, **options):
        project_name = options["project"]
        n_latest = options["n_latest"]
        project_root = getattr(settings, "KAG_PROJECT_ROOT",
                               os.path.join(settings.BASE_DIR, "kag", "kag_projects"))
        project_dir = os.path.join(project_root, project_name)

        dump_dir = os.path.join(project_dir, "builder", "prompt", "_llm_dump")
        if not os.path.isdir(dump_dir):
            raise CommandError(f"LLM dump 目录不存在: {dump_dir}")

        all_files = sorted(glob.glob(os.path.join(dump_dir, "*_relations.json")),
                           key=os.path.getmtime, reverse=True)
        if not all_files:
            raise CommandError("找不到 *_relations.json 文件")

        files = all_files[:n_latest]
        files.sort(key=os.path.getmtime)
        triples = []
        for f in files:
            with open(f, encoding="utf-8") as fh:
                data = json.load(fh)
                triples.extend(data)
            self.stdout.write(f"  读取: {os.path.basename(f)} ({len(data)} 条)")

        self.stdout.write(f"\n共 {len(triples)} 条三元组")

        driver = GraphDatabase.driver(options["uri"], auth=(options["user"], options["password"]))
        node_index = {}
        with driver.session(database=options["database"]) as sess:
            rows = sess.run(
                "MATCH (n) WHERE any(l IN labels(n) WHERE l STARTS WITH $ns) "
                "RETURN labels(n)[0] AS label, n.name AS name", ns=f"{NS}."
            )
            for r in rows:
                label = r["label"].split(".", 1)[-1]
                actual = r["name"]
                if actual:
                    node_index[(label, norm(actual))] = actual

        self.stdout.write(f"数据库节点索引: {len(node_index)} 个")

        written = skipped = 0
        miss = []
        with driver.session(database=options["database"]) as sess:
            for triple in triples:
                if isinstance(triple, dict):
                    s_name = triple.get("subject") or triple.get("s")
                    s_label = triple.get("subject_type") or triple.get("s_type")
                    predicate = triple.get("predicate") or triple.get("p")
                    o_name = triple.get("object") or triple.get("o")
                    o_label = triple.get("object_type") or triple.get("o_type")
                else:
                    if len(triple) < 5:
                        skipped += 1
                        continue
                    s_name, s_label, predicate, o_name, o_label = triple[:5]

                s_actual = find_actual(s_label, s_name, node_index)
                o_actual = find_actual(o_label, o_name, node_index)

                if s_actual is None or o_actual is None:
                    skipped += 1
                    if len(miss) < 15:
                        miss.append(
                            f"{s_label}:{s_name!r}->{predicate}->{o_label}:{o_name!r}")
                    continue

                cy = (f"MATCH (a:`{NS}.{s_label}` {{name: $s}}), "
                      f"(b:`{NS}.{o_label}` {{name: $o}}) "
                      f"MERGE (a)-[r:`{predicate}`]->(b) RETURN count(r) AS c")
                try:
                    rec = sess.run(cy, s=s_actual, o=o_actual).single()
                    if rec and rec["c"] > 0:
                        written += 1
                    else:
                        skipped += 1
                except Exception as e:
                    skipped += 1

        driver.close()
        self.stdout.write(self.style.SUCCESS(f"写入: {written}, 跳过: {skipped}"))
        if miss:
            self.stdout.write("跳过示例:")
            for x in miss[:10]:
                self.stdout.write(f"  - {x}")
