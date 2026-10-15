"""
Test suite for evidence formulation, provenance, and 7-part explainability breakdown.
"""
import pytest
from evidence_service import evidence_service, RULES_CATALOG

def test_create_evidence_item():
    ev = evidence_service.create_evidence_item(
        claim="System S uses vulnerable software SW.",
        source_records=["REC-VULN-4401"],
        graph_path=[{"type": "USES", "start_id": "S", "end_id": "SW"}],
        rule_id="RULE-CONNECTED-SOFTWARE-RISK",
        sufficiency="SUPPORTED"
    )
    assert ev["evidence_id"].startswith("EVID-")
    assert ev["epistemic_type"] == "RULE_BASED_INFERENCE"
    assert ev["sufficiency"] == "SUPPORTED"
    assert "REC-VULN-4401" in ev["source_records"]

def test_7_part_explanation_format():
    finding = {
        "finding_id": "FND-TEST-01",
        "claim": "Downstream payment engine failed due to auth desync.",
        "supporting_evidence_ids": ["EVID-001"],
        "graph_paths": ["(E-102)-[:AFFECTS]->(SYS-PAY-02)"],
        "rule": RULES_CATALOG["RULE-DOWNSTREAM-DEPENDENCY-PROPAGATION"],
        "source_session_id": "SESS-PRIOR-01",
        "unknowns": ["Gateway internal queue depth"],
        "missing_evidence": ["Network trace logs"]
    }
    exp = evidence_service.format_explanation(finding)
    
    assert exp["conclusion"] == finding["claim"]
    assert exp["supporting_evidence_ids"] == ["EVID-001"]
    assert len(exp["graph_paths"]) == 1
    assert exp["applied_rule"]["rule_id"] == "RULE-DOWNSTREAM-DEPENDENCY-PROPAGATION"
    assert exp["contributing_session_id"] == "SESS-PRIOR-01"
    assert len(exp["unknowns"]) > 0
    assert len(exp["strengthening_evidence_needed"]) > 0
