"""
ContextGraph AI - Configuration Module.
Zero-cost, local-first configuration with support for environment overrides.
"""
import os
from dataclasses import dataclass

@dataclass(frozen=True)
class AppConfig:
    # FalkorDB settings - auto-detect Railway and cloud variables
    @staticmethod
    def _resolve_db_settings():
        import urllib.parse
        falkordb_url = os.getenv("FALKORDB_URL") or os.getenv("REDIS_URL")
        host = os.getenv("FALKORDB_HOST") or os.getenv("REDISHOST") or os.getenv("REDIS_HOST")
        port_raw = os.getenv("FALKORDB_PORT") or os.getenv("REDISPORT") or os.getenv("REDIS_PORT")
        password = os.getenv("FALKORDB_PASSWORD") or os.getenv("REDISPASSWORD") or os.getenv("REDIS_PASSWORD")
        username = os.getenv("FALKORDB_USERNAME") or os.getenv("REDISUSER") or os.getenv("REDIS_USER")

        # Parse from full URL if provided (standard Railway / FalkorDB Cloud URL)
        if falkordb_url:
            try:
                parsed = urllib.parse.urlparse(falkordb_url)
                if parsed.hostname:
                    host = parsed.hostname
                if parsed.port:
                    port_raw = str(parsed.port)
                if parsed.username:
                    username = parsed.username
                if parsed.password:
                    password = urllib.parse.unquote(parsed.password)
            except Exception:
                pass

        if not host:
            # Check if running in Railway private network
            if os.getenv("RAILWAY_ENVIRONMENT"):
                host = "falkordb.railway.internal"
            else:
                host = "127.0.0.1"

        port = int(port_raw) if port_raw else 6379

        # Clean quotes and whitespace from password
        if password:
            password = password.strip().strip("'\"")

        # In FalkorDB Cloud ACL, default username is 'falkordb' (or fallback to 'default')
        if password and not username:
            username = "falkordb"

        return host, port, username, password, falkordb_url

    _resolved = _resolve_db_settings.__func__()
    FALKORDB_HOST: str = _resolved[0]
    FALKORDB_PORT: int = _resolved[1]
    FALKORDB_USERNAME: str | None = _resolved[2]
    FALKORDB_PASSWORD: str | None = _resolved[3]
    FALKORDB_URL: str | None = _resolved[4]
    GRAPH_NAME: str = os.getenv("GRAPH_NAME", "contextgraph")
    
    # Application & Agent bounds
    APP_NAME: str = "ThreatNexus"
    APP_VERSION: str = "1.0.0-hackathon"
    ENVIRONMENT: str = "ContextGraph Simulation Lab (Synthetic)"
    MAX_TRAVERSAL_DEPTH: int = int(os.getenv("MAX_TRAVERSAL_DEPTH", "3"))
    MAX_QUERY_RESULTS: int = int(os.getenv("MAX_QUERY_RESULTS", "50"))
    
    # MCP settings
    MCP_HOST: str = os.getenv("MCP_HOST", "127.0.0.1")
    MCP_PORT: int = int(os.getenv("MCP_PORT", "8000"))

    # Agent & Local Inference Settings (Zero paid APIs)
    AGENT_MODE: str = os.getenv("AGENT_MODE", "deterministic")  # "deterministic" or "ollama"
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3:latest")
    OLLAMA_TIMEOUT: float = float(os.getenv("OLLAMA_TIMEOUT", "30.0"))

config = AppConfig()

