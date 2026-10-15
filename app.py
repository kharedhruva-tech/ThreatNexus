"""
ContextGraph AI - Streamlit Interactive Simulation Lab.
A comprehensive, dark-themed dashboard demonstrating persistent, explainable, graph-powered agent workflows.
Features:
1. Simulation Overview
2. Interactive 2D/3D Graph Canvas (Vis.js physics & glowing paths)
3. Agent Investigation Lab (with SRE Runbook Generator & 1-Click Post-Mortem Export)
4. Dual-Agent Debate: Investigator vs Epistemic Auditor
5. "What-If" Counterfactual Chaos Outage Simulator
6. Real-Time Alert Webhook Ingestor (Prometheus / Datadog / CloudWatch)
7. Persistent Memory & Cross-Session Recall
8. Epistemic Explainability & System Health
Operates with zero external LLM API keys on top of real FalkorDB storage.
"""
import streamlit as st
import streamlit.components.v1 as components
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

# Unique Extension Services
from visualizer import generate_network_html
from whatif_simulator import whatif_simulator
from remediation_service import remediation_service
from debate_service import debate_service
from export_service import export_service
from webhook_service import webhook_service, SAMPLE_ALERTS

# --- PAGE SETUP ---
st.set_page_config(
    page_title="ContextGraph AI — Advanced Agent Lab",
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
    .zero-key-badge {
        background-color: #047857;
        color: #ecfdf5;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 12px;
    }
    .debate-bubble-investigator {
        background-color: #1e293b;
        border-left: 4px solid #38bdf8;
        padding: 14px 18px;
        border-radius: 8px;
        margin-bottom: 12px;
    }
    .debate-bubble-auditor {
        background-color: #271d3b;
        border-left: 4px solid #c084fc;
        padding: 14px 18px;
        border-radius: 8px;
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
        "2. 🔮 Interactive Graph Canvas",
        "3. 🤖 Agent Investigation Lab",
        "4. 🤼 Dual-Agent Debate",
        "5. ⚡ 'What-If' Chaos Simulator",
        "6. 🔔 Alert Webhook Ingestor",
        "7. 💾 Memory & Sessions",
        "8. 🩺 System Health & MCP"
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

    st.markdown("### 🌟 Unique Hackathon Innovations")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("""
        - 🔮 **2D/3D Interactive Canvas:** Physics-based graph canvas with live blast radius path glowing.
        - ⚡ **'What-If' Chaos Simulator:** Computes downstream transitive outage cascades before production failures.
        """)
    with c2:
        st.markdown("""
        - 🛠️ **Autonomous SRE Runbooks:** Synthesizes actionable mitigation commands grounded in FalkorDB nodes.
        - 🤼 **Dual-Agent Debate:** Investigator and Epistemic Auditor collaborate to eliminate hallucination.
        """)
    with c3:
        st.markdown("""
        - 📄 **1-Click Post-Mortem:** Generates publication-ready SRE incident reports in Markdown.
        - 🔔 **Live Alert Webhook:** Ingests raw Prometheus / Datadog alerts directly into the graph.
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
        st.info("No investigations executed yet. Head to **3. 🤖 Agent Investigation Lab** to run Event E-101 investigation!")

# ==============================================================================
# PAGE 2: INTERACTIVE 2D/3D GRAPH CANVAS (VISUALIZER)
# ==============================================================================
elif page == "2. 🔮 Interactive Graph Canvas":
    st.title("🔮 Interactive Physics-Based Graph Canvas")
    st.markdown("Explore live topology, inspect nodes, and highlight multi-hop investigation paths in real time.")

    col_v1, col_v2, col_v3 = st.columns([2, 2, 1])
    with col_v1:
        root_entity = st.text_input("Root Entity to Center Subgraph", value="SYS-AUTH-01")
    with col_v2:
        highlight_input = st.text_input("Entity IDs to Highlight Path (comma-separated)", value="E-101, SYS-AUTH-01, SW-LIBCRYPTO-21, REC-VULN-4401")
    with col_v3:
        subgraph_depth = st.slider("Depth", min_value=1, max_value=3, value=2)

    highlights = [h.strip() for h in highlight_input.split(",") if h.strip()]

    # Query subgraph
    subgraph_data = graph_service.get_subgraph(root_entity, max_depth=subgraph_depth)
    nodes = subgraph_data.get("nodes", [])
    edges = subgraph_data.get("edges", [])

    if not nodes:
        # Fallback to general sample of nodes if root entity has no direct tree
        stats = graph_service.search_entities("", limit=30)
        st.warning(f"Root entity '{root_entity}' returned 0 nodes. Showing primary scenario entities.")
        subgraph_data = graph_service.get_subgraph("E-101", max_depth=2)
        nodes = subgraph_data.get("nodes", [])
        edges = subgraph_data.get("edges", [])

    st.markdown(f"**Rendering Canvas:** `{len(nodes)}` nodes, `{len(edges)}` relationships. Drag nodes, scroll to zoom, click for properties.")
    
    html_canvas = generate_network_html(
        nodes=nodes,
        edges=edges,
        highlight_node_ids=highlights,
        highlight_color="#ef4444",
        height="640px"
    )
    components.html(html_canvas, height=660)

# ==============================================================================
# PAGE 3: AGENT INVESTIGATION LAB & RUNBOOK GENERATOR
# ==============================================================================
elif page == "3. 🤖 Agent Investigation Lab":
    st.title("🤖 Deterministic Agent Investigation Lab")
    st.markdown("Execute the deterministic graph agent, generate SRE runbooks, and export formal incident post-mortems.")

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
            st.session_state["last_investigation"] = res

    if "last_investigation" in st.session_state:
        res = st.session_state["last_investigation"]
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

        if res.get("earlier_session_id"):
            st.info(f"🔁 **Context Reused from Prior Session:** `{res['earlier_session_id']}` directly from FalkorDB graph memory.")

        # Grounded Findings
        st.markdown("#### 📜 Grounded Findings")
        for f in res.get("findings", []):
            st.markdown(f"**Finding ID:** `{f['finding_id']}` | **Sufficiency:** `{f['sufficiency']}`")
            st.markdown(f"> **Claim:** {f['claim']}")

        # Action Buttons: Runbook Generation & Post-Mortem Export
        st.markdown("---")
        st.markdown("### 🛠️ Autonomous Next-Step SRE Actions")
        act_col1, act_col2 = st.columns(2)
        
        with act_col1:
            if st.button("🔧 Generate Autonomous Remediation Runbook"):
                target = res.get("retrieved_entity_ids", ["E-101"])[0] if res.get("retrieved_entity_ids") else "E-101"
                runbook = remediation_service.generate_remediation_runbook(target)
                st.session_state["last_runbook"] = runbook
                st.success(f"Generated Runbook: {runbook['title']} ({runbook['severity']})")

        with act_col2:
            target = res.get("retrieved_entity_ids", ["E-101"])[0] if res.get("retrieved_entity_ids") else "E-101"
            runbook_to_export = st.session_state.get("last_runbook")
            post_mortem_md = export_service.generate_markdown_post_mortem(res, runbook=runbook_to_export)
            st.download_button(
                label="📄 Export 1-Click Executive Post-Mortem (Markdown)",
                data=post_mortem_md,
                file_name=f"post_mortem_{target}_{int(time.time())}.md",
                mime="text/markdown"
            )

        # Show Runbook Details if generated
        if "last_runbook" in st.session_state:
            rbk = st.session_state["last_runbook"]
            st.markdown(f"#### 📋 Active Runbook: `{rbk['runbook_id']}`")
            st.markdown(f"**Severity:** `{rbk['severity']}` | **Readiness:** `{rbk['automation_readiness']}`")
            
            for s in rbk.get("remediation_steps", []):
                st.markdown(f"**Step {s['step_number']} [{s['phase']}]: {s['action']}** (Risk: `{s['risk']}`)")
                st.code(s['command'], language="bash")
                st.caption(f"Rationale: {s['rationale']}")

            st.markdown("**FalkorDB Health Verification Check Query:**")
            st.code(rbk["cypher_verification_check"], language="cypher")

# ==============================================================================
# PAGE 4: DUAL-AGENT DEBATE (INVESTIGATOR VS AUDITOR)
# ==============================================================================
elif page == "4. 🤼 Dual-Agent Debate":
    st.title("🤼 Dual-Agent Debate: Investigator vs. Epistemic Auditor")
    st.markdown("""
    Watch two specialized deterministic agents collaborate adversarially to eliminate hallucinations:
    - **Agent Alpha (Lead Investigator):** Traverses the FalkorDB graph to formulate root-cause claims.
    - **Agent Beta (Epistemic Auditor):** Challenges logical leaps, demands telemetry proofs, and audits epistemic rules.
    """)

    col_d1, col_d2 = st.columns([3, 1])
    with col_d1:
        debate_query = st.text_input("Incident Query to Audit", value="Investigate Event E-101")
    with col_d2:
        start_debate_btn = st.button("⚔️ Launch Dual-Agent Debate", type="primary")

    if start_debate_btn and debate_query:
        with st.spinner("Agents debating graph evidence and epistemic proofs..."):
            debate_res = debate_service.run_debate(debate_query)

        st.markdown(f"### 🛡️ Debate Session: `{debate_res['debate_session_id']}` (Target: `{debate_res['target_entity']}`)")

        for r in debate_res.get("rounds", []):
            if "Investigator" in r["speaker"]:
                st.markdown(f"""
                <div class="debate-bubble-investigator">
                    <b>{r['avatar']} {r['speaker']}</b> <small>[Stance: {r['stance']}]</small><br><br>
                    {r['speech']}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="debate-bubble-auditor">
                    <b>{r['avatar']} {r['speaker']}</b> <small>[Stance: {r['stance']}]</small><br><br>
                    {r['speech']}
                </div>
                """, unsafe_allow_html=True)

        summary = debate_res.get("consensus_summary", {})
        st.success(f"**Final Consensus Verdict:** `{summary.get('consensus_verdict')}` | Epistemic Grounding Score: **{int(summary.get('epistemic_score', 0) * 100)}%**")
        st.markdown(f"> **Agreed Claim:** {summary.get('final_claim')}")

# ==============================================================================
# PAGE 5: WHAT-IF CHAOS OUTAGE SIMULATOR
# ==============================================================================
elif page == "5. ⚡ 'What-If' Chaos Simulator":
    st.title("⚡ 'What-If' Counterfactual Chaos Outage Simulator")
    st.markdown("Select any system or software and simulate what happens if it experiences catastrophic failure.")

    col_c1, col_c2 = st.columns([2, 1])
    with col_c1:
        # Dynamically query available systems from FalkorDB
        sys_options = []
        try:
            res_sys = db_manager.get_graph().query("MATCH (s:System) RETURN s.id ORDER BY s.id")
            if res_sys.result_set:
                sys_options = [r[0] for r in res_sys.result_set]
        except Exception:
            pass
        if not sys_options:
            sys_options = ["SYS-AUTH-01", "SYS-PAY-02", "SYS-DATA-03", "SYS-MON-04"]

        target_sys = st.selectbox(
            "Select Target System to Simulate Failure",
            sys_options
        )
    with col_c2:
        kill_btn = st.button("💥 Simulate System Crash (Pre-Mortem)", type="primary")

    if kill_btn:
        with st.spinner("Computing transitive blast radius across FalkorDB topology..."):
            report = whatif_simulator.simulate_system_outage(target_sys)

        st.markdown("---")
        st.subheader(f"💥 Pre-Mortem Report for `{target_sys}`")
        
        if report.get("status") == "NOT_FOUND":
            st.warning(report.get("pre_mortem_summary", f"System {target_sys} not found in graph."))
        else:
            st.markdown(f"### Risk Tier: `{report.get('risk_tier', 'MODERATE')}`")
            st.info(report.get("pre_mortem_summary", "Simulation completed."))

            k1, k2, k3, k4 = st.columns(4)
            with k1:
                st.metric("Immediate Failures (1-Hop)", report.get("immediate_hop1_failures", 0))
            with k2:
                st.metric("Secondary Failures (2-Hop)", report.get("secondary_hop2_failures", 0))
            with k3:
                st.metric("Total Severed Systems", report.get("total_downstream_systems_impacted", 0))
            with k4:
                st.metric("Cascade Duration", f"{report.get('estimated_cascade_seconds', 0)}s")

            st.markdown("#### 🚨 Cascading Dependency Impact List")
            cascading_systems = report.get("cascading_systems", [])
            if cascading_systems:
                df_casc = pd.DataFrame(cascading_systems)
                st.dataframe(df_casc, use_container_width=True)
            else:
                st.success("No downstream systems depend on this component. Failure is isolated.")

# ==============================================================================
# PAGE 6: REAL-TIME ALERT WEBHOOK INGESTOR
# ==============================================================================
elif page == "6. 🔔 Alert Webhook Ingestor":
    st.title("🔔 Real-Time Alert Webhook Ingestion")
    st.markdown("Ingest live or simulated JSON alerts from Prometheus, Datadog, or AWS CloudWatch into FalkorDB.")

    col_w1, col_w2 = st.columns([1, 2])
    with col_w1:
        selected_sample = st.selectbox("Select Sample Monitoring Alert", list(SAMPLE_ALERTS.keys()))
        sample_payload = SAMPLE_ALERTS[selected_sample]

    with col_w2:
        raw_json = st.text_area("Alert JSON Payload", value=json.dumps(sample_payload, indent=2), height=220)

    if st.button("📥 Ingest Alert & Dispatch Autonomous Agent", type="primary"):
        try:
            parsed = json.loads(raw_json)
            with st.spinner("Ingesting alert into FalkorDB graph and dispatching agent..."):
                res = webhook_service.ingest_and_investigate(parsed)

            st.success(f"Successfully ingested event `{res['ingested_event_id']}` into FalkorDB!")
            
            w_col1, w_col2 = st.columns(2)
            with w_col1:
                st.markdown("#### Ingestion Metadata")
                st.write(f"- **Event ID:** `{res['ingested_event_id']}`")
                st.write(f"- **Record ID:** `{res['ingested_record_id']}`")
                st.write(f"- **Target System:** `{res['target_system']}`")
                st.write(f"- **Source:** `{res['source']}`")
                st.write(f"- **Timestamp:** `{res['timestamp']}`")

            with w_col2:
                st.markdown("#### Immediate Agent Investigation Report")
                agent_res = res.get("agent_investigation", {})
                st.write(f"- **Intent:** `{agent_res.get('intent')}`")
                st.write(f"- **Context Status:** `{agent_res.get('reuse_outcome')}`")
                st.write(f"- **Session ID:** `{agent_res.get('session_id')}`")
                st.write(f"- **Findings Count:** `{len(agent_res.get('findings', []))}`")

        except Exception as e:
            st.error(f"Failed to process alert payload: {e}")

# ==============================================================================
# PAGE 7: MEMORY & SESSIONS
# ==============================================================================
elif page == "7. 💾 Memory & Sessions":
    st.title("💾 Persistent Cross-Session Memory in FalkorDB")
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
        st.info("No sessions stored in FalkorDB yet. Run an investigation from **3. 🤖 Agent Investigation Lab**.")

# ==============================================================================
# PAGE 8: SYSTEM HEALTH & MCP
# ==============================================================================
elif page == "8. 🩺 System Health & MCP":
    st.title("🩺 System Health & MCP Server Integration")
    st.markdown("Real-time operational status of all application tiers and FastMCP configuration.")

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
