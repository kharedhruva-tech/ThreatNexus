"""
ContextGraph AI - Chat & Persistent Graph Memory Service.
Implements:
1. Mode A: Deterministic Agent (Default, no LLM required, zero paid APIs).
2. Mode B: Optional Local Ollama LLM (Offline, grounded strictly on retrieved FalkorDB graph context).
3. Real FalkorDB Graph Memory Persistence: User, Conversation, Message, Fact, Entity nodes.
4. Memory Search, Explicit Fact Storing, and Memory Deletion.
"""
import uuid
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

from config import config
from database import db_manager
from intent_router import IntentRouter

class ChatService:
    def __init__(self, manager=db_manager):
        self.manager = manager
        self.router = IntentRouter()

    def _get_graph(self):
        return self.manager.get_graph()

    def chat(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        agent_mode: Optional[str] = None,
        save_memory: bool = True
    ) -> Dict[str, Any]:
        """
        Processes a chat request using either deterministic graph logic or local Ollama.
        Persists conversation, messages, and facts into FalkorDB.
        """
        clean_msg = message.strip()
        conv_id = conversation_id or f"conv-{uuid.uuid4().hex[:8]}"
        mode = agent_mode or config.AGENT_MODE
        mode = mode.lower()

        # Check database connectivity
        is_healthy, diag = self.manager.check_health()
        if not is_healthy:
            return {
                "status": "DATABASE_DISCONNECTED",
                "response": (
                    f"FalkorDB is currently unreachable at {config.FALKORDB_HOST}:{config.FALKORDB_PORT}. "
                    "Cannot retrieve or persist graph memories. Please ensure the FalkorDB service is running."
                ),
                "conversation_id": conv_id,
                "message_id": f"msg-{uuid.uuid4().hex[:8]}",
                "agent_mode": mode,
                "retrieved_facts": [],
                "matching_entities": [],
                "source_records": [],
                "database_healthy": False,
                "used_local_llm": False,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        # Step 1: Extract entities and retrieve context from FalkorDB
        entities = self.router.extract_entity_ids(clean_msg)
        retrieved_facts = []
        matching_entities = []
        source_records = []

        # Lookup mentioned entities in FalkorDB
        if entities:
            matching_entities, facts_from_entities = self._lookup_entities(entities)
            retrieved_facts.extend(facts_from_entities)

        # Lookup entities by name, title, or label if not matched by ID
        fuzzy_entities, fuzzy_facts = self._lookup_entities_by_name(clean_msg, exclude_ids=entities)
        for fe in fuzzy_entities:
            if not any(me.get("id") == fe.get("id") for me in matching_entities):
                matching_entities.append(fe)
        for ff in fuzzy_facts:
            if ff not in retrieved_facts:
                retrieved_facts.append(ff)

        # Lookup related facts by keyword if query mentions keywords
        keyword_facts = self._lookup_facts_by_keywords(clean_msg)
        for kf in keyword_facts:
            if kf not in retrieved_facts:
                retrieved_facts.append(kf)

        # Step 2: Handle based on Agent Mode
        used_local_llm = False
        ollama_fallback_notice = None

        if mode == "ollama":
            # Mode B: Local Ollama
            ollama_resp, err = self._query_ollama(clean_msg, retrieved_facts, matching_entities)
            if ollama_resp:
                response_text = ollama_resp
                used_local_llm = True
            else:
                ollama_fallback_notice = (
                    f"[Notice: Local Ollama service at {config.OLLAMA_BASE_URL} ({config.OLLAMA_MODEL}) was unreachable ({err}). "
                    "Operating in Deterministic Graph Engine mode.]\n\n"
                )
                response_text, extracted_facts = self._generate_deterministic_response(
                    clean_msg, entities, retrieved_facts, matching_entities, conv_id
                )
                response_text = ollama_fallback_notice + response_text
        else:
            # Mode A: Deterministic Engine (Default)
            response_text, extracted_facts = self._generate_deterministic_response(
                clean_msg, entities, retrieved_facts, matching_entities, conv_id
            )

        # Step 3: Persist Conversation, Messages, and Facts in FalkorDB
        msg_id = f"msg-{uuid.uuid4().hex[:8]}"
        if save_memory:
            try:
                self._persist_chat_turn(
                    conv_id=conv_id,
                    user_text=clean_msg,
                    agent_text=response_text,
                    mode=mode,
                    msg_id=msg_id,
                    entities=matching_entities,
                    retrieved_facts=retrieved_facts
                )
            except Exception as e:
                # Still return the response, but note the persistence error
                response_text += f"\n\n[Warning: Memory persistence failed: {e}]"

        return {
            "status": "SUCCESS",
            "response": response_text,
            "conversation_id": conv_id,
            "message_id": msg_id,
            "agent_mode": mode,
            "retrieved_facts": retrieved_facts,
            "matching_entities": matching_entities,
            "source_records": source_records,
            "database_healthy": True,
            "used_local_llm": used_local_llm,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def _generate_deterministic_response(
        self,
        clean_msg: str,
        entities: List[str],
        retrieved_facts: List[str],
        matching_entities: List[Dict[str, Any]],
        conv_id: str
    ) -> tuple[str, List[str]]:
        """
        Pure deterministic response generator based on rules, intent matching,
        and FalkorDB ground truth. Zero LLM, zero hallucinations.
        """
        lower = clean_msg.lower()
        extracted_facts: List[str] = []

        # Punctuation-stripped lower string for greeting / intent matching
        clean_lower = re.sub(r"[^\w\s]", "", lower).strip()

        # 1. Greetings (including "hy", "hi", "hello", "hey", "yo", "sup", etc.)
        greeting_words = {"hi", "hy", "hello", "hey", "yo", "sup", "howdy", "hola", "greetings", "good morning", "good evening", "good afternoon"}
        is_greeting = (
            clean_lower in greeting_words 
            or any(clean_lower.startswith(g + " ") for g in greeting_words)
            or clean_msg.lower().startswith(("hi ", "hy ", "hello ", "hey ", "yo ", "sup ", "good morning", "good evening"))
        )
        if is_greeting:
            return (
                "Hello! I am ThreatNexus, your autonomous threat intelligence assistant with persistent graph memory "
                "backed by FalkorDB. I operate with zero paid AI APIs.\n\n"
                "You can ask me anything about your project, query registered systems, trace incident causal graphs, "
                "search or record memories, or explore threat intelligence. How can I help you today?"
            ), []

        # 1.1 Status & Courtesy ("How are you", "Thank you", "Bye", "Ok")
        if any(p in lower for p in ["how are you", "how are you doing", "how do you do", "how is it going"]):
            return (
                "I am running at 100% operational health with all FalkorDB graph connections online and ready to assist! "
                "You can ask me about registered systems, incident investigations, project architecture, or record new memories into graph storage."
            ), []
        if any(lower == w or lower.startswith(w + " ") or lower.startswith(w + ",") or lower.startswith(w + "!") for w in ["thank you", "thanks", "thx", "appreciate it"]):
            return "You're very welcome! Let me know if you need to query any systems, investigate an incident, or record a new memory into FalkorDB.", []
        if any(lower == w or lower.startswith(w + " ") for w in ["bye", "goodbye", "see you"]):
            return "Goodbye! All your memories and investigation graphs are safely preserved in FalkorDB. Have a great day!", []
        if lower in ["ok", "okay", "cool", "great", "awesome", "perfect", "got it", "understood", "nice"]:
            return "Glad to help! What would you like to explore or investigate next?", []

        # 2. Self-Identity / About Agent ("Please tell about yourself", "Who are you?", etc.)
        about_agent_patterns = [
            "tell about yourself", "tell me about yourself", "who are you", "what are you",
            "introduce yourself", "about yourself", "who created you", "who made you",
            "what is your name", "describe yourself", "explain yourself", "what do you do",
            "what is threatnexus", "about threatnexus", "threatnexus"
        ]
        if any(p in lower for p in about_agent_patterns):
            return (
                "### ThreatNexus - Threat Intelligence & Persistent Graph Memory\n\n"
                "I am **ThreatNexus**, an autonomous pair-programming and incident-investigation agent "
                "built strictly on **zero paid AI APIs** and backed by a real **FalkorDB** knowledge graph.\n\n"
                "#### Core Architectural Pillars:\n"
                "1. **Zero Paid Cloud APIs:** Runs entirely locally with zero recurring costs. No OpenAI or cloud API keys required.\n"
                "2. **Persistent Graph Memory (FalkorDB):** I store conversations, users, messages, systems, and custom facts in FalkorDB (`contextgraph`). Memory persists across browser sessions and server reboots.\n"
                "3. **Zero-Hallucination Deterministic Engine:** My answers are grounded directly in verifiable graph nodes, relationships, and evidence records.\n"
                "4. **Voice Interaction (Web Speech API):** Tap the microphone to speak naturally. Responses can be auto-narrated using custom voice synthesis.\n"
                "5. **Local Offline LLM Support:** When desired, you can connect an offline Ollama instance (`llama3`) for natural synthesis while keeping all context strictly grounded in FalkorDB.\n\n"
                "#### What You Can Ask Me:\n"
                "- *\"What does this project do?\"* - Full project breakdown and architecture.\n"
                "- *\"What systems exist?\"* - View registered systems, statuses, and criticality.\n"
                "- *\"Investigate Event E-101\"* - Trace incident failure paths and affected components.\n"
                "- *\"Show incident timeline\"* - View chronological timeline of operational events.\n"
                "- *\"Remember that [fact]\"* - Record custom domain knowledge into FalkorDB.\n"
                "- *\"Show saved facts\"* - List all persistent facts in graph memory."
            ), []

        # 3. Project Explanation ("What does this project I have made", "What is this project", "What can I ask")
        project_patterns = [
            "what does this project", "what is this project", "what have i made", "what did i make",
            "explain this project", "tell me about this project", "about this project",
            "what project is this", "what is threatnexus", "what is contextgraph", "what have we built", "what did we make",
            "what can i ask", "what questions can i ask", "can i ask anything", "what can you tell me",
            "if i can ask anything", "how to use this project", "project summary", "project overview",
            "what is the purpose of this project", "what is this app", "how does this work",
            "about project and overview", "project and overview", "give me project", "give me overview",
            "overview of the project", "overview of project", "tell me about project", "about the project"
        ]
        is_project_query = (
            any(p in lower for p in project_patterns)
            or ("project" in lower and any(w in lower for w in ["overview", "summary", "about", "details", "explain", "info", "guide", "purpose", "describe"]))
            or any(w in lower for w in ["about project", "overview", "project overview", "project summary"])
        )
        if is_project_query:
            return (
                "### ThreatNexus - Project Overview & Guide\n\n"
                "You have created **ThreatNexus**, a full-stack, voice-enabled AI assistant with **persistent graph memory** powered by **FalkorDB**, engineered completely free of paid AI APIs.\n\n"
                "---\n\n"
                "#### The Subsystems You Have Built:\n"
                "1. **Voice Assistant (Web Speech API):**\n"
                "   - Real-time in-browser speech recognition and audio synthesis.\n"
                "   - Holographic animated voice orb with dynamic state indication.\n"
                "   - Voice controls: voice picker, speech rate slider, and auto-speak toggles.\n\n"
                "2. **Persistent Graph Memory (FalkorDB):**\n"
                "   - Real Redis-based graph database running in Docker (`contextgraph`).\n"
                "   - Knowledge graph with 90+ nodes spanning `System`, `Software`, `Record`, `Event`, `Project`, `Person`, and custom `Fact`.\n"
                "   - Fully persistent across sessions, browser reloads, and container restarts.\n\n"
                "3. **Dual Intelligence Engine:**\n"
                "   - **Deterministic Mode (Default):** Instant, reliable graph queries with 0% hallucination risk.\n"
                "   - **Local Ollama Mode (Optional):** Plugs into a local, offline Ollama model (`llama3`).\n\n"
                "4. **Mission Control Frontend:**\n"
                "   - React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, and React Flow visual graph explorer.\n\n"
                "---\n\n"
                "#### What You Can Ask Me Right Now:\n"
                "- **System Inquiries:** `What systems exist?`, `Tell me about SYS-AUTH-01`, `What software is used?`\n"
                "- **Incident Investigation:** `Investigate Event E-101`, `Show incident timeline`, `What caused E-102?`\n"
                "- **Memory & Fact Storing:** `Remember that SYS-PAY-02 handles European debit cards`, `Show saved facts`, `Search memory for auth`\n"
                "- **Team & Projects:** `Who is Alice Vance?`, `What is Project Apollo?`\n\n"
                "Tap **Start Listening** on the microphone to speak your question aloud, or type in the chat below!"
            ), []

        # 4. Help / Capabilities ("What can you do for me", "What you can do", etc.)
        help_patterns = [
            "help", "what can you do", "what you can do", "what do you do",
            "features", "commands", "how can you help", "how to use",
            "can you help", "what are your capabilities", "your capabilities",
            "what can i ask", "what can you do for me", "what you can do for me",
            "tell me what you can do", "what you do", "what are you capable of"
        ]
        is_help_query = (
            any(kw in lower for kw in help_patterns)
            or ("what" in lower and "you" in lower and ("do" in lower or "can" in lower or "help" in lower))
            or ("how" in lower and "you" in lower and "help" in lower)
        )
        if is_help_query:
            return (
                "### What ContextGraph AI Can Do For You:\n\n"
                "I am your local AI pair-assistant with **persistent FalkorDB graph memory** and zero cloud API charges.\n\n"
                "#### Core Capabilities:\n"
                "1. **System & Architecture Queries:**\n"
                "   - *\"What systems exist?\"* or *\"Tell me about SYS-AUTH-01\"*\n"
                "   - *\"What software is registered?\"* or *\"What projects exist?\"*\n"
                "   - *\"Who is Alice Vance?\"* or *\"Show team members\"*\n\n"
                "2. **Incident & Causality Investigation:**\n"
                "   - *\"Investigate Event E-101\"* - Trace root cause and connected failure nodes.\n"
                "   - *\"Show incident timeline\"* - View chronological timeline of operational events.\n"
                "   - *\"What records exist?\"* - View security advisories and CVE records.\n\n"
                "3. **Persistent Knowledge & Memory:**\n"
                "   - *\"Remember that [any fact]\"* - Saves custom domain facts into FalkorDB.\n"
                "   - *\"Show saved facts\"* - View all facts remembered across sessions.\n\n"
                "4. **Voice Interaction:**\n"
                "   - Tap **Start Listening** on the microphone orb to speak your queries aloud."
            ), []

        # 5. Explicit Memory Creation ("Remember that ...", "Save fact: ...", "Store: ...")
        remember_match = re.search(r"^(?:remember\s+that|save\s+fact:?|store\s+memory:?|note\s+that|remember)\s+(.+)", clean_msg, re.IGNORECASE)
        if remember_match:
            fact_content = remember_match.group(1).strip()
            entity_ref = entities[0] if entities else None
            created = self.create_memory(
                fact=fact_content,
                entity=entity_ref,
                category="user_memory",
                provenance=f"conversation:{conv_id}"
            )
            return (
                f"Understood. I have recorded this fact into FalkorDB persistent graph memory:\n\n"
                f"> **\"{fact_content}\"**\n\n"
                f"- **Memory ID:** `{created['id']}`\n"
                f"- **Target Entity:** `{entity_ref or 'GLOBAL'}`\n"
                f"- **Persistence:** Stored in graph `contextgraph`. This fact will persist across conversations and application restarts."
            ), [fact_content]

        # 6. Show Saved Facts / Memories ("Show facts", "List memories", "What do you remember")
        if any(kw in lower for kw in ["show saved facts", "show facts", "list memories", "what do you remember", "get facts", "saved memories"]):
            facts = self.search_memory(q="", limit=10)
            if not facts:
                return "There are currently no custom user facts stored in FalkorDB. You can save one by saying: `Remember that [fact]`.", []
            fact_lines = [f"- **[{f.get('id', 'FACT')}]** ({f.get('category', 'general')}): {f.get('text', '')}" for f in facts]
            return (
                f"### Retrieved {len(facts)} Stored Fact(s) from FalkorDB:\n\n" + "\n".join(fact_lines) +
                "\n\nYou can delete any memory record via the Persistent Memory page or by ID."
            ), []

        # 7. Systems List Query ("What systems are running?", "Show systems")
        if any(kw in lower for kw in ["what systems", "show systems", "list systems", "registered systems", "available systems"]):
            try:
                graph = self._get_graph()
                res = graph.query("MATCH (s:System) RETURN s.id, s.name, s.criticality, s.status ORDER BY s.id")
                if res.result_set:
                    lines = [f"- **{row[0]}** ({row[1]}): Criticality `{row[2] or 'STANDARD'}`, Status: `{row[3] or 'OPERATIONAL'}`" for row in res.result_set]
                    return f"### Registered Systems in FalkorDB ({len(lines)} Total):\n\n" + "\n".join(lines), []
            except Exception as e:
                return f"Failed to query systems from FalkorDB: {e}", []

        # 8. Software / Records / Projects Queries
        if any(kw in lower for kw in ["what software", "list software", "show software", "available software"]):
            try:
                graph = self._get_graph()
                res = graph.query("MATCH (s:Software) RETURN s.id, s.name, s.version, s.language, s.maintainer ORDER BY s.id")
                if res.result_set:
                    lines = [f"- **{row[0]}** ({row[1]} v{row[2]}): Language `{row[3]}`, Maintainer: `{row[4]}`" for row in res.result_set]
                    return f"### Registered Software Components in FalkorDB ({len(lines)} Total):\n\n" + "\n".join(lines), []
            except Exception as e:
                return f"Failed to query software from FalkorDB: {e}", []

        if any(kw in lower for kw in ["what records", "list records", "show records", "vulnerabilities", "advisories"]):
            try:
                graph = self._get_graph()
                res = graph.query("MATCH (r:Record) RETURN r.id, r.title, r.severity, r.type ORDER BY r.id")
                if res.result_set:
                    lines = [f"- **{row[0]}** [{row[3]}]: `{row[1]}` (Severity: `{row[2]}`)" for row in res.result_set]
                    return f"### Security & Incident Records in FalkorDB ({len(lines)} Total):\n\n" + "\n".join(lines), []
            except Exception as e:
                return f"Failed to query records from FalkorDB: {e}", []

        # 8.1 Projects Query
        if any(kw in lower for kw in ["what projects", "list projects", "show projects", "registered projects"]):
            try:
                graph = self._get_graph()
                res = graph.query("MATCH (p:Project) RETURN p.id, p.name, p.status, p.description ORDER BY p.id")
                if res.result_set:
                    lines = [f"- **{row[0]}** ({row[1]}): Status `{row[2] or 'ACTIVE'}` - {row[3] or 'No description'}" for row in res.result_set]
                    return f"### Registered Projects in FalkorDB ({len(lines)} Total):\n\n" + "\n".join(lines), []
            except Exception as e:
                return f"Failed to query projects from FalkorDB: {e}", []

        # 8.2 Team / People Query
        if any(kw in lower for kw in ["who is in the team", "list people", "show people", "show team", "team members", "who works here", "list users", "what people", "the team"]):
            try:
                graph = self._get_graph()
                res = graph.query("MATCH (p:Person) RETURN p.id, p.name, p.role, p.email ORDER BY p.name")
                if res.result_set:
                    lines = [f"- **{row[1]}** (`{row[0]}`): {row[2]} ({row[3]})" for row in res.result_set]
                    return f"### Team Members & Engineers in FalkorDB ({len(lines)} Total):\n\n" + "\n".join(lines), []
            except Exception as e:
                return f"Failed to query team from FalkorDB: {e}", []

        # 8.3 Events Query
        if any(kw in lower for kw in ["what events", "list events", "show events", "operational events"]):
            try:
                graph = self._get_graph()
                res = graph.query("MATCH (e:Event) RETURN e.id, e.name, e.timestamp, e.severity ORDER BY e.timestamp ASC")
                if res.result_set:
                    lines = [f"- **{row[0]}** ({row[2]}): `{row[1]}` [Severity: {row[3]}]" for row in res.result_set]
                    return f"### Operational Events in FalkorDB ({len(lines)} Total):\n\n" + "\n".join(lines), []
            except Exception as e:
                return f"Failed to query events from FalkorDB: {e}", []

        # 8.4 Investigations Query
        if any(kw in lower for kw in ["what investigations", "list investigations", "show investigations"]):
            try:
                graph = self._get_graph()
                res = graph.query("MATCH (i:Investigation) RETURN i.id, i.title, i.status ORDER BY i.id")
                if res.result_set:
                    lines = [f"- **{row[0]}**: `{row[1]}` (Status: `{row[2]}`)" for row in res.result_set]
                    return f"### Incident Investigations in FalkorDB ({len(lines)} Total):\n\n" + "\n".join(lines), []
            except Exception as e:
                return f"Failed to query investigations from FalkorDB: {e}", []

        # 9. Specific Entity Query with Retrieved Graph Context
        if matching_entities:
            ent_summaries = []
            for ent in matching_entities:
                ent_id = ent.get("id")
                ent_name = ent.get("name", ent_id)
                ent_label = ent.get("label", "Entity")
                summary = f"### Entity: **{ent_name}** (`{ent_id}`, Type: `{ent_label}`)\n"
                
                # Fetch connected neighbors
                try:
                    graph = self._get_graph()
                    cypher = """
                    MATCH (n {id: $id})-[r]-(neighbor)
                    RETURN type(r) AS rel, labels(neighbor)[0] AS n_type, neighbor.id AS n_id, coalesce(neighbor.name, neighbor.title, neighbor.id) AS n_name
                    LIMIT 10
                    """
                    rel_res = graph.query(cypher, {"id": ent_id})
                    if rel_res.result_set:
                        summary += "**Connected Graph Relationships:**\n"
                        for r in rel_res.result_set:
                            summary += f"- `({ent_id}) -[:{r[0]}]- ({r[1]}: {r[3]} [{r[2]}])`\n"
                    else:
                        summary += "No direct neighbors recorded in the graph.\n"
                except Exception:
                    pass

                ent_summaries.append(summary)

            facts_text = ""
            if retrieved_facts:
                facts_text = "\n\n**Associated Facts from Graph Memory:**\n" + "\n".join([f"- {f}" for f in retrieved_facts])

            return "\n".join(ent_summaries) + facts_text, retrieved_facts

        # 10. Timeline / Incident Sequence
        if any(kw in lower for kw in ["timeline", "chronology", "sequence of events", "what happened first", "incident chain"]):
            try:
                graph = self._get_graph()
                q = """
                MATCH (e:Event)
                OPTIONAL MATCH (e)-[:LED_TO]->(next:Event)
                OPTIONAL MATCH (e)-[:AFFECTS]->(target)
                RETURN e.id, e.name, e.timestamp, e.severity, target.id, next.id
                ORDER BY e.timestamp ASC
                LIMIT 10
                """
                res = graph.query(q)
                if res.result_set:
                    timeline_lines = []
                    for row in res.result_set:
                        timeline_lines.append(
                            f"- **{row[0]}** ({row[2]}): `{row[1]}` [Severity: {row[3]}]. "
                            f"Affected: `{row[4] or 'N/A'}` " + (f"-> Led to `{row[5]}`" if row[5] else "")
                        )
                    return "### Chronological Incident Timeline from FalkorDB:\n\n" + "\n".join(timeline_lines), []
            except Exception as e:
                return f"Failed to reconstruct incident timeline from graph: {e}", []

        # 10.5 Stored Facts from FalkorDB Persistent Memory
        if retrieved_facts:
            facts_list = "\n".join([f"- {f}" for f in retrieved_facts])
            return (
                f"### Retrieved Graph Knowledge from FalkorDB:\n\n{facts_list}\n\n"
                f"*(Stored in persistent graph memory `contextgraph`)*"
            ), retrieved_facts

        # 11. Unrecorded / Unknown Question Handling (Honest transparent response)
        return (
            f"No matching records, entities, or facts were found in FalkorDB for **\"{clean_msg}\"**.\n\n"
            "ContextGraph AI operates with zero hallucinations in deterministic mode and only states "
            "facts backed by ground-truth database records.\n\n"
            "**Things you can ask me right now:**\n"
            "- Learn about this app: `What does this project do?` or `Tell me about yourself`\n"
            "- Inspect system graph: `What systems exist?` or `What software is registered?`\n"
            "- Trace incident timeline: `Show incident timeline` or `Investigate Event E-101`\n"
            "- Save new knowledge: If this is new domain knowledge, you can record it into FalkorDB memory by saying:\n"
            f"  `Remember that {clean_msg}`"
        ), []

    def _lookup_entities_by_name(self, query: str, exclude_ids: List[str]) -> tuple[List[Dict[str, Any]], List[str]]:
        """Fuzzy/Keyword lookup of entities by name, title, or label in FalkorDB."""
        matched_entities = []
        facts = []
        stopwords = {
            "what", "does", "this", "project", "have", "made", "please", "tell", "about",
            "yourself", "with", "from", "that", "there", "show", "list", "give", "some",
            "your", "mine", "here", "were", "been", "they", "them", "then", "than", "when",
            "where", "which", "will", "would", "could", "should", "know", "mean", "like",
            "help", "call", "name", "type", "good", "view", "find", "look", "more", "much",
            "into", "onto", "over", "just", "user", "agent", "hello", "system"
        }
        words = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 3 and w.lower() not in stopwords]
        if not words:
            return matched_entities, facts

        try:
            graph = self._get_graph()
            for w in words[:3]:
                q = """
                MATCH (n)
                WHERE NOT n:Message AND NOT n:Conversation AND NOT n:User AND NOT n:Fact
                  AND (toLower(coalesce(n.name, '')) CONTAINS $w 
                       OR toLower(coalesce(n.title, '')) CONTAINS $w 
                       OR toLower(n.id) CONTAINS $w)
                RETURN n.id, labels(n)[0], coalesce(n.name, n.title, n.id), properties(n)
                LIMIT 2
                """
                res = graph.query(q, {"w": w})
                if res.result_set:
                    for row in res.result_set:
                        eid = row[0]
                        if eid not in exclude_ids and not any(me["id"] == eid for me in matched_entities):
                            matched_entities.append({
                                "id": row[0],
                                "label": row[1],
                                "name": row[2],
                                "properties": row[3] if len(row) > 3 else {}
                            })
                            # Check for attached Fact nodes
                            fq = "MATCH (n {id: $id})-[:HAS_FACT|RELATED_TO]->(f:Fact) RETURN f.text"
                            fres = graph.query(fq, {"id": eid})
                            if fres.result_set:
                                for frow in fres.result_set:
                                    if frow[0] not in facts:
                                        facts.append(frow[0])
        except Exception:
            pass
        return matched_entities, facts

    def _lookup_entities(self, entity_ids: List[str]) -> tuple[List[Dict[str, Any]], List[str]]:
        """Look up entity nodes and connected facts in FalkorDB."""
        matched_entities = []
        facts = []
        try:
            graph = self._get_graph()
            for eid in entity_ids:
                q = "MATCH (n {id: $id}) RETURN n.id, labels(n)[0], coalesce(n.name, n.title, n.id), properties(n)"
                res = graph.query(q, {"id": eid})
                if res.result_set:
                    row = res.result_set[0]
                    matched_entities.append({
                        "id": row[0],
                        "label": row[1],
                        "name": row[2],
                        "properties": row[3] if len(row) > 3 else {}
                    })
                # Check for attached Fact nodes
                fq = "MATCH (n {id: $id})-[:HAS_FACT|RELATED_TO]->(f:Fact) RETURN f.text"
                fres = graph.query(fq, {"id": eid})
                if fres.result_set:
                    for frow in fres.result_set:
                        facts.append(frow[0])
        except Exception:
            pass
        return matched_entities, facts

    def _lookup_facts_by_keywords(self, query: str) -> List[str]:
        """Finds Fact nodes matching significant words in query."""
        facts = []
        words = [w for w in re.findall(r"\w+", query) if len(w) > 3]
        if not words:
            return facts
        try:
            graph = self._get_graph()
            for w in words[:3]:
                q = "MATCH (f:Fact) WHERE toLower(f.text) CONTAINS toLower($w) RETURN f.text LIMIT 3"
                res = graph.query(q, {"w": w})
                if res.result_set:
                    for row in res.result_set:
                        if row[0] not in facts:
                            facts.append(row[0])
        except Exception:
            pass
        return facts

    def _query_ollama(
        self,
        user_message: str,
        retrieved_facts: List[str],
        matching_entities: List[Dict[str, Any]]
    ) -> tuple[Optional[str], Optional[str]]:
        """
        Sends grounded context to local Ollama instance.
        Returns (response_text, error_message).
        """
        context_parts = []
        if matching_entities:
            context_parts.append("Known Graph Entities:\n" + "\n".join([f"- {e.get('name')} ({e.get('id')})" for e in matching_entities]))
        if retrieved_facts:
            context_parts.append("Verified Graph Facts from FalkorDB:\n" + "\n".join([f"- {f}" for f in retrieved_facts]))

        grounded_context = "\n\n".join(context_parts) if context_parts else "No specific prior graph records matched."

        prompt = (
            "System: You are ContextGraph AI, an assistant grounded strictly in verified graph memory from FalkorDB.\n"
            "Use ONLY the retrieved context below to answer. If the context does not contain the answer, "
            "honestly explain that the graph database lacks this information. Do not invent entities or facts.\n\n"
            f"=== RETRIEVED GRAPH CONTEXT ===\n{grounded_context}\n===============================\n\n"
            f"User: {user_message}\n\nAssistant:"
        )

        url = f"{config.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        payload = {
            "model": config.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }

        try:
            with httpx.Client(timeout=config.OLLAMA_TIMEOUT) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "").strip(), None
                return None, f"HTTP {res.status_code}: {res.text[:100]}"
        except Exception as e:
            return None, str(e)

    def _persist_chat_turn(
        self,
        conv_id: str,
        user_text: str,
        agent_text: str,
        mode: str,
        msg_id: str,
        entities: List[Dict[str, Any]],
        retrieved_facts: List[str]
    ):
        """Persists User, Conversation, and Message nodes into FalkorDB."""
        graph = self._get_graph()
        now_utc = datetime.now(timezone.utc).isoformat()
        user_msg_id = f"msg-user-{uuid.uuid4().hex[:8]}"
        agent_msg_id = msg_id

        # 1. Merge User and Conversation
        cypher_conv = """
        MERGE (u:User {id: "user_default"})
        ON CREATE SET u.name = "Engineer", u.created_at = $now
        MERGE (c:Conversation {id: $conv_id})
        ON CREATE SET c.title = $title, c.created_at = $now, c.updated_at = $now
        ON MATCH SET c.updated_at = $now
        MERGE (u)-[:HAS_CONVERSATION]->(c)
        """
        title = user_text[:40] + ("..." if len(user_text) > 40 else "")
        graph.query(cypher_conv, {"conv_id": conv_id, "title": title, "now": now_utc})

        # 2. Create User message
        cypher_user_msg = """
        MATCH (c:Conversation {id: $conv_id})
        CREATE (m:Message {
            id: $msg_id,
            sender: "user",
            text: $text,
            timestamp: $now
        })
        CREATE (c)-[:HAS_MESSAGE]->(m)
        """
        graph.query(cypher_user_msg, {"conv_id": conv_id, "msg_id": user_msg_id, "text": user_text, "now": now_utc})

        # 3. Create Agent message
        cypher_agent_msg = """
        MATCH (c:Conversation {id: $conv_id})
        CREATE (m:Message {
            id: $msg_id,
            sender: "agent",
            text: $text,
            agent_mode: $mode,
            timestamp: $now
        })
        CREATE (c)-[:HAS_MESSAGE]->(m)
        """
        graph.query(cypher_agent_msg, {
            "conv_id": conv_id,
            "msg_id": agent_msg_id,
            "text": agent_text,
            "mode": mode,
            "now": now_utc
        })

        # 4. Link mentioned entities to conversation
        for ent in entities:
            eid = ent.get("id")
            if eid:
                cypher_link = """
                MATCH (c:Conversation {id: $conv_id})
                MATCH (e {id: $eid})
                MERGE (c)-[:MENTIONS]->(e)
                """
                try:
                    graph.query(cypher_link, {"conv_id": conv_id, "eid": eid})
                except Exception:
                    pass

    # --- MEMORY CRUD OPERATIONS ---

    def create_memory(
        self,
        fact: str,
        entity: Optional[str] = None,
        category: Optional[str] = "general",
        provenance: Optional[str] = "user_input"
    ) -> Dict[str, Any]:
        """Creates a Fact node in FalkorDB linked to an entity or project."""
        graph = self._get_graph()
        fact_id = f"FACT-{uuid.uuid4().hex[:8].upper()}"
        now_utc = datetime.now(timezone.utc).isoformat()

        cypher = """
        CREATE (f:Fact {
            id: $id,
            text: $text,
            category: $category,
            provenance: $provenance,
            created_at: $now
        })
        RETURN f.id
        """
        graph.query(cypher, {
            "id": fact_id,
            "text": fact,
            "category": category or "general",
            "provenance": provenance or "user_input",
            "now": now_utc
        })

        # Link to entity if specified
        if entity:
            cypher_link = """
            MATCH (f:Fact {id: $fid})
            MATCH (e {id: $eid})
            MERGE (e)-[:HAS_FACT]->(f)
            MERGE (f)-[:RELATED_TO]->(e)
            """
            try:
                graph.query(cypher_link, {"fid": fact_id, "eid": entity})
            except Exception:
                pass

        return {
            "id": fact_id,
            "fact": fact,
            "entity": entity,
            "category": category or "general",
            "provenance": provenance or "user_input",
            "created_at": now_utc
        }

    def search_memory(
        self,
        q: str = "",
        limit: int = 20,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Searches persistent Fact nodes in FalkorDB."""
        graph = self._get_graph()
        clean_q = q.strip().lower()

        if clean_q:
            cypher = """
            MATCH (f:Fact)
            WHERE toLower(f.text) CONTAINS $q OR toLower(f.category) CONTAINS $q
            OPTIONAL MATCH (e)-[:HAS_FACT]->(f)
            RETURN f.id, f.text, f.category, f.provenance, f.created_at, e.id
            ORDER BY f.created_at DESC
            LIMIT $limit
            """
            params = {"q": clean_q, "limit": limit}
        else:
            cypher = """
            MATCH (f:Fact)
            OPTIONAL MATCH (e)-[:HAS_FACT]->(f)
            RETURN f.id, f.text, f.category, f.provenance, f.created_at, e.id
            ORDER BY f.created_at DESC
            LIMIT $limit
            """
            params = {"limit": limit}

        res = graph.query(cypher, params)
        results = []
        if res.result_set:
            for row in res.result_set:
                results.append({
                    "id": row[0],
                    "text": row[1],
                    "category": row[2] or "general",
                    "provenance": row[3] or "user_input",
                    "created_at": row[4] or "",
                    "connected_entity": row[5] or None
                })
        return results

    def delete_memory(self, memory_id: str) -> bool:
        """Deletes a Fact, Memory, or Session node from FalkorDB."""
        graph = self._get_graph()
        cypher = """
        MATCH (f:Fact {id: $id})
        DETACH DELETE f
        RETURN count(f) AS deleted
        """
        res = graph.query(cypher, {"id": memory_id})
        count = res.result_set[0][0] if res.result_set else 0
        if count > 0:
            return True

        # Fallback to Session node if fact was not found
        cypher_session = """
        MATCH (s:Session {id: $id})
        DETACH DELETE s
        RETURN count(s) AS deleted
        """
        res_s = graph.query(cypher_session, {"id": memory_id})
        count_s = res_s.result_set[0][0] if res_s.result_set else 0
        return count_s > 0

    def get_conversation(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Retrieves all messages for a given conversation in order."""
        graph = self._get_graph()
        cypher = """
        MATCH (c:Conversation {id: $conv_id})-[:HAS_MESSAGE]->(m:Message)
        RETURN m.id, m.sender, m.text, m.agent_mode, m.timestamp
        ORDER BY m.timestamp ASC
        """
        res = graph.query(cypher, {"conv_id": conversation_id})
        messages = []
        if res.result_set:
            for row in res.result_set:
                messages.append({
                    "id": row[0],
                    "sender": row[1],
                    "text": row[2],
                    "agent_mode": row[3],
                    "timestamp": row[4]
                })
        return messages

    def list_conversations(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Lists persistent conversations stored in FalkorDB."""
        graph = self._get_graph()
        cypher = """
        MATCH (c:Conversation)
        OPTIONAL MATCH (c)-[:HAS_MESSAGE]->(m:Message)
        RETURN c.id, c.title, c.created_at, c.updated_at, count(m) AS message_count
        ORDER BY c.updated_at DESC
        LIMIT $limit
        """
        res = graph.query(cypher, {"limit": limit})
        convs = []
        if res.result_set:
            for row in res.result_set:
                convs.append({
                    "id": row[0],
                    "title": row[1] or "Conversation",
                    "created_at": row[2] or "",
                    "updated_at": row[3] or "",
                    "message_count": row[4] or 0
                })
        return convs

    def get_full_graph(self, limit: int = 150) -> Dict[str, Any]:
        """
        Returns full graph topology directly from FalkorDB for React Flow visualization.
        Does not invent nodes when empty.
        """
        graph = self._get_graph()
        nodes_dict = {}
        edges_list = []

        try:
            # 1. Fetch nodes
            q_nodes = """
            MATCH (n)
            RETURN n.id, labels(n)[0], coalesce(n.name, n.title, n.user_request, n.text, n.id), properties(n)
            LIMIT $limit
            """
            res_nodes = graph.query(q_nodes, {"limit": limit})
            if res_nodes.result_set:
                for row in res_nodes.result_set:
                    nid = row[0]
                    if nid:
                        nodes_dict[nid] = {
                            "id": nid,
                            "label": row[1] or "Node",
                            "name": row[2] or nid,
                            "properties": row[3] if len(row) > 3 else {}
                        }

            # 2. Fetch edges
            q_edges = """
            MATCH (n)-[r]->(m)
            WHERE n.id IS NOT NULL AND m.id IS NOT NULL
            RETURN n.id, m.id, type(r), properties(r)
            LIMIT $limit
            """
            res_edges = graph.query(q_edges, {"limit": limit})
            seen_edges = set()
            if res_edges.result_set:
                for row in res_edges.result_set:
                    source_id = row[0]
                    target_id = row[1]
                    rel_type = row[2]
                    key = (source_id, target_id, rel_type)
                    if key not in seen_edges:
                        seen_edges.add(key)
                        edges_list.append({
                            "source": source_id,
                            "target": target_id,
                            "start_id": source_id,
                            "end_id": target_id,
                            "type": rel_type,
                            "properties": row[3] if len(row) > 3 else {}
                        })
        except Exception:
            pass

        return {
            "root_id": next(iter(nodes_dict.keys()), "NONE") if nodes_dict else "NONE",
            "nodes": list(nodes_dict.values()),
            "edges": edges_list,
            "total_nodes": len(nodes_dict),
            "total_edges": len(edges_list)
        }

    def process_voice_transcript(
        self,
        transcript: str,
        confidence: Optional[float] = None,
        conversation_id: Optional[str] = None,
        agent_mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates browser-recognized speech transcript and passes to chat pipeline.
        Transparently informs that transcript processing is text-based.
        """
        if not transcript or not transcript.strip():
            return {
                "status": "EMPTY_TRANSCRIPT",
                "response": "No voice transcript was detected. Please try speaking again.",
                "conversation_id": conversation_id or f"conv-{uuid.uuid4().hex[:8]}",
                "database_healthy": True,
                "retrieved_facts": [],
                "matching_entities": []
            }

        result = self.chat(
            message=transcript,
            conversation_id=conversation_id,
            agent_mode=agent_mode,
            save_memory=True
        )
        result["voice_confidence"] = confidence or 1.0
        result["processed_as_speech"] = True
        return result

chat_service = ChatService()
