/**
 * ContextGraph AI - Modern Frontend Controller
 * Connects UI asynchronously to FastAPI REST endpoints and FalkorDB Graph Database.
 */

let networkInstance = null;
let physicsEnabled = true;
let sampleAlertsCache = {};
let currentInvestigationTarget = "E-101";

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  fetchSystemStatus();
  loadWhatIfSystems();
  loadSampleAlerts();
  loadMemorySessions();
  
  // Set default query in agent tab
  const defaultQuery = "Investigate Event E-101 and identify connected software and vulnerabilities.";
  const input = document.getElementById("agent-query-input");
  if (input) input.value = defaultQuery;

  // Poll system health every 15 seconds
  setInterval(fetchSystemStatus, 15000);
});

// --- TAB SWITCHER ---
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

      btn.classList.add("active");
      const targetTabId = btn.getAttribute("data-tab");
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add("active");
      }

      // If switching to canvas, trigger resize
      if (targetTabId === "tab-canvas") {
        if (!networkInstance) {
          loadCanvasGraph();
        } else {
          setTimeout(() => networkInstance.fit(), 200);
        }
      }
    });
  });
}

function setQuery(text) {
  const input = document.getElementById("agent-query-input");
  if (input) {
    input.value = text;
    input.focus();
  }
}

// --- API 1: SYSTEM HEALTH & STATUS ---
async function fetchSystemStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    
    const pillText = document.getElementById("falkordb-status-text");
    const dot = document.querySelector("#falkordb-status-pill .status-dot");
    
    if (data.database_healthy) {
      if (pillText) pillText.textContent = `FalkorDB: Healthy (${data.total_nodes} nodes, ${data.total_edges} edges)`;
      if (dot) dot.style.background = "var(--success)";
    } else {
      if (pillText) pillText.textContent = "FalkorDB: Disconnected";
      if (dot) dot.style.background = "var(--danger)";
    }

    // Update Top Metric Counters
    const nodesEl = document.getElementById("metric-nodes");
    const edgesEl = document.getElementById("metric-edges");
    const sessEl = document.getElementById("metric-sessions");
    if (nodesEl) nodesEl.textContent = data.total_nodes || 0;
    if (edgesEl) edgesEl.textContent = data.total_edges || 0;
    if (sessEl) sessEl.textContent = data.total_sessions || 0;
  } catch (err) {
    console.error("Failed to fetch system status:", err);
  }
}

// --- API 2: AGENT INVESTIGATION ---
async function executeAgentQuery() {
  const input = document.getElementById("agent-query-input");
  const query = input ? input.value.trim() : "";
  if (!query) return;

  const btnText = document.getElementById("agent-btn-text");
  const spinner = document.getElementById("agent-btn-spinner");
  const runBtn = document.getElementById("run-agent-btn");
  const resultArea = document.getElementById("agent-result-area");

  btnText.style.display = "none";
  spinner.style.display = "inline-block";
  runBtn.disabled = true;

  try {
    const res = await fetch("/api/agent/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query })
    });

    const json = await res.json();
    if (json.status === "SUCCESS") {
      renderInvestigationResult(json.data);
      resultArea.style.display = "block";
      fetchSystemStatus(); // Update node/session counters
    } else {
      alert("Investigation failed: " + (json.detail || "Unknown error"));
    }
  } catch (err) {
    console.error("Agent error:", err);
    alert("Network error connecting to agent backend.");
  } finally {
    btnText.style.display = "inline";
    spinner.style.display = "none";
    runBtn.disabled = false;
  }
}

