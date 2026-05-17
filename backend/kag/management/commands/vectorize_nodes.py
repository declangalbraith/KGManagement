import os
import time
import logging
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from neo4j import GraphDatabase

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "对 Neo4j 中所有项目节点做向量化，写入 name_vector / content_vector"

    def add_arguments(self, parser):
        parser.add_argument("--project", default="KGtestV2", help="项目命名空间")
        parser.add_argument("--uri", default="bolt://106.13.174.178:17688", help="Neo4j URI")
        parser.add_argument("--user", default="neo4j", help="Neo4j 用户名")
        parser.add_argument("--password", default="neo4j@openspg", help="Neo4j 密码")
        parser.add_argument("--database", default="kgtestv2", help="Neo4j 数据库名")
        parser.add_argument("--batch", type=int, default=16, help="批量大小")

    def handle(self, *args, **options):
        ns = options["project"]
        batch = options["batch"]

        embed_cfg = getattr(settings, "KAG_EMBEDDING_CONFIG", {})
        embed_api = embed_cfg.get("base_url", "https://api.siliconflow.cn/v1") + "/embeddings"
        embed_key = embed_cfg.get("api_key", "")
        embed_model = embed_cfg.get("model", "BAAI/bge-m3")

        driver = GraphDatabase.driver(options["uri"], auth=(options["user"], options["password"]))

        with driver.session(database=options["database"]) as sess:
            nodes = sess.run(
                "MATCH (n) WHERE any(l IN labels(n) WHERE l STARTS WITH $ns)"
                " AND n.name_vector IS NULL RETURN id(n) AS nid, n.name AS name",
                ns=f"{ns}.",
            ).data()

        self.stdout.write(f"待向量化节点: {len(nodes)}")
        written = 0
        for i in range(0, len(nodes), batch):
            batch_data = nodes[i:i + batch]
            texts = [str(n["name"]) for n in batch_data]
            try:
                r = requests.post(embed_api,
                                  headers={"Authorization": f"Bearer {embed_key}"},
                                  json={"model": embed_model, "input": texts}, timeout=60)
                r.raise_for_status()
                vecs = [d["embedding"] for d in sorted(r.json()["data"], key=lambda x: x["index"])]
                with driver.session(database=options["database"]) as sess:
                    for n, v in zip(batch_data, vecs):
                        sess.run("MATCH (n) WHERE id(n)=$nid SET n.name_vector=$v", nid=n["nid"], v=v)
                        written += 1
                self.stdout.write(f"  进度 {written}/{len(nodes)}")
                time.sleep(0.3)
            except Exception as e:
                logger.warning("Batch %d failed: %s", i, e)
                time.sleep(2)

        with driver.session(database=options["database"]) as sess:
            sess.run("""
                MATCH (n) WHERE n.name_vector IS NOT NULL
                SET n.`_name_vector` = n.name_vector
            """)
            self.stdout.write("  _name_vector 已同步")

        driver.close()
        self.stdout.write(self.style.SUCCESS(f"向量化完成: {written} 个节点"))
