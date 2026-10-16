# ContextGraph AI — Frontend Setup & Integration Guide

**Author:** M. Jai Manikanta (Frontend Engineer & UI/UX Designer)  
**Target:** Teammate (Python Backend, FalkorDB & Gemini Integration)  

---

## 1. Quick Start (Running Frontend Locally)

### Prerequisites
- Node.js v20+ / v24+
- npm v10+

### Install Dependencies
```bash
npm install
```

### Run Dev Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Run Production Build Validation
```bash
npm run build
```

---

## 2. Standalone Frontend Demo Mode vs. Live Backend Mode

The frontend operates in **Demo Mode by default**, providing a complete, high-fidelity experience with realistic synthetic data:
- **Visual Badging:** Explicit `DEMO DATA` / `SIMULATED` badges are visible throughout all 8 pages.
- **Repeatable Hackathon Flow:** The primary demo flow `E-101 ➔ S-2026-01 Context Preservation ➔ E-102 Cross-Session Recall` is fully functional and repeatable out of the box.

### Connecting Your Real Python Backend
When your Python API server is running:
1. In `src/lib/api/apiClient.ts`, set `isDemoMode: false` or provide an environment variable:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
2. Or use the interactive endpoint tester on the **System Health** page (`/health`) to test connection pings.
3. Your endpoints should match the schemas defined in [`PROPOSED_BACKEND_API_CONTRACT.md`](./PROPOSED_BACKEND_API_CONTRACT.md).

---

## 3. What is Simulated vs. What Requires Future Backend Integration

| Feature | Simulated Status (Current Frontend) | Future Backend Integration (Your Responsibility) |
|---|---|---|
| **Graph Topology & Nodes** | 10 realistic cybersecurity entities (`E-101` to `E-110`) and 10 relationships with coordinates. | Real Cypher query execution against FalkorDB. |
| **Agent Reasoning Engine** | 5-stage simulated reasoning timeline with 200ms delays. | Real Gemini API prompt chains / function-calling runs. |
| **Cross-Session Memory Bank** | Stored memory triples (`svc_backup` Kerberoasting) committed into React Context state. | Vector embeddings & graph memory persistence in FalkorDB. |
| **Evidence Corpus & Raw Logs** | 9 cryptographically hashed synthetic Sysmon/Zeek/PostgreSQL records. | Live SIEM/EDR log collectors & ingestion pipeline. |
| **Security & Secrets** | Zero credentials or keys in frontend. | Python backend securely holds `GEMINI_API_KEY` and FalkorDB credentials. |

---

## 4. Eight Implemented Pages Tour
1. **`/` (Overview):** Platform telemetry, entity/relationship counters, threat level, live mini-graph preview, and one-click demo triggers.
2. **`/scenarios` (Scenario Explorer):** 3 preset threat scenarios (APT-41 Phantom Pivot, Supply Chain Infiltration, Domain Escalation) with instant launch into workspace.
3. **`/graph` (Graph Explorer):** Fullscreen interactive canvas powered by `@xyflow/react` with custom Liquid Glass nodes, animated edges, type filters, risk filters, node inspector drawer, and edge inspector drawer.
4. **`/investigation` (Agent Investigation):** Autonomous reasoning workbench with entity input, multi-stage timeline, subgraph visualization, and cross-session memory highlight.
5. **`/sessions` (Memory & Sessions):** Timeline of investigations (`S-2026-01`, `S-2026-02`, `S-2026-03`), memory triples bank, and interactive new session creator.
6. **`/comparison` (Before vs. After):** Side-by-side comparison of siloed log search vs ContextGraph connected memory.
7. **`/explainability` (Explainability):** Fact classification matrix (Facts, Inferences, Hypotheses, Unknowns), multi-hop provenance chain, and evidence table.
8. **`/health` (System Health):** Runtime diagnostic cards, mock vs live status, and backend ping tester.

---

## 5. Visual Design System
- **Liquid Glass Aesthetic:** Deep midnight navy background (`#070B14`), frosted translucent panels with `backdrop-filter: blur(16px)`, specular top reflections, controlled cyan (`#06b6d4`) and teal (`#14b8a6`) luminous highlights.
- **Edge Panel Drawers:** Slide-over inspectors for deep inspection without navigating away from the graph canvas.
- **Responsive & Accessible:** Reduced-motion media query support, high-contrast text, visible focus rings.
