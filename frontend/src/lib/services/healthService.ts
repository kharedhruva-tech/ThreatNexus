import { SystemHealth } from '../types/health';
import { INITIAL_GRAPH_DATA } from '../demo/graphData';

export interface IHealthService {
  getSystemHealth(): Promise<SystemHealth>;
}

class MockHealthService implements IHealthService {
  async getSystemHealth(): Promise<SystemHealth> {
    const isClient = typeof window !== 'undefined';
    const configuredApi = (isClient && (window as any).__CONTEXTGRAPH_API_URL__) || 'http://localhost:8000/api/v1 (Proposed)';

    return Promise.resolve({
      overallStatus: 'DEMO_SIMULATED',
      mode: 'DEMO',
      uptimeSeconds: 84620,
      totalRequestsHandled: 1248,
      lastChecked: new Date().toISOString(),
      backendConfiguredUrl: configuredApi,
      graphStats: {
        nodeCount: INITIAL_GRAPH_DATA.summary.totalNodes,
        edgeCount: INITIAL_GRAPH_DATA.summary.totalEdges,
        memoryTriples: 5,
      },
      services: [
        {
          name: 'Frontend Engine (Next.js & React 19)',
          key: 'frontend',
          status: 'OPERATIONAL',
          latencyMs: 12,
          lastChecked: new Date().toISOString(),
          version: '1.0.0-rc1',
          endpoint: 'Client-side SPA Runtime',
          isSimulated: false,
          details: 'Liquid Glass UI active, @xyflow/react graph canvas mounted.',
        },
        {
          name: 'Python Backend Adapter',
          key: 'backend_adapter',
          status: 'DEMO_SIMULATED',
          latencyMs: 45,
          lastChecked: new Date().toISOString(),
          version: '0.1.0-mock',
          endpoint: configuredApi,
          isSimulated: true,
          details: 'Running in Standalone Frontend Demo Mode. Awaiting Python backend pairing.',
        },
        {
          name: 'FalkorDB Graph Storage',
          key: 'falkordb',
          status: 'DEMO_SIMULATED',
          latencyMs: 0,
          lastChecked: new Date().toISOString(),
          version: 'v0.4.0 (Synthetic Schema)',
          endpoint: 'falkordb://localhost:6379 (Proposed backend connection)',
          isSimulated: true,
          details: 'Synthetic graph schema loaded in memory. Browser does not connect directly to FalkorDB for security.',
        },
        {
          name: 'Gemini Agent Service',
          key: 'gemini_ai',
          status: 'DEMO_SIMULATED',
          latencyMs: 0,
          lastChecked: new Date().toISOString(),
          version: 'gemini-1.5-flash (Simulated Reasoning Engine)',
          endpoint: 'https://generativelanguage.googleapis.com (Backend managed)',
          isSimulated: true,
          details: 'Simulated multi-stage reasoning active. API credentials safely preserved on backend side.',
        },
        {
          name: 'ContextGraph In-Memory Cache',
          key: 'graph_cache',
          status: 'OPERATIONAL',
          latencyMs: 4,
          lastChecked: new Date().toISOString(),
          version: 'v2.1',
          endpoint: 'Browser Client State (Zustand/React Context)',
          isSimulated: false,
          details: 'Cached 10 entities, 10 relationships, 3 historical sessions.',
        },
      ],
    });
  }
}

export const healthService = new MockHealthService();
