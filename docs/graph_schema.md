# ContextGraph AI — Graph Schema Specification

ContextGraph AI models its synthetic universe and agent operational state as a single connected graph inside FalkorDB.

---

## 1. Node Labels

| Node Label | Description | Primary Properties |
| :--- | :--- | :--- |
| `Person` | Synthetic lab engineers and architects | `id`, `name`, `role`, `email`, `scenario` |
| `Organization` | Synthetic research lab | `id`, `name`, `domain`, `created_at` |
| `Project` | Engineering or research initiative | `id`, `name`, `status`, `priority`, `start_date` |
| `System` | Infrastructure service or microservice | `id`, `name`, `tier`, `environment`, `status`, `criticality` |
| `Software` | Software libraries and code packages | `id`, `name`, `version`, `language`, `maintainer` |
| `Event` | Synthetic operational or incident events | `id`, `name`, `timestamp`, `duration_sec`, `severity`, `category` |
| `Record` | Security advisories, logs, and RFCs | `id`, `type`, `title`, `severity`, `status`, `timestamp` |
| `Document` | Architecture specs and standards | `id`, `title`, `version`, `author`, `status` |
| `Task` | Operational engineering tasks | `id`, `title`, `assignee`, `priority`, `status` |
| `Session` | Persistent agent session record | `id`, `user_request`, `intent`, `tools_json`, `summary`, `reuse_outcome`, `timestamp` |
| `Investigation`| Specific investigation scope | `id`, `target_entity_id`, `outcome`, `timestamp` |
| `Finding` | Derived conclusion or discovery | `id`, `claim`, `sufficiency`, `rule_id`, `timestamp` |
| `Evidence` | Supporting evidentiary unit | `id`, `claim`, `rule_id`, `sufficiency`, `timestamp` |
| `Decision` | Ratified technical decision | `id`, `claim`, `status`, `rule`, `timestamp` |

---

## 2. Relationship Types

| Relationship | Source Label | Target Label | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| `WORKS_WITH` | `Person` | `Person` | Engineering collaboration |
| `BELONGS_TO` | `Person` / `System` / `Task` | `Organization` / `Project` | Ownership / membership hierarchy |
| `OWNS` | `Person` / `Session` | `Project` / `Investigation` | Accountability / parent ownership |
| `USES` | `System` | `Software` | Code dependency |
| `DEPENDS_ON` | `System` | `System` | Runtime architectural dependency |
| `AFFECTS` | `Event` / `Record` | `System` / `Software` | Incident impact or vulnerability exposure |
| `RELATED_TO` | `Event` / `Record` / `Task` | `Event` / `Record` / `System`| Associative correlation |
| `REFERENCED_IN` | `Document` | `Project` | Documentation provenance |
| `OCCURRED_DURING` | `Event` | `Event` | Temporal containment |
| `RECORDED_IN` | `Event` | `Record` | Audit log evidence binding |
| `SUPPORTED_BY` | `Finding` / `Decision` | `Evidence` / `Document` | Grounded proof and justification |
| `LED_TO` | `Event` | `Event` | Causal chronology |
| `DISCOVERED_IN` | `Investigation` | `Finding` | Investigation outcome |
| `REVISITS` | `Session` | `Session` | Cross-session context reuse link |
| `DERIVED_FROM` | `Finding` | `Finding` | Epistemic derivation from earlier finding |

---

## 3. Epistemic Classifications

1. **`STORED_FACT`**: Values or relationships directly recorded in FalkorDB (e.g. `(SYS-PAY-02)-[:DEPENDS_ON]->(SYS-AUTH-01)`).
2. **`RULE_BASED_INFERENCE`**: Conclusions derived from facts via explicit rules (e.g., downstream failure propagation).
3. **`HYPOTHESIS`**: Unproven explanations where critical telemetry is absent.
4. **`UNKNOWN`**: Explicitly unobserved properties or missing logs.