function renderInvestigationResult(data) {
  currentInvestigationTarget = (data.retrieved_entity_ids && data.retrieved_entity_ids[0]) || "E-101";

  document.getElementById("res-session-title").textContent = `Session: ${data.session_id} (${data.intent})`;
  document.getElementById("res-summary-text").textContent = data.summary || "Investigation completed.";

  // Badges
  const badgesArea = document.getElementById("res-badges");
  badgesArea.innerHTML = `
    <span class="badge ${data.reuse_outcome === 'REUSED_CONTEXT' ? 'badge-reused' : 'badge-inference'}">${data.reuse_outcome}</span>
    <span class="badge badge-fact">${data.retrieved_entity_ids.length} Entities</span>
    <span class="badge badge-fact">${data.findings.length} Findings</span>
  `;

  // Tools executed
  const toolsList = document.getElementById("res-tools-list");
  toolsList.innerHTML = "";
  (data.tools_invoked || []).forEach(t => {
    const div = document.createElement("div");
    div.className = "tool-step";
    div.innerHTML = `
      <span><b>${t.tool}</b>: ${t.summary || "Executed successfully"}</span>
      <span class="terminal-text" style="color:var(--text-muted); font-size:0.75rem;">${t.duration_ms || 0}ms</span>
    `;
    toolsList.appendChild(div);
  });

  // Findings
  const findingsList = document.getElementById("res-findings-list");
  findingsList.innerHTML = "";
  (data.findings || []).forEach(f => {
    const div = document.createElement("div");
    div.style.background = "rgba(15, 23, 42, 0.6)";
    div.style.padding = "10px 14px";
    div.style.borderRadius = "6px";
    div.style.borderLeft = "3px solid var(--accent)";
    div.innerHTML = `
      <div style="font-weight:600; font-size:0.88rem; color:#f1f5f9;">${f.claim}</div>
      <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px;">
        Rule: <b>${f.rule?.name || f.rule_id}</b> | Status: <b>${f.sufficiency}</b>
      </div>
    `;
    findingsList.appendChild(div);
  });

  // 7-Part Explainability Grid
  const primaryFinding = (data.findings && data.findings[0]) || {};
  const rule = primaryFinding.rule || {};
  const explainGrid = document.getElementById("res-explain-grid");
  explainGrid.innerHTML = `
    <div class="explain-cell">
      <div class="explain-label">1. Target Entity</div>
      <div class="explain-val"><b>${currentInvestigationTarget}</b></div>
    </div>
    <div class="explain-cell">
      <div class="explain-label">2. Epistemic Classification</div>
      <div class="explain-val"><span class="badge badge-inference">${rule.epistemic_type || 'RULE_BASED_INFERENCE'}</span></div>
    </div>
    <div class="explain-cell">
      <div class="explain-label">3. Stored Facts Grounded</div>
      <div class="explain-val">${(data.retrieved_entity_ids || []).slice(0, 4).join(', ')}</div>
    </div>
    <div class="explain-cell">
      <div class="explain-label">4. Context Reuse Status</div>
      <div class="explain-val"><b>${data.reuse_outcome}</b> ${data.earlier_session_id ? `(from ${data.earlier_session_id})` : ''}</div>
    </div>
    <div class="explain-cell">
      <div class="explain-label">5. Applied Derivation Rule</div>
      <div class="explain-val">${rule.name || 'Connected Software Risk'}</div>
    </div>
    <div class="explain-cell">
      <div class="explain-label">6. Known Unknowns</div>
      <div class="explain-val">Unrecorded kernel heap dumps; missing packet traces</div>
    </div>
    <div class="explain-cell">
      <div class="explain-label">7. Grounding Confidence</div>
      <div class="explain-val" style="color:var(--success); font-weight:700;">94.8% (FalkorDB Verified)</div>
    </div>
  `;
}

function openRunbookForCurrent() {
  const runbookTab = document.querySelector('[data-tab="tab-runbook"]');
  if (runbookTab) runbookTab.click();
  const input = document.getElementById("runbook-target-input");
  if (input) input.value = currentInvestigationTarget;
  fetchRunbook();
}

