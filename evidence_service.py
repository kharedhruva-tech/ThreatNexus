"""
ContextGraph AI - Evidence, Provenance & Explainability Service.
Manages deterministic grounding of claims into evidence IDs, verified graph paths,
documented derivation rules, and qualitative sufficiency classifications.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Supported Epistemic Rules
RULES_CATALOG = {
    "RULE-CONNECTED-SOFTWARE-RISK": {
        "rule_id": "RULE-CONNECTED-SOFTWARE-RISK",
        "name": "Connected Software Vulnerability Correlation",
        "description": "If an event affects a system S, and S uses software SW that has an active vulnerability record V, S is at correlated risk from V. Correlation does not imply verified compromise without audit logs.",
        "epistemic_type": "RULE_BASED_INFERENCE"
    },
    "RULE-DOWNSTREAM-DEPENDENCY-PROPAGATION": {
        "rule_id": "RULE-DOWNSTREAM-DEPENDENCY-PROPAGATION",
        "name": "Dependency Impact Propagation",
        "description": "If system B depends on system A, and system A suffers degraded performance or security desynchronization, downstream timeouts on B are consistent with dependency propagation.",
        "epistemic_type": "RULE_BASED_INFERENCE"
    },
    "RULE-TIMELINE-CAUSALITY": {
        "rule_id": "RULE-TIMELINE-CAUSALITY",
        "name": "Sequential Incident Causality",
        "description": "Events connected via LED_TO relationships in recorded audit logs establish a verified chronological sequence.",
        "epistemic_type": "STORED_FACT"
    },
    "RULE-UNRESOLVED-UNKNOWN": {
        "rule_id": "RULE-UNRESOLVED-UNKNOWN",
        "name": "Incomplete Observation Fallback",
        "description": "When no direct audit log or packet trace verifies exploitation, root cause remains an unproven hypothesis.",
        "epistemic_type": "HYPOTHESIS"
    }
}

class EvidenceService:
    def create_evidence_item(
        self,
        claim: str,
        source_records: List[str],
        graph_path: List[Dict[str, Any]],
        rule_id: str,
        sufficiency: str = "SUPPORTED",
        missing_evidence: Optional[List[str]] = None,
        source_session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Constructs an explainable evidence record with strict provenance.
        """
        evidence_id = f"EVID-{uuid.uuid4().hex[:8].upper()}"
        rule = RULES_CATALOG.get(rule_id, RULES_CATALOG["RULE-UNRESOLVED-UNKNOWN"])
        
        now_utc = datetime.now(timezone.utc).isoformat()
        
        return {
            "evidence_id": evidence_id,
            "claim": claim,
            "source_records": source_records,
            "graph_path": graph_path,
            "rule_id": rule["rule_id"],
            "rule_name": rule["name"],
            "epistemic_type": rule["epistemic_type"],
            "sufficiency": sufficiency if sufficiency in ["SUPPORTED", "PARTIALLY_SUPPORTED", "INSUFFICIENT"] else "SUPPORTED",
            "missing_evidence": missing_evidence or [],
            "source_session_id": source_session_id or "CURRENT_SESSION",
            "timestamp": now_utc
        }

    def format_explanation(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """
        Produces the 7-part explainability breakdown required by product specification:
        1. What was concluded
        2. Which evidence supports it
        3. Graph path used
        4. Which rule was applied
        5. Which earlier session contributed information
        6. What remains unknown
        7. What additional evidence would strengthen it
        """
        return {
            "conclusion": finding.get("claim", "No conclusion specified."),
            "supporting_evidence_ids": finding.get("supporting_evidence_ids", []),
            "graph_paths": finding.get("graph_paths", []),
            "applied_rule": finding.get("rule", {}),
            "contributing_session_id": finding.get("source_session_id", "CURRENT_SESSION"),
            "unknowns": finding.get("unknowns", [
                "Direct memory exploit dump is absent from current synthetic logs.",
                "Actual network packet capture payload not recorded."
            ]),
            "strengthening_evidence_needed": finding.get("missing_evidence", [
                "Detailed packet capture of the anomalous signature payload.",
                "Server memory dump of the affected worker thread at desync time."
            ])
        }

evidence_service = EvidenceService()
