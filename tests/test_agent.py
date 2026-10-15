"""
Test suite for deterministic intent router and agent execution.
"""
import pytest
from intent_router import intent_router
from agent import agent

def test_intent_router_investigate():
    req = "Investigate Event E-101 and identify connected systems"
    routing = intent_router.route_request(req)
    assert routing["intent"] == "INVESTIGATE_EVENT"
    assert "E-101" in routing["extracted_entities"]

def test_intent_router_retrieve_context():
    req = "What did we discover earlier, and is that relevant to Event E-102?"
    routing = intent_router.route_request(req)
    assert routing["intent"] == "RETRIEVE_PREVIOUS_CONTEXT"
    assert "E-102" in routing["extracted_entities"]

def test_intent_router_timeline():
    req = "Reconstruct the timeline of events and causal dependencies"
    routing = intent_router.route_request(req)
    assert routing["intent"] == "RECONSTRUCT_TIMELINE"

def test_intent_router_ambiguous():
    req = "hello can you do stuff"
    routing = intent_router.route_request(req)
    assert routing["intent"] == "AMBIGUOUS_INTENT"
    assert len(routing["candidate_intents"]) > 0

def test_agent_investigate_e101_execution():
    res = agent.run("Investigate Event E-101 and identify relevant connected systems, records, and supporting evidence.")
    assert res["status"] == "COMPLETED"
    assert res["intent"] == "INVESTIGATE_EVENT"
    assert len(res["findings"]) > 0
    assert len(res["evidence"]) > 0
    assert res["session_id"].startswith("SESS-")
    assert "E-101" in res["retrieved_entity_ids"]
