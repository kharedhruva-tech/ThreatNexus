"""
ContextGraph AI - Interactive Physics-Based Graph Visualizer.
Renders an animated, interactive HTML5 / vis.js network canvas directly inside Streamlit.
Supports color-coding by node label, glowing blast radius paths, physics stabilization,
and interactive node clicking/dragging.
"""
import json
from typing import List, Dict, Any, Optional

# Color mapping by node label
LABEL_COLORS = {
    "System": {"background": "#0284c7", "border": "#38bdf8", "highlight": "#7dd3fc"},        # Sky blue
    "Software": {"background": "#d97706", "border": "#fbbf24", "highlight": "#fde68a"},      # Amber
    "Event": {"background": "#dc2626", "border": "#f87171", "highlight": "#fca5a5"},         # Red
    "Record": {"background": "#475569", "border": "#94a3b8", "highlight": "#cbd5e1"},        # Slate
    "Session": {"background": "#7c3aed", "border": "#a855f7", "highlight": "#d8b4fe"},       # Purple
    "Investigation": {"background": "#9333ea", "border": "#c084fc", "highlight": "#e9d5ff"}, # Violet
    "Finding": {"background": "#059669", "border": "#34d399", "highlight": "#a7f3d0"},       # Emerald
    "Evidence": {"background": "#16a34a", "border": "#4ade80", "highlight": "#bbf7d0"},      # Green
    "Person": {"background": "#2563eb", "border": "#60a5fa", "highlight": "#93c5fd"},        # Blue
    "Organization": {"background": "#0891b2", "border": "#22d3ee", "highlight": "#a5f3fc"},  # Cyan
    "DEFAULT": {"background": "#374151", "border": "#6b7280", "highlight": "#9ca3af"}
}

def generate_network_html(
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
    highlight_node_ids: Optional[List[str]] = None,
    highlight_color: str = "#ef4444",
    title: str = "ContextGraph Topology",
    height: str = "600px"
) -> str:
    """
    Constructs a complete standalone HTML document embedding vis-network
    with dark-mode styling, physics simulation, node clustering, and path glow.
    """
    highlight_set = set(highlight_node_ids or [])
    
    vis_nodes = []
    for n in nodes:
        node_id = str(n.get("id", ""))
        label = n.get("label", "DEFAULT")
        name = n.get("name") or n.get("title") or n.get("id") or node_id
        is_highlighted = node_id in highlight_set
        
        base_color = LABEL_COLORS.get(label, LABEL_COLORS["DEFAULT"])
        
        if is_highlighted:
            color_cfg = {
                "background": highlight_color,
                "border": "#ffffff",
                "highlight": {"background": highlight_color, "border": "#ffffff"}
            }
            size = 32
            border_width = 3
        else:
            color_cfg = {
                "background": base_color["background"],
                "border": base_color["border"],
                "highlight": {"background": base_color["highlight"], "border": "#ffffff"}
            }
            size = 22
            border_width = 1.5

        props_str = "<br>".join([f"<b>{k}</b>: {v}" for k, v in n.get("properties", {}).items() if k not in ("id", "name", "title")][:6])
        tooltip = f"<div style='font-family:sans-serif;font-size:12px;'><b>[{label}] {name}</b><br><small>ID: {node_id}</small><hr style='margin:4px 0;'>{props_str}</div>"

        vis_nodes.append({
            "id": node_id,
            "label": name[:20] + ("..." if len(name) > 20 else ""),
            "title": tooltip,
            "group": label,
            "color": color_cfg,
            "size": size,
            "borderWidth": border_width,
            "font": {"color": "#f8fafc", "size": 13, "face": "Inter, system-ui, sans-serif"}
        })

    vis_edges = []
    for e in edges:
        s = str(e.get("start_id", ""))
        t = str(e.get("end_id", ""))
        rel_type = e.get("type", "RELATED_TO")
        
        is_path_edge = s in highlight_set and t in highlight_set
        edge_color = highlight_color if is_path_edge else "#475569"
        edge_width = 3 if is_path_edge else 1.2
        
        vis_edges.append({
            "from": s,
            "to": t,
            "label": rel_type,
            "arrows": "to",
            "color": {"color": edge_color, "highlight": "#38bdf8", "hover": "#60a5fa"},
            "width": edge_width,
            "font": {"color": "#94a3b8", "size": 10, "align": "middle", "strokeWidth": 0},
            "smooth": {"type": "curvedCW", "roundness": 0.15}
        })

    nodes_json = json.dumps(vis_nodes)
    edges_json = json.dumps(vis_edges)

    html_template = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background: #0b0f17;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }}
    #network-container {{
      width: 100%;
      height: {height};
      background: radial-gradient(circle at center, #131b2e 0%, #080c14 100%);
      border: 1px solid #1e293b;
      border-radius: 12px;
      position: relative;
    }}
    .legend-box {{
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      z-index: 100;
      max-width: 200px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }}
    .legend-item {{
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }}
    .legend-color {{
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }}
    .controls {{
      position: absolute;
      bottom: 14px;
      left: 14px;
      z-index: 100;
      display: flex;
      gap: 6px;
    }}
    .btn {{
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .btn:hover {{
      background: #334155;
      border-color: #475569;
    }}
  </style>
</head>
<body>
  <div id="network-container">
    <div class="legend-box">
      <div style="font-weight:bold;margin-bottom:6px;color:#93c5fd;">Node Palette</div>
      <div class="legend-item"><div class="legend-color" style="background:#0284c7;"></div>System</div>
      <div class="legend-item"><div class="legend-color" style="background:#d97706;"></div>Software</div>
      <div class="legend-item"><div class="legend-color" style="background:#dc2626;"></div>Incident / Event</div>
      <div class="legend-item"><div class="legend-color" style="background:#475569;"></div>Record / Log</div>
      <div class="legend-item"><div class="legend-color" style="background:#7c3aed;"></div>Memory Session</div>
      <div class="legend-item"><div class="legend-color" style="background:#059669;"></div>Finding / Evid</div>
      {"<div class='legend-item'><div class='legend-color' style='background:" + highlight_color + ";'></div><b>Highlighted Path</b></div>" if highlight_set else ""}
    </div>

    <div class="controls">
      <button class="btn" onclick="network.fit()">Fit Screen</button>
      <button class="btn" onclick="togglePhysics()">Toggle Physics</button>
    </div>
  </div>

  <script type="text/javascript">
    const nodes = new vis.DataSet({nodes_json});
    const edges = new vis.DataSet({edges_json});

    const container = document.getElementById('network-container');
    const data = {{ nodes: nodes, edges: edges }};
    const options = {{
      nodes: {{
        shape: 'dot',
        scaling: {{ min: 14, max: 36 }}
      }},
      edges: {{
        arrows: {{ to: {{ enabled: true, scaleFactor: 0.6 }} }},
        selectionWidth: 2
      }},
      physics: {{
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {{
          gravitationalConstant: -38,
          centralGravity: 0.008,
          springLength: 90,
          springConstant: 0.08,
          damping: 0.4
        }},
        stabilization: {{ iterations: 120, updateInterval: 25 }}
      }},
      interaction: {{
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true,
        keyboard: true
      }}
    }};

    let network = new vis.Network(container, data, options);
    let physicsEnabled = true;

    function togglePhysics() {{
      physicsEnabled = !physicsEnabled;
      network.setOptions({{ physics: {{ enabled: physicsEnabled }} }});
    }}
  </script>
</body>
</html>
"""
    return html_template
