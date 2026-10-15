"""
Test suite for graph queries and live Cypher traversals in FalkorDB.
"""
import pytest
from database import db_manager
from graph_service import graph_service

def test_database_health():
    is_healthy, info = db_manager.check_health()
    assert is_healthy is True
    assert info["status"] == "HEALTHY"
    assert info["nodes"] > 0
    assert info["edges"] > 0

def test_search_entities():
    # Search for known seeded entity
    results = graph_service.search_entities("SYS-AUTH-01")
    assert len(results) >= 1
    sys_node = next((r for r in results if r["id"] == "SYS-AUTH-01"), None)
    assert sys_node is not None
    assert sys_node["label"] == "System"

def test_get_entity_details():
    details = graph_service.get_entity_details("SW-LIBCRYPTO-21")
    assert details is not None
    assert details["id"] == "SW-LIBCRYPTO-21"
    assert details["label"] == "Software"
    assert "version" in details["properties"]

def test_find_related_records():
    neighbors = graph_service.find_related_records("E-101")
    assert len(neighbors) > 0
    target_ids = [n["target_id"] for n in neighbors]
    assert "SYS-AUTH-01" in target_ids

def test_multi_hop_traversal():
    paths = graph_service.trace_multi_hop_relationships("E-101", "SW-LIBCRYPTO-21", max_depth=3)
    assert len(paths) >= 1
    p = paths[0]
    assert p["path_length"] == 2
    node_ids = [n["id"] for n in p["path_nodes"]]
    assert "E-101" in node_ids
    assert "SYS-AUTH-01" in node_ids
    assert "SW-LIBCRYPTO-21" in node_ids

def test_subgraph_extraction():
    subgraph = graph_service.extract_subgraph("SYS-AUTH-01", depth=2)
    assert subgraph["root_id"] == "SYS-AUTH-01"
    assert len(subgraph["nodes"]) > 1
    assert len(subgraph["edges"]) > 0

def test_incident_timeline():
    timeline = graph_service.get_incident_timeline()
    assert len(timeline) >= 4
    event_ids = [e["event_id"] for e in timeline]
    assert "E-101" in event_ids
    assert "E-102" in event_ids
