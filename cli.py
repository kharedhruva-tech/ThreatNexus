"""
ContextGraph AI - Command Line Interface (CLI).
Allows running investigations, timeline reconstructions, and simulations directly in PowerShell or Bash.
"""
import sys
import argparse
import json
from agent import agent
from graph_service import graph_service
from memory_service import memory_service
from evidence_service import evidence_service
from simulation_engine import simulation_engine
from database import db_manager

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def print_banner():
    banner = r"""
  ==============================================================
    ContextGraph AI — Deterministic Graph-Powered Agent CLI
  ==============================================================
    FalkorDB: 127.0.0.1:6379 | Zero LLM API Keys | Full Grounding
  ==============================================================
"""
    print(banner)

def run_query(query: str):
    print(f"\n[+] Executing Agent Query: '{query}'...")
    res = agent.run(query)
    
    if res.get("status") == "AMBIGUOUS_INPUT":
        print("\n[!] AMBIGUOUS QUERY DETECTED:")
        print(f"Reasoning: {res.get('reasoning')}")
        print("Candidate Intents:")
        for ci in res.get("candidate_intents", []):
            print(f"  - {ci}")
        return

    print("\n" + "=" * 65)
    print(f"[*] AGENT INVESTIGATION REPORT (Session: {res.get('session_id')})")
    print("=" * 65)
    print(f"Intent Detected: {res.get('intent')}")
    print(f"Context Reuse  : {res.get('reuse_outcome')}")
    if res.get('earlier_session_id'):
        print(f"Prior Session  : {res.get('earlier_session_id')}")
    print(f"Entities Found : {', '.join(res.get('retrieved_entity_ids', []))}")
    
    print("\n[TOOLS EXECUTED]")
    for t in res.get("tools_invoked", []):
        print(f" - {t.get('tool')} ({t.get('duration_ms', 0)}ms): {t.get('summary', 'Done')}")
        
    print("\n" + "-" * 65)
    print("EXPLAINABILITY BREAKDOWN (7-Part Epistemic Model)")
    print("-" * 65)
    findings = res.get("findings", [])
    if not findings:
        print("Summary: " + res.get("summary", "Investigation complete."))
    for idx, f in enumerate(findings, 1):
        expl = evidence_service.format_explanation(f)
        print(f"\n[Finding #{idx}] {expl.get('conclusion')}")
        rule = expl.get("applied_rule") or {}
        print(f"  * Applied Rule  : {rule.get('name', 'N/A')} ({rule.get('epistemic_type', 'N/A')})")
        print(f"  * Supporting Ev : {', '.join(expl.get('supporting_evidence_ids', [])) or 'None'}")
        print(f"  * Prior Session : {expl.get('contributing_session_id')}")
        print(f"  * Unknowns      : {', '.join(expl.get('unknowns', []))}")
        print(f"  * Need to Verify: {', '.join(expl.get('strengthening_evidence_needed', []))}")
    print("=" * 65 + "\n")

def run_timeline():
    print("\n[+] Reconstructing Incident Timeline from FalkorDB...")
    timeline = graph_service.get_incident_timeline()
    if not timeline:
        print("No incident events found in graph.")
        return
    print("\n" + "=" * 65)
    print("CHRONOLOGICAL INCIDENT TIMELINE")
    print("=" * 65)
    for evt in timeline:
        ts = evt.get("timestamp", "N/A")
        eid = evt.get("event_id", "N/A")
        name = evt.get("event_name", "N/A")
        sev = evt.get("severity", "N/A")
        tgt = evt.get("affected_target_id", "None")
        caused = evt.get("caused_event_id")
        causation = f" -> LED_TO {caused}" if caused else ""
        print(f"[{ts}] [{sev}] {eid}: {name} (Target: {tgt}){causation}")
    print("=" * 65 + "\n")

def run_simulation(event_code: str):
    print(f"\n[+] Triggering Simulation Event '{event_code}'...")
    res = simulation_engine.trigger_event(event_code)
    print("Status  :", res.get("status"))
    print("Message :", res.get("message"))
    if "event" in res:
        print("Details :", json.dumps(res["event"], indent=2))

def interactive_mode():
    print_banner()
    print("Entering interactive PowerShell mode. Type 'exit' or 'quit' to leave.")
    print("Example commands:")
    print("  - Investigate incident E-101")
    print("  - What caused incident E-102?")
    print("  - Show incident timeline")
    print("  - Retrieve previous context for E-101")
    print("  - timeline")
    print("  - status\n")
    
    while True:
        try:
            user_input = input("ContextGraph-AI> ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit", "q"):
                print("Exiting ContextGraph AI CLI. Goodbye!")
                break
            elif user_input.lower() == "timeline":
                run_timeline()
            elif user_input.lower() == "status":
                healthy, diag = db_manager.check_health()
                print(f"Database Health: {'HEALTHY' if healthy else 'UNHEALTHY'}")
                print(json.dumps(diag, indent=2))
            else:
                run_query(user_input)
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break
        except Exception as e:
            print(f"[!] Error: {e}")

def main():
    parser = argparse.ArgumentParser(description="ContextGraph AI PowerShell CLI")
    parser.add_argument("query", nargs="?", help="Natural language or incident query to investigate (e.g. 'Investigate E-101')")
    parser.add_argument("-i", "--interactive", action="store_true", help="Launch interactive PowerShell REPL session")
    parser.add_argument("-t", "--timeline", action="store_true", help="Show chronological incident timeline")
    parser.add_argument("-s", "--simulate", type=str, help="Trigger a simulation event (SIM-EVT-01, SIM-EVT-02, SIM-EVT-03, SIM-EVT-04)")
    parser.add_argument("--status", action="store_true", help="Check live FalkorDB connectivity and node counts")

    args = parser.parse_args()

    if args.timeline:
        run_timeline()
    elif args.simulate:
        run_simulation(args.simulate)
    elif args.status:
        healthy, diag = db_manager.check_health()
        print(f"Database Health: {'HEALTHY' if healthy else 'UNHEALTHY'}")
        print(json.dumps(diag, indent=2))
    elif args.query:
        run_query(args.query)
    else:
        # Default to interactive mode if no arguments provided
        interactive_mode()

if __name__ == "__main__":
    main()
