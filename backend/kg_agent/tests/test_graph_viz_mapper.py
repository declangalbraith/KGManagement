from django.test import SimpleTestCase

from kg_agent.mappers.graph_viz import graph_response_to_viz, result_response_to_viz


class GraphVizMapperTests(SimpleTestCase):
    def test_result_explicit_relationships_only(self):
        payload = {
            "entities": [
                {
                    "entity_id": "R1",
                    "entity_type": "EightDReport",
                    "title": "Test Report",
                }
            ],
            "relationships": [
                {
                    "from_id": "R1",
                    "from_type": "EightDReport",
                    "rel_type": "ROOT_CAUSE",
                    "to_id": "C1",
                    "to_type": "CauseItem",
                }
            ],
        }
        viz = result_response_to_viz(payload)
        self.assertEqual(len(viz["nodes"]), 2)
        self.assertEqual(len(viz["links"]), 1)
        self.assertEqual(viz["links"][0]["label"], "ROOT_CAUSE")

    def test_graph_response_mapping(self):
        payload = {
            "nodes": [{"id": "R1", "label": "EightDReport", "title": "Report"}],
            "edges": [{"source": "R1", "type": "DESCRIBES", "target": "E1"}],
            "meta": {"truncated": False},
        }
        viz = graph_response_to_viz(payload)
        self.assertEqual(len(viz["nodes"]), 2)
        self.assertEqual(viz["links"][0]["source"], "R1")
