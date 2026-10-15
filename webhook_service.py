"""
ContextGraph AI - Real-Time Alert Webhook Ingestion Service.
Ingests live or simulated alerts from monitoring ecosystems (Prometheus Alertmanager, Datadog, CloudWatch)
into FalkorDB as dynamic graph nodes and automatically dispatches the deterministic agent.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from database import db_manager
from agent import agent

# Sample alert payloads for instant testing in dashboard
SAMPLE_ALERTS = {
    "Prometheus_Auth_Desync": {
        "source": "Prometheus Alertmanager",
        "alertname": "AuthServiceSignatureDesync",
        "severity": "CRITICAL",
        "target_system": "SYS-AUTH-01",
        "summary": "Cryptographic signature validation failure rate exceeded 25% on prod cluster.",
        "metric_value": "failure_rate=0.285",
        "labels": {"cluster": "us-east-1", "tier": "identity", "team": "security-core"}
    },
    "Datadog_Payment_Timeout": {
        "source": "Datadog APM",
        "alertname": "PaymentGatewayTimeoutSpike",
        "severity": "HIGH",
        "target_system": "SYS-PAY-02",
        "summary": "Downstream payment verification HTTP 504 gateway timeouts sustained for 3 minutes.",
        "metric_value": "p99_latency=4200ms",
        "labels": {"service": "checkout-pay", "environment": "production"}
    },
    "CloudWatch_TLS_Drift": {
        "source": "AWS CloudWatch",
        "alertname": "MeshTLSHandshakeErrorRate",
        "severity": "MEDIUM",
        "target_system": "SYS-GATEWAY",
        "summary": "TLS Handshake renegotiation dropouts observed across ingress mesh envoy sidecars.",
        "metric_value": "tls_errors=42_per_sec",
        "labels": {"region": "global", "vpc": "vpc-corp-main"}
    }
}

class WebhookService:
    def __init__(self, manager=db_manager):
        self.manager = manager
        self.agent = agent

    def ingest_and_investigate(self, alert_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Parses incoming alert JSON.
        2. Ingests new Event and Record nodes into FalkorDB linked to target system.
        3. Immediately triggers agent investigation on the new event.
        4. Returns ingestion metadata + agent investigation report.
        """
        graph = self.manager.get_graph()
        now_ts = datetime.now(timezone.utc).isoformat()
        
        event_id = f"EVT-WH-{uuid.uuid4().hex[:6].upper()}"
        record_id = f"REC-WH-{uuid.uuid4().hex[:6].upper()}"
        
        alert_name = alert_payload.get("alertname") or alert_payload.get("alert_name") or "External Incident"
        severity = alert_payload.get("severity", "HIGH").upper()
        target_sys = alert_payload.get("target_system", "SYS-AUTH-01")
        summary = alert_payload.get("summary") or alert_payload.get("description") or "Live ingested monitoring alert."
        source = alert_payload.get("source", "Webhook Ingestor")

        # Ingest into FalkorDB
        cypher = """
        MERGE (s:System {id: $target_sys})
        ON CREATE SET s.name = $target_sys, s.status = 'DEGRADED', s.created_at = $ts
        CREATE (e:Event {
            id: $event_id,
            title: $title,
            severity: $severity,
            status: 'OPEN',
            source: $source,
            timestamp: $ts,
            summary: $summary
        })
        CREATE (r:Record {
            id: $record_id,
            type: 'MONITORING_ALERT',
            source: $source,
            payload: $summary,
            timestamp: $ts
        })
        CREATE (e)-[:AFFECTS]->(s)
        CREATE (e)-[:RECORDED_IN]->(r)
        RETURN e.id, s.id
        """
        
        graph.query(cypher, {
            "target_sys": target_sys,
            "event_id": event_id,
            "title": alert_name,
            "severity": severity,
            "source": source,
            "ts": now_ts,
            "summary": summary,
            "record_id": record_id
        })

        # Autonomously run the agent against this new event
        investigation_query = f"Investigate incident {event_id} affecting {target_sys}"
        agent_report = self.agent.run(investigation_query)

        return {
            "status": "INGESTED_AND_INVESTIGATED",
            "ingested_event_id": event_id,
            "ingested_record_id": record_id,
            "target_system": target_sys,
            "source": source,
            "timestamp": now_ts,
            "agent_investigation": agent_report
        }

webhook_service = WebhookService()
