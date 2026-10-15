"""
Test suite for persistent cross-session memory and context reuse evaluation.
"""
import pytest
from memory_service import memory_service
from database import db_manager

def test_save_and_retrieve_session():
    meta = memory_service.save_session_context(
        user_request="Test session persistence request",
        selected_intent="INVESTIGATE_EVENT",
        tools_invoked=["test_tool_1", "test_tool_2"],
        retrieved_entity_ids=["SYS-AUTH-01"],
        findings=[{"finding_id": "FND-T1", "claim": "Test claim", "sufficiency": "SUPPORTED"}],
        evidence_items=[{"evidence_id": "EVID-T1", "claim": "Test evidence", "rule_id": "RULE-CONNECTED-SOFTWARE-RISK"}],
        summary="Test summary",
        reuse_outcome="FRESH_INVESTIGATION",
        target_entity_id="SYS-AUTH-01"
    )
    assert meta["session_id"].startswith("SESS-")
    
    # Retrieve back from FalkorDB
    sess = memory_service.retrieve_session_by_id(meta["session_id"])
    assert sess is not None
    assert sess["session_id"] == meta["session_id"]
    assert sess["request"] == "Test session persistence request"
    assert "FND-T1" in sess["finding_ids"]

def test_evaluate_context_reuse_not_found():
    status, data, rationale = memory_service.evaluate_context_reuse("NON_EXISTENT_ENTITY_999", "check something")
    assert status == "NO_RELEVANT_PRIOR_CONTEXT"
    assert data is None

def test_evaluate_context_reuse_existing():
    # Since E-101 was investigated, evaluating E-101 should return REUSED_CONTEXT
    status, data, rationale = memory_service.evaluate_context_reuse("E-101", "check E-101 again")
    assert status in ["REUSED_CONTEXT", "EXTENDED_INVESTIGATION"]
    assert data is not None
    assert "session_id" in data
