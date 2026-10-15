"""
ContextGraph AI - Domain Graph Service.
Provides high-level graph retrieval and traversal functions executed against FalkorDB.
Used symmetrically across Streamlit dashboard, Deterministic Agent, and MCP Server.
"""
from typing import List, Dict, Any, Optional
from database import db_manager
from config import config
import graph_queries

class GraphService:
    def __init__(self, manager=db_manager):
        self.manager = manager

    def _get_graph(self):
        return self.manager.get_graph()

    def search_entities(self, keyword: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Searches for entities by keyword matching ID, name, title, or claim."""
        if not keyword or not keyword.strip():
            return []
        
        safe_keyword = keyword.strip()
        safe_limit = max(1, min(limit, config.MAX_QUERY_RESULTS))
        graph = self._get_graph()
        
        # Execute query with parameters
        query = graph_queries.SEARCH_ENTITIES_CYPHER
        res = graph.query(query, {"keyword": safe_keyword, "limit": safe_limit})
        
        entities = []
        if res.result_set:
            for row in res.result_set:
                entities.append({
                    "label": row[0],
                    "id": row[1],
                    "display_name": row[2],
                    "properties": row[3] if len(row) > 3 and isinstance(row[3], dict) else {}
                })
        return entities

    def get_entity_details(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves exact details and properties for an entity by ID."""
        if not entity_id or not entity_id.strip():
            return None
            
        clean_id = entity_id.strip()
        graph = self._get_graph()
        res = graph.query(graph_queries.GET_ENTITY_BY_ID_CYPHER, {"id": clean_id})
        
        if res.result_set and len(res.result_set) > 0:
            row = res.result_set[0]
            return {
                "label": row[0],
                "id": row[1],
                "properties": row[2] if len(row) > 2 and isinstance(row[2], dict) else {}
            }
        return None

    def find_related_records(self, entity_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves all direct 1-hop connected neighbors (in and out) for an entity."""
        if not entity_id or not entity_id.strip():
            return []
            
        clean_id = entity_id.strip()
        safe_limit = max(1, min(limit, config.MAX_QUERY_RESULTS))
        graph = self._get_graph()
        res = graph.query(graph_queries.GET_DIRECT_NEIGHBORS_CYPHER, {"id": clean_id, "limit": safe_limit})
        
        neighbors = []
        if res.result_set:
            for row in res.result_set:
                neighbors.append({
                    "source_id": row[0],
                    "relationship": row[1],
                    "direction": row[2],
                    "target_id": row[3],
                    "target_label": row[4],
                    "target_name": row[5],
                    "target_properties": row[6] if len(row) > 6 and isinstance(row[6], dict) else {}
                })
        return neighbors

    def trace_multi_hop_relationships(
        self, start_id: str, end_id: str, max_depth: int = 3, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Traces multi-hop paths between two entities within configured max_depth bounds.
        Returns explicit path nodes, relationships, and path length.
        """
        if not start_id or not end_id:
            return []
            
        s_id = start_id.strip()
        e_id = end_id.strip()
        if s_id == e_id:
            return []
            
        bounded_depth = max(1, min(max_depth, config.MAX_TRAVERSAL_DEPTH))
        safe_limit = max(1, min(limit, 20))
        
        query = graph_queries.build_multi_hop_query(max_depth=bounded_depth)
        graph = self._get_graph()
        res = graph.query(query, {"start_id": s_id, "end_id": e_id, "limit": safe_limit})
        
        paths = []
        if res.result_set:
            for row in res.result_set:
                paths.append({
                    "path_nodes": row[0],
                    "path_relationships": row[1],
                    "path_length": row[2]
                })
        return paths

    def extract_subgraph(self, start_id: str, depth: int = 2, limit: int = 30) -> Dict[str, Any]:
        """
        Extracts a localized connected subgraph surrounding start_id up to depth hops.
        Deduplicates nodes and edges for clean UI and agent inspection.
        """
        if not start_id or not start_id.strip():
            return {"nodes": [], "edges": []}
            
        s_id = start_id.strip()
        bounded_depth = max(1, min(depth, 3))
        safe_limit = max(1, min(limit, 50))
        
        query = graph_queries.build_subgraph_query(depth=bounded_depth)
        graph = self._get_graph()
        res = graph.query(query, {"start_id": s_id, "limit": safe_limit})
        
        nodes_dict = {}
        edges_list = []
        seen_edges = set()
        
        if res.result_set:
            for row in res.result_set:
                path_nodes = row[0]
                path_rels = row[1]
                
                for node in path_nodes:
                    if isinstance(node, dict) and "id" in node:
                        nodes_dict[node["id"]] = node
                        
                for rel in path_rels:
                    if isinstance(rel, dict):
                        edge_key = (rel.get("start_id"), rel.get("type"), rel.get("end_id"))
                        if edge_key not in seen_edges:
                            seen_edges.add(edge_key)
                            edges_list.append(rel)
                            
        return {
            "root_id": s_id,
            "nodes": list(nodes_dict.values()),
            "edges": edges_list
        }

    def get_subgraph(self, start_id: str, max_depth: int = 2, depth: Optional[int] = None, limit: int = 30) -> Dict[str, Any]:
        """Alias for extract_subgraph supporting both depth and max_depth kwargs."""
        actual_depth = depth if depth is not None else max_depth
        return self.extract_subgraph(start_id=start_id, depth=actual_depth, limit=limit)

    def get_incident_timeline(self) -> List[Dict[str, Any]]:
        """Retrieves ordered sequence of synthetic events and their causal links."""
        graph = self._get_graph()
        res = graph.query(graph_queries.GET_TIMELINE_EVENTS_CYPHER)
        
        events = []
        if res.result_set:
            for row in res.result_set:
                events.append({
                    "event_id": row[0],
                    "event_name": row[1],
                    "timestamp": row[2],
                    "severity": row[3],
                    "category": row[4],
                    "caused_event_id": row[5],
                    "affected_target_id": row[6],
                    "affected_target_label": row[7],
                    "record_id": row[8]
                })
        return events

    def get_graph_statistics(self) -> Dict[str, Any]:
        """Returns node counts by label and relationship counts by type."""
        graph = self._get_graph()
        label_res = graph.query("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC")
        rel_res = graph.query("MATCH ()-[r]->() RETURN type(r) AS rel_type, count(r) AS count ORDER BY count DESC")
        
        labels_breakdown = {row[0]: row[1] for row in label_res.result_set} if label_res.result_set else {}
        rels_breakdown = {row[0]: row[1] for row in rel_res.result_set} if rel_res.result_set else {}
        
        total_nodes = sum(labels_breakdown.values())
        total_edges = sum(rels_breakdown.values())
        
        return {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "labels": labels_breakdown,
            "relationships": rels_breakdown
        }

graph_service = GraphService()
