export type ComponentStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'DEMO_SIMULATED';

export interface ServiceHealthMetric {
  name: string;
  key: 'frontend' | 'backend_adapter' | 'falkordb' | 'gemini_ai' | 'graph_cache';
  status: ComponentStatus;
  latencyMs: number;
  lastChecked: string;
  version: string;
  endpoint: string;
  isSimulated: boolean;
  details: string;
}

export interface SystemHealth {
  overallStatus: ComponentStatus;
  mode: 'DEMO' | 'LIVE';
  services: ServiceHealthMetric[];
  uptimeSeconds: number;
  totalRequestsHandled: number;
  graphStats: {
    nodeCount: number;
    edgeCount: number;
    memoryTriples: number;
  };
  lastChecked: string;
  backendConfiguredUrl: string;
}
