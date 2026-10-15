# ContextGraph AI — Judge-Facing Demo Walkthrough

### Workflow Title:
**"From Fragmented Records to Persistent, Explainable Context"**

---

## Prerequisites
1. FalkorDB active on `127.0.0.1:6379`.
2. Streamlit running:
   ```powershell
   streamlit run app.py
   ```
3. Open browser at `http://localhost:8501`.

---

## Step A — Initialize Simulation
1. Navigate to **2. Scenario Explorer**.
2. Select **Scenario A — Connected Systems Investigation**.
3. Point out the synthetic infrastructure:
   - `SYS-AUTH-01` (Authentication Gateway) uses `SW-LIBCRYPTO-21`.
   - `REC-VULN-4401` exposes `CVE-SYNTH-2026-4401` on LibCrypto.
   - `SYS-PAY-02` (Payment Processing Engine) runtime-depends on `SYS-AUTH-01`.

---

## Step B — Investigate Event E-101
1. Navigate to **4. Agent Investigation**.
2. Click the quick-run button: **"Step B: Investigate Event E-101"**.
   - Query: `"Investigate Event E-101 and identify relevant connected systems, records, and supporting evidence."`
3. Click **🚀 Run Agent Investigation**.
4. **Key Observations**:
   - Intent Router automatically selected `INVESTIGATE_EVENT`.
   - Context Status is `NO_RELEVANT_PRIOR_CONTEXT` (First-time fresh investigation).
   - Tool execution audit log shows Cypher traversals discovering `(E-101)-[:AFFECTS]->(SYS-AUTH-01)-[:USES]->(LibCrypto)`.
   - Generated Finding `FND-AUTH-DESYNC` and Evidence item `EVID-...` grounded in `RULE-CONNECTED-SOFTWARE-RISK`.
   - Point out that the session is persisted directly into FalkorDB with a unique session ID (e.g. `SESS-XXXX`).

---

## Step C — Start a New Session & Verify Persistence
1. Navigate to **5. Memory & Sessions**.
2. Show that `SESS-XXXX` is already recorded in FalkorDB with its full graph record, findings, and evidence references.
3. Refresh the browser or restart the Streamlit server: the session remains permanently stored in FalkorDB disk storage.

---

## Step D — Investigate Event E-102 with Context Reuse
1. Return to **4. Agent Investigation**.
2. Click the quick-run button: **"Step D: Investigate Event E-102 (Context Reuse)"**.
   - Query: `"What did we discover earlier, and is that information relevant to Event E-102?"`
3. Click **🚀 Run Agent Investigation**.
4. **Key Observations**:
   - The agent does NOT re-investigate from zero.
   - It invokes `evaluate_context_reuse` against FalkorDB.
   - **Context Status:** `REUSED_CONTEXT` / `EXTENDED_INVESTIGATION`.
   - It identifies that `SYS-PAY-02` depends on `SYS-AUTH-01`, which had the E-101 desync discovered in the earlier session!
   - Shows the blue banner: `"Context Reused from Prior Session: SESS-XXXX"`.
   - It derives a new finding that E-102 is a downstream propagated timeout, linking back to the prior session via `(:Session)-[:REVISITS]->(:Session)` in FalkorDB.

---

## Step E — Inspect Traceable Explainability
1. Navigate to **6. Explainability**.
2. Review the **7-part explainability breakdown**:
   - Conclusion, Supporting Evidence IDs, Exact Graph Path, Derivation Rule (`RULE-DOWNSTREAM-DEPENDENCY-PROPAGATION`), Contributing Session, Unknowns, and Strengthening Evidence Needed.
3. Contrast **Stored Fact** vs **Rule-Based Inference** vs **Hypothesis**.

---

## Step F — Inspect Graph Explorer
1. Navigate to **3. Graph Explorer**.
2. In tab **Multi-Hop Path Tracer**, enter:
   - Start: `E-101`
   - End: `SW-LIBCRYPTO-21`
   - Click **Trace Path in FalkorDB**.
3. Point out the exact openCypher traversal path:
   `E-101 (Event) ➔ SYS-AUTH-01 (System) ➔ SW-LIBCRYPTO-21 (Software)`

---

## Step G — Review Persistent State & System Health
1. Navigate to **7. System Health**.
2. Show that all database metrics, node counts, and edge counts come from live FalkorDB queries.
3. Emphasize:
   - **Zero API keys required.**
   - **Zero mock data.**
   - **All 26 automated tests passing.**
