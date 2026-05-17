from django.core.management.base import BaseCommand
from neo4j import GraphDatabase


class Command(BaseCommand):
    help = "重建 Neo4j 向量索引为指定维度"

    def add_arguments(self, parser):
        parser.add_argument("--uri", default="bolt://106.13.174.178:17688")
        parser.add_argument("--user", default="neo4j")
        parser.add_argument("--password", default="neo4j@openspg")
        parser.add_argument("--database", default="kgtestv2")
        parser.add_argument("--dim", type=int, default=1024)

    def handle(self, *args, **options):
        driver = GraphDatabase.driver(options["uri"], auth=(options["user"], options["password"]))
        with driver.session(database=options["database"]) as sess:
            indexes = sess.run("""
                SHOW INDEXES YIELD name, type, labelsOrTypes, properties, options
                WHERE type = 'VECTOR'
                RETURN name, labelsOrTypes[0] AS label, properties[0] AS prop,
                       options.indexConfig.`vector.dimensions` AS dim,
                       options.indexConfig.`vector.similarity_function` AS sim
            """).data()

            todo = [i for i in indexes if i["dim"] != options["dim"]]
            self.stdout.write(f"需重建索引: {len(todo)} 个")

            for idx in todo:
                name, label, prop, sim = idx["name"], idx["label"], idx["prop"], idx["sim"] or "cosine"
                try:
                    sess.run(f"DROP INDEX `{name}`")
                except Exception:
                    pass
                cy = f"""
                CREATE VECTOR INDEX `{name}` IF NOT EXISTS
                FOR (n:`{label}`) ON (n.`{prop}`)
                OPTIONS {{indexConfig: {{`vector.dimensions`: {options["dim"]}, `vector.similarity_function`: '{sim}'}}}}
                """
                try:
                    sess.run(cy)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"创建 {name} 失败: {e}"))

        driver.close()
        self.stdout.write(self.style.SUCCESS("索引重建完成"))