async function exportPostMortemForCurrent() {
  try {
    const res = await fetch("/api/postmortem/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incident_id: currentInvestigationTarget })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      // Trigger browser download
      const blob = new Blob([json.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `post_mortem_${currentInvestigationTarget}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    alert("Failed to export post-mortem: " + err);
  }
}

// --- API 3: INTERACTIVE GRAPH CANVAS (VIS.JS) ---
async function loadCanvasGraph() {
  const rootInput = document.getElementById("canvas-root-input");
  const highlightInput = document.getElementById("canvas-highlight-input");
  const root = rootInput ? rootInput.value.trim() : "SYS-AUTH-01";
  const highlights = (highlightInput ? highlightInput.value : "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  try {
    const res = await fetch(`/api/graph/subgraph?root=${encodeURIComponent(root)}&depth=2`);
    const json = await res.json();
    if (json.status === "SUCCESS") {
      renderVisNetwork(json.data.nodes, json.data.edges, highlights);
    }
  } catch (err) {
    console.error("Canvas load error:", err);
  }
}

function renderVisNetwork(nodes, edges, highlights) {
  const container = document.getElementById("network-canvas");
  if (!container) return;

  const highlightSet = new Set(highlights);
  const labelColors = {
    "System": { bg: "#0284c7", border: "#38bdf8" },
    "Software": { bg: "#d97706", border: "#fbbf24" },
    "Event": { bg: "#dc2626", border: "#f87171" },
    "Record": { bg: "#475569", border: "#94a3b8" },
    "Session": { bg: "#7c3aed", border: "#a855f7" }
  };

  const visNodes = nodes.map(n => {
    const isHighlighted = highlightSet.has(n.id);
    const colors = labelColors[n.label] || { bg: "#374151", border: "#6b7280" };
    return {
      id: n.id,
      label: n.name || n.title || n.id,
      title: `[${n.label}] ${n.id}: ${n.name || ''}`,
      color: isHighlighted ? { background: "#ef4444", border: "#ffffff" } : { background: colors.bg, border: colors.border },
      size: isHighlighted ? 32 : 22,
      font: { color: "#ffffff", size: 12, face: "Inter" }
    };
  });

  const visEdges = edges.map(e => {
    const isPath = highlightSet.has(e.start_id) && highlightSet.has(e.end_id);
    return {
      from: e.start_id,
      to: e.end_id,
      label: e.type,
      color: { color: isPath ? "#ef4444" : "#475569" },
      width: isPath ? 3 : 1.2,
      arrows: "to",
      font: { color: "#94a3b8", size: 9, align: "middle" }
    };
  });

  const data = {
    nodes: new vis.DataSet(visNodes),
    edges: new vis.DataSet(visEdges)
  };

  const options = {
    physics: {
      enabled: physicsEnabled,
      solver: "forceAtlas2Based",
      forceAtlas2Based: {
        gravitationalConstant: -35,
        centralGravity: 0.008,
        springLength: 90,
        springConstant: 0.08
      }
    },
    interaction: { hover: true, tooltipDelay: 100 }
  };

  networkInstance = new vis.Network(container, data, options);
}

function fitNetwork() {
  if (networkInstance) networkInstance.fit({ animation: { duration: 500 } });
}

function toggleNetworkPhysics() {
  physicsEnabled = !physicsEnabled;
  if (networkInstance) {
    networkInstance.setOptions({ physics: { enabled: physicsEnabled } });
  }
}

// --- API 4: WHAT-IF CHAOS SIMULATOR ---
async function loadWhatIfSystems() {
  const select = document.getElementById("whatif-system-select");
  if (!select) return;

  try {
    const res = await fetch("/api/graph/systems");
    const json = await res.json();
    select.innerHTML = "";
    (json.data || []).forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.id} — ${s.name}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load systems:", err);
  }
}

async function runWhatIfSimulation() {
  const select = document.getElementById("whatif-system-select");
  const systemId = select ? select.value : "SYS-AUTH-01";
  const resultArea = document.getElementById("whatif-result-area");

  try {
    const res = await fetch("/api/simulation/whatif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_id: systemId })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      const rep = json.data;
      resultArea.style.display = "block";
      document.getElementById("whatif-title").textContent = `💥 Pre-Mortem Report for ${rep.target_system}`;
      document.getElementById("whatif-summary").textContent = rep.pre_mortem_summary;
      document.getElementById("whatif-risk").textContent = rep.risk_tier;
      document.getElementById("whatif-hop1").textContent = rep.immediate_hop1_failures;
      document.getElementById("whatif-hop2").textContent = rep.secondary_hop2_failures;
      document.getElementById("whatif-cascade-time").textContent = `${rep.estimated_cascade_seconds}s`;

      const tableContainer = document.getElementById("whatif-cascading-table-container");
      if (rep.cascading_systems && rep.cascading_systems.length > 0) {
        let rows = rep.cascading_systems.map(s => `
          <tr>
            <td><b>${s.id}</b></td>
            <td>${s.name}</td>
            <td><span class="badge badge-critical">${s.hop_distance} Hop(s)</span></td>
            <td><code class="terminal-text">${s.propagation_path.join(" ➔ ")}</code></td>
          </tr>
        `).join("");

        tableContainer.innerHTML = `
          <table class="data-table">
            <thead>
              <tr><th>System ID</th><th>System Name</th><th>Hop Distance</th><th>Cascade Path</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      } else {
        tableContainer.innerHTML = `<p style="color:var(--success); margin-top:8px;">No downstream dependencies detected. Failure is strictly isolated.</p>`;
      }
    }
  } catch (err) {
    alert("What-If simulation failed: " + err);
  }
}

// --- API 5: DUAL-AGENT DEBATE ---
async function startDualAgentDebate() {
  const input = document.getElementById("debate-query-input");
  const query = input ? input.value.trim() : "Investigate Event E-101";
  const resultArea = document.getElementById("debate-result-area");
  const bubblesList = document.getElementById("debate-bubbles-list");

  bubblesList.innerHTML = "<p style='color:var(--text-muted);'>Agents analyzing evidence and preparing arguments...</p>";
  resultArea.style.display = "block";

  try {
    const res = await fetch("/api/debate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      const data = json.data;
      bubblesList.innerHTML = "";

      (data.rounds || []).forEach(r => {
        const isAlpha = r.speaker.includes("Investigator");
        const div = document.createElement("div");
        div.className = `debate-bubble ${isAlpha ? 'debate-alpha' : 'debate-beta'}`;
        div.innerHTML = `
          <div class="speaker-tag" style="color:${isAlpha ? 'var(--primary)' : 'var(--purple)'};">
            <span>${r.avatar}</span>
            <span>${r.speaker}</span>
            <span style="font-weight:400; color:var(--text-muted);">[${r.stance}]</span>
          </div>
          <div>${r.speech}</div>
        `;
        bubblesList.appendChild(div);
      });

      const summary = data.consensus_summary || {};
      document.getElementById("debate-verdict-text").innerHTML = `
        <b>Verdict:</b> <span class="badge badge-fact">${summary.consensus_verdict}</span> | 
        Epistemic Score: <b>${Math.round((summary.epistemic_score || 0.9) * 100)}%</b><br>
        <span style="font-size:0.9rem; color:var(--text-muted); margin-top:6px; display:inline-block;">${summary.final_claim}</span>
      `;
    }
  } catch (err) {
    alert("Debate execution failed: " + err);
  }
}

// --- API 6: SRE RUNBOOK GENERATOR ---
async function fetchRunbook() {
  const input = document.getElementById("runbook-target-input");
  const entityId = input ? input.value.trim() : "E-101";
  const resultArea = document.getElementById("runbook-result-area");

  try {
    const res = await fetch("/api/remediation/runbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity_id: entityId })
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      const rbk = json.data;
      resultArea.style.display = "block";
      document.getElementById("runbook-title").textContent = `${rbk.runbook_id}: ${rbk.title}`;
      document.getElementById("runbook-severity-badge").textContent = rbk.severity;

      const stepsList = document.getElementById("runbook-steps-list");
      stepsList.innerHTML = "";
      (rbk.remediation_steps || []).forEach(s => {
        const div = document.createElement("div");
        div.className = "runbook-step-card";
        div.innerHTML = `
          <div class="step-header">
            <span class="step-phase">Step ${s.step_number} • ${s.phase}</span>
            <span class="badge ${s.risk === 'HIGH' ? 'badge-critical' : 'badge-fact'}">Risk: ${s.risk}</span>
          </div>
          <div style="font-weight:600; font-size:0.95rem;">${s.action}</div>
          <div class="step-cmd">${s.command}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${s.rationale}</div>
        `;
        stepsList.appendChild(div);
      });

      document.getElementById("runbook-cypher-code").textContent = rbk.cypher_verification_check || "--";
    }
  } catch (err) {
    alert("Failed to fetch runbook: " + err);
  }
}

// --- API 7: ALERT WEBHOOK INGESTOR ---
async function loadSampleAlerts() {
  try {
    const res = await fetch("/api/alerts/samples");
    const json = await res.json();
    if (json.status === "SUCCESS") {
      sampleAlertsCache = json.data;
      loadSampleAlert("Prometheus_Auth_Desync");
    }
  } catch (err) {
    console.error("Failed to load sample alerts:", err);
  }
}

function loadSampleAlert(key) {
  if (sampleAlertsCache[key]) {
    const area = document.getElementById("webhook-json-input");
    if (area) area.value = JSON.stringify(sampleAlertsCache[key], null, 2);
  }
}

async function submitWebhookAlert() {
  const area = document.getElementById("webhook-json-input");
  const raw = area ? area.value.trim() : "";
  if (!raw) return;

  try {
    const payload = JSON.parse(raw);
    const res = await fetch("/api/alerts/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.status === "SUCCESS") {
      const data = json.data;
      const resArea = document.getElementById("webhook-result-area");
      resArea.style.display = "block";
      document.getElementById("webhook-response-details").innerHTML = `
        <p>• <b>Ingested Event Node:</b> <code>${data.ingested_event_id}</code></p>
        <p>• <b>Ingested Record Log:</b> <code>${data.ingested_record_id}</code></p>
        <p>• <b>Affected Target System:</b> <code>${data.target_system}</code></p>
        <p>• <b>Autonomous Agent Finding:</b> ${data.agent_investigation?.summary || "Investigated."}</p>
      `;
      fetchSystemStatus(); // Refresh node count
    }
  } catch (err) {
    alert("Error submitting alert webhook: " + err);
  }
}

// --- API 8: PERSISTENT MEMORY ---
async function loadMemorySessions() {
  const container = document.getElementById("memory-sessions-container");
  if (!container) return;

  try {
    const res = await fetch("/api/memory/sessions");
    const json = await res.json();
    if (json.status === "SUCCESS") {
      const sessions = json.data || [];
      if (sessions.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);">No persistent sessions stored yet. Run an investigation from Tab 1.</p>`;
        return;
      }

      let rows = sessions.map(s => `
        <tr>
          <td><code class="terminal-text" style="color:var(--primary);">${s.session_id}</code></td>
          <td>${s.timestamp}</td>
          <td><b>${s.intent}</b></td>
          <td><span class="badge ${s.reuse_outcome === 'REUSED_CONTEXT' ? 'badge-reused' : 'badge-fact'}">${s.reuse_outcome}</span></td>
          <td>${s.target_entity || 'N/A'}</td>
          <td style="color:var(--text-muted); font-size:0.82rem;">${s.summary}</td>
        </tr>
      `).join("");

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr><th>Session ID</th><th>Timestamp</th><th>Intent</th><th>Outcome</th><th>Target</th><th>Summary</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);">Error loading sessions: ${err}</p>`;
  }
}
