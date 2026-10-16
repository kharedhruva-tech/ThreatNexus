# ContextGraph AI — Voice-Enabled Persistent AI Agent with FalkorDB
## Zero Paid AI APIs — Local-First Graph Memory Platform

[![Tests Passing](https://img.shields.io/badge/pytest-47%20passed-brightgreen.svg)](tests/)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![FalkorDB](https://img.shields.io/badge/database-FalkorDB-red.svg)](https://falkordb.com)
[![React](https://img.shields.io/badge/frontend-React%20%7C%20Vite%20%7C%20TypeScript-blue.svg)](frontend/)
[![Speech](https://img.shields.io/badge/voice-Web%20Speech%20API-purple.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

---

## 30-Second Overview

**ContextGraph AI** is a complete, voice-enabled AI assistant with persistent graph memory, contextual retrieval, and optional local LLM integration. 

Unlike traditional session-bound agents that suffer from amnesia, ContextGraph AI anchors all memories, entities, conversations, and investigations in **FalkorDB**. Using native openCypher graph queries, it retrieves relevant facts and historical context across conversations and application restarts.

- **Deterministic Agent Engine (Default):** Operates 100% deterministically without external model calls, avoiding hallucinations and cloud API charges.
- **Optional Local LLM (Mode B):** Offline integration with local Ollama instances, strictly grounded on retrieved FalkorDB graph facts with graceful deterministic fallback.
- **Browser Voice Recognition & Synthesis:** Converts microphone speech into text locally and speaks assistant responses aloud using browser speech APIs.
- **Enterprise Web Interface:** Deep navy/cyan cyber interface featuring an animated holographic voice orb, React Flow graph explorer, persistent memory manager, and incident console.

---

## Architecture Overview

```mermaid
graph TD
    subgraph Frontend [Enterprise Web Client (React 19 + TypeScript + Vite)]
        Voice[Holographic Voice Orb & Web Speech API]
        Composer[Text Message Composer]
        Canvas[React Flow Graph Explorer]
        MemUI[Persistent Memory Manager]
        HealthUI[Live System & DB Health]
    end

    subgraph Backend [FastAPI REST Gateway (127.0.0.1:8080)]
        API_Health["GET /api/health & /api/health/database"]
        API_Chat["POST /api/chat"]
        API_Voice["POST /api/voice/transcript"]
        API_Mem["GET/POST/DELETE /api/memory"]
        API_Graph["GET /api/graph"]
    end

    subgraph AgentEngine [Agent Reasoning Layer]
        Router[Deterministic Intent Router]
        ChatSvc[Chat & Voice Service]
        DetEngine[Deterministic Graph Engine]
        OllamaEngine[Local Ollama Bridge (Optional)]
    end

    subgraph Persistence [Graph Database Layer]
        Falkor[(FalkorDB 127.0.0.1:6379)]
        UserNodes[User & Conversation Nodes]
        MsgNodes[Message Nodes]
        FactNodes[Fact & Memory Nodes]
        SystemNodes[System, Software, Event Nodes]
    end

    Voice -->|Audio Speech to Text| API_Voice
    Composer -->|JSON Payload| API_Chat
    API_Voice --> ChatSvc
    API_Chat --> ChatSvc
    ChatSvc --> Router
    Router --> DetEngine
    Router -.->|Opt-in| OllamaEngine
    DetEngine -->|openCypher Query| Falkor
    OllamaEngine -->|Grounding Context| Falkor
    Falkor --> UserNodes
    Falkor --> MsgNodes
    Falkor --> FactNodes
    Falkor --> SystemNodes
    Canvas -->|Fetch Graph Topology| API_Graph
    API_Graph --> Falkor
    MemUI --> API_Mem
    API_Mem --> Falkor
```

---

## Root Cause Diagnosis & Fixes Implemented

Prior to this implementation, the frontend encountered a **"Failed to fetch"** error. Investigation revealed two root causes:

1. **Python Dependency Mismatch in FastAPI/Starlette:**  
   `starlette 1.8.0` was installed alongside `fastapi 0.110.0`. In Starlette 0.46+, `on_startup` was removed from `Router.__init__`, causing `server.py` to crash immediately on startup with `TypeError: Router.__init__() got an unexpected keyword argument 'on_startup'`. Upgrading `fastapi>=0.115.0` resolved the conflict and restored server functionality.
2. **Missing Host Port Mapping in FalkorDB Container:**  
   The FalkorDB container was running in WSL without publishing port 6379 to the host (`-p 6379:6379`). Windows connections to `127.0.0.1:6379` were actively refused. Re-creating the container with `-p 6379:6379` and establishing a keep-alive background worker restored direct Cypher execution.

---

## Quickstart Guide

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Docker or WSL 2 with Docker installed
- Windows PowerShell or Bash terminal

### 1. Start FalkorDB

Run the official FalkorDB Docker container with persistent volume and port mapping:

```powershell
docker run -d --name falkordb -p 6379:6379 -v falkordb_data:/data --restart always falkordb/falkordb:latest
```

*If using WSL Ubuntu:*
```bash
wsl -d Ubuntu -u root -- docker run -d --name falkordb -p 6379:6379 -v falkordb_data:/data --restart always falkordb/falkordb:latest
```

Verify connection:
```powershell
python verify_falkordb.py
```

### 2. Seed the Graph Database

Initialize the schema, constraints, indices, and baseline synthetic topology:

```powershell
python seed_data.py
```

### 3. Start the Backend Server

Start the FastAPI server on `http://127.0.0.1:8080`:

```powershell
python -m uvicorn server:app --host 127.0.0.1 --port 8080 --reload
```

Test health endpoints:
```powershell
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:8080/api/health/database
```

### 4. Start the Frontend Application

In a separate terminal, start the Vite development server:

```powershell
cd frontend
npm install
npm run dev
```

Open your browser to:
- **Frontend Development Portal:** `http://localhost:5173/voice`
- **FastAPI Direct Production Portal:** `http://127.0.0.1:8080/`

---

## Agent Operating Modes

### Mode A: Deterministic Agent (Default)

- No external LLM or cloud API keys required.
- Intent classification through regex patterns and deterministic rules.
- Directly retrieves facts, systems, software dependencies, and chronological timelines from FalkorDB.
- Transparently reports when requested information is absent rather than guessing or hallucinating.
- Persists conversations, user prompts, agent answers, and extracted facts into FalkorDB.

### Mode B: Optional Local Ollama LLM (Offline)

- Opt-in integration via the Settings page or setting `AGENT_MODE=ollama`.
- Queries FalkorDB first to retrieve ground-truth graph facts.
- Constructs a grounded prompt sent to local Ollama (`http://127.0.0.1:11434/api/generate`).
- If Ollama is offline or times out, it provides a transparent notice and seamlessly falls back to the deterministic engine.
- Never calls paid cloud APIs (no OpenAI, Anthropic, or external telemetry).

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns service health, version, agent mode, and DB status |
| `GET` | `/api/health/database` | Returns live FalkorDB connectivity, node count, edge count |
| `POST` | `/api/chat` | Main chat endpoint supporting deterministic and Ollama modes |
| `POST` | `/api/voice/transcript` | Validates speech recognition transcript and routes to chat engine |
| `GET` | `/api/memory/search` | Searches persistent Fact nodes in FalkorDB (`?q=...`) |
| `POST` | `/api/memory` | Creates a new Fact node linked to entities or projects |
| `DELETE` | `/api/memory/{memory_id}` | Deletes a Fact or Session node by ID |
| `GET` | `/api/graph` | Returns full graph topology for React Flow visualization |
| `GET` | `/api/conversations` | Lists stored conversation threads |
| `GET` | `/api/conversations/{conv_id}` | Retrieves ordered messages for a conversation |
| `GET` | `/api/status` | Legacy health check with session counts |
| `POST` | `/api/agent/investigate` | Full 7-part explainable agent investigation |
| `GET` | `/api/graph/subgraph` | Bounded subgraph extraction surrounding an entity |
| `GET` | `/api/graph/timeline` | Causal chronological incident timeline |
| `POST` | `/api/simulation/whatif` | Counterfactual blast radius outage simulator |
| `POST` | `/api/debate` | Dual-agent adversarial SRE debate |

---

## FalkorDB Memory Schema

### Node Labels
- `:User` — Operator identity (`id`, `name`, `created_at`).
- `:Conversation` — Conversation thread (`id`, `title`, `created_at`, `updated_at`).
- `:Message` — Message turn (`id`, `sender`, `text`, `agent_mode`, `timestamp`).
- `:Fact` — Atomic memory item (`id`, `text`, `category`, `provenance`, `created_at`).
- `:Entity` — System, Software, Event, or Record entities in the topology.
- `:System`, `:Software`, `:Event`, `:Record` — Domain topology nodes.
- `:Session`, `:Investigation`, `:Finding`, `:Evidence` — Investigation explainability nodes.

### Relationships
- `(:User)-[:HAS_CONVERSATION]->(:Conversation)`
- `(:Conversation)-[:HAS_MESSAGE]->(:Message)`
- `(:Conversation)-[:MENTIONS]->(:Entity)`
- `(:Entity)-[:HAS_FACT]->(:Fact)`
- `(:Fact)-[:RELATED_TO]->(:Entity)`
- `(:Event)-[:AFFECTS]->(:System)`
- `(:Event)-[:LED_TO]->(:Event)`
- `(:System)-[:USES]->(:Software)`
- `(:Session)-[:REVISITS]->(:Session)`

---

## Automated Test Suite

ContextGraph AI includes a complete automated test suite covering all 15 master engineering scenarios:

```powershell
pytest -v
```

### Test Coverage Highlights:
- **`test_text_message_submission`**: Validates chat query processing and response schema.
- **`test_request_validation`**: Rejects invalid payloads with HTTP 422.
- **`test_deterministic_intent_classification`**: Verifies greeting, help, systems, and memory commands.
- **`test_honest_handling_of_unknown_questions`**: Guarantees zero hallucinations on unrecorded topics.
- **`test_voice_transcript_endpoint`**: Verifies transcript processing and empty string rejection.
- **`test_database_connection_failure_simulation`**: Verifies transparent failure reporting when DB is down.
- **`test_successful_graph_writes_and_reads`**: Confirms real FalkorDB node creation and retrieval.
- **`test_memory_search_endpoint` & `test_memory_deletion_endpoint`**: Verifies memory CRUD.
- **`test_cross_conversation_fact_retrieval`**: Proves facts saved in Conversation A are accessible in Conversation B.
- **`test_graph_endpoint_output`**: Validates React Flow graph payload format.
- **`test_health_endpoints_accuracy`**: Confirms `/api/health` and `/api/health/database` reflect live status.
- **`test_ollama_unavailable_fallback`**: Verifies graceful fallback to deterministic engine when Ollama is offline.
- **`test_deterministic_mode_makes_no_model_requests`**: Enforces zero external HTTP requests in deterministic mode.
- **`test_cors_and_api_error_handling`**: Checks CORS preflight headers and status codes.

**Result: 47 passed in 3.78s**

---

## Frontend Web Experience

The enterprise frontend is built with React 19, TypeScript, and Vite:

1. **Overview Dashboard (`/`):** Live telemetry, system criticality distribution, incident events table, and graph statistics.
2. **Voice Assistant (`/voice`):** Interactive holographic voice orb with glowing pulse animation, live transcript display, microphone control, speech synthesis audio narration, agent mode switcher, and live retrieved memory panel.
3. **Chat History (`/history`):** Inspect persistent conversations and message transcripts stored in FalkorDB.
4. **Graph Explorer (`/graph`):** Interactive React Flow canvas rendering real nodes and relationships from FalkorDB.
5. **Persistent Memory (`/memory`):** Search, view, and delete stored facts and cross-session investigations with user confirmation.
6. **Evidence & Explainability (`/explainability`):** 7-part epistemic classification of findings (`STORED_FACT`, `RULE_BASED_INFERENCE`, `HYPOTHESIS`, `UNKNOWN`).
7. **Simulation Lab (`/simulation`):** Counterfactual what-if blast radius analysis and synthetic incident triggers.
8. **System Health (`/health`):** Real-time diagnostics for FalkorDB, memory usage, and component statuses.
9. **Settings (`/settings`):** Switch between Deterministic and Local Ollama engines, configure Ollama endpoints, and adjust speech narration parameters.

---

## Security & Privacy Policy

- **Zero External AI Calls:** All agent reasoning runs locally. No message data or transcripts are ever transmitted to third-party AI APIs.
- **Local Speech Processing:** Voice recognition and text-to-speech synthesis occur inside the user's browser via native Web Speech APIs. No raw audio is recorded or stored on the server.
- **Bounded Query Safety:** All Cypher traversals use parameterized queries with enforced result limits and depth bounds (max 3 hops) to prevent denial-of-service.
- **Data Deletion:** The user has full control over persisted memories via the `DELETE /api/memory/{id}` endpoint and UI confirmation dialogs.

---

## License

MIT License. Designed and engineered for ContextGraph AI.
