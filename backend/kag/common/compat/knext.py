from knext.schema.client import CHUNK_TYPE

try:
    from knext.schema.client import TABLE_TYPE
except ImportError:
    TABLE_TYPE = "Table"


class GraphClient:
    def __init__(self, host_addr: str = None, project_id: int = None):
        self._native_client = None
        self._builder_client = None
        self._graph_algo_client = None

        try:
            from knext.graph.client import GraphClient as NativeGraphClient

            self._native_client = NativeGraphClient(host_addr, project_id)
            return
        except ImportError:
            pass

        try:
            from knext.builder.client import BuilderClient

            self._builder_client = BuilderClient(host_addr, project_id)
        except ImportError:
            self._builder_client = None

        try:
            from knext.graph_algo.client import GraphAlgoClient

            self._graph_algo_client = GraphAlgoClient(host_addr, project_id)
        except ImportError:
            self._graph_algo_client = None

        if self._builder_client is None and self._graph_algo_client is None:
            raise ModuleNotFoundError(
                "No compatible graph client was found in the installed knext package."
            )

    def write_graph(self, sub_graph: dict, operation: str, lead_to_builder: bool):
        if self._native_client is not None:
            return self._native_client.write_graph(
                sub_graph=sub_graph,
                operation=operation,
                lead_to_builder=lead_to_builder,
            )
        if self._builder_client is None:
            raise AttributeError("The installed knext package does not support graph writing.")
        return self._builder_client.write_graph(
            sub_graph=sub_graph,
            operation=operation,
            lead_to_builder=lead_to_builder,
        )

    def calculate_pagerank_scores(self, target_vertex_type, start_nodes):
        if self._native_client is not None:
            return self._native_client.calculate_pagerank_scores(
                target_vertex_type, start_nodes
            )
        if self._graph_algo_client is None:
            raise AttributeError(
                "The installed knext package does not support graph ranking."
            )
        return self._graph_algo_client.calculate_pagerank_scores(
            target_vertex_type, start_nodes
        )
