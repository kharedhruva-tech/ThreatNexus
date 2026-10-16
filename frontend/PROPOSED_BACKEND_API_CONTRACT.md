# Proposed Backend API Contract — ContextGraph AI

> **Status:** Proposal for Teammate Review  
> **Author:** Frontend Engineering (M. Jai Manikanta)  
> **Target Consumer:** Python Backend / FalkorDB / Gemini Integration  

---

## 1. Overview & Architectural Boundary
The ContextGraph AI frontend is completely decoupled from the backend. The frontend consumes a clean typed adapter layer (`src/lib/api/apiClient.ts`). When the Python backend is launched, changing `NEXT_PUBLIC_API_URL` or setting `isDemoMode = false` seamlessly routes requests to your live endpoints.

No browser code connects directly to FalkorDB or Gemini API keys. All database drivers and generative models are encapsulated on your server.

---

## 2. Base URL
```
http://localhost:8000/api/v1
```
*(Or whatever host/port your Python application specifies; the frontend adapter is fully configurable)*

---

## 3. Endpoints Specification

### 3.1. Graph Topology
#### `GET /api/v1/graph`
Returns the knowledge graph topology (nodes and edges) for visualization and inspection.

**Query Parameters:**
- `sessionId` (optional string): Filter graph to a specific session snapshot.
- `targetEntityId` (optional string): Center graph around a target entity.
- `depth` (optional integer, default: 2): Max traversal radius.

**Response `200 OK`:**
```json
{
  "nodes": [
    {
      "id": "E-101",
      "label": "Host-Finance-01",
      "name": "Host-Finance-01",
      "type": "Host",
      "riskLevel": "CRITICAL",
      "confidence": 0.98,
      "description": "Finance jumpbox pivot host",
      "firstSeen": "2026-10-14T03:12:00Z",
      "lastObserved": "2026-10-15T14:40:00Z",
      "provenance": {
        "source": "CrowdStrike / Sysmon",
        "sessionId": "S-2026-01",
        "timestamp": "2026-10-14T03:15:00Z",
        "verified": true
      },
      "metadata": {
        "os": "Windows Server 2022",
        "ip": "10.100.4.15",
        "owner": "SecOps-Finance",
        "isSimulated": false
      },
      "tags": ["Jumpbox", "APT-41"]
    }
  ],
  "edges": [
    {
      "id": "R-209",
      "sourceId": "E-101",
      "targetId": "E-102",
      "type": "LATERAL_MOVEMENT_TO",
      "label": "LATERAL_PIVOT",
      "riskLevel": "CRITICAL",
      "confidence": 0.96,
      "weight": 0.98,
      "timestamp": "2026-10-15T08:15:00Z",
      "evidenceId": "EV-8809",
      "sessionId": "S-2026-02",
      "description": "Lateral movement from Host-Finance-01 to SQL-PROD-09 via svc_backup",
      "isSimulated": false
    }
  ],
  "summary": {
    "totalNodes": 10,
    "totalEdges": 10,
    "criticalNodes": 2,
    "sessionsCovered": 2,
    "generatedAt": "2026-10-15T23:30:00Z"
  }
}
```

---

### 3.2. Autonomous Investigation
#### `POST /api/v1/investigate`
Dispatches an autonomous agent investigation.

**Request Body:**
```json
{
  "entityId": "E-102",
  "objective": "Investigate anomalous query on core ledger database",
  "scenarioId": "SCN-01",
  "sessionId": "S-2026-02",
  "depth": 3
}
```

**Response `200 OK`:**
```json
{
  "id": "INV-2026-002",
  "status": "SUCCESS",
  "riskScore": 96,
  "riskLevel": "CRITICAL",
  "executiveSummary": "CRITICAL ALERT: SQL-PROD-09 accessed via unauthorized lateral pivot from Host-Finance-01...",
  "detailedFindings": [
    "Anomalous SELECT query on transaction tables executed by svc_backup.",
    "Cross-session memory recalled that svc_backup was compromised on Host-Finance-01 (E-101)..."
  ],
  "reasoningSteps": [
    {
      "id": "STP-201",
      "stepNumber": 1,
      "title": "Target Ingestion",
      "stage": "QUERY_DECOMPOSITION",
      "description": "Ingested target E-102...",
      "durationMs": 110,
      "status": "COMPLETED",
      "entitiesDiscovered": ["E-102"],
      "relationshipsTraversed": []
    }
  ],
  "evidenceList": [
    {
      "id": "EV-8809",
      "title": "Remote RPC Lateral Authentication",
      "factType": "FACT",
      "confidence": 0.96,
      "source": "Security Event Log 4624",
      "timestamp": "2026-10-15T08:15:00Z",
      "entityId": "E-102",
      "sessionId": "S-2026-02",
      "rawSnippet": "LogonType: 3 | TargetUserName: svc_backup...",
      "sha256": "3d4e5f6a7b8c...",
      "provenanceDetails": {
        "collector": "Domain-SIEM",
        "ingestTime": "2026-10-15T08:15:12Z",
        "immutableHash": "0x8809AB2"
      }
    }
  ],
  "subgraph": {
    "entities": [...],
    "relationships": [...],
    "highlightPath": ["E-104", "E-103", "E-101", "E-105", "E-102"]
  },
  "crossSessionMemory": {
    "originalSessionId": "S-2026-01",
    "originalEntityId": "E-101 (Host-Finance-01)",
    "recalledEntityId": "E-105 (svc_backup)",
    "contextSummary": "Session S-2026-01 discovered credentials for svc_backup were dumped from LSASS memory...",
    "significance": "Links perimeter jumpbox directly to database tier.",
    "similarityScore": 0.98,
    "timestamp": "2026-10-14T05:45:00Z",
    "bridgingRelationship": "LATERAL_PIVOT [CROSS-SESSION]"
  },
  "factsBreakdown": {
    "facts": 6,
    "inferences": 3,
    "hypotheses": 1,
    "unknowns": 0
  },
  "completedAt": "2026-10-15T18:45:00Z",
  "executionTimeMs": 1300
}
```

---

### 3.3. Sessions & Memory Bank
#### `GET /api/v1/sessions`
Returns list of historical sessions and their memory snapshots.

#### `POST /api/v1/sessions/:id/context`
Persists verified context and memory triples from an investigation into FalkorDB.

**Request Body:**
```json
{
  "sessionId": "S-2026-01",
  "title": "Jumpbox Initial Compromise",
  "storedMemoryRecords": [
    {
      "id": "MEM-101-B",
      "entityId": "E-105",
      "triple": {
        "subject": "Host-Finance-01 (E-101)",
        "predicate": "COMPROMISED_ACCOUNT",
        "object": "svc_backup (E-105)"
      },
      "storedAt": "2026-10-14T04:10:00Z",
      "relevanceScore": 0.99,
      "confidence": 0.96,
      "summary": "Service account svc_backup ticket dumped from LSASS cache."
    }
  ]
}
```

---

### 3.4. Diagnostics & Health
#### `GET /api/v1/health`
Returns connection status of backend components.

**Response `200 OK`:**
```json
{
  "status": "OPERATIONAL",
  "falkordb": "CONNECTED",
  "gemini": "CONNECTED",
  "nodeCount": 10,
  "edgeCount": 10,
  "uptimeSeconds": 84620
}
```
