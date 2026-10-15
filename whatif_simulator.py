"""
ContextGraph AI - What-If Counterfactual Outage Simulator.
Executes forward-looking chaos simulations against the FalkorDB dependency graph.
Answers: "If System X crashes right now, what cascades, what breaks, and within how many seconds?"
"""
from typing import Dict, Any, List, Optional
from database import db_manager
from graph_service import graph_service

class WhatIfSimulator:
    def __init__(self, manager=db_manager):
        self.manager = manager
        self.graph_service = graph_service

    def simulate_system_outage(self, target_system_id: str) -> Dict[str, Any]:
        """
        Calculates the complete downstream transitive blast radius if `target_system_id` fails.
        Traces DEPENDS_ON, USES, and AFFECTS relationships up to 3 hops in FalkorDB.
        """
        graph = self.manager.get_graph()
        
        # 1. Fetch target details
        target_details = self.graph_service.get_entity_details(target_system_id)
        if not target_details:
            return {
                "status": "NOT_FOUND",
                "message": f"Target entity '{target_system_id}' was not found in FalkorDB."
            }

        # 2. Query all downstream dependent systems via incoming DEPENDS_ON
        cypher_downstream = """
        MATCH path = (downstream:System)-[:DEPENDS_ON*1..3]->(target:System {id: $target_id})
        RETURN downstream.id AS id, downstream.name AS name, length(path) AS hops,
               [n in nodes(path) | n.id] AS path_nodes
        ORDER BY hops ASC
        """
        res_downstream = graph.query(cypher_downstream, {"target_id": target_system_id})
        
        cascading_systems = []
        hop_1_count = 0
        hop_2_count = 0
        hop_3_count = 0
        affected_node_ids = {target_system_id}

        if res_downstream.result_set:
            for row in res_downstream.result_set:
                sys_id, sys_name, hops, path_nodes = row[0], row[1], row[2], row[3]
                affected_node_ids.add(sys_id)
                for nid in path_nodes:
                    affected_node_ids.add(nid)
                    
                if hops == 1:
                    hop_1_count += 1
                elif hops == 2:
                    hop_2_count += 1
                else:
                    hop_3_count += 1
                    
                cascading_systems.append({
                    "id": sys_id,
                    "name": sys_name,
                    "hop_distance": hops,
                    "propagation_path": path_nodes
                })

        # 3. Query software dependencies and vulnerability risks
        cypher_sw = """
        MATCH (target:System {id: $target_id})-[:USES]->(sw:Software)
        OPTIONAL MATCH (target)<-[:AFFECTS]-(evt:Event)
        RETURN collect(DISTINCT sw.id) AS software, collect(DISTINCT evt.id) AS past_events
        """
        res_sw = graph.query(cypher_sw, {"target_id": target_system_id})
        connected_sw = []
        past_events = []
        if res_sw.result_set:
            connected_sw = res_sw.result_set[0][0] or []
            past_events = res_sw.result_set[0][1] or []
            affected_node_ids.update(connected_sw)
            affected_node_ids.update(past_events)

        # 4. Assess risk tier and timing
        total_affected = len(cascading_systems)
        if total_affected >= 3 or "SYS-AUTH" in target_system_id or "SYS-GATEWAY" in target_system_id:
            risk_tier = "CRITICAL / CATASTROPHIC"
            est_time_seconds = 15
        elif total_affected >= 1:
            risk_tier = "HIGH"
            est_time_seconds = 35
        else:
            risk_tier = "MODERATE (ISOLATED)"
            est_time_seconds = 60

        # 5. Formulate Pre-Mortem Narrative
        narrative = (
            f"PRE-MORTEM OUTAGE REPORT: If '{target_system_id}' experiences catastrophic failure, "
            f"{hop_1_count} direct upstream service(s) will encounter connection resets within 5 seconds. "
            f"Secondary dependency propagation will cascade to {hop_2_count} additional system(s) in ~{est_time_seconds}s. "
            f"Total downstream services rendered unresponsive: {total_affected}."
        )

        return {
            "status": "SIMULATION_COMPLETE",
            "target_system": target_system_id,
            "target_properties": target_details.get("properties", {}),
            "risk_tier": risk_tier,
            "estimated_cascade_seconds": est_time_seconds,
            "immediate_hop1_failures": hop_1_count,
            "secondary_hop2_failures": hop_2_count,
            "tertiary_hop3_failures": hop_3_count,
            "total_downstream_systems_impacted": total_affected,
            "cascading_systems": cascading_systems,
            "connected_software": connected_sw,
            "past_correlated_events": past_events,
            "affected_node_ids": list(affected_node_ids),
            "pre_mortem_summary": narrative
        }

whatif_simulator = WhatIfSimulator()
