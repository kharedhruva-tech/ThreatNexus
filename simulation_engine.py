"""
ContextGraph AI - Deterministic Simulation Engine.
Provides reproducible event injection, scenario management, state inspection,
and safe confirmed reset operations against FalkorDB.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
from database import db_manager
from seed_data import seed_database, reset_scenario_data

PREDEFINED_SIMULATION_EVENTS = [
    {
        "event_id": "SIM-EVT-01",
        "name": "Trigger Config Drift on Auth Cluster",
        "description": "Simulates unscheduled certificate authority rotation drift affecting SYS-AUTH-01.",
        "affected_system": "SYS-AUTH-01",
        "scenario": "Scenario_A"
    },
    {
        "event_id": "SIM-EVT-02",
        "name": "Trigger Signature Desync (E-101)",
        "description": "Simulates RSA key desync event E-101 under concurrency via LibCrypto.",
        "affected_system": "SYS-AUTH-01",
        "scenario": "Scenario_A"
    },
    {
        "event_id": "SIM-EVT-03",
        "name": "Trigger Downstream Payment Timeout (E-102)",
        "description": "Propagates failure from SYS-AUTH-01 to dependent payment gateway SYS-PAY-02.",
        "affected_system": "SYS-PAY-02",
        "scenario": "Scenario_A"
    },
    {
        "event_id": "SIM-EVT-04",
        "name": "Engage Circuit Breaker Auto-Remediation",
        "description": "Engages circuit breaker on SYS-PAY-02, isolating auth degradation.",
        "affected_system": "SYS-PAY-02",
        "scenario": "Scenario_C"
    }
]

class SimulationEngine:
    def __init__(self, manager=db_manager):
        self.manager = manager
        self.activity_log: List[Dict[str, Any]] = []

    def get_available_events(self) -> List[Dict[str, Any]]:
        return PREDEFINED_SIMULATION_EVENTS

    def trigger_event(self, event_id: str) -> Dict[str, Any]:
        """
        Executes a deterministic simulation event update in FalkorDB.
        """
        graph = self.manager.get_graph()
        matched = next((e for e in PREDEFINED_SIMULATION_EVENTS if e["event_id"] == event_id), None)
        if not matched:
            return {"status": "ERROR", "message": f"Unknown simulation event {event_id}"}

        now_utc = datetime.now(timezone.utc).isoformat()
        
        # Update system status in FalkorDB
        sys_id = matched["affected_system"]
        if event_id in ["SIM-EVT-01", "SIM-EVT-02"]:
            graph.query("MATCH (s:System {id: $id}) SET s.status = 'degraded', s.last_incident = $ts", {"id": sys_id, "ts": now_utc})
        elif event_id == "SIM-EVT-03":
            graph.query("MATCH (s:System {id: $id}) SET s.status = 'impacted', s.last_incident = $ts", {"id": sys_id, "ts": now_utc})
        elif event_id == "SIM-EVT-04":
            graph.query("MATCH (s:System {id: $id}) SET s.status = 'operational_isolated', s.last_incident = $ts", {"id": sys_id, "ts": now_utc})

        entry = {
            "timestamp": now_utc,
            "event_id": event_id,
            "name": matched["name"],
            "affected_system": sys_id,
            "status": "APPLIED_IN_GRAPH"
        }
        self.activity_log.append(entry)
        return entry

    def reset_scenario(self, scenario_name: str, confirm: bool = False) -> Dict[str, Any]:
        """Safely resets a single scenario."""
        if not confirm:
            return {"status": "ABORTED", "message": "Confirmation required for scenario reset."}
        
        res = reset_scenario_data(scenario_name)
        self.activity_log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": f"RESET_SCENARIO_{scenario_name}",
            "status": "SUCCESS"
        })
        return res

    def reset_all(self, confirm: bool = False) -> Dict[str, Any]:
        """Confirmed full baseline reset."""
        if not confirm:
            return {"status": "ABORTED", "message": "Confirmation required for full reset."}
            
        res = seed_database(reset_existing=True)
        self.activity_log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "FULL_SIMULATION_RESET",
            "status": "SUCCESS"
        })
        return res

    def get_activity_log(self) -> List[Dict[str, Any]]:
        return list(reversed(self.activity_log))

simulation_engine = SimulationEngine()
