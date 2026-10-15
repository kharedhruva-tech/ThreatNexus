"""
ContextGraph AI - Configuration Module.
Zero-cost, local-first configuration with support for environment overrides.
"""
import os
from dataclasses import dataclass

@dataclass(frozen=True)
class AppConfig:
    # FalkorDB settings
    FALKORDB_HOST: str = os.getenv("FALKORDB_HOST", "127.0.0.1")
    FALKORDB_PORT: int = int(os.getenv("FALKORDB_PORT", "6379"))
    FALKORDB_PASSWORD: str | None = os.getenv("FALKORDB_PASSWORD", None)
    GRAPH_NAME: str = os.getenv("GRAPH_NAME", "contextgraph")
    
    # Application & Agent bounds
    APP_NAME: str = "ContextGraph AI"
    APP_VERSION: str = "1.0.0-hackathon"
    ENVIRONMENT: str = "ContextGraph Simulation Lab (Synthetic)"
    MAX_TRAVERSAL_DEPTH: int = int(os.getenv("MAX_TRAVERSAL_DEPTH", "3"))
    MAX_QUERY_RESULTS: int = int(os.getenv("MAX_QUERY_RESULTS", "50"))
    
    # MCP settings
    MCP_HOST: str = os.getenv("MCP_HOST", "127.0.0.1")
    MCP_PORT: int = int(os.getenv("MCP_PORT", "8000"))

config = AppConfig()
