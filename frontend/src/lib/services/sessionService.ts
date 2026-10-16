import { Session, SessionContext, MemoryRecord } from '../types/session';
import { DEMO_SESSIONS } from '../demo/sessionData';

export interface ISessionService {
  getSessions(): Promise<Session[]>;
  getSessionById(id: string): Promise<Session | null>;
  createSession(name: string, description: string, primaryTarget?: string): Promise<Session>;
  getMemoryRecords(): Promise<MemoryRecord[]>;
  preserveSessionContext(sessionId: string, context: SessionContext): Promise<boolean>;
}

class MockSessionService implements ISessionService {
  private sessions: Session[] = [...DEMO_SESSIONS];

  async getSessions(): Promise<Session[]> {
    return Promise.resolve([...this.sessions]);
  }

  async getSessionById(id: string): Promise<Session | null> {
    const session = this.sessions.find((s) => s.id === id);
    return Promise.resolve(session || null);
  }

  async createSession(name: string, description: string, primaryTarget: string = 'E-102'): Promise<Session> {
    const newSessionId = `S-2026-${String(this.sessions.length + 1).padStart(2, '0')}`;
    const newSession: Session = {
      id: newSessionId,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      investigator: 'Agent-Vigilance-02 (Autonomous)',
      primaryTarget,
      entityCount: 1,
      evidenceCount: 1,
      tags: ['New-Session', 'Cross-Session-Demo'],
      context: {
        sessionId: newSessionId,
        title: name,
        investigatedEntityIds: [primaryTarget],
        findingsCount: 0,
        storedMemoryRecords: [],
        graphSnapshotNodeCount: 1,
        graphSnapshotEdgeCount: 0,
        preservedAt: new Date().toISOString(),
        investigatorNotes: `New investigation session initiated for ${primaryTarget}.`,
        isSimulated: true,
      },
    };

    this.sessions.unshift(newSession);
    return Promise.resolve(newSession);
  }

  async getMemoryRecords(): Promise<MemoryRecord[]> {
    const allRecords: MemoryRecord[] = [];
    for (const session of this.sessions) {
      if (session.context && session.context.storedMemoryRecords) {
        allRecords.push(...session.context.storedMemoryRecords);
      }
    }
    return Promise.resolve(allRecords);
  }

  async preserveSessionContext(sessionId: string, context: SessionContext): Promise<boolean> {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.context = context;
      session.updatedAt = new Date().toISOString();
      session.status = 'DEMO_PRESERVED';
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
}

export const sessionService = new MockSessionService();
