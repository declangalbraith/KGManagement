from django.core.management.base import BaseCommand
from neo4j import GraphDatabase


BACKFILL_CYPHER = """
MATCH (keep) WHERE elementId(keep) = $keep_id
MATCH (drop) WHERE elementId(drop) IN $drop_ids
WITH keep, drop UNWIND keys(drop) AS k
WITH keep, drop, k
WHERE drop[k] IS NOT NULL AND drop[k] <> '' AND drop[k] <> []
  AND (keep[k] IS NULL OR keep[k] = '' OR keep[k] = [])
CALL apoc.create.setProperty(keep, k, drop[k]) YIELD node
RETURN count(*) AS filled
"""

MERGE_CYPHER = """
MATCH (keep) WHERE elementId(keep) = $keep_id
MATCH (drop) WHERE elementId(drop) IN $drop_ids
WITH keep, collect(drop) AS drops
CALL apoc.refactor.mergeNodes([keep] + drops, {properties: 'discard', mergeRels: true}) YIELD node
RETURN elementId(node) AS merged_id
"""

CLEAR_VECTOR_CYPHER = """
MATCH (n) WHERE elementId(n) = $keep_id
REMOVE n.name_vector, n.`_name_vector`, n.content_vector, n.`_content_vector`
RETURN elementId(n) AS id
"""


def score(props):
    EXCLUDE_KEYS = {"name_vector", "_name_vector", "content_vector", "_content_vector",
                    "_name_vector_index", "_content_vector_index"}
    non_empty = sum(1 for k, v in props.items()
                    if k not in EXCLUDE_KEYS and v not in (None, "", [], {}))
    name_len = len(props.get("name", "") or "")
    bonus = sum(5 for k in ("issueTitle", "ownerName", "d4RootCauseSummary",
                            "d5PermanentCorrectionSummary", "d7PreventionSummary")
                if props.get(k))
    return non_empty * 10 + name_len + bonus


class Command(BaseCommand):
    help = "按 reportNo 合并重复的 EightDReport 节点"

    def add_arguments(self, parser):
        parser.add_argument("--uri", default="bolt://106.13.174.178:17688")
        parser.add_argument("--user", default="neo4j")
        parser.add_argument("--password", default="neo4j@openspg")
        parser.add_argument("--database", default="kgtestv2")
        parser.add_argument("--label", default="KGtestV2.EightDReport")
        parser.add_argument("--dry-run", action="store_true", default=False)

    def handle(self, *args, **options):
        driver = GraphDatabase.driver(options["uri"], auth=(options["user"], options["password"]))
        label = options["label"]
        dry_run = options["dry_run"]

        FIND_GROUPS = f"""
        MATCH (r:`{label}`)
        WHERE r.reportNo IS NOT NULL AND trim(r.reportNo) <> ''
        WITH trim(r.reportNo) AS rno, collect(r) AS nodes
        WHERE size(nodes) > 1
        RETURN rno, [n IN nodes | elementId(n)] AS ids, [n IN nodes | properties(n)] AS props
        """

        with driver.session(database=options["database"]) as sess:
            groups = sess.run(FIND_GROUPS).data()
            self.stdout.write(f"发现 {len(groups)} 组重复节点")

            total_merged = total_dropped = 0
            for g in groups:
                rno, ids, props = g["rno"], g["ids"], g["props"]
                ranked = sorted(zip(ids, props), key=lambda x: score(x[1]), reverse=True)
                keep_id, drops = ranked[0], ranked[1:]

                self.stdout.write(f"\n[组] reportNo={rno} 共 {len(ids)} 节点")
                for eid, p in ranked:
                    tag = "KEEP" if eid == keep_id[0] else "DROP"
                    self.stdout.write(f"  [{tag}] score={score(p)} name={(p.get('name') or '')[:60]}")

                if dry_run:
                    self.stdout.write("  [DRY RUN] 跳过")
                    continue

                drop_ids = [eid for eid, _ in drops]
                filled = sess.run(BACKFILL_CYPHER, keep_id=keep_id[0], drop_ids=drop_ids).single()["filled"]
                self.stdout.write(f"  回填 {filled} 字段")
                merged_id = sess.run(MERGE_CYPHER, keep_id=keep_id[0], drop_ids=drop_ids).single()["merged_id"]
                self.stdout.write(f"  合并完成, 删除 {len(drop_ids)} 碎片")
                sess.run(CLEAR_VECTOR_CYPHER, keep_id=merged_id)
                total_merged += 1
                total_dropped += len(drop_ids)

            self.stdout.write(self.style.SUCCESS(f"处理 {total_merged} 组, 删除 {total_dropped} 节点"))

        driver.close()
