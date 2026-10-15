"""
ContextGraph AI - Graph Schema & Index Management.
Defines entity types, relationships, constraints, and supported index creation in FalkorDB.
"""
from typing import List, Dict, Any

# Node Labels
NODE_LABELS = [
    "Person",
    "Organization",
    "Project",
    "System",
    "Software",
    "Event",
    "Record",
    "Document",
    "Task",
    "Session",
    "Evidence",
    "Decision",
    "Investigation",
    "Finding"
]

# Relationship Types
RELATIONSHIP_TYPES = [
    "WORKS_WITH",
    "BELONGS_TO",
    "OWNS",
    "USES",
    "DEPENDS_ON",
    "AFFECTS",
    "RELATED_TO",
    "REFERENCED_IN",
    "OCCURRED_DURING",
    "RECORDED_IN",
    "SUPPORTED_BY",
    "LED_TO",
    "DISCOVERED_IN",
    "REVISITS",
    "DERIVED_FROM"
]

# Epistemic Categories for Explainability
EPISTEMIC_STATUSES = [
    "STORED_FACT",
    "RULE_BASED_INFERENCE",
    "HYPOTHESIS",
    "UNKNOWN"
]

# Evidence Sufficiency Categories
EVIDENCE_SUFFICIENCY = [
    "SUPPORTED",
    "PARTIALLY_SUPPORTED",
    "INSUFFICIENT"
]

# Context Reuse Outcomes
REUSE_STATUSES = [
    "FRESH_INVESTIGATION",
    "REUSED_CONTEXT",
    "EXTENDED_INVESTIGATION",
    "CONTRADICTED_PRIOR_FINDING",
    "NO_RELEVANT_PRIOR_CONTEXT"
]

def initialize_schema_indices(graph) -> List[Dict[str, Any]]:
    """
    Creates indices on primary identifiers for fast multi-hop lookups.
    Safely handles existing indices or syntax variants across FalkorDB versions.
    """
    results = []
    # FalkorDB standard index syntax: CREATE INDEX ON :Label(property)
    index_targets = [
        ("System", "id"),
        ("Software", "id"),
        ("Event", "id"),
        ("Record", "id"),
        ("Person", "id"),
        ("Project", "id"),
        ("Session", "id"),
        ("Evidence", "id"),
        ("Finding", "id"),
        ("Investigation", "id"),
        ("Decision", "id")
    ]
    
    for label, prop in index_targets:
        query = f"CREATE INDEX ON :{label}({prop})"
        try:
            res = graph.query(query)
            results.append({"label": label, "property": prop, "status": "CREATED_OR_EXISTS"})
        except Exception as e:
            # If index already exists or syntax differs, capture cleanly
            results.append({"label": label, "property": prop, "status": "ALREADY_EXISTS_OR_SKIPPED", "detail": str(e)})
            
    return results
