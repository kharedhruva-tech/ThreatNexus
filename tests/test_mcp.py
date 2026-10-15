"""
Test suite for Model Context Protocol (MCP) server tool interfaces.
"""
import pytest
import mcp_server

def test_mcp_search_entities():
    res = mcp_server.search_entities("SYS-AUTH-01")
    assert isinstance(res, list)
    assert len(res) >= 1
    assert any(r["id"] == "SYS-AUTH-01" for r in res)

def test_mcp_get_entity_details():
    res = mcp_server.get_entity_details("SW-LIBCRYPTO-21")
    assert isinstance(res, dict)
    assert res["id"] == "SW-LIBCRYPTO-21"

def test_mcp_trace_multi_hop():
    res = mcp_server.trace_multi_hop_relationships("E-101", "SW-LIBCRYPTO-21", max_depth=3)
    assert isinstance(res, list)
    assert len(res) >= 1

def test_mcp_timeline():
    res = mcp_server.reconstruct_incident_timeline()
    assert isinstance(res, list)
    assert len(res) >= 4

def test_mcp_investigation_agent():
    res = mcp_server.run_agent_investigation("Investigate Event E-101")
    assert isinstance(res, dict)
    assert res["status"] == "COMPLETED"
    assert "session_id" in res
