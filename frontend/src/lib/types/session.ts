export interface MemoryRecord {
  id: string; // e.g. 'MEM-101'
  entityId: string;
  triple: {
    subject: string;
    predicate: string;
    object: string;
  };
  storedAt: string;
  relevanceScore: number;
  confidence: number;
  summary: string;
  sessionId: string;
}

export interface SessionContext {
  sessionId: string;
  title: string;
  investigatedEntityIds: string[];
  findingsCount: number;
  storedMemoryRecords: MemoryRecord[];
  graphSnapshotNodeCount: number;
  graphSnapshotEdgeCount: number;
  preservedAt: string;
  investigatorNotes: string;
  isSimulated: boolean;
}

export interface Session {
  id: string; // e.g. 'S-2026-01'
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DEMO_PRESERVED';
  investigator: string;
  primaryTarget: string;
  entityCount: number;
  evidenceCount: number;
  context: SessionContext;
  tags: string[];
}
