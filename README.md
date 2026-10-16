<div align="center">

<img src="frontend/public/threatnexus-logo.jpg" alt="ThreatNexus Logo" width="180" style="border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 240, 255, 0.25);" />

# ThreatNexus
### Voice-Enabled Persistent AI Agent & Threat Intelligence Platform with FalkorDB
**Zero Paid AI APIs • Local-First Graph Memory • Deterministic Grounding • Enterprise Next.js Portal**

[![Pytest Suite](https://img.shields.io/badge/pytest-47%20passed-brightgreen.svg?style=for-the-badge&logo=pytest)](tests/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115+-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![FalkorDB](https://img.shields.io/badge/Database-FalkorDB-e63946.svg?style=for-the-badge&logo=redis)](https://falkordb.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-000000.svg?style=for-the-badge&logo=next.js)](frontend/)
[![Streamlit](https://img.shields.io/badge/Console-Streamlit%201.40+-FF4B4B.svg?style=for-the-badge&logo=streamlit)](app.py)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20Ready-2496ED.svg?style=for-the-badge&logo=docker)](Dockerfile)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

</div>

---

## 30-Second Overview

**ThreatNexus** is an autonomous, voice-enabled cybersecurity and infrastructure intelligence platform powered by **FalkorDB** graph memory. Unlike typical amnesic LLM chatbots that lose context when conversations end, ThreatNexus stores all entities, software dependencies, cyber incidents, and investigations permanently as connected knowledge graphs.

- **Deterministic Agent Engine (Default):** Operates 100% locally with zero cloud API keys, zero hallucinations, and zero cost using strict openCypher graph traversal.
- **Optional Local LLM (Mode B):** Offline integration with local Ollama (`llama3`, `mistral`), strictly grounded against retrieved graph facts with automatic deterministic fallback.
- **Persistent Graph Memory:** Cross-session memory anchors facts, causal event chains (`AFFECTS`, `LED_TO`), and system topologies in FalkorDB.
- **Cyber Holographic Portal:** Built with **Next.js 16**, **React 19**, and **Tailwind CSS**, featuring spatial glassmorphic tiles, interactive React Flow graph explorer, floating voice assistant, and live telemetry.
- **Dual Console Options:** Includes both the modern **Next.js 16 Web Portal** and the deep-analytics **Streamlit SRE Dashboard** (`app.py`).

---

## Architecture Overview

```mermaid
graph TD
    subgraph ClientLayers [Interactive Client Applications]
        WebPortal["Next.js 16 Glassmorphic Portal (localhost:3000)"]
        VoiceOrb["Holographic Voice Assistant & Web Speech API"]
        GraphExplorer["React Flow Graph Topology Visualizer"]
        StreamlitApp["Streamlit Incident & Cascade Console (localhost:8501)"]
    end

    subgraph Gateway [FastAPI Gateway & REST Service (Port 8000)]
        API_Health["GET /api/health & /api/health/database"]
        API_Chat["POST /api/chat"]
        API_Voice["POST /api/voice/transcript"]
        API_Memory["GET / POST / DELETE /api/memory"]
        API_Graph["GET /api/graph & /api/graph/subgraph"]
        API_Sim["POST /api/simulation/whatif"]
        API_Debate["POST /api/debate"]
    end

    subgraph ReasoningLayer [ThreatNexus Autonomous Engine]
        Router["Deterministic Intent Router"]
        DetEngine["Deterministic openCypher Query Planner"]
        OllamaBridge["Local Ollama Offline LLM (Optional)"]
        Explainability["7-Part Epistemic Evidence Engine"]
    end

    subgraph DatabaseLayer [FalkorDB Graph Persistence (Port 6379)]
        Falkor[(FalkorDB Instance)]
        Nodes_Entities[":System, :Software, :Record Nodes"]
        Nodes_Incidents[":Event, :Incident, :Timeline Nodes"]
        Nodes_Memory[":Fact, :Session, :Evidence Nodes"]
        Edges_Graph["-[:AFFECTS | :LED_TO | :USES | :REVISITS]->"]
    end

    WebPortal --> Gateway
    VoiceOrb --> Gateway
    StreamlitApp --> Gateway
    Gateway --> ReasoningLayer
    ReasoningLayer --> DatabaseLayer
    DatabaseLayer --> Falkor
    Falkor --- Nodes_Entities
    Falkor --- Nodes_Incidents
    Falkor --- Nodes_Memory
    Falkor --- Edges_Graph
```

---

## Key Features

| Capability | Description |
|---|---|
| **Voice-Enabled Assistant** | Native in-browser Web Speech API for voice dictation and synthesized spoken responses without streaming audio to external servers. |
| **FalkorDB Knowledge Graph** | High-performance graph queries mapping systems, software vulnerabilities, and incident timelines using native openCypher. |
| **Deterministic Intent Classification** | Regex-driven router that classifies user inquiries, checks facts, extracts subgraphs, and handles unknown questions honestly. |
| **Cross-Session Memory** | Facts recorded in Session A remain instantly retrievable in Session B, enabling cumulative investigations. |
| **Blast Radius Outage Simulator** | Counterfactual what-if chaos simulator (`/api/simulation/whatif`) to compute cascading failures before maintenance. |
| **Adversarial SRE Debate** | Dual-agent simulation evaluating root cause hypotheses from competing operational viewpoints. |
| **Production Ready** | Pre-configured `Dockerfile` and `docker-compose.yml` for instant deployment on Railway, Docker, or bare metal. |

---

## Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Docker or WSL 2 with Docker installed

---

### Step 1: Start FalkorDB
Run the official FalkorDB Docker container with persistent volume and port mapping:

```powershell
docker run -d --name falkordb -p 6379:6379 -v falkordb_data:/data --restart always falkordb/falkordb:latest
```

*Or via Docker Compose:*
```powershell
docker-compose up -d
```

Verify connectivity:
```powershell
python verify_falkordb.py
```

---

### Step 2: Seed the Knowledge Graph
Populate the database with baseline security topologies, software stacks, and incident scenarios:

```powershell
python seed_data.py
```

---

### Step 3: Launch the FastAPI Backend
Start the high-performance asynchronous REST gateway on port 8000:

```powershell
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

- API Docs (Swagger): `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/health`
- Database Telemetry: `http://localhost:8000/api/health/database`

---

### Step 4: Launch the Next.js Frontend Portal
In a new terminal window:

```powershell
cd frontend
npm install
npm run dev
```

Open your browser to **`http://localhost:3000`** to experience the ThreatNexus command center:
- **Overview & Spatial Workspace:** Real-time metrics, system health, and interactive holographic tiles.
- **Graph Explorer:** Visual graph canvas with dynamic node inspection.
- **Incident Investigation:** Cross-session evidence drawer and chronological causal timeline.
- **Scenarios & Chaos Lab:** Blast radius simulation for affected microservices.
- **Floating Voice Assistant:** Voice-driven threat queries and live memory recall.

---

### Step 5: (Optional) Launch Streamlit SRE Console
For deep incident cascade analytics and legacy tabular views:

```powershell
streamlit run app.py
```
Access at `http://localhost:8501`.

---

## Cloud Deployment

### 1. Railway.app (Backend + FalkorDB)
1. Fork or push this repository to GitHub.
2. In Railway, click **New Project** -> **Provision Redis** (or deploy FalkorDB via Docker image `falkordb/falkordb:latest`).
3. Click **Add Service** -> **GitHub Repo** and select `kharedhruva-tech/ai-agent`.
4. Add environment variables:
   - `FALKORDB_HOST`: `<Your Railway FalkorDB Host>`
   - `FALKORDB_PORT`: `<Your Railway FalkorDB Port>`
   - `PORT`: `8000`
5. Railway uses the included `Dockerfile` automatically to build, seed, and run `server.py`.

### 2. Vercel / Netlify (Frontend)
1. Import the `/frontend` directory into Vercel or Netlify.
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Configure environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-railway-url.railway.app`

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns service health, version, agent mode, and DB status |
| `GET` | `/api/health/database` | Returns live FalkorDB connectivity, node counts, edge counts |
| `POST` | `/api/chat` | Main query endpoint supporting deterministic and local Ollama modes |
| `POST` | `/api/voice/transcript` | Validates speech recognition transcript and routes to engine |
| `GET` | `/api/memory/search` | Performs full-text / openCypher search over persistent memory |
| `POST` | `/api/memory` | Creates an atomic Fact node linked to entities or investigations |
| `DELETE` | `/api/memory/{id}` | Deletes a stored Fact or Session record |
| `GET` | `/api/graph` | Extracts full topology for React Flow visualization |
| `GET` | `/api/graph/subgraph` | Extracts bounded n-hop subgraph around a specific entity |
| `GET` | `/api/graph/timeline` | Generates causal chronological incident timeline |
| `POST` | `/api/simulation/whatif` | Counterfactual blast radius outage simulator |
| `POST` | `/api/debate` | Dual-agent adversarial root cause debate |

---

## FalkorDB openCypher Schema

```cypher
// Node Labels
(:User {id, name, created_at})
(:Conversation {id, title, created_at, updated_at})
(:Message {id, sender, text, agent_mode, timestamp})
(:Fact {id, text, category, provenance, created_at})
(:System {id, name, tier, criticality, status})
(:Software {id, name, version, cve})
(:Event {id, title, severity, timestamp})
(:Session {id, title, status, timestamp})

// Edge Relationships
(:User)-[:HAS_CONVERSATION]->(:Conversation)
(:Conversation)-[:HAS_MESSAGE]->(:Message)
(:Conversation)-[:MENTIONS]->(:System)
(:Event)-[:AFFECTS]->(:System)
(:Event)-[:LED_TO]->(:Event)
(:System)-[:USES]->(:Software)
(:Session)-[:REVISITS]->(:Session)
```

---

## Automated Test Suite

ThreatNexus is verified with a comprehensive test suite covering all master agent scenarios:

```powershell
pytest -v
```

```text
============================== 47 passed in 3.78s ==============================
```

- Guaranteed zero hallucinations in deterministic mode.
- Validated graceful fallback when local Ollama is unreachable.
- Automated tests for cross-conversation fact isolation and memory retrieval.
- Cypher injection defense and bounded query security enforcement.

---

## Security & Privacy Policy

- **No Cloud AI APIs:** All agent processing happens locally. No data leaves your infrastructure.
- **Local Browser Speech:** Voice transcription and audio playback run purely through browser APIs without external audio streaming.
- **Parameterized Cypher:** Bounded graph traversals (maximum 3 hops) prevent Denial-of-Service or graph extraction exploits.
- **Full Data Sovereignty:** Complete user control over graph data with explicit memory deletion endpoints.

---

## Author & License

Designed and maintained by **[Dhruva Khare](https://github.com/kharedhruva-tech)**.  
Licensed under the [MIT License](LICENSE).
