"""
ContextGraph AI - Advanced Command Line Interface (CLI).
Allows running investigations, timeline reconstructions, what-if chaos simulations,
remediation runbooks, dual-agent debates, and post-mortem exports directly from PowerShell.
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
from whatif_simulator import whatif_simulator
from remediation_service import remediation_service
from debate_service import debate_service
from export_service import export_service

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def print_banner():
    banner = r"""
  ==============================================================
    ContextGraph AI — Advanced Graph-Powered Agent CLI
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

def run_whatif(system_id: str):
    print(f"\n[+] Executing What-If Outage Simulation for '{system_id}'...")
    rep = whatif_simulator.simulate_system_outage(system_id)
    print("\n" + "=" * 65)
    print(f"PRE-MORTEM OUTAGE REPORT — {system_id} (Risk: {rep.get('risk_tier')})")
    print("=" * 65)
    print(f"Summary: {rep.get('pre_mortem_summary')}\n")
    print(f"- Immediate 1-Hop Failures : {rep.get('immediate_hop1_failures')}")
    print(f"- Secondary 2-Hop Failures : {rep.get('secondary_hop2_failures')}")
    print(f"- Total Severed Systems    : {rep.get('total_downstream_systems_impacted')}")
    print(f"- Estimated Cascade Velocity: {rep.get('estimated_cascade_seconds')} seconds")
    if rep.get("cascading_systems"):
        print("\nImpacted Downstream Systems:")
        for s in rep["cascading_systems"]:
            print(f"  * {s['id']} ({s['name']}) - Hop Distance: {s['hop_distance']}")
    print("=" * 65 + "\n")

def run_runbook(entity_id: str):
    print(f"\n[+] Synthesizing SRE Remediation Runbook for '{entity_id}'...")
    rbk = remediation_service.generate_remediation_runbook(entity_id)
    print("\n" + "=" * 65)
    print(f"AUTONOMOUS REMEDIATION RUNBOOK: {rbk.get('runbook_id')}")
    print(f"Title: {rbk.get('title')} ({rbk.get('severity')})")
    print("=" * 65)
    for step in rbk.get("remediation_steps", []):
        print(f"\n[Step {step['step_number']} - {step['phase']}] {step['action']} (Risk: {step['risk']})")
        print(f" Command: {step['command']}")
        print(f" Rationale: {step['rationale']}")
    print(f"\nCypher Health Verification Check:\n  {rbk.get('cypher_verification_check')}")
    print("=" * 65 + "\n")

def run_debate(query: str):
    print(f"\n[+] Initiating Dual-Agent Adversarial Debate on: '{query}'...")
    deb = debate_service.run_debate(query)
    print("\n" + "=" * 65)
    print(f"DUAL-AGENT DEBATE SESSION: {deb.get('debate_session_id')} (Target: {deb.get('target_entity')})")
    print("=" * 65)
    for r in deb.get("rounds", []):
        print(f"\n>> {r['speaker']} [{r['stance']}]:")
        print(f"   {r['speech']}")
    summary = deb.get("consensus_summary", {})
    print("\n" + "-" * 65)
    print(f"CONSENSUS VERDICT : {summary.get('consensus_verdict')} (Confidence: {int(summary.get('epistemic_score', 0)*100)}%)")
    print(f"AGREED ROOT CAUSE : {summary.get('final_claim')}")
    print("=" * 65 + "\n")

def run_postmortem(entity_id: str):
    print(f"\n[+] Generating SRE Post-Mortem Document for '{entity_id}'...")
    inv_res = agent.run(f"Investigate {entity_id}")
    rbk = remediation_service.generate_remediation_runbook(entity_id)
    whatif = whatif_simulator.simulate_system_outage("SYS-AUTH-01")
    md = export_service.generate_markdown_post_mortem(inv_res, runbook=rbk, whatif_report=whatif)
    filename = f"post_mortem_{entity_id}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"[+] Post-Mortem successfully exported to '{filename}' ({len(md)} bytes).\n")

def interactive_mode():
    print_banner()
    print("Entering interactive PowerShell mode. Type 'exit' or 'quit' to leave.")
    print("Commands:")
    print("  - Investigate incident E-101")
    print("  - whatif SYS-AUTH-01")
    print("  - runbook E-101")
    print("  - debate Investigate E-101")
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
            elif user_input.lower().startswith("whatif "):
                target = user_input.split(" ", 1)[1].strip()
                run_whatif(target)
            elif user_input.lower().startswith("runbook "):
                target = user_input.split(" ", 1)[1].strip()
                run_runbook(target)
            elif user_input.lower().startswith("debate "):
                q = user_input.split(" ", 1)[1].strip()
                run_debate(q)
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
    parser = argparse.ArgumentParser(description="ContextGraph AI Advanced PowerShell CLI")
    parser.add_argument("query", nargs="?", help="Natural language query to investigate")
    parser.add_argument("-i", "--interactive", action="store_true", help="Launch interactive PowerShell REPL session")
    parser.add_argument("-t", "--timeline", action="store_true", help="Show chronological incident timeline")
    parser.add_argument("--whatif", type=str, help="Simulate catastrophic failure of a system (e.g. --whatif SYS-AUTH-01)")
    parser.add_argument("--runbook", type=str, help="Generate SRE remediation runbook (e.g. --runbook E-101)")
    parser.add_argument("--debate", type=str, help="Launch dual-agent debate on an incident (e.g. --debate 'Investigate E-101')")
    parser.add_argument("--postmortem", type=str, help="Export 1-click Markdown SRE post-mortem (e.g. --postmortem E-101)")
    parser.add_argument("--status", action="store_true", help="Check live FalkorDB connectivity and node counts")

    args = parser.parse_args()

    if args.timeline:
        run_timeline()
    elif args.whatif:
        run_whatif(args.whatif)
    elif args.runbook:
        run_runbook(args.runbook)
    elif args.debate:
        run_debate(args.debate)
    elif args.postmortem:
        run_postmortem(args.postmortem)
    elif args.status:
        healthy, diag = db_manager.check_health()
        print(f"Database Health: {'HEALTHY' if healthy else 'UNHEALTHY'}")
        print(json.dumps(diag, indent=2))
    elif args.query:
        run_query(args.query)
    else:
        interactive_mode()

if __name__ == "__main__":
    main()
