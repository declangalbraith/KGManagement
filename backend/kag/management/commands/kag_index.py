import os
import sys
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "KAG 索引重建 / 节点向量化"

    def add_arguments(self, parser):
        parser.add_argument("--project", default="KGtestV2", help="项目名称")
        parser.add_argument("--action", default="vectorize",
                            choices=["vectorize", "rebuild_indexes", "all"],
                            help="操作类型")

    def handle(self, *args, **options):
        project_name = options["project"]
        action = options["action"]

        project_root = getattr(settings, "KAG_PROJECT_ROOT",
                               os.path.join(settings.BASE_DIR, "kag", "kag_projects"))
        project_dir = os.path.join(project_root, project_name)

        if not os.path.isdir(project_dir):
            raise CommandError(f"项目目录不存在: {project_dir}")

        if action in ("vectorize", "all"):
            self._vectorize_nodes(project_name, project_dir)
        if action in ("rebuild_indexes", "all"):
            self._rebuild_indexes(project_name, project_dir)

    def _get_neo4j_config(self):
        from kag.common.conf import KAG_CONFIG
        cfg = KAG_CONFIG.all_config or {}
        project_cfg = cfg.get("project", {})
        host_addr = project_cfg.get("host_addr", "bolt://localhost:7687")
        return {
            "uri": host_addr.replace("http://", "bolt://").replace("https://", "bolt://"),
            "user": cfg.get("neo4j", {}).get("user", "neo4j"),
            "password": cfg.get("neo4j", {}).get("password", "neo4j@openspg"),
            "database": cfg.get("neo4j", {}).get("database", "kgtestv2"),
        }

    def _vectorize_nodes(self, project_name, project_dir):
        self.stdout.write(f"[向量化] 开始向量化 {project_name} 的节点...")
        import requests
        from neo4j import GraphDatabase

        n4j = self._get_neo4j_config()
        embed_cfg = getattr(settings, "KAG_EMBEDDING_CONFIG", {})
        embed_api = embed_cfg.get("base_url", "https://api.siliconflow.cn/v1") + "/embeddings"
        embed_key = embed_cfg.get("api_key", "")
        embed_model = embed_cfg.get("model", "BAAI/bge-m3")

        driver = GraphDatabase.driver(n4j["uri"], auth=(n4j["user"], n4j["password"]))
        ns = project_name

        with driver.session(database=n4j["database"]) as sess:
            nodes = sess.run(
                "MATCH (n) WHERE any(l IN labels(n) WHERE l STARTS WITH $ns)"
                " AND n.name_vector IS NULL RETURN id(n) AS nid, n.name AS name",
                ns=f"{ns}.",
            ).data()

        self.stdout.write(f"  待向量化节点: {len(nodes)}")
        BATCH = 16
        written = 0
        for i in range(0, len(nodes), BATCH):
            batch = nodes[i:i + BATCH]
            texts = [str(n["name"]) for n in batch]
            try:
                r = requests.post(embed_api,
                                  headers={"Authorization": f"Bearer {embed_key}"},
                                  json={"model": embed_model, "input": texts},
                                  timeout=60)
                r.raise_for_status()
                vecs = [d["embedding"] for d in sorted(r.json()["data"], key=lambda x: x["index"])]
                with driver.session(database=n4j["database"]) as sess:
                    for n, v in zip(batch, vecs):
                        sess.run("MATCH (n) WHERE id(n)=$nid SET n.name_vector=$v", nid=n["nid"], v=v)
                        written += 1
                self.stdout.write(f"  进度 {written}/{len(nodes)}")
            except Exception as e:
                logger.warning("Embedding batch failed at %d: %s", i, e)

        driver.close()
        self.stdout.write(self.style.SUCCESS(f"向量化完成: {written} 个节点"))

    def _rebuild_indexes(self, project_name, project_dir):
        self.stdout.write(f"[重建索引] 重建 {project_name} 的向量索引...")
        from neo4j import GraphDatabase
        n4j = self._get_neo4j_config()
        driver = GraphDatabase.driver(n4j["uri"], auth=(n4j["user"], n4j["password"]))
        target_dim = getattr(settings, "KAG_EMBEDDING_DIMENSIONS", 1024)

        with driver.session(database=n4j["database"]) as sess:
            indexes = sess.run("""
                SHOW INDEXES YIELD name, type, labelsOrTypes, properties, options
                WHERE type = 'VECTOR'
                RETURN name, labelsOrTypes[0] AS label, properties[0] AS prop,
                       options.indexConfig.`vector.dimensions` AS dim,
                       options.indexConfig.`vector.similarity_function` AS sim
            """).data()

            todo = [i for i in indexes if i["dim"] != target_dim]
            self.stdout.write(f"  需重建索引: {len(todo)} 个")
            for idx in todo:
                name, label, prop, sim = idx["name"], idx["label"], idx["prop"], idx["sim"] or "cosine"
                try:
                    sess.run(f"DROP INDEX `{name}`")
                except Exception:
                    pass
                cy = f"""
                CREATE VECTOR INDEX `{name}` IF NOT EXISTS
                FOR (n:`{label}`) ON (n.`{prop}`)
                OPTIONS {{indexConfig: {{
                    `vector.dimensions`: {target_dim},
                    `vector.similarity_function`: '{sim}'
                }}}}
                """
                try:
                    sess.run(cy)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  创建索引 {name} 失败: {e}"))

        driver.close()
        self.stdout.write(self.style.SUCCESS("索引重建完成"))
