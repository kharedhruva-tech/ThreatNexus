"""
ContextGraph AI - Production-Grade FastAPI Web Server.
Exposes full REST API endpoints connecting Frontend -> Agent Backend -> FalkorDB Graph Database.
Serves static Single Page Application (SPA) on root '/'.
"""
import os
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
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
from chat_service import chat_service
from api_v1 import router as api_v1_router
from datetime import datetime, timezone

app = FastAPI(
    title="ThreatNexus Web Portal",
    description="Persistent, Explainable, Graph-Powered Threat Intelligence Platform",
    version=config.APP_VERSION
)

# Enable CORS for Next.js, Vite, Railway, and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router for Next.js frontend integration
app.include_router(api_v1_router)

@app.on_event("startup")
def startup_event():
    """Attempts background database seeding without blocking server startup."""
    import threading
    def background_seed():
        try:
            from seed_data import seed_database
            seed_database(reset_existing=False)
            print("[Startup] FalkorDB seed verification complete.")
        except Exception as e:
            print(f"[Startup] FalkorDB seed deferred: {e}")
    threading.Thread(target=background_seed, daemon=True).start()

@app.get("/health")
def get_root_health():
    """Root health check matching Frontend SystemHealth contract."""
    from api_v1 import get_v1_health
    res = get_v1_health()
    res["database_connected"] = (res.get("overallStatus") == "OPERATIONAL")
    res["service"] = config.APP_NAME
    res["status"] = res.get("overallStatus", "OPERATIONAL")
    return res

# --- REQUEST MODELS ---
class InvestigationRequest(BaseModel):
    query: str
    explicit_intent: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    agent_mode: Optional[str] = None
    save_memory: Optional[bool] = True

class VoiceTranscriptRequest(BaseModel):
    transcript: str
    confidence: Optional[float] = None
    conversation_id: Optional[str] = None
    agent_mode: Optional[str] = None

class CreateMemoryRequest(BaseModel):
    fact: str
    entity: Optional[str] = None
    category: Optional[str] = "general"
    provenance: Optional[str] = "user_input"

class WhatIfRequest(BaseModel):
    system_id: str

class RunbookRequest(BaseModel):
    entity_id: str

class DebateRequest(BaseModel):
    query: str

class PostMortemRequest(BaseModel):
    incident_id: str

# --- HEALTH & CONFIGURATION ENDPOINTS ---

@app.get("/api/health")
def get_health():
    """Returns general service health, agent mode, and FalkorDB connectivity."""
    db_healthy, diag = db_manager.check_health()
    return {
        "status": "HEALTHY" if db_healthy else "DEGRADED",
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "agent_mode": config.AGENT_MODE,
        "database_connected": db_healthy,
        "falkordb_host": f"{config.FALKORDB_HOST}:{config.FALKORDB_PORT}",
        "graph_name": config.GRAPH_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/health/database")
def get_database_health():
    """Returns honest FalkorDB connectivity and metrics."""
    healthy, diag = db_manager.check_health()
    if not healthy:
        return {
            "status": "DISCONNECTED",
            "connected": False,
            "host": config.FALKORDB_HOST,
            "port": config.FALKORDB_PORT,
            "graph_name": config.GRAPH_NAME,
            "nodes": 0,
            "edges": 0,
            "error": diag.get("error")
        }
    return {
        "status": "HEALTHY",
        "connected": True,
        "host": config.FALKORDB_HOST,
        "port": config.FALKORDB_PORT,
        "graph_name": config.GRAPH_NAME,
        "nodes": diag.get("nodes", 0),
        "edges": diag.get("edges", 0),
        "error": None
    }

# --- CHAT & VOICE ENDPOINTS ---

@app.post("/api/chat")
def handle_chat(req: ChatRequest):
    """Processes chat message using deterministic graph engine or local Ollama."""
    try:
        res = chat_service.chat(
            message=req.message,
            conversation_id=req.conversation_id,
            agent_mode=req.agent_mode,
            save_memory=req.save_memory if req.save_memory is not None else True
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/voice/transcript")
def handle_voice_transcript(req: VoiceTranscriptRequest):
    """Processes browser-recognized voice transcript."""
    try:
        res = chat_service.process_voice_transcript(
            transcript=req.transcript,
            confidence=req.confidence,
            conversation_id=req.conversation_id,
            agent_mode=req.agent_mode
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MEMORY ENDPOINTS ---

@app.get("/api/memory/search")
def search_memories(q: str = "", limit: int = 20, category: Optional[str] = None):
    """Searches persistent Fact nodes stored in FalkorDB."""
    facts = chat_service.search_memory(q=q, limit=limit, category=category)
    return {"status": "SUCCESS", "data": facts, "count": len(facts)}

@app.post("/api/memory")
def create_memory(req: CreateMemoryRequest):
    """Persists a new Fact node into FalkorDB graph memory."""
    try:
        fact_node = chat_service.create_memory(
            fact=req.fact,
            entity=req.entity,
            category=req.category,
            provenance=req.provenance
        )
        return {"status": "SUCCESS", "data": fact_node}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/memory/{memory_id}")
def delete_memory(memory_id: str):
    """Deletes a Fact or Session node from FalkorDB."""
    deleted = chat_service.delete_memory(memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Memory record '{memory_id}' not found in FalkorDB.")
    return {"status": "SUCCESS", "deleted_id": memory_id, "message": "Memory record successfully deleted."}

# --- GRAPH ENDPOINTS ---

@app.get("/api/graph")
def get_full_graph(limit: int = 150):
    """Returns actual nodes and edges from FalkorDB for React Flow visualization."""
    data = chat_service.get_full_graph(limit=limit)
    return {"status": "SUCCESS", "data": data}

@app.get("/api/conversations")
def list_conversations(limit: int = 20):
    """Lists persistent chat conversations stored in FalkorDB."""
    convs = chat_service.list_conversations(limit=limit)
    return {"status": "SUCCESS", "data": convs}

@app.get("/api/conversations/{conv_id}")
def get_conversation_messages(conv_id: str):
    """Retrieves all messages for a specific conversation."""
    msgs = chat_service.get_conversation(conv_id)
    return {"status": "SUCCESS", "data": msgs}

# --- LEGACY & SPECIALIZED INVESTIGATION ENDPOINTS ---

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

# --- GATEWAY & FRONTEND ROUTING ---
@app.get("/")
def serve_index():
    """Immediately redirects browser to the active Next.js frontend on port 3000."""
    response = RedirectResponse(url="http://localhost:3000", status_code=307)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

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
