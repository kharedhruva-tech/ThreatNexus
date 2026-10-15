"""
ContextGraph AI - Deterministic Intent Router.
Routes user requests using transparent pattern matching, entity extraction,
and deterministic rules. Ambiguous queries receive explicit clarification options.
"""
import re
from typing import Dict, Any, List, Optional

INTENTS = {
    "FIND_ENTITY": "Find an entity by name, ID, or keyword",
    "INVESTIGATE_EVENT": "Investigate an event and trace connected systems, software, and vulnerabilities",
    "TRACE_RELATIONSHIPS": "Trace multi-hop graph paths between two entities",
    "RETRIEVE_PREVIOUS_CONTEXT": "Retrieve information discovered in an earlier session",
    "EXPLAIN_DECISION": "Explain a conclusion, finding, or decision with supporting evidence",
    "COMPARE_INVESTIGATIONS": "Compare findings and evidence across multiple investigations",
    "RECONSTRUCT_TIMELINE": "Reconstruct chronological and causal incident timeline",
    "SAVE_FINDING": "Record and persist a new finding into graph memory",
    "IDENTIFY_MISSING_EVIDENCE": "Identify unobserved evidence and evidentiary gaps",
    "AMBIGUOUS_INTENT": "Ambiguous request requiring explicit operator selection"
}

# Regex patterns for known synthetic entities
ENTITY_PATTERNS = [
    r"\b(E-\d{3})\b",            # Events E-101, E-102
    r"\b(EVT-\d{4})\b",          # Timeline events EVT-0900
    r"\b(SYS-[A-Z]+-\d{2})\b",   # Systems SYS-AUTH-01
    r"\b(SW-[A-Z]+-\d{2})\b",    # Software SW-LIBCRYPTO-21
    r"\b(REC-[A-Z]+-\d{3,4})\b", # Records REC-VULN-4401
    r"\b(USR-[A-Z]+)\b",         # Users USR-ALICE
    r"\b(PRJ-[A-Z]+)\b",         # Projects PRJ-APOLLO
    r"\b(DOC-[A-Z]+-\d{2})\b",   # Documents DOC-ARCH-01
    r"\b(DEC-\d{3})\b",          # Decisions DEC-001
    r"\b(TSK-\d{3})\b",          # Tasks TSK-101
    r"\b(SESS-[A-F0-9]{8})\b",   # Sessions SESS-XXXXXXXX
]

