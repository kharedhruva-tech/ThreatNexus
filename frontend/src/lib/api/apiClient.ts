import { GraphData, GraphEntity } from '../types/graph';
import { InvestigationRequest, InvestigationResult, EvidenceItem } from '../types/investigation';
import { Session, SessionContext } from '../types/session';
import { SystemHealth } from '../types/health';
import { DemoScenario } from '../types/scenario';
import { graphService } from '../services/graphService';
import { investigationService } from '../services/investigationService';
import { sessionService } from '../services/sessionService';
import { healthService } from '../services/healthService';

export class ApiError extends Error {
  statusCode?: number;
  endpoint: string;
  isNetworkError: boolean;

  constructor(message: string, endpoint: string, statusCode?: number, isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    this.isNetworkError = isNetworkError;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  isDemoMode: boolean;
  timeoutMs: number;
}

function resolveTimeout(url: string, overrideMs?: number): number {
  if (overrideMs && overrideMs > 0) return overrideMs;
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_TIMEOUT_MS) {
    const parsed = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Render and other free cloud hosts sleep after inactivity and need 40-60s to wake up
  const isCloudHost = url.includes('onrender.com') || url.includes('railway.app') || url.includes('fly.dev') || url.startsWith('https://');
  return isCloudHost ? 60000 : 30000;
}

export class ContextGraphApiClient {
  private config: ApiClientConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    let defaultUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    defaultUrl = defaultUrl.trim().replace(/\/+$/, '');
    if (defaultUrl && !defaultUrl.endsWith('/api/v1')) {
      defaultUrl += '/api/v1';
    }
    this.config = {
      baseUrl: defaultUrl,
      isDemoMode: false,
      timeoutMs: resolveTimeout(defaultUrl, config?.timeoutMs),
      ...config,
    };
  }

  syncWithLocalStorage() {
    if (typeof window !== 'undefined') {
      const savedDemoMode = localStorage.getItem('contextgraph_demo_mode');
      if (savedDemoMode !== null) {
        this.config.isDemoMode = savedDemoMode === 'true';
      } else {
        this.config.isDemoMode = false;
      }
      let savedBaseUrl = localStorage.getItem('contextgraph_api_url');
      if (savedBaseUrl) {
        savedBaseUrl = savedBaseUrl.trim().replace(/\/+$/, '');
        if (savedBaseUrl && !savedBaseUrl.endsWith('/api/v1')) {
          savedBaseUrl += '/api/v1';
        }
        this.config.baseUrl = savedBaseUrl;
        this.config.timeoutMs = resolveTimeout(savedBaseUrl);
      }
    }
  }

  setDemoMode(enabled: boolean) {
    this.config.isDemoMode = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('contextgraph_demo_mode', String(enabled));
    }
  }

  isDemo(): boolean {
    return this.config.isDemoMode;
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  setBaseUrl(url: string) {
    let normalized = url.trim().replace(/\/+$/, '');
    if (normalized && !normalized.endsWith('/api/v1')) {
      normalized += '/api/v1';
    }
    this.config.baseUrl = normalized;
    this.config.timeoutMs = resolveTimeout(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('contextgraph_api_url', normalized);
    }
  }

  private async fetchLive<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const fullUrl = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorBody = '';
        try {
          const json = await response.json();
          errorBody = json.detail || json.message || JSON.stringify(json);
        } catch {
          errorBody = response.statusText;
        }

        throw new ApiError(
          `Backend returned HTTP ${response.status}: ${errorBody}`,
          endpoint,
          response.status,
          false
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) throw err;

      const isAbort = err.name === 'AbortError';
      const isRender = fullUrl.includes('onrender.com');
      const msg = isAbort
        ? `Request timed out after ${this.config.timeoutMs}ms connecting to ${fullUrl}.${
            isRender
              ? ' Note: Render free tier services sleep after inactivity and require 40-60s to wake up on the first request.'
              : ''
          }`
        : `Network Error: Could not reach Python backend at ${fullUrl}. Ensure your backend server is running and CORS is enabled.`;

      throw new ApiError(msg, endpoint, undefined, true);
    }
  }

  // 1. Graph Data
  async getGraph(params?: { sessionId?: string; targetEntityId?: string; depth?: number }): Promise<GraphData> {
    if (this.config.isDemoMode) {
      return graphService.getGraphData();
    }
    const query = new URLSearchParams();
    if (params?.sessionId) query.set('sessionId', params.sessionId);
    if (params?.targetEntityId) query.set('targetEntityId', params.targetEntityId);
    if (params?.depth) query.set('depth', String(params.depth));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return this.fetchLive<GraphData>(`/graph${qs}`);
  }

  // 2. Entity Inspection
  async getEntity(id: string): Promise<GraphEntity | null> {
    if (this.config.isDemoMode) {
      return graphService.getEntityById(id);
    }
    return this.fetchLive<GraphEntity>(`/entities/${encodeURIComponent(id)}`);
  }

  // 3. Autonomous Investigation
  async runInvestigation(request: InvestigationRequest): Promise<InvestigationResult> {
    if (this.config.isDemoMode) {
      return investigationService.runInvestigation(request);
    }
    return this.fetchLive<InvestigationResult>('/investigate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 4. Session History & Context
  async getSessions(): Promise<Session[]> {
    if (this.config.isDemoMode) {
      return sessionService.getSessions();
    }
    return this.fetchLive<Session[]>('/sessions');
  }

  async getSession(id: string): Promise<Session | null> {
    if (this.config.isDemoMode) {
      return sessionService.getSessionById(id);
    }
    return this.fetchLive<Session>(`/sessions/${encodeURIComponent(id)}`);
  }

  async preserveSessionContext(sessionId: string, context: SessionContext): Promise<boolean> {
    if (this.config.isDemoMode) {
      return sessionService.preserveSessionContext(sessionId, context);
    }
    await this.fetchLive<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/context`, {
      method: 'POST',
      body: JSON.stringify(context),
    });
    return true;
  }

  // 5. Scenarios
  async getScenarios(): Promise<DemoScenario[]> {
    if (this.config.isDemoMode) {
      return investigationService.getScenarios();
    }
    return this.fetchLive<DemoScenario[]>('/scenarios');
  }

  // 6. Evidence Corpus
  async getEvidence(params?: { sessionId?: string; entityId?: string; factType?: string }): Promise<EvidenceItem[]> {
    if (this.config.isDemoMode) {
      return investigationService.getEvidence(params);
    }
    const query = new URLSearchParams();
    if (params?.sessionId) query.set('sessionId', params.sessionId);
    if (params?.entityId) query.set('entityId', params.entityId);
    if (params?.factType) query.set('factType', params.factType);
    const qs = query.toString() ? `?${query.toString()}` : '';

    return this.fetchLive<EvidenceItem[]>(`/evidence${qs}`);
  }

  // 7. Health & System Diagnostics
  async getHealth(): Promise<SystemHealth> {
    if (this.config.isDemoMode) {
      return healthService.getSystemHealth();
    }
    return this.fetchLive<SystemHealth>('/health');
  }

  // 8. Interactive Graph Assistant
  async chat(message: string, conversationId?: string): Promise<any> {
    return this.fetchLive<any>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        agent_mode: 'deterministic',
        save_memory: true,
      }),
    });
  }
}

export const apiClient = new ContextGraphApiClient();
