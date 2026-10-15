"""
ContextGraph AI - Model Context Protocol (MCP) Server.
Exposes verified domain service functions and deterministic graph investigation tools
to external MCP-compatible AI clients via the official FastMCP Python SDK.
"""
import sys
from typing import List, Dict, Any, Optional
from mcp.server.fastmcp import FastMCP

from graph_service import graph_service
from memory_service import memory_service
from agent import agent
from whatif_simulator import whatif_simulator
from remediation_service import remediation_service
from debate_service import debate_service
from webhook_service import webhook_service

# Initialize FastMCP Server
mcp = FastMCP("ContextGraphAI")

@mcp.tool()
def search_entities(keyword: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Search for entities in the graph by ID, name, or title."""
    return graph_service.search_entities(keyword, limit=limit)

@mcp.tool()
def get_entity_details(entity_id: str) -> Dict[str, Any]:
    """Retrieve full attributes, labels, and properties of an entity by ID."""
    details = graph_service.get_entity_details(entity_id)
    return details if details else {"error": f"Entity '{entity_id}' not found in graph."}

@mcp.tool()
def find_related_records(entity_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Discover direct 1-hop connected neighbors, systems, software, or records."""
    return graph_service.find_related_records(entity_id, limit=limit)

@mcp.tool()
def trace_multi_hop_relationships(start_id: str, end_id: str, max_depth: int = 3, limit: int = 10) -> List[Dict[str, Any]]:
    """Trace bounded multi-hop paths between two entities in FalkorDB."""
    return graph_service.trace_multi_hop_relationships(start_id, end_id, max_depth=max_depth, limit=limit)

@mcp.tool()
def retrieve_previous_context(target_entity_id: str, query: str = "") -> Dict[str, Any]:
    """Search FalkorDB for earlier investigations and evaluate context reuse eligibility."""
    reuse_status, prior_data, rationale = memory_service.evaluate_context_reuse(target_entity_id, query)
    return {
        "reuse_status": reuse_status,
        "rationale": rationale,
        "prior_data": prior_data
    }

@mcp.tool()
def reconstruct_incident_timeline() -> List[Dict[str, Any]]:
    """Retrieve the sequential and causal timeline of all recorded synthetic incidents."""
    return graph_service.get_incident_timeline()

@mcp.tool()
def run_agent_investigation(user_request: str) -> Dict[str, Any]:
    """Execute the full deterministic investigation pipeline with FalkorDB session persistence."""
    return agent.run(user_request)

@mcp.tool()
def simulate_what_if_outage(system_id: str) -> Dict[str, Any]:
    """Simulate catastrophic failure of a system and compute cascading transitive blast radius."""
    return whatif_simulator.simulate_system_outage(system_id)

@mcp.tool()
def generate_mitigation_runbook(entity_id: str) -> Dict[str, Any]:
    """Synthesize an actionable, step-by-step SRE remediation runbook grounded in FalkorDB."""
    return remediation_service.generate_remediation_runbook(entity_id)

@mcp.tool()
def run_dual_agent_debate(query: str) -> Dict[str, Any]:
    """Execute adversarial collaboration between Lead Investigator and Epistemic Auditor agents."""
    return debate_service.run_debate(query)

@mcp.tool()
def ingest_monitoring_alert(alert_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Ingest live Prometheus/Datadog/CloudWatch alert into FalkorDB and trigger immediate investigation."""
    return webhook_service.ingest_and_investigate(alert_payload)

if __name__ == "__main__":
    # Support stdio transport by default (standard for MCP clients)
    print("Starting ContextGraph AI MCP Server on stdio transport...", file=sys.stderr)
    mcp.run(transport="stdio")