class IntentRouter:
    def extract_entity_ids(self, text: str) -> List[str]:
        """Extracts standard entity identifiers from text using verified patterns."""
        found = set()
        for pat in ENTITY_PATTERNS:
            matches = re.findall(pat, text, re.IGNORECASE)
            for m in matches:
                found.add(m.upper())
        return list(found)

    def route_request(self, user_request: str, explicit_intent: Optional[str] = None) -> Dict[str, Any]:
        """
        Determines the intent and extracted parameters deterministically.
        If explicit_intent is passed, validates and honors it.
        """
        if explicit_intent and explicit_intent in INTENTS:
            entities = self.extract_entity_ids(user_request)
            return {
                "intent": explicit_intent,
                "confidence": "EXPLICIT_SELECTION",
                "extracted_entities": entities,
                "reasoning": f"Operator explicitly selected '{explicit_intent}'."
            }

        text = user_request.strip().lower()
        entities = self.extract_entity_ids(user_request)

        # 1. Previous context retrieval check
        # Patterns like: "what did we discover earlier", "previous session", "relevant to E-102"
        if any(w in text for w in ["discover earlier", "earlier", "previous session", "what did we learn", "prior context", "relevant to"]):
            return {
                "intent": "RETRIEVE_PREVIOUS_CONTEXT",
                "confidence": "DETERMINISTIC_MATCH",
                "extracted_entities": entities,
                "reasoning": "Detected cross-session memory query referencing earlier findings."
            }

        # 2. Timeline reconstruction
        if any(w in text for w in ["timeline", "chronology", "sequence of events", "order of events", "what happened first"]):
            return {
                "intent": "RECONSTRUCT_TIMELINE",
                "confidence": "DETERMINISTIC_MATCH",
                "extracted_entities": entities,
                "reasoning": "Detected request to reconstruct the incident sequence and timeline."
            }

        # 3. Decision / Explainability
        if any(w in text for w in ["explain", "why did we conclude", "justification", "evidence for", "rationale"]):
            return {
                "intent": "EXPLAIN_DECISION",
                "confidence": "DETERMINISTIC_MATCH",
                "extracted_entities": entities,
                "reasoning": "Detected request for explanation, evidence provenance, and rule trace."
            }

        # 4. Compare investigations
        if any(w in text for w in ["compare", "difference between", "versus", "vs"]):
            return {
                "intent": "COMPARE_INVESTIGATIONS",
                "confidence": "DETERMINISTIC_MATCH",
                "extracted_entities": entities,
                "reasoning": "Detected request to compare investigation results across sessions."
            }

        # 5. Missing evidence
        if any(w in text for w in ["missing evidence", "unknowns", "what do we not know", "evidentiary gaps"]):
            return {
                "intent": "IDENTIFY_MISSING_EVIDENCE",
                "confidence": "DETERMINISTIC_MATCH",
                "extracted_entities": entities,
                "reasoning": "Detected query focusing on incomplete observations or missing records."
            }

        # 6. Trace relationships (multi-hop)
        # Needs at least 2 entities or relationship keywords
        if any(w in text for w in ["connected", "how is", "path between", "multi-hop", "trace", "link between"]):
            if len(entities) >= 2:
                return {
                    "intent": "TRACE_RELATIONSHIPS",
                    "confidence": "DETERMINISTIC_MATCH",
                    "extracted_entities": entities,
                    "reasoning": f"Detected relationship path request connecting {entities[0]} and {entities[1]}."
                }
            elif any(w in text for w in ["connected systems", "connected software", "dependencies"]):
                # If only 1 entity but asking for connections, can be investigate or trace
                pass

        # 7. Investigate event
        if any(w in text for w in ["investigate", "incident", "outage", "anomaly", "breach"]) or (len(entities) == 1 and entities[0].startswith("E-")):
            target = entities[0] if entities else "UNKNOWN"
            return {
                "intent": "INVESTIGATE_EVENT",
                "confidence": "DETERMINISTIC_MATCH",
                "extracted_entities": entities,
                "reasoning": f"Detected event investigation request for target {target}."
            }

        # 8. Find entity
        if any(w in text for w in ["find", "search", "who is", "what is", "lookup", "show entity"]):
            return {
                "intent": "FIND_ENTITY",
                "confidence": "DETERMINISTIC_MATCH",
                "extracted_entities": entities,
                "reasoning": "Detected entity lookup and attribute retrieval request."
            }

        # 9. If text has exact known entity ID
        if len(entities) == 1:
            e = entities[0]
            if e.startswith("E-") or e.startswith("EVT-"):
                return {
                    "intent": "INVESTIGATE_EVENT",
                    "confidence": "DETERMINISTIC_MATCH",
                    "extracted_entities": entities,
                    "reasoning": f"Target entity {e} mapped to event investigation."
                }
            else:
                return {
                    "intent": "FIND_ENTITY",
                    "confidence": "DETERMINISTIC_MATCH",
                    "extracted_entities": entities,
                    "reasoning": f"Target entity {e} mapped to entity lookup."
                }

        # 10. Fallback: Ambiguous input
        return {
            "intent": "AMBIGUOUS_INTENT",
            "confidence": "LOW",
            "extracted_entities": entities,
            "reasoning": "Query is underspecified or matches multiple candidate operations.",
            "candidate_intents": [
                "INVESTIGATE_EVENT",
                "FIND_ENTITY",
                "RETRIEVE_PREVIOUS_CONTEXT",
                "TRACE_RELATIONSHIPS",
                "RECONSTRUCT_TIMELINE"
            ]
        }

intent_router = IntentRouter()
