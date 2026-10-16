import { GraphEntity, GraphRelationship } from './graph';

export type FactType = 'FACT' | 'INFERENCE' | 'HYPOTHESIS' | 'UNKNOWN';

export type InvestigationStepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ReasoningStep {
  id: string;
  stepNumber: number;
  title: string;
  stage: 'QUERY_DECOMPOSITION' | 'MEMORY_BANK_RECALL' | 'GRAPH_HOP_EXPANSION' | 'CORRELATION_ANALYSIS' | 'SYNTHESIS';
  description: string;
  durationMs: number;
  status: InvestigationStepStatus;
  entitiesDiscovered: string[];
  relationshipsTraversed: string[];
  notes?: string;
}

export interface EvidenceItem {
  id: string; // e.g. 'EV-8801'
  title: string;
  factType: FactType;
  confidence: number; // 0.0 - 1.0
  source: string; // e.g., 'Sysmon_Event_1', 'Zeek_Conn_Log', 'FalkorDB_SubGraph'
  timestamp: string;
  entityId: string;
  sessionId?: string;
  rawSnippet: string;
  sha256?: string;
  isSimulated: boolean;
  provenanceDetails: {
    collector: string;
    ingestTime: string;
    immutableHash: string;
    sessionCrossReference?: string;
  };
}

export interface CrossSessionMemoryInsight {
  originalSessionId: string;
  originalEntityId: string;
  recalledEntityId: string;
  contextSummary: string;
  significance: string;
  similarityScore: number;
  timestamp: string;
  bridgingRelationship: string;
}

export interface InvestigationRequest {
  entityId: string;
  objective: string;
  scenarioId?: string;
  sessionId?: string;
  depth: number;
}

export interface InvestigationResult {
  id: string;
  request: InvestigationRequest;
  targetEntity: GraphEntity;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  riskScore: number; // 0 to 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  executiveSummary: string;
  detailedFindings: string[];
  reasoningSteps: ReasoningStep[];
  evidenceList: EvidenceItem[];
  subgraph: {
    entities: GraphEntity[];
    relationships: GraphRelationship[];
    highlightPath: string[]; // sequence of entity IDs forming the critical path
  };
  crossSessionMemory?: CrossSessionMemoryInsight;
  factsBreakdown: {
    facts: number;
    inferences: number;
    hypotheses: number;
    unknowns: number;
  };
  completedAt: string;
  executionTimeMs: number;
  isSimulated: boolean;
}
