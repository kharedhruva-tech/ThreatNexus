"""
End-to-end integration test validating the Section 16 mandatory demo workflow:
'From Fragmented Records to Persistent, Explainable Context'
Steps A through G executed against live FalkorDB primary storage.
"""
import pytest
from seed_data import seed_database
from agent import agent
from memory_service import memory_service
from graph_service import graph_service
from evidence_service import evidence_service

def test_full_e2e_demo_workflow():
    # Step A — Initialize the simulation
    seed_result = seed_database(reset_existing=True)
    assert seed_result["status"] == "SEEDED_SUCCESSFULLY"
    assert seed_result["nodes"] >= 20
    assert seed_result["edges"] >= 30

    # Step B — Investigate Event E-101
    prompt_b = "Investigate Event E-101 and identify relevant connected systems, records, and supporting evidence."
    result_b = agent.run(prompt_b)
    
    assert result_b["status"] == "COMPLETED"
    assert result_b["intent"] == "INVESTIGATE_EVENT"
    assert result_b["reuse_outcome"] == "NO_RELEVANT_PRIOR_CONTEXT"
    assert len(result_b["findings"]) >= 1
    assert len(result_b["evidence"]) >= 1
    session_b_id = result_b["session_id"]
    assert session_b_id.startswith("SESS-")

    # Step C — Verify Persistence Across Session Boundaries
    # Query FalkorDB directly to ensure session B was written to disk
    persisted_b = memory_service.retrieve_session_by_id(session_b_id)
    assert persisted_b is not None
    assert persisted_b["session_id"] == session_b_id

    # Step D — Investigate Event E-102 (Cross-Session Context Reuse)
    prompt_d = "What did we discover earlier, and is that information relevant to Event E-102?"
    result_d = agent.run(prompt_d)

    assert result_d["status"] == "COMPLETED"
    assert result_d["reuse_outcome"] in ["REUSED_CONTEXT", "EXTENDED_INVESTIGATION"]
    assert result_d["earlier_session_id"] == session_b_id
    assert len(result_d["findings"]) >= 1
    
    # Verify reuse link: Finding in session D cites upstream desync
    finding_d = result_d["findings"][0]
    assert "E-101" in finding_d["claim"] or "SYS-AUTH-01" in finding_d["claim"]

    # Step E — Inspect Explainability
    explanation = evidence_service.format_explanation(finding_d)
    assert "conclusion" in explanation
    assert len(explanation["supporting_evidence_ids"]) > 0
    assert "applied_rule" in explanation
    assert len(explanation["unknowns"]) > 0
    assert len(explanation["strengthening_evidence_needed"]) > 0

    # Step F — Repeat a related query to confirm consistent reuse evaluation
    result_f = agent.run("Investigate Event E-102")
    assert result_f["reuse_outcome"] in ["REUSED_CONTEXT", "EXTENDED_INVESTIGATION"]

    # Step G — Review Persistent State in FalkorDB
    all_sessions = memory_service.list_persistent_sessions(limit=20)
    session_ids = [s["session_id"] for s in all_sessions]
    assert session_b_id in session_ids
    assert result_d["session_id"] in session_ids
    assert result_f["session_id"] in session_ids
