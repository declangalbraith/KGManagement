import requests
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from neo4j import GraphDatabase

logger = logging.getLogger(__name__)


def embed(text, api_base, api_key, model):
    r = requests.post(f"{api_base}/embeddings",
                      headers={"Authorization": f"Bearer {api_key}"},
                      json={"model": model, "input": text}, timeout=30)
    r.raise_for_status()
    return r.json()["data"][0]["embedding"]


class Command(BaseCommand):
    help = "Neo4j 向量召回测试"

    def add_arguments(self, parser):
        parser.add_argument("--question", default="EP2002有哪些部件")
        parser.add_argument("--uri", default="bolt://106.13.174.178:17688")
        parser.add_argument("--user", default="neo4j")
        parser.add_argument("--password", default="neo4j@openspg")
        parser.add_argument("--database", default="kgtestv2")
        parser.add_argument("--namespace", default="KGtestV2")
        parser.add_argument("--top-k", type=int, default=10)

    def handle(self, *args, **options):
        api_base = getattr(settings, "KAG_EMBEDDING_BASE_URL", "https://api.siliconflow.cn/v1")
        api_key = getattr(settings, "KAG_EMBEDDING_API_KEY", "")
        model = getattr(settings, "KAG_EMBEDDING_MODEL", "BAAI/bge-m3")

        qv = embed(options["question"], api_base, api_key, model)
        ns = options["namespace"]

        driver = GraphDatabase.driver(options["uri"], auth=(options["user"], options["password"]))
        with driver.session(database=options["database"]) as sess:
            cy = f"""
            MATCH (n) WHERE any(l IN labels(n) WHERE l STARTS WITH '{ns}.')
              AND n.`_name_vector` IS NOT NULL
            WITH n, reduce(s=0.0, i IN range(0, size(n.`_name_vector`)-1) |
                s + n.`_name_vector`[i] * $qv[i]) AS dot,
                sqrt(reduce(x=1.0, s=0.0, i IN range(0, size(n.`_name_vector`)-1) | 0)) AS _
            WITH n, dot / (sqrt(reduce(s=0.0, x IN n.`_name_vector` | s + x*x))
                * sqrt(reduce(s=0.0, x IN $qv | s + x*x)) + 1e-10) AS score
            RETURN labels(n)[0] AS type, n.name AS name, score
            ORDER BY score DESC LIMIT {options["top_k"]}
            """
            try:
                rows = sess.run(cy, qv=qv).data()
            except Exception:
                cy_pure = f"""
                MATCH (n) WHERE any(l IN labels(n) WHERE l STARTS WITH '{ns}.')
                  AND n.`_name_vector` IS NOT NULL
                WITH n,
                     reduce(s=0.0, i IN range(0, size(n.`_name_vector`)-1) |
                         s + n.`_name_vector`[i] * $qv[i]) AS dot,
                     sqrt(reduce(s=0.0, x IN n.`_name_vector` | s + x*x)) AS na,
                     sqrt(reduce(s=0.0, x IN $qv | s + x*x)) AS nb
                RETURN labels(n)[0] AS type, n.name AS name, dot/(na*nb) AS score
                ORDER BY score DESC LIMIT {options["top_k"]}
                """
                rows = sess.run(cy_pure, qv=qv).data()

        driver.close()
        self.stdout.write(f"\n问题: {options['question']}")
        for r in rows:
            self.stdout.write(f"  {r['score']:.3f}  {r['type']:35s} {r['name']}")
