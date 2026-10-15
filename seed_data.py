"""
ContextGraph AI - Synthetic World Seed Data.
Seeds the fictional ContextGraph Simulation Lab with rich, connected entities
spanning Scenarios A (Systems), B (Project Context), and C (Incident Timeline).
All entities are strictly synthetic and deterministic.
"""
from typing import Dict, Any
from database import db_manager
from schema import initialize_schema_indices

def get_seed_cypher() -> str:
    """Returns Cypher statement to seed all baseline entities and relationships."""
    return """
    // === SCENARIO A: CONNECTED SYSTEMS INVESTIGATION ===
    MERGE (org:Organization {id: 'ORG-SYNTH', name: 'Synthetic Cyber Labs', domain: 'Security & Distributed Systems', created_at: '2026-01-01T00:00:00Z'})

    // Systems
    MERGE (s1:System {id: 'SYS-AUTH-01', name: 'Authentication Gateway', tier: 'Tier-1', environment: 'production', status: 'degraded', criticality: 'CRITICAL', created_at: '2026-01-10T08:00:00Z'})
    MERGE (s2:System {id: 'SYS-PAY-02', name: 'Payment Processing Engine', tier: 'Tier-1', environment: 'production', status: 'impacted', criticality: 'CRITICAL', created_at: '2026-01-10T08:30:00Z'})
    MERGE (s3:System {id: 'SYS-DATA-03', name: 'Customer Vault Database', tier: 'Tier-2', environment: 'production', status: 'operational', criticality: 'HIGH', created_at: '2026-01-10T09:00:00Z'})
    MERGE (s4:System {id: 'SYS-MON-04', name: 'Telemetry & Audit Collector', tier: 'Tier-3', environment: 'production', status: 'operational', criticality: 'MEDIUM', created_at: '2026-01-10T09:30:00Z'})

    // Software
    MERGE (sw1:Software {id: 'SW-LIBCRYPTO-21', name: 'LibCrypto', version: '2.1.0', language: 'C/Rust', maintainer: 'Internal Crypto Team', created_at: '2026-02-01T12:00:00Z'})
    MERGE (sw2:Software {id: 'SW-PAYGATE-14', name: 'PayGatewayCore', version: '1.4.2', language: 'Python', maintainer: 'Payments Platform', created_at: '2026-02-10T12:00:00Z'})
    MERGE (sw3:Software {id: 'SW-DBSYNC-30', name: 'DbSyncService', version: '3.0.1', language: 'Go', maintainer: 'Data Infra', created_at: '2026-02-15T12:00:00Z'})

    // Records
    MERGE (r1:Record {id: 'REC-VULN-4401', type: 'Vulnerability Advisory', title: 'CVE-SYNTH-2026-4401: RSA Key Desync under concurrency', severity: 'HIGH', status: 'OPEN', published_at: '2026-10-10T14:00:00Z'})
    MERGE (r2:Record {id: 'REC-LOG-881', type: 'System Audit Log', title: 'Signature desynchronization burst in worker thread 4', severity: 'MEDIUM', timestamp: '2026-10-15T10:02:11Z'})
    MERGE (r3:Record {id: 'REC-PATCH-102', type: 'Change Management RFC', title: 'Emergency Dependency Bump LibCrypto 2.1.0 -> 2.1.1', severity: 'LOW', status: 'PENDING_APPROVAL', timestamp: '2026-10-15T11:00:00Z'})

    // Events A
    MERGE (e1:Event {id: 'E-101', name: 'Authentication Signature Desync Event', timestamp: '2026-10-15T10:00:00Z', duration_sec: 900, severity: 'HIGH', category: 'SECURITY_OPERATIONS', scenario: 'Scenario_A'})
    MERGE (e2:Event {id: 'E-102', name: 'Downstream Payment Verification Timeout', timestamp: '2026-10-15T10:25:00Z', duration_sec: 600, severity: 'CRITICAL', category: 'SERVICE_OUTAGE', scenario: 'Scenario_A'})

    // Relationships A
    MERGE (s1)-[:BELONGS_TO]->(org)
    MERGE (s2)-[:BELONGS_TO]->(org)
    MERGE (s3)-[:BELONGS_TO]->(org)
    MERGE (s4)-[:BELONGS_TO]->(org)

    MERGE (s2)-[:DEPENDS_ON]->(s1)
    MERGE (s2)-[:DEPENDS_ON]->(s3)
    MERGE (s1)-[:USES]->(sw1)
    MERGE (s2)-[:USES]->(sw2)
    MERGE (s3)-[:USES]->(sw3)
    MERGE (s1)-[:DEPENDS_ON]->(s4)

    MERGE (r1)-[:AFFECTS]->(sw1)
    MERGE (e1)-[:AFFECTS]->(s1)
    MERGE (e1)-[:RECORDED_IN]->(r2)
    MERGE (e2)-[:AFFECTS]->(s2)
    MERGE (e1)-[:LED_TO]->(e2)
    MERGE (e2)-[:RELATED_TO]->(e1)
    MERGE (r3)-[:RELATED_TO]->(r1)

    // === SCENARIO B: CROSS-SESSION PROJECT CONTEXT ===
    MERGE (prj:Project {id: 'PRJ-APOLLO', name: 'Apollo-Syn Context Resilience', status: 'ACTIVE', priority: 'P1', start_date: '2026-03-01', scenario: 'Scenario_B'})
    
    // People
    MERGE (p1:Person {id: 'USR-ALICE', name: 'Alice Vance', role: 'Principal Architect', email: 'alice.v@synthlabs.local', scenario: 'Scenario_B'})
    MERGE (p2:Person {id: 'USR-BOB', name: 'Bob Chen', role: 'Staff Security Engineer', email: 'bob.c@synthlabs.local', scenario: 'Scenario_B'})
    MERGE (p3:Person {id: 'USR-CHARLIE', name: 'Charlie Diaz', role: 'Lead Site Reliability Engineer', email: 'charlie.d@synthlabs.local', scenario: 'Scenario_B'})

    // Documents & Tasks
    MERGE (doc1:Document {id: 'DOC-ARCH-01', title: 'Apollo Resilience Architecture Specification', version: '2.4', author: 'USR-ALICE', status: 'APPROVED', updated_at: '2026-09-20T10:00:00Z'})
    MERGE (doc2:Document {id: 'DOC-RFC-89', title: 'RFC-89: Zero-Trust Token Re-evaluation Strategy', version: '1.1', author: 'USR-BOB', status: 'IN_REVIEW', updated_at: '2026-10-01T15:30:00Z'})
    MERGE (tsk1:Task {id: 'TSK-101', title: 'Remediate CVE-SYNTH-2026-4401 in Auth Gateway', assignee: 'USR-BOB', priority: 'HIGH', status: 'IN_PROGRESS'})
    MERGE (tsk2:Task {id: 'TSK-102', title: 'Implement Circuit Breaker between Payment and Auth', assignee: 'USR-CHARLIE', priority: 'CRITICAL', status: 'PENDING_VALIDATION'})

    // Pre-existing Project Decisions
    MERGE (dec1:Decision {id: 'DEC-001', claim: 'Adopt graph-native persistent context memory to avoid session amnesia in multi-agent labs', status: 'RATIFIED', timestamp: '2026-08-15T12:00:00Z', rule: 'RULE-ARCH-GRAPH-PRIMARY'})

    // Relationships B
    MERGE (p1)-[:BELONGS_TO]->(org)
    MERGE (p2)-[:BELONGS_TO]->(org)
    MERGE (p3)-[:BELONGS_TO]->(org)
    MERGE (p1)-[:WORKS_WITH]->(p2)
    MERGE (p2)-[:WORKS_WITH]->(p3)

    MERGE (p1)-[:OWNS]->(prj)
    MERGE (doc1)-[:REFERENCED_IN]->(prj)
    MERGE (doc2)-[:REFERENCED_IN]->(prj)
    MERGE (tsk1)-[:BELONGS_TO]->(prj)
    MERGE (tsk2)-[:BELONGS_TO]->(prj)
    MERGE (dec1)-[:SUPPORTED_BY]->(doc1)
    MERGE (tsk1)-[:RELATED_TO]->(r1)
    MERGE (tsk2)-[:RELATED_TO]->(s2)

    // === SCENARIO C: INCIDENT TIMELINE RECONSTRUCTION ===
    MERGE (t0:Event {id: 'EVT-0900', name: 'Configuration Drift Detected on Gateway Cluster', timestamp: '2026-10-15T09:00:00Z', duration_sec: 60, severity: 'LOW', category: 'AUDIT', scenario: 'Scenario_C'})
    MERGE (t1:Event {id: 'EVT-0915', name: 'Certificate Authority Rotation Cycle Started', timestamp: '2026-10-15T09:15:00Z', duration_sec: 300, severity: 'LOW', category: 'SCHEDULED_MAINTENANCE', scenario: 'Scenario_C'})
    MERGE (t2:Event {id: 'EVT-0945', name: 'Intermittent TLS Handshake Failures on Internal Mesh', timestamp: '2026-10-15T09:45:00Z', duration_sec: 450, severity: 'MEDIUM', category: 'NETWORK_FAULT', scenario: 'Scenario_C'})
    MERGE (t5:Event {id: 'EVT-1040', name: 'Automated Circuit Breaker & Fallback Auth Gateway Engaged', timestamp: '2026-10-15T10:40:00Z', duration_sec: 120, severity: 'HIGH', category: 'AUTO_REMEDIATION', scenario: 'Scenario_C'})

    // Timeline Sequence C
    MERGE (t0)-[:LED_TO]->(t1)
    MERGE (t1)-[:LED_TO]->(t2)
    MERGE (t2)-[:LED_TO]->(e1)
    MERGE (e1)-[:OCCURRED_DURING]->(t1)
    MERGE (e2)-[:LED_TO]->(t5)
    """

