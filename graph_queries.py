"""
ContextGraph AI - Cypher Query Definitions.
Contains bounded, safe, parameterized Cypher queries for entity retrieval,
relationship expansion, multi-hop path discovery, and subgraph extraction in FalkorDB.
"""

# Search entities by keyword across id, name, and title
SEARCH_ENTITIES_CYPHER = """
MATCH (n)
WHERE (n.id IS NOT NULL AND toLower(n.id) CONTAINS toLower($keyword))
   OR (n.name IS NOT NULL AND toLower(n.name) CONTAINS toLower($keyword))
   OR (n.title IS NOT NULL AND toLower(n.title) CONTAINS toLower($keyword))
   OR (n.claim IS NOT NULL AND toLower(n.claim) CONTAINS toLower($keyword))
RETURN labels(n)[0] AS label, n.id AS id, coalesce(n.name, n.title, n.claim, n.id) AS display_name, properties(n) AS properties
LIMIT $limit
"""

# Get exact entity details by ID
GET_ENTITY_BY_ID_CYPHER = """
MATCH (n {id: $id})
RETURN labels(n)[0] AS label, n.id AS id, properties(n) AS properties
LIMIT 1
"""

# Direct (1-hop) neighbors in either direction
GET_DIRECT_NEIGHBORS_CYPHER = """
MATCH (src {id: $id})-[r]-(dst)
RETURN 
    src.id AS source_id,
    type(r) AS relationship,
    CASE WHEN startNode(r) = src THEN 'OUTGOING' ELSE 'INCOMING' END AS direction,
    dst.id AS target_id,
    labels(dst)[0] AS target_label,
    coalesce(dst.name, dst.title, dst.claim, dst.id) AS target_name,
    properties(dst) AS target_properties
LIMIT $limit
"""

# Multi-hop path tracing between two specific entities
# Bounded to max_depth (1..3)
def build_multi_hop_query(max_depth: int = 3) -> str:
    depth = max(1, min(max_depth, 4))
    return f"""
    MATCH p = (src {{id: $start_id}})-[r*1..{depth}]-(dst {{id: $end_id}})
    RETURN [node in nodes(p) | {{id: node.id, label: labels(node)[0], name: coalesce(node.name, node.title, node.claim, node.id)}}] AS path_nodes,
           [rel in relationships(p) | {{type: type(rel), start_id: startNode(rel).id, end_id: endNode(rel).id}}] AS path_relationships,
           length(p) AS path_length
    LIMIT $limit
    """

# Subgraph expansion from an entity up to bounded depth
def build_subgraph_query(depth: int = 2) -> str:
    bounded_depth = max(1, min(depth, 3))
    return f"""
    MATCH p = (src {{id: $start_id}})-[r*1..{bounded_depth}]-(dst)
    RETURN [node in nodes(p) | {{id: node.id, label: labels(node)[0], name: coalesce(node.name, node.title, node.claim, node.id)}}] AS nodes,
           [rel in relationships(p) | {{type: type(rel), start_id: startNode(rel).id, end_id: endNode(rel).id}}] AS rels
    LIMIT $limit
    """

# Sequential Incident Timeline Query
GET_TIMELINE_EVENTS_CYPHER = """
MATCH (e:Event)
OPTIONAL MATCH (e)-[:LED_TO]->(next:Event)
OPTIONAL MATCH (e)-[:AFFECTS]->(target)
OPTIONAL MATCH (e)-[:RECORDED_IN]->(rec:Record)
RETURN e.id AS event_id,
       e.name AS event_name,
       e.timestamp AS timestamp,
       e.severity AS severity,
       e.category AS category,
       next.id AS caused_event_id,
       target.id AS affected_target_id,
       labels(target)[0] AS affected_target_label,
       rec.id AS record_id
ORDER BY e.timestamp ASC
"""
