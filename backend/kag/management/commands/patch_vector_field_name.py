from django.core.management.base import BaseCommand
from neo4j import GraphDatabase


class Command(BaseCommand):
    help = "补写 _name_vector / _content_vector 字段"

    def add_arguments(self, parser):
        parser.add_argument("--uri", default="bolt://106.13.174.178:17688")
        parser.add_argument("--user", default="neo4j")
        parser.add_argument("--password", default="neo4j@openspg")
        parser.add_argument("--database", default="kgtestv2")

    def handle(self, *args, **options):
        driver = GraphDatabase.driver(options["uri"], auth=(options["user"], options["password"]))
        with driver.session(database=options["database"]) as sess:
            r1 = sess.run("""
                MATCH (n) WHERE n.name_vector IS NOT NULL AND n.`_name_vector` IS NULL
                SET n.`_name_vector` = n.name_vector RETURN count(n) AS cnt
            """).single()
            self.stdout.write(f"复制 _name_vector: {r1['cnt']} 条")
            r2 = sess.run("""
                MATCH (n) WHERE n.content_vector IS NOT NULL AND n.`_content_vector` IS NULL
                SET n.`_content_vector` = n.content_vector RETURN count(n) AS cnt
            """).single()
            self.stdout.write(f"复制 _content_vector: {r2['cnt']} 条")
        driver.close()
        self.stdout.write(self.style.SUCCESS("完成"))