def seed_database(reset_existing: bool = False) -> Dict[str, Any]:
    """
    Seeds the FalkorDB database with all synthetic scenarios.
    If reset_existing is True, clears existing graph entities first.
    """
    graph = db_manager.get_graph()
    
    if reset_existing:
        graph.query("MATCH (n) DETACH DELETE n")
        
    # Initialize indices
    index_results = initialize_schema_indices(graph)
    
    # Execute seed queries
    cypher = get_seed_cypher()
    # Split query into chunks or execute directly
    graph.query(cypher)
    
    # Retrieve resulting counts
    res = graph.query("MATCH (n) OPTIONAL MATCH (n)-[r]->() RETURN count(DISTINCT n) AS nodes, count(r) AS edges")
    nodes = res.result_set[0][0] if res.result_set else 0
    edges = res.result_set[0][1] if res.result_set else 0
    
    return {
        "status": "SEEDED_SUCCESSFULLY",
        "nodes": nodes,
        "edges": edges,
        "indices": len(index_results),
        "graph_name": db_manager.graph_name
    }

def reset_scenario_data(scenario_name: str) -> Dict[str, Any]:
    """
    Safely resets a single scenario without deleting unrelated sessions or data.
    """
    graph = db_manager.get_graph()
    # Delete nodes matching scenario tag
    del_query = f"MATCH (n {{scenario: '{scenario_name}'}}) DETACH DELETE n"
    graph.query(del_query)
    
    # Re-seed the database
    seed_database(reset_existing=False)
    
    res = graph.query("MATCH (n) OPTIONAL MATCH (n)-[r]->() RETURN count(DISTINCT n) AS nodes, count(r) AS edges")
    return {
        "status": f"SCENARIO_{scenario_name}_RESET",
        "nodes": res.result_set[0][0],
        "edges": res.result_set[0][1]
    }

if __name__ == "__main__":
    result = seed_database(reset_existing=True)
    print("Seed execution finished:", result)
