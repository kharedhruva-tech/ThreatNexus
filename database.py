"""
ContextGraph AI - Database Connection Manager.
Manages persistent connection to the primary FalkorDB instance and provides health checks.
"""
from typing import Tuple, Dict, Any, Optional
import falkordb
from falkordb import FalkorDB
from config import config
class DatabaseConnectionError(Exception):
    """Raised when FalkorDB is unreachable or rejects the connection."""
    pass

class DatabaseManager:
    def __init__(
        self,
        host: str = config.FALKORDB_HOST,
        port: int = config.FALKORDB_PORT,
        graph_name: str = config.GRAPH_NAME
    ):
        self.host = host
        self.port = port
        self.graph_name = graph_name
        self._db: Optional[FalkorDB] = None
        self._graph = None

    def get_client(self) -> FalkorDB:
        """Returns the official FalkorDB client instance or raises DatabaseConnectionError."""
        try:
            if self._db is None:
                self._db = FalkorDB(
                    host=self.host,
                    port=self.port,
                    password=config.FALKORDB_PASSWORD
                )
            else:
                # Validate existing connection health
                try:
                    if hasattr(self._db, "connection") and self._db.connection:
                        self._db.connection.ping()
                except Exception:
                    self._db = FalkorDB(
                        host=self.host,
                        port=self.port,
                        password=config.FALKORDB_PASSWORD
                    )
            return self._db
        except Exception as e:
            raise DatabaseConnectionError(
                f"Failed to connect to FalkorDB at {self.host}:{self.port}. "
                f"Ensure FalkorDB and the background bridge are active. Error: {e}"
            ) from e

    def get_graph(self):
        """Returns the active graph instance for Cypher operations."""
        try:
            client = self.get_client()
            return client.select_graph(self.graph_name)
        except Exception as e:
            raise DatabaseConnectionError(
                f"Failed to select graph '{self.graph_name}' from FalkorDB: {e}"
            ) from e

    def check_health(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Executes an actual health check against FalkorDB.
        Returns (is_healthy, diagnostic_dict).
        """
        try:
            graph = self.get_graph()
            res = graph.query("RETURN 1 AS ping")
            if res.result_set and res.result_set[0][0] == 1:
                # Count nodes and relationships
                count_res = graph.query(
                    "MATCH (n) OPTIONAL MATCH (n)-[r]->() "
                    "RETURN count(DISTINCT n) AS nodes, count(r) AS edges"
                )
                nodes_count = count_res.result_set[0][0] if count_res.result_set else 0
                edges_count = count_res.result_set[0][1] if count_res.result_set else 0
                return True, {
                    "status": "HEALTHY",
                    "host": self.host,
                    "port": self.port,
                    "graph_name": self.graph_name,
                    "nodes": nodes_count,
                    "edges": edges_count,
                    "error": None
                }
            return False, {"status": "UNHEALTHY", "error": "Query returned unexpected result"}
        except Exception as e:
            return False, {
                "status": "UNREACHABLE",
                "host": self.host,
                "port": self.port,
                "graph_name": self.graph_name,
                "nodes": 0,
                "edges": 0,
                "error": str(e)
            }

db_manager = DatabaseManager()
