"""
ContextGraph AI - Streamlit Interactive Simulation Lab.
A 7-page dark-themed dashboard demonstrating persistent, explainable, graph-powered agent workflows.
Operates with zero external LLM API keys on top of real FalkorDB storage.
"""
import streamlit as st
import pandas as pd
import json
import time
from datetime import datetime, timezone

from config import config
from database import db_manager
from schema import NODE_LABELS, RELATIONSHIP_TYPES, EPISTEMIC_STATUSES, EVIDENCE_SUFFICIENCY
from seed_data import seed_database
from graph_service import graph_service
from memory_service import memory_service
from evidence_service import evidence_service, RULES_CATALOG
from simulation_engine import simulation_engine
from agent import agent
from intent_router import INTENTS

# --- PAGE SETUP ---
st.set_page_config(
    page_title="ContextGraph AI — Simulation Lab",
    page_icon="🕸️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Dark Theme CSS Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #1a1e24;
        border: 1px solid #2d333b;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }
    .badge-stored-fact {
        background-color: #1e3a8a;
        color: #93c5fd;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.85em;
    }
    .badge-rule-inference {
        background-color: #065f46;
        color: #a7f3d0;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.85em;
    }
    .badge-hypothesis {
        background-color: #78350f;
        color: #fde68a;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.85em;
    }
    .badge-reused {
        background-color: #4c1d95;
        color: #ddd6fe;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.85em;
    }
    .zero-key-badge {
        background-color: #047857;
        color: #ecfdf5;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# --- SIDEBAR NAVIGATION ---
st.sidebar.title("ContextGraph AI")
st.sidebar.markdown(f"**Version:** `{config.APP_VERSION}`")
st.sidebar.markdown("""
<div class="zero-key-badge">
    🔒 100% Zero-API-Key Operation
</div>
""", unsafe_allow_html=True)

# Live FalkorDB Connectivity Pill
is_healthy, health_info = db_manager.check_health()
if is_healthy:
    st.sidebar.success(f"🟢 FalkorDB Connected ({health_info['nodes']} nodes, {health_info['edges']} edges)")
else:
    st.sidebar.error("🔴 FalkorDB Disconnected")

page = st.sidebar.radio(
    "Navigation",
    [
        "1. Simulation Overview",
        "2. Scenario Explorer",
        "3. Graph Explorer",
        "4. Agent Investigation",
        "5. Memory & Sessions",
        "6. Explainability",
        "7. System Health"
    ]
)

st.sidebar.markdown("---")
st.sidebar.caption("Graph Hacks 2026 — Track 1: Agents That Act on Connected Data")

# ==============================================================================
# PAGE 1: SIMULATION OVERVIEW
# ==============================================================================
if page == "1. Simulation Overview":
    st.title("ContextGraph AI — Persistent, Explainable, Graph-Powered Agent Lab")
    st.markdown("""
    **ContextGraph AI** demonstrates how autonomous AI agents transition from fragmented, session-bound memory 
    to persistent, connected reasoning using **real Cypher queries on FalkorDB**.
    """)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Graph Primary Storage", "FalkorDB (Live)", delta="Local Docker")
    with col2:
        st.metric("Total Graph Nodes", health_info.get("nodes", 0))
    with col3:
        st.metric("Total Relationships", health_info.get("edges", 0))
    with col4:
        sessions = memory_service.list_persistent_sessions(limit=50)
        st.metric("Persistent Sessions", len(sessions))

    st.markdown("### 🌟 Five Integrated Core Capabilities")
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("""
        1. **Persistent Context Memory:** Store and retrieve session histories, findings, evidence, and decisions through FalkorDB.
        2. **Connected Reasoning:** Execute real openCypher graph traversals across multi-hop software and system dependencies.
        3. **Evidence-Based Explainability:** Ground every conclusion in supporting graph paths, provenance, and documented epistemic rules.
        """)
    with c2:
        st.markdown("""
        4. **Context Reuse Engine:** Distinguish freshly discovered evidence from reused historical context across separate sessions.
        5. **Deterministic Tool Selection:** Pure Python rule-based agent routing with zero external LLM API key dependencies.
        """)

    st.markdown("---")
    st.markdown("### 📋 Recent Persistent Investigations in FalkorDB")
    if sessions:
        df_sess = pd.DataFrame([
            {
                "Session ID": s["session_id"],
                "Intent": s["intent"],
                "Outcome": s["reuse_outcome"],
                "Target": s["target_entity"] or "N/A",
                "User Request": s["request"],
                "Timestamp": s["timestamp"]
            }
            for s in sessions[:5]
        ])
        st.dataframe(df_sess, use_container_width=True)
    else:
        st.info("No investigations executed yet. Head to **4. Agent Investigation** to run Event E-101 investigation!")

# ==============================================================================
# PAGE 2: SCENARIO EXPLORER
# ==============================================================================
elif page == "2. Scenario Explorer":
    st.title("Scenario Explorer & Deterministic Simulation Engine")
    st.markdown("Explore synthetic environments and inject reproducible incidents into the graph.")

    scenario = st.selectbox(
        "Select Synthetic Scenario",
        [
            "Scenario A — Connected Systems Investigation",
            "Scenario B — Cross-Session Project Context",
            "Scenario C — Incident Timeline Reconstruction"
        ]
    )

    if "Scenario A" in scenario:
        st.subheader("Scenario A: Systems, Vulnerabilities & Cascading Failures")
        st.markdown("""
        An anomaly affects `SYS-AUTH-01`, which relies on software package `LibCrypto-v2.1`. 
        A synthetic vulnerability `CVE-SYNTH-2026-4401` threatens downstream `SYS-PAY-02`.
        """)
        col_a, col_b = st.columns(2)
        with col_a:
            st.markdown("#### Synthetic Systems & Software")
            systems = [
                {"ID": "SYS-AUTH-01", "Name": "Authentication Gateway", "Software": "SW-LIBCRYPTO-21 (LibCrypto 2.1.0)", "Status": "Degraded"},
                {"ID": "SYS-PAY-02", "Name": "Payment Processing Engine", "Software": "SW-PAYGATE-14 (PayGatewayCore)", "Status": "Impacted"},
                {"ID": "SYS-DATA-03", "Name": "Customer Vault Database", "Software": "SW-DBSYNC-30 (DbSyncService)", "Status": "Operational"}
            ]
            st.table(pd.DataFrame(systems))
        with col_b:
            st.markdown("#### Primary Vulnerability & Audit Records")
            records = [
                {"ID": "REC-VULN-4401", "Type": "Vulnerability Advisory", "Severity": "HIGH", "Affects": "SW-LIBCRYPTO-21"},
                {"ID": "REC-LOG-881", "Type": "Audit Log", "Severity": "MEDIUM", "Recorded For": "E-101"},
                {"ID": "REC-PATCH-102", "Type": "Change Management RFC", "Severity": "LOW", "Status": "PENDING_APPROVAL"}
            ]
            st.table(pd.DataFrame(records))

    elif "Scenario B" in scenario:
        st.subheader("Scenario B: Team, Architecture Documents & Prior Decisions")
        st.markdown("""
        Project **Apollo-Syn Context Resilience** contains cross-functional engineers, architecture specifications,
        and ratified architectural decisions stored in FalkorDB.
        """)
        p_col1, p_col2 = st.columns(2)
        with p_col1:
            st.markdown("#### Team Members")
            people = [
                {"ID": "USR-ALICE", "Name": "Alice Vance", "Role": "Principal Architect"},
                {"ID": "USR-BOB", "Name": "Bob Chen", "Role": "Staff Security Engineer"},
                {"ID": "USR-CHARLIE", "Name": "Charlie Diaz", "Role": "Lead SRE"}
            ]
            st.table(pd.DataFrame(people))
        with p_col2:
            st.markdown("#### Project Assets & Decisions")
            docs = [
                {"ID": "DOC-ARCH-01", "Type": "Document", "Title": "Apollo Resilience Architecture Spec"},
                {"ID": "DEC-001", "Type": "Decision", "Claim": "Adopt graph-native persistent context memory"}
            ]
            st.table(pd.DataFrame(docs))

    else:
        st.subheader("Scenario C: Sequential Incident Chronology")
        st.markdown("Chronological series of events linked by `LED_TO` relationships.")
        events = graph_service.get_incident_timeline()
        if events:
            df_ev = pd.DataFrame(events)[["event_id", "timestamp", "severity", "event_name", "caused_event_id"]]
            st.dataframe(df_ev, use_container_width=True)

    st.markdown("---")
    st.markdown("### ⚡ Predefined Simulation Event Triggers")
    t_cols = st.columns(4)
    sim_events = simulation_engine.get_available_events()
    for idx, evt in enumerate(sim_events):
        with t_cols[idx % 4]:
            if st.button(f"▶ {evt['name']}", key=f"btn_{evt['event_id']}"):
                res = simulation_engine.trigger_event(evt["event_id"])
                st.success(f"Triggered: {evt['name']} on {evt['affected_system']}")

    st.markdown("---")
    st.markdown("### 🛡️ Safe Scenario Reset Controls")
    c_res1, c_res2 = st.columns(2)
    with c_res1:
        if st.checkbox("Confirm Scenario A Reset"):
            if st.button("Reset Scenario A to Baseline"):
                simulation_engine.reset_scenario("Scenario_A", confirm=True)
                st.success("Scenario A reset completed.")
                st.rerun()
    with c_res2:
        if st.checkbox("Confirm Complete Graph Reset (All Scenarios)"):
            if st.button("🚨 Full Database Reset"):
                simulation_engine.reset_all(confirm=True)
                st.warning("All scenarios and synthetic entities re-seeded to factory baseline.")
                st.rerun()

# ==============================================================================
# PAGE 3: GRAPH EXPLORER
# ==============================================================================
elif page == "3. Graph Explorer":
    st.title("Interactive Graph Explorer & Traversal")
    st.markdown("Inspect entities, direct neighbors, and bounded multi-hop paths queried live from FalkorDB.")

    tab1, tab2, tab3 = st.tabs(["🔍 Entity Search & Details", "🔗 Direct Neighbors", "🌐 Multi-Hop Path Tracer"])

    with tab1:
        col_s1, col_s2 = st.columns([3, 1])
        with col_s1:
            kw = st.text_input("Search entities by ID or keyword", value="SYS-AUTH-01")
        with col_s2:
            lim = st.number_input("Limit", min_value=1, max_value=50, value=15)

        if kw:
            matches = graph_service.search_entities(kw, limit=lim)
            if matches:
                st.markdown(f"Found **{len(matches)}** matching entities:")
                df_matches = pd.DataFrame([
                    {"Label": m["label"], "ID": m["id"], "Name / Claim": m["display_name"]}
                    for m in matches
                ])
                st.dataframe(df_matches, use_container_width=True)

                selected_id = st.selectbox("Inspect properties for entity:", [m["id"] for m in matches])
                if selected_id:
                    details = graph_service.get_entity_details(selected_id)
                    st.json(details)
            else:
                st.warning(f"No entities found matching '{kw}'.")

    with tab2:
        n_id = st.text_input("Entity ID to inspect direct connections", value="E-101")
        if n_id:
            neighbors = graph_service.find_related_records(n_id, limit=30)
            if neighbors:
                st.markdown(f"**{len(neighbors)}** direct connected relationships:")
                df_neigh = pd.DataFrame([
                    {
                        "Source": n["source_id"],
                        "Direction": n["direction"],
                        "Relationship": n["relationship"],
                        "Target ID": n["target_id"],
                        "Target Label": n["target_label"],
                        "Target Name": n["target_name"]
                    }
                    for n in neighbors
                ])
                st.dataframe(df_neigh, use_container_width=True)
            else:
                st.info(f"No direct relationships found for '{n_id}'.")

    with tab3:
        st.markdown("#### Bounded Multi-Hop Path Discovery")
        c_p1, c_p2, c_p3 = st.columns(3)
        with c_p1:
            start_entity = st.text_input("Start Entity ID", value="E-101")
        with c_p2:
            end_entity = st.text_input("End Entity ID", value="SW-LIBCRYPTO-21")
        with c_p3:
            depth = st.slider("Max Traversal Depth", min_value=1, max_value=3, value=3)

        if st.button("Trace Path in FalkorDB"):
            paths = graph_service.trace_multi_hop_relationships(start_entity, end_entity, max_depth=depth)
            if paths:
                st.success(f"Discovered {len(paths)} qualifying path(s) between `{start_entity}` and `{end_entity}`:")
                for idx, p in enumerate(paths):
                    st.markdown(f"**Path #{idx + 1} (Hops: {p['path_length']}):**")
                    chain = " ➔ ".join([f"`{n['id']}` ({n['label']})" for n in p["path_nodes"]])
                    st.markdown(f"> {chain}")
                    st.json(p["path_relationships"])
            else:
                st.warning(f"No qualifying path found between `{start_entity}` and `{end_entity}` within depth {depth}.")

# ==============================================================================
# PAGE 4: AGENT INVESTIGATION
# ==============================================================================
elif page == "4. Agent Investigation":
    st.title("Deterministic Agent Investigation")
    st.markdown("""
    Execute the deterministic agent with transparent intent routing, FalkorDB Cypher traversals,
    and automatic session persistence.
    """)

    # Quick Demo Launch Buttons (Section 16 E2E Workflow)
    st.markdown("#### ⚡ Quick-Run Demonstration Prompts")
    demo_cols = st.columns(3)
    preset_query = ""
    with demo_cols[0]:
        if st.button("Step B: Investigate Event E-101"):
            preset_query = "Investigate Event E-101 and identify relevant connected systems, records, and supporting evidence."
    with demo_cols[1]:
        if st.button("Step D: Investigate Event E-102 (Context Reuse)"):
            preset_query = "What did we discover earlier, and is that information relevant to Event E-102?"
    with demo_cols[2]:
        if st.button("Reconstruct Incident Timeline"):
            preset_query = "Reconstruct the timeline of events and dependencies."

    query_input = st.text_area(
        "User Request",
        value=preset_query if preset_query else "Investigate Event E-101 and identify relevant connected systems, records, and supporting evidence.",
        height=70
    )

    col_opt1, col_opt2 = st.columns([2, 1])
    with col_opt1:
        explicit_intent = st.selectbox(
            "Explicit Operation Selector (Optional - Override Router)",
            ["(Automatic Intent Detection)"] + list(INTENTS.keys())
        )
    with col_opt2:
        run_btn = st.button("🚀 Run Agent Investigation", type="primary")

    if run_btn and query_input.strip():
        override = None if explicit_intent == "(Automatic Intent Detection)" else explicit_intent
        
        with st.spinner("Agent running Cypher queries against FalkorDB..."):
            res = agent.run(query_input.strip(), explicit_intent=override)

        st.markdown("---")
        st.markdown(f"### 🎯 Investigation Execution Result: `{res.get('session_id', 'N/A')}`")

        # Top summary badge metrics
        m1, m2, m3, m4 = st.columns(4)
        with m1:
            st.metric("Detected Intent", res.get("intent"))
        with m2:
            st.metric("Context Status", res.get("reuse_outcome"))
        with m3:
            st.metric("Retrieved Entities", len(res.get("retrieved_entity_ids", [])))
        with m4:
            st.metric("Generated Findings", len(res.get("findings", [])))

        # Prior context reuse callout
        if res.get("earlier_session_id"):
            st.info(f"🔁 **Context Reused from Prior Session:** `{res['earlier_session_id']}` directly from FalkorDB graph memory.")

        # Tool execution audit trail
        st.markdown("#### 🛠️ Deterministic Tool Invocations Log")
        tools_df = pd.DataFrame(res.get("tools_invoked", []))
        if not tools_df.empty:
            st.dataframe(tools_df[["tool", "status", "duration_ms", "summary"]], use_container_width=True)

        # Grounded Findings
        st.markdown("#### 📜 Grounded Findings")
        for f in res.get("findings", []):
            st.markdown(f"**Finding ID:** `{f['finding_id']}` | **Sufficiency:** `{f['sufficiency']}`")
            st.markdown(f"> **Claim:** {f['claim']}")
            if f.get("graph_paths"):
                st.markdown("**Supporting Graph Path Traversed in FalkorDB:**")
                st.json(f["graph_paths"])

        # Evidence Items
        st.markdown("#### 🔬 Formulated Evidence & Provenance")
        for ev in res.get("evidence", []):
            st.markdown(f"**Evidence ID:** `{ev['evidence_id']}` | **Type:** `{ev['epistemic_type']}` | **Rule:** `{ev['rule_name']}`")
            st.markdown(f"> {ev['claim']}")
            if ev.get("missing_evidence"):
                st.markdown(f"⚠️ **Missing Unobserved Evidence:** `{', '.join(ev['missing_evidence'])}`")

# ==============================================================================
# PAGE 5: MEMORY AND SESSIONS
# ==============================================================================
elif page == "5. Memory & Sessions":
    st.title("Persistent Cross-Session Memory in FalkorDB")
    st.markdown("""
    All session interactions, investigations, and findings persist across application restarts
    as first-class graph nodes in FalkorDB.
    """)

    sessions = memory_service.list_persistent_sessions(limit=50)
    if sessions:
        st.markdown(f"**{len(sessions)} Persistent Sessions Recorded:**")
        df_all_sess = pd.DataFrame([
            {
                "Session ID": s["session_id"],
                "Timestamp": s["timestamp"],
                "Intent": s["intent"],
                "Outcome": s["reuse_outcome"],
                "Target Entity": s["target_entity"] or "None",
                "Revisited Session": s["revisited_session_id"] or "Fresh",
                "Summary": s["summary"]
            }
            for s in sessions
        ])
        st.dataframe(df_all_sess, use_container_width=True)

        selected_s_id = st.selectbox("Select Session to Inspect Full Graph Record:", [s["session_id"] for s in sessions])
        if selected_s_id:
            s_full = memory_service.retrieve_session_by_id(selected_s_id)
            if s_full:
                st.markdown("#### Session Graph Record Details")
                st.json(s_full)
    else:
        st.info("No sessions stored in FalkorDB yet. Run an investigation from **4. Agent Investigation**.")

# ==============================================================================
# PAGE 6: EXPLAINABILITY
# ==============================================================================
elif page == "6. Explainability":
    st.title("Traceable Evidence & Epistemic Explainability")
    st.markdown("""
    Every important conclusion is backed by explicit epistemic classifications, derivation rules,
    and verified Cypher graph paths.
    """)

    st.markdown("### 📚 Grounded Epistemic Catalog")
    st.markdown("""
    | Category | Definition | Status |
    | :--- | :--- | :--- |
    | **STORED_FACT** | Directly recorded property or relationship in FalkorDB | Verified |
    | **RULE_BASED_INFERENCE** | Derived from stored facts using a documented rule | Inferred |
    | **HYPOTHESIS** | Plausible explanation lacking sufficient supporting evidence | Unproven |
    | **UNKNOWN** | Information cannot be established from available records | Missing |
    """)

    st.markdown("---")
    st.markdown("### 🔎 7-Part Explainability Breakdown")
    sample_finding = {
        "finding_id": "FND-AUTH-DESYNC",
        "claim": "SYS-AUTH-01 experienced a signature desync event correlated with LibCrypto vulnerability CVE-SYNTH-2026-4401.",
        "sufficiency": "SUPPORTED",
        "supporting_evidence_ids": ["EVID-AUTH-01", "REC-VULN-4401"],
        "graph_paths": ["(E-101)-[:AFFECTS]->(SYS-AUTH-01)-[:USES]->(LibCrypto)"],
        "rule": RULES_CATALOG["RULE-CONNECTED-SOFTWARE-RISK"],
        "source_session_id": "CURRENT_SESSION",
        "unknowns": ["Direct memory exploit trace is absent from current logs."],
        "missing_evidence": ["Full packet payload capture of the anomalous signature burst."]
    }

    exp = evidence_service.format_explanation(sample_finding)
    
    st.markdown(f"1. **What was concluded:**\n> {exp['conclusion']}")
    st.markdown(f"2. **Which evidence supports it:** `{', '.join(exp['supporting_evidence_ids'])}`")
    st.markdown(f"3. **Graph path used in FalkorDB:** `{exp['graph_paths']}`")
    st.markdown(f"4. **Which rule was applied:** `{exp['applied_rule']['name']}` (`{exp['applied_rule']['epistemic_type']}`)")
    st.markdown(f"5. **Which earlier session contributed information:** `{exp['contributing_session_id']}`")
    st.markdown(f"6. **What remains unknown:** `{', '.join(exp['unknowns'])}`")
    st.markdown(f"7. **Additional evidence that would strengthen it:** `{', '.join(exp['strengthening_evidence_needed'])}`")

# ==============================================================================
# PAGE 7: SYSTEM HEALTH
# ==============================================================================
elif page == "7. System Health":
    st.title("System Health & Diagnostic Telemetry")
    st.markdown("Real-time operational status of all application tiers.")

    ok, h_info = db_manager.check_health()
    
    col_h1, col_h2 = st.columns(2)
    with col_h1:
        st.markdown("#### Primary Database Tier (FalkorDB)")
        st.write(f"**Connection Status:** {'🟢 HEALTHY' if ok else '🔴 OFFLINE'}")
        st.write(f"**Database Host:** `{config.FALKORDB_HOST}:{config.FALKORDB_PORT}`")
        st.write(f"**Primary Graph Name:** `{config.GRAPH_NAME}`")
        st.write(f"**Active Node Count:** {h_info.get('nodes', 0)}")
        st.write(f"**Active Edge Count:** {h_info.get('edges', 0)}")
        st.write(f"**Error Diagnostics:** {h_info.get('error') or 'None'}")

    with col_h2:
        st.markdown("#### Agent & Protocol Tier")
        st.write(f"**Application Version:** `{config.APP_VERSION}`")
        st.write(f"**Environment:** `{config.ENVIRONMENT}`")
        st.write("**LLM API Key Policy:** `Zero-cost, 100% deterministic local-first`")
        st.write(f"**Max Traversal Depth:** `{config.MAX_TRAVERSAL_DEPTH} hops`")
        st.write(f"**Max Query Limit:** `{config.MAX_QUERY_RESULTS} records`")

    st.markdown("---")
    st.markdown("### 🔌 Model Context Protocol (MCP) Server Integration")
    st.markdown("""
    The MCP server runs independently via `mcp_server.py` using the official FastMCP SDK.
    """)
    st.code("""
# Start the MCP server:
python mcp_server.py

# Configure in Claude Desktop or compatible client (claude_desktop_config.json):
{
  "mcpServers": {
    "contextgraph": {
      "command": "python",
      "args": ["d:/PROJECT/ai-agent/mcp_server.py"]
    }
  }
}
    """, language="json")
