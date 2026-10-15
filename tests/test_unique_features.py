"""
Unit and integration tests for the 6 unique features:
1. Interactive Vis.js Network Canvas Generator
2. What-If Counterfactual Chaos Simulator
3. Autonomous SRE Remediation Runbook Generator
4. Dual-Agent Debate Engine
5. Executive Post-Mortem Export Service
6. Real-Time Alert Webhook Ingestor
"""
import pytest
from visualizer import generate_network_html
from whatif_simulator import whatif_simulator
from remediation_service import remediation_service
from debate_service import debate_service
from export_service import export_service
from webhook_service import webhook_service

def test_visualizer_html_generation():
    nodes = [
        {"id": "SYS-AUTH-01", "label": "System", "name": "Auth Gateway", "properties": {"status": "DEGRADED"}},
        {"id": "E-101", "label": "Event", "name": "Auth Desync", "properties": {"severity": "HIGH"}}
    ]
    edges = [
        {"start_id": "E-101", "end_id": "SYS-AUTH-01", "type": "AFFECTS"}
    ]
    html = generate_network_html(nodes, edges, highlight_node_ids=["E-101", "SYS-AUTH-01"])
    assert "vis-network" in html
    assert "SYS-AUTH-01" in html
    assert "E-101" in html
    assert "#ef4444" in html  # highlight color

def test_whatif_simulator():
    report = whatif_simulator.simulate_system_outage("SYS-AUTH-01")
    assert report["status"] == "SIMULATION_COMPLETE"
    assert report["target_system"] == "SYS-AUTH-01"
    assert report["total_downstream_systems_impacted"] >= 1
    assert "PRE-MORTEM" in report["pre_mortem_summary"]
    assert len(report["cascading_systems"]) >= 1

def test_remediation_service():
    rbk = remediation_service.generate_remediation_runbook("E-101")
    assert "RBK-" in rbk["runbook_id"]
    assert rbk["severity"] == "SEV-1 (CRITICAL)"
    assert len(rbk["remediation_steps"]) >= 3
    assert "cypher_verification_check" in rbk
    assert "LibCrypto" in rbk["title"] or "Authentication" in rbk["title"]

def test_debate_service():
    debate = debate_service.run_debate("Investigate incident E-101")
    assert "DEBATE-" in debate["debate_session_id"]
    assert len(debate["rounds"]) == 4
    assert debate["rounds"][0]["speaker"] == "Agent Alpha (Lead Investigator)"
    assert debate["rounds"][1]["speaker"] == "Agent Beta (Epistemic Auditor)"
    assert debate["consensus_summary"]["consensus_verdict"] == "VERIFIED_ROOT_CAUSE"
    assert debate["consensus_summary"]["epistemic_score"] > 0.8

def test_export_service():
    mock_inv = {
        "session_id": "SESS-TEST-99",
        "retrieved_entity_ids": ["E-101", "SYS-AUTH-01"],
        "intent": "INVESTIGATE_EVENT",
        "reuse_outcome": "FRESH_INVESTIGATION",
        "findings": [{"claim": "Auth node suffered desynchronization."}],
        "tools_invoked": [{"tool": "get_entity_details", "status": "SUCCESS", "duration_ms": 1.2, "summary": "Found"}]
    }
    mock_rbk = remediation_service.generate_remediation_runbook("E-101")
    md = export_service.generate_markdown_post_mortem(mock_inv, runbook=mock_rbk)
    assert "# 📋 SRE Incident Post-Mortem" in md
    assert "Mermaid" in md or "graph LR" in md
    assert "SESS-TEST-99" in md
    assert "Autonomous Remediation Runbook" in md

def test_webhook_service():
    alert_payload = {
        "source": "Prometheus Alertmanager",
        "alertname": "TestGatewayFailure",
        "severity": "CRITICAL",
        "target_system": "SYS-AUTH-01",
        "summary": "Automated unit test alert."
    }
    res = webhook_service.ingest_and_investigate(alert_payload)
    assert res["status"] == "INGESTED_AND_INVESTIGATED"
    assert "EVT-WH-" in res["ingested_event_id"]
    assert res["target_system"] == "SYS-AUTH-01"
    assert "agent_investigation" in res
    assert res["agent_investigation"]["status"] == "COMPLETED"
