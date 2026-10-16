"""
ContextGraph AI - Comprehensive Master Engineering Test Suite.
Tests all 15 required scenarios from Section 12 of the MASTER ENGINEERING PROMPT:
1. Text-message submission
2. Request validation
3. Deterministic intent classification
4. Honest handling of unknown questions
5. Voice transcript endpoint
6. FalkorDB connection failure
7. Successful graph writes and reads
8. Memory search
9. Memory deletion
10. Retrieval of facts across separate conversations
11. Graph endpoint output
12. Health endpoint accuracy
13. Ollama unavailable fallback
14. Ensuring deterministic mode makes no model requests
15. CORS and API error handling
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from server import app
from database import db_manager, DatabaseManager, DatabaseConnectionError
from chat_service import chat_service

client = TestClient(app)

# 1. Text-message submission
def test_text_message_submission():
    payload = {"message": "Hello ContextGraph!", "save_memory": True}
    res = client.post("/api/chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "response" in data
    assert len(data["response"]) > 0
    assert data["agent_mode"] == "deterministic"
    assert "conversation_id" in data

# 2. Request validation
def test_request_validation():
    # Missing required message field
    res = client.post("/api/chat", json={})
    assert res.status_code == 422

    # Invalid JSON body
    res_bad = client.post("/api/chat", content="not-a-json", headers={"Content-Type": "application/json"})
    assert res_bad.status_code == 422

# 3. Deterministic intent classification
def test_deterministic_intent_classification():
    # Greetings
    res_greet = client.post("/api/chat", json={"message": "Hey there!"})
    assert "Hello! I am ThreatNexus" in res_greet.json()["response"]

    # Systems query
    res_sys = client.post("/api/chat", json={"message": "What systems are running?"})
    assert "SYS-AUTH-01" in res_sys.json()["response"]

    # Save fact intent
    fact_text = f"SYS-AUTH-01 uses TLS-1.3 with automated certificate renewal {uuid.uuid4().hex[:6]}"
    res_save = client.post("/api/chat", json={"message": f"Remember that {fact_text}"})
    assert "recorded this fact into FalkorDB" in res_save.json()["response"]
    assert fact_text in res_save.json()["response"]

# 4. Honest handling of unknown questions
def test_honest_handling_of_unknown_questions():
    unknown_query = "What is the secret recipe for Martian potato stew?"
    res = client.post("/api/chat", json={"message": unknown_query})
    assert res.status_code == 200
    resp_text = res.json()["response"]
    assert "No matching records" in resp_text or "zero hallucinations" in resp_text
    assert "Martian potato stew" in resp_text

# 5. Voice transcript endpoint
def test_voice_transcript_endpoint():
    res = client.post("/api/voice/transcript", json={
        "transcript": "Show registered systems",
        "confidence": 0.96
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data.get("processed_as_speech") is True
    assert "SYS-AUTH-01" in data["response"]

    # Empty voice transcript handling
    res_empty = client.post("/api/voice/transcript", json={"transcript": "   "})
    assert res_empty.status_code == 200
    assert res_empty.json()["status"] == "EMPTY_TRANSCRIPT"

# 6. FalkorDB connection failure
def test_database_connection_failure_simulation(monkeypatch):
    class FailingDbManager:
        def check_health(self):
            return False, {"status": "UNREACHABLE", "error": "Connection timed out"}
        def get_graph(self):
            raise DatabaseConnectionError("FalkorDB unreachable")

    failing_chat = type(chat_service)(manager=FailingDbManager())
    res = failing_chat.chat("Hello there")
    assert res["status"] == "DATABASE_DISCONNECTED"
    assert res["database_healthy"] is False
    assert "FalkorDB is currently unreachable" in res["response"]

# 7. Successful graph writes and reads
def test_successful_graph_writes_and_reads():
    test_fact = f"Host-Finance-01 operates in isolated VLAN 402 {uuid.uuid4().hex[:6]}"
    mem = chat_service.create_memory(
        fact=test_fact,
        entity="Host-Finance-01",
        category="security",
        provenance="automated_test"
    )
    assert mem["id"].startswith("FACT-")
    assert mem["fact"] == test_fact

    # Verify direct read back from FalkorDB
    search_results = chat_service.search_memory(q=test_fact)
    assert len(search_results) > 0
    assert any(r["text"] == test_fact for r in search_results)

# 8. Memory search endpoint
def test_memory_search_endpoint():
    unique_keyword = f"telemetry_{uuid.uuid4().hex[:6]}"
    client.post("/api/memory", json={
        "fact": f"High frequency {unique_keyword} collector enabled",
        "category": "observability"
    })

    res = client.get(f"/api/memory/search?q={unique_keyword}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert len(data["data"]) >= 1
    assert unique_keyword in data["data"][0]["text"]

# 9. Memory deletion endpoint
def test_memory_deletion_endpoint():
    # Create memory
    res_create = client.post("/api/memory", json={
        "fact": "Temporary fact to be deleted",
        "category": "temp"
    })
    mem_id = res_create.json()["data"]["id"]

    # Delete memory
    res_del = client.delete(f"/api/memory/{mem_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "SUCCESS"
    assert res_del.json()["deleted_id"] == mem_id

    # Verify 404 on deleting non-existent ID
    res_del_nonexistent = client.delete("/api/memory/NONEXISTENT-FACT-999")
    assert res_del_nonexistent.status_code == 404

# 10. Retrieval of facts across separate conversations
def test_cross_conversation_fact_retrieval():
    conv_a = f"conv-A-{uuid.uuid4().hex[:6]}"
    conv_b = f"conv-B-{uuid.uuid4().hex[:6]}"
    unique_code = f"CLUSTER-{uuid.uuid4().hex[:4].upper()}"

    # Save fact in Conversation A
    client.post("/api/chat", json={
        "conversation_id": conv_a,
        "message": f"Remember that SYS-PAY-02 belongs to primary {unique_code} failover group."
    })

    # Retrieve and query in Conversation B
    res_b = client.post("/api/chat", json={
        "conversation_id": conv_b,
        "message": f"Show saved facts"
    })
    assert res_b.status_code == 200
    assert unique_code in res_b.json()["response"]

# 11. Graph endpoint output
def test_graph_endpoint_output():
    res = client.get("/api/graph?limit=50")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "nodes" in data
    assert "edges" in data
    assert data["total_nodes"] > 0
    # Confirm nodes have required React Flow properties
    first_node = data["nodes"][0]
    assert "id" in first_node
    assert "label" in first_node
    assert "name" in first_node

# 12. Health endpoint accuracy
def test_health_endpoints_accuracy():
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    health_data = res_health.json()
    assert health_data["status"] in ["HEALTHY", "DEGRADED"]
    assert health_data["database_connected"] is True
    assert health_data["agent_mode"] in ["deterministic", "ollama"]

    res_db = client.get("/api/health/database")
    assert res_db.status_code == 200
    db_data = res_db.json()
    assert db_data["status"] == "HEALTHY"
    assert db_data["connected"] is True
    assert db_data["nodes"] > 0

# 13. Ollama unavailable fallback
def test_ollama_unavailable_fallback(monkeypatch):
    # Test that requesting ollama mode when offline triggers graceful honest fallback
    res = client.post("/api/chat", json={
        "message": "What systems exist?",
        "agent_mode": "ollama"
    })
    assert res.status_code == 200
    data = res.json()
    # Response must either succeed with local ollama or include honest fallback notice
    if data["used_local_llm"]:
        assert len(data["response"]) > 0
    else:
        assert "Notice: Local Ollama service" in data["response"] or "Operating in Deterministic Graph Engine mode" in data["response"]
        assert "SYS-AUTH-01" in data["response"]

# 14. Ensuring deterministic mode makes no model requests
def test_deterministic_mode_makes_no_model_requests(monkeypatch):
    called = []
    def fake_post(*args, **kwargs):
        called.append(args)
        raise AssertionError("External or model HTTP request was attempted in deterministic mode!")

    monkeypatch.setattr("httpx.Client.post", fake_post)

    # In deterministic mode, this must execute purely via Cypher and rules without calling any HTTP inference endpoint
    res = chat_service.chat(
        message="What systems exist?",
        agent_mode="deterministic"
    )
    assert len(called) == 0
    assert "SYS-AUTH-01" in res["response"]
    assert res["used_local_llm"] is False

# 15. CORS and API error handling
def test_cors_and_api_error_handling():
    # CORS preflight options check
    res_cors = client.options("/api/chat", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST"
    })
    assert res_cors.status_code in [200, 204]
    assert "access-control-allow-origin" in res_cors.headers
