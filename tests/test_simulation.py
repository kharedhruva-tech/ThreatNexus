"""
Test suite for deterministic simulation engine.
"""
import pytest
from simulation_engine import simulation_engine
from graph_service import graph_service

def test_available_simulation_events():
    events = simulation_engine.get_available_events()
    assert len(events) >= 4
    assert any(e["event_id"] == "SIM-EVT-02" for e in events)

def test_trigger_simulation_event():
    res = simulation_engine.trigger_event("SIM-EVT-02")
    assert res["status"] == "APPLIED_IN_GRAPH"
    assert res["affected_system"] == "SYS-AUTH-01"
    
    # Verify in FalkorDB
    details = graph_service.get_entity_details("SYS-AUTH-01")
    assert details["properties"]["status"] == "degraded"

def test_simulation_activity_log():
    log = simulation_engine.get_activity_log()
    assert len(log) > 0
    assert log[0]["event_id"] == "SIM-EVT-02"
