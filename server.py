"""
ContextGraph AI - Production-Grade FastAPI Web Server.
Exposes full REST API endpoints connecting Frontend -> Agent Backend -> FalkorDB Graph Database.
Serves static Single Page Application (SPA) on root '/'.
"""
import os
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import config
from database import db_manager
from graph_service import graph_service
from memory_service import memory_service
from agent import agent
from whatif_simulator import whatif_simulator
from remediation_service import remediation_service
from debate_service import debate_service
from export_service import export_service
from webhook_service import webhook_service, SAMPLE_ALERTS

app = FastAPI(
    title="ContextGraph AI Web Portal",
    description="Persistent, Explainable, Graph-Powered Agent Web Platform",
    version=config.APP_VERSION
)

# Enable CORS for local development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST MODELS ---
class InvestigationRequest(BaseModel):
    query: str
    explicit_intent: Optional[str] = None

class WhatIfRequest(BaseModel):
    system_id: str

class RunbookRequest(BaseModel):
    entity_id: str

class DebateRequest(BaseModel):
    query: str

class PostMortemRequest(BaseModel):
    incident_id: str

# --- API ENDPOINTS ---

@app.get("/api/status")
def get_system_status():
    """Returns live FalkorDB connectivity and graph metrics."""
    healthy, diag = db_manager.check_health()
    sessions = memory_service.list_persistent_sessions(limit=50)
    return {
        "database_healthy": healthy,
        "database_host": f"{config.FALKORDB_HOST}:{config.FALKORDB_PORT}",
        "graph_name": config.GRAPH_NAME,
        "total_nodes": diag.get("nodes", 0),
        "total_edges": diag.get("edges", 0),
        "total_sessions": len(sessions),
        "version": config.APP_VERSION,
        "error": diag.get("error")
    }

@app.post("/api/agent/investigate")
def run_agent_investigation(req: InvestigationRequest):
    """Executes the full deterministic agent workflow on the user query."""
    try:
        result = agent.run(req.query, explicit_intent=req.explicit_intent)
        return {"status": "SUCCESS", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/graph/subgraph")
def get_graph_subgraph(root: str = "SYS-AUTH-01", depth: int = 2):
    """Returns localized nodes and edges for the interactive canvas."""
    data = graph_service.get_subgraph(root, max_depth=depth)
    return {"status": "SUCCESS", "data": data}

@app.get("/api/graph/timeline")
def get_incident_timeline():
    """Returns chronological causal incident chain."""
    timeline = graph_service.get_incident_timeline()
    return {"status": "SUCCESS", "data": timeline}

@app.get("/api/graph/systems")
def get_available_systems():
    """Returns list of registered systems in FalkorDB."""
    try:
        res = db_manager.get_graph().query("MATCH (s:System) RETURN s.id AS id, s.name AS name ORDER BY s.id")
        systems = [{"id": r[0], "name": r[1]} for r in res.result_set] if res.result_set else []
        return {"status": "SUCCESS", "data": systems}
    except Exception as e:
        return {"status": "ERROR", "data": [{"id": "SYS-AUTH-01", "name": "Authentication Gateway"}]}

@app.post("/api/simulation/whatif")
def simulate_outage(req: WhatIfRequest):
    """Runs forward-looking counterfactual blast radius analysis."""
    report = whatif_simulator.simulate_system_outage(req.system_id)
    return {"status": "SUCCESS", "data": report}

@app.post("/api/remediation/runbook")
def generate_runbook(req: RunbookRequest):
    """Generates autonomous step-by-step SRE runbook."""
    rbk = remediation_service.generate_remediation_runbook(req.entity_id)
    return {"status": "SUCCESS", "data": rbk}

@app.post("/api/debate")
def run_dual_agent_debate(req: DebateRequest):
    """Runs adversarial debate between Investigator and Epistemic Auditor."""
    debate = debate_service.run_debate(req.query)
    return {"status": "SUCCESS", "data": debate}

@app.get("/api/alerts/samples")
def get_sample_alerts():
    """Returns pre-packaged Prometheus, Datadog, CloudWatch sample alerts."""
    return {"status": "SUCCESS", "data": SAMPLE_ALERTS}

@app.post("/api/alerts/ingest")
def ingest_alert(alert_payload: Dict[str, Any]):
    """Ingests live alert JSON into FalkorDB and dispatches the agent."""
    try:
        res = webhook_service.ingest_and_investigate(alert_payload)
        return {"status": "SUCCESS", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memory/sessions")
def list_memory_sessions(limit: int = 50):
    """Retrieves cross-session persistent investigations."""
    sessions = memory_service.list_persistent_sessions(limit=limit)
    return {"status": "SUCCESS", "data": sessions}

@app.post("/api/postmortem/export")
def export_post_mortem(req: PostMortemRequest):
    """Generates publication-ready SRE Markdown post-mortem."""
    inv = agent.run(f"Investigate {req.incident_id}")
    rbk = remediation_service.generate_remediation_runbook(req.incident_id)
    whatif = whatif_simulator.simulate_system_outage("SYS-AUTH-01")
    md = export_service.generate_markdown_post_mortem(inv, runbook=rbk, whatif_report=whatif)
    return {"status": "SUCCESS", "markdown": md}

# --- STATIC FILES FOR FRONTEND ---
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def serve_index():
    """Serves the main single page web application."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>ContextGraph AI Web Portal Loading...</h1>")

if __name__ == "__main__":
    import sys
    import uvicorn
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    print("[+] Starting ContextGraph AI Web Portal on http://127.0.0.1:8080...")
    uvicorn.run("server:app", host="127.0.0.1", port=8080, reload=True)
