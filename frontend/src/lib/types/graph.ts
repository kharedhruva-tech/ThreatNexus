export type EntityType = 
  | 'Host'
  | 'Process'
  | 'IP_Address'
  | 'User_Account'
  | 'File_Artifact'
  | 'Database'
  | 'Vulnerability'
  | 'Domain';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface EntityMetadata {
  os?: string;
  ip?: string;
  cve?: string;
  hash?: string;
  path?: string;
  owner?: string;
  port?: number;
  protocol?: string;
  lastSeen?: string;
  sourceSessionId?: string;
  isSimulated: boolean;
  [key: string]: any;
}

export interface GraphEntity {
  id: string; // e.g., 'E-101', 'E-102'
  label: string;
  name: string;
  type: EntityType;
  riskLevel: RiskLevel;
  confidence: number; // 0 to 1
  description: string;
  firstSeen: string;
  lastObserved: string;
  provenance: {
    source: string;
    sessionId?: string;
    timestamp: string;
    verified: boolean;
  };
  metadata: EntityMetadata;
  tags: string[];
}

export type RelationshipType = 
  | 'COMMUNICATED_WITH'
  | 'SPAWNED_PROCESS'
  | 'ACCESSED_CREDENTIAL'
  | 'AUTHENTICATED_TO'
  | 'STORED_ON'
  | 'EXPLOITED'
  | 'LATERAL_MOVEMENT_TO'
  | 'COMMAND_AND_CONTROL';

export interface GraphRelationship {
  id: string; // e.g., 'R-201'
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  label: string;
  riskLevel: RiskLevel;
  confidence: number;
  weight: number;
  timestamp: string;
  evidenceId?: string;
  sessionId?: string;
  description: string;
  isSimulated: boolean;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphEntity[];
  edges: GraphRelationship[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    criticalNodes: number;
    sessionsCovered: number;
    generatedAt: string;
  };
}

export interface GraphFilter {
  searchQuery: string;
  selectedTypes: EntityType[];
  riskLevels: RiskLevel[];
  onlyInPath?: boolean;
}
