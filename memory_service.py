"""
ContextGraph AI - Persistent Cross-Session Memory & Context Reuse Service.
Stores and retrieves sessions, investigations, findings, and evidence directly in FalkorDB.
Evaluates context reuse eligibility without fabricating memory.
"""
import uuid
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from database import db_manager

class MemoryService:
    def __init__(self, manager=db_manager):
        self.manager = manager

    def _get_graph(self):
        return self.manager.get_graph()

    def save_session_context(
        self,
        user_request: str,
        selected_intent: str,
        tools_invoked: List[str],
        retrieved_entity_ids: List[str],
        findings: List[Dict[str, Any]],
        evidence_items: List[Dict[str, Any]],
        summary: str,
        earlier_session_id: Optional[str] = None,
        reuse_outcome: str = "FRESH_INVESTIGATION",
        target_entity_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Persists a complete session, investigation, findings, and evidence nodes into FalkorDB.
        """
        graph = self._get_graph()
        session_id = f"SESS-{uuid.uuid4().hex[:8].upper()}"
        investigation_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
        now_utc = datetime.now(timezone.utc).isoformat()
        
        # 1. Create Session node
        cypher_session = """
        MERGE (s:Session {
            id: $session_id,
            user_request: $request,
            intent: $intent,
            tools_json: $tools_json,
            entities_json: $entities_json,
            summary: $summary,
            reuse_outcome: $reuse_outcome,
            timestamp: $timestamp
        })
        """
        graph.query(cypher_session, {
            "session_id": session_id,
            "request": user_request,
            "intent": selected_intent,
            "tools_json": json.dumps(tools_invoked),
            "entities_json": json.dumps(retrieved_entity_ids),
            "summary": summary,
            "reuse_outcome": reuse_outcome,
            "timestamp": now_utc
        })

        # 2. Create Investigation node
        cypher_inv = """
        MATCH (s:Session {id: $session_id})
        MERGE (inv:Investigation {
            id: $inv_id,
            target_entity_id: $target_id,
            outcome: $outcome,
            timestamp: $timestamp
        })
        MERGE (s)-[:OWNS]->(inv)
        """
        graph.query(cypher_inv, {
            "session_id": session_id,
            "inv_id": investigation_id,
            "target_id": target_entity_id or (retrieved_entity_ids[0] if retrieved_entity_ids else "UNKNOWN"),
            "outcome": reuse_outcome,
            "timestamp": now_utc
        })

        # 3. Link earlier session if context was reused
        if earlier_session_id and earlier_session_id.strip():
            cypher_link_earlier = """
            MATCH (s:Session {id: $session_id})
            MATCH (prev:Session {id: $earlier_id})
            MERGE (s)-[:REVISITS]->(prev)
            """
            graph.query(cypher_link_earlier, {
                "session_id": session_id,
                "earlier_id": earlier_session_id.strip()
            })

        # 4. Create and link Findings & Evidence
        for idx, finding in enumerate(findings):
            finding_id = finding.get("finding_id", f"FND-{uuid.uuid4().hex[:8].upper()}")
            cypher_finding = """
            MATCH (inv:Investigation {id: $inv_id})
            MERGE (f:Finding {
                id: $finding_id,
                claim: $claim,
                sufficiency: $sufficiency,
                rule_id: $rule_id,
                timestamp: $timestamp
            })
            MERGE (inv)-[:DISCOVERED_IN]->(f)
            """
            graph.query(cypher_finding, {
                "inv_id": investigation_id,
                "finding_id": finding_id,
                "claim": finding.get("claim", ""),
                "sufficiency": finding.get("sufficiency", "SUPPORTED"),
                "rule_id": finding.get("rule_id", "RULE-CONNECTED-SOFTWARE-RISK"),
                "timestamp": now_utc
            })

            # Check if this finding was derived from a prior finding
            prior_fnd_id = finding.get("derived_from_finding_id")
            if prior_fnd_id:
                graph.query("""
                MATCH (f:Finding {id: $fid})
                MATCH (pf:Finding {id: $pfid})
                MERGE (f)-[:DERIVED_FROM]->(pf)
                """, {"fid": finding_id, "pfid": prior_fnd_id})

            # Link evidence items to this finding
            for ev in evidence_items:
                ev_id = ev.get("evidence_id", f"EVID-{uuid.uuid4().hex[:8].upper()}")
                cypher_evidence = """
                MATCH (f:Finding {id: $finding_id})
                MERGE (e:Evidence {
                    id: $ev_id,
                    claim: $claim,
                    rule_id: $rule_id,
                    sufficiency: $sufficiency,
                    timestamp: $timestamp
                })
                MERGE (f)-[:SUPPORTED_BY]->(e)
                """
                graph.query(cypher_evidence, {
                    "finding_id": finding_id,
                    "ev_id": ev_id,
                    "claim": ev.get("claim", ""),
                    "rule_id": ev.get("rule_id", "RULE-CONNECTED-SOFTWARE-RISK"),
                    "sufficiency": ev.get("sufficiency", "SUPPORTED"),
                    "timestamp": now_utc
                })

        return {
            "session_id": session_id,
            "investigation_id": investigation_id,
            "timestamp": now_utc,
            "reuse_outcome": reuse_outcome,
            "findings_count": len(findings),
            "evidence_count": len(evidence_items)
        }

    def list_persistent_sessions(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves list of stored sessions ordered chronologically descending."""
        graph = self._get_graph()
        query = """
        MATCH (s:Session)
        OPTIONAL MATCH (s)-[:OWNS]->(inv:Investigation)
        OPTIONAL MATCH (s)-[:REVISITS]->(prev:Session)
        RETURN 
            s.id AS session_id,
            s.user_request AS request,
            s.intent AS intent,
            s.summary AS summary,
            s.reuse_outcome AS reuse_outcome,
            s.timestamp AS timestamp,
            inv.id AS investigation_id,
            inv.target_entity_id AS target_entity,
            prev.id AS revisited_session_id
        ORDER BY s.timestamp DESC
        LIMIT $limit
        """
        res = graph.query(query, {"limit": limit})
        sessions = []
        if res.result_set:
            for row in res.result_set:
                sessions.append({
                    "session_id": row[0],
                    "request": row[1],
                    "intent": row[2],
                    "summary": row[3],
                    "reuse_outcome": row[4],
                    "timestamp": row[5],
                    "investigation_id": row[6],
                    "target_entity": row[7],
                    "revisited_session_id": row[8]
                })
        return sessions

    def retrieve_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full details of a session including findings and evidence."""
        if not session_id or not session_id.strip():
            return None
        
        graph = self._get_graph()
        query = """
        MATCH (s:Session {id: $session_id})
        OPTIONAL MATCH (s)-[:OWNS]->(inv:Investigation)
        OPTIONAL MATCH (inv)-[:DISCOVERED_IN]->(f:Finding)
        OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(e:Evidence)
        RETURN 
            s.id AS session_id,
            s.user_request AS request,
            s.intent AS intent,
            s.summary AS summary,
            s.reuse_outcome AS reuse_outcome,
            s.timestamp AS timestamp,
            inv.id AS investigation_id,
            inv.target_entity_id AS target_entity,
            collect(DISTINCT f.id) AS finding_ids,
            collect(DISTINCT f.claim) AS finding_claims,
            collect(DISTINCT e.id) AS evidence_ids
        LIMIT 1
        """
        res = graph.query(query, {"session_id": session_id.strip()})
        if res.result_set and len(res.result_set) > 0:
            row = res.result_set[0]
            return {
                "session_id": row[0],
                "request": row[1],
                "intent": row[2],
                "summary": row[3],
                "reuse_outcome": row[4],
                "timestamp": row[5],
                "investigation_id": row[6],
                "target_entity": row[7],
                "finding_ids": row[8] if row[8] else [],
                "finding_claims": row[9] if row[9] else [],
                "evidence_ids": row[10] if row[10] else []
            }
        return None

    def search_prior_investigations(
        self, target_entity_id: str
    ) -> List[Dict[str, Any]]:
        """
        Finds previous investigations in FalkorDB that examined this target or related entities.
        """
        graph = self._get_graph()
        query = """
        MATCH (s:Session)-[:OWNS]->(inv:Investigation)
        WHERE inv.target_entity_id = $target_id
           OR s.entities_json CONTAINS $target_id
           OR s.user_request CONTAINS $target_id
        OPTIONAL MATCH (inv)-[:DISCOVERED_IN]->(f:Finding)
        OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(e:Evidence)
        RETURN 
            s.id AS session_id,
            inv.id AS investigation_id,
            inv.target_entity_id AS target_entity,
            s.summary AS summary,
            s.timestamp AS timestamp,
            collect(DISTINCT f.claim) AS findings,
            collect(DISTINCT f.id) AS finding_ids,
            collect(DISTINCT e.id) AS evidence_ids
        ORDER BY s.timestamp DESC
        LIMIT 5
        """
        res = graph.query(query, {"target_id": target_entity_id})
        results = []
        if res.result_set:
            for row in res.result_set:
                results.append({
                    "session_id": row[0],
                    "investigation_id": row[1],
                    "target_entity": row[2],
                    "summary": row[3],
                    "timestamp": row[4],
                    "findings": row[5] if row[5] else [],
                    "finding_ids": row[6] if row[6] else [],
                    "evidence_ids": row[7] if row[7] else []
                })
        return results

    def evaluate_context_reuse(
        self, current_target_id: str, new_request: str
    ) -> Tuple[str, Optional[Dict[str, Any]], str]:
        """
        Evaluates whether an earlier investigation in FalkorDB can be reused.
        Returns (reuse_status, prior_investigation_data, rationale).
        Possible statuses:
        - FRESH_INVESTIGATION
        - REUSED_CONTEXT
        - EXTENDED_INVESTIGATION
        - CONTRADICTED_PRIOR_FINDING
        - NO_RELEVANT_PRIOR_CONTEXT
        """
        graph = self._get_graph()
        
        # 1. Check if the exact entity was investigated earlier
        exact_priors = self.search_prior_investigations(current_target_id)
        if exact_priors:
            prior = exact_priors[0]
            rationale = (
                f"Prior session {prior['session_id']} already investigated {current_target_id}. "
                f"Existing findings and evidence are retrieved directly from FalkorDB."
            )
            return "REUSED_CONTEXT", prior, rationale

        # 2. Check if a related upstream or causal entity was investigated
        # For instance, if investigating E-102, check if upstream E-101 was investigated
        cypher_connected_priors = """
        MATCH (curr {id: $curr_id})-[*1..2]-(connected)
        MATCH (s:Session)-[:OWNS]->(inv:Investigation)
        WHERE inv.target_entity_id = connected.id
           OR s.entities_json CONTAINS connected.id
        OPTIONAL MATCH (inv)-[:DISCOVERED_IN]->(f:Finding)
        OPTIONAL MATCH (f)-[:SUPPORTED_BY]->(e:Evidence)
        RETURN 
            s.id AS session_id,
            inv.id AS investigation_id,
            inv.target_entity_id AS connected_target,
            connected.id AS matched_entity,
            s.summary AS summary,
            s.timestamp AS timestamp,
            collect(DISTINCT f.claim) AS findings,
            collect(DISTINCT f.id) AS finding_ids,
            collect(DISTINCT e.id) AS evidence_ids
        ORDER BY s.timestamp DESC
        LIMIT 1
        """
        res = graph.query(cypher_connected_priors, {"curr_id": current_target_id})
        if res.result_set and len(res.result_set) > 0:
            row = res.result_set[0]
            prior_data = {
                "session_id": row[0],
                "investigation_id": row[1],
                "target_entity": row[2],
                "matched_connected_entity": row[3],
                "summary": row[4],
                "timestamp": row[5],
                "findings": row[6] if row[6] else [],
                "finding_ids": row[7] if row[7] else [],
                "evidence_ids": row[8] if row[8] else []
            }
            rationale = (
                f"Discovered relevant earlier investigation {prior_data['session_id']} for connected entity "
                f"'{prior_data['matched_connected_entity']}'. Reusing prior context and extending investigation "
                f"to examine current entity '{current_target_id}'."
            )
            return "EXTENDED_INVESTIGATION", prior_data, rationale

        return "NO_RELEVANT_PRIOR_CONTEXT", None, "No relevant stored session found in FalkorDB matching current request or connected entities."

memory_service = MemoryService()
