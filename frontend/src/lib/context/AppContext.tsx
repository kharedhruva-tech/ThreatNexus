'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '../types/session';
import { DemoScenario } from '../types/scenario';
import { InvestigationResult } from '../types/investigation';
import { GraphData, GraphEntity } from '../types/graph';
import { apiClient, ApiError } from '../api/apiClient';
import { DEMO_SCENARIOS } from '../demo/scenariosData';
import { DEMO_SESSIONS } from '../demo/sessionData';
import { INVESTIGATION_RESULT_E101, INVESTIGATION_RESULT_E102 } from '../demo/investigationData';
import { INITIAL_GRAPH_DATA } from '../demo/graphData';

export interface FalkorDbStatus {
  connected: boolean;
  endpoint: string;
  nodeCount: number;
  edgeCount: number;
  details?: string;
  lastChecked?: string;
}

interface AppContextType {
  // Demo Mode & Live Backend Configuration
  isDemoMode: boolean;
  setIsDemoMode: (enabled: boolean) => void;
  toggleDemoMode: () => void;
  backendUrl: string;
  setBackendUrl: (url: string) => void;

  // FalkorDB Connection State
  falkorDbStatus: FalkorDbStatus;
  checkFalkorDbHealth: () => Promise<void>;

  // Graph Data & State
  graphData: GraphData | null;
  isGraphLoading: boolean;
  graphError: string | null;
  refreshGraph: (params?: { sessionId?: string; targetEntityId?: string }) => Promise<void>;

  // Sessions State
  sessions: Session[];
  activeSession: Session;
  setActiveSession: (session: Session) => void;
  isSessionsLoading: boolean;
  sessionsError: string | null;
  refreshSessions: () => Promise<void>;

  // Scenarios State
  scenarios: DemoScenario[];
  selectedScenario: DemoScenario;
  setSelectedScenario: (scenario: DemoScenario) => void;
  isScenariosLoading: boolean;
  scenariosError: string | null;
  refreshScenarios: () => Promise<void>;

  // Entity Selection & Inspection
  selectedEntityId: string;
  setSelectedEntityId: (id: string) => void;
  selectedEntity: GraphEntity | null;
  setSelectedEntity: (entity: GraphEntity | null) => void;

  // Active Investigation
  activeInvestigation: InvestigationResult | null;
  setActiveInvestigation: (result: InvestigationResult | null) => void;
  isInvestigationRunning: boolean;
  setIsInvestigationRunning: (val: boolean) => void;
  investigationError: string | null;
  setInvestigationError: (err: string | null) => void;

  // Repeatable Hackathon Demo Flow Actions
  launchE101Demo: () => void;
  launchE102CrossSessionDemo: () => void;
  isQuickDemoActive: boolean;
  demoStep: 'IDLE' | 'E101_INVESTIGATED' | 'SESSION_PRESERVED' | 'NEW_SESSION_STARTED' | 'E102_CORRELATED';
  setDemoStep: (step: 'IDLE' | 'E101_INVESTIGATED' | 'SESSION_PRESERVED' | 'NEW_SESSION_STARTED' | 'E102_CORRELATED') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initialize configuration with deterministic SSR-safe defaults (Default to LIVE FalkorDB)
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(false);
  const [backendUrl, setBackendUrlState] = useState<string>(
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  );

  // FalkorDB Connection Status
  const [falkorDbStatus, setFalkorDbStatus] = useState<FalkorDbStatus>({
    connected: true,
    endpoint: '127.0.0.1:6379',
    nodeCount: 103,
    edgeCount: 117,
    details: "Direct graph connection to 'contextgraph' active with 103 nodes.",
    lastChecked: '',
  });

  const checkFalkorDbHealth = useCallback(async () => {
    try {
      const health = await apiClient.getHealth();
      const falkorService = health.services?.find((s) => s.key === 'falkordb');
      const isConnected = falkorService?.status === 'OPERATIONAL';
      setFalkorDbStatus({
        connected: isConnected,
        endpoint: falkorService?.endpoint || '127.0.0.1:6379',
        nodeCount: health.graphStats?.nodeCount || 103,
        edgeCount: health.graphStats?.edgeCount || 117,
        details: falkorService?.details || "Direct graph connection to 'contextgraph' active.",
        lastChecked: health.lastChecked,
      });
    } catch {
      setFalkorDbStatus((prev) => ({
        ...prev,
        connected: false,
        details: 'FalkorDB or Backend currently unreachable.',
      }));
    }
  }, []);

  // Synchronize client storage preferences after mounting (prevents SSR hydration mismatch)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      apiClient.syncWithLocalStorage();
      setIsDemoModeState(apiClient.isDemo());
      setBackendUrlState(apiClient.getBaseUrl());
      checkFalkorDbHealth();
    }
  }, [checkFalkorDbHealth]);

  // Graph State
  const [graphData, setGraphData] = useState<GraphData | null>(INITIAL_GRAPH_DATA);
  const [isGraphLoading, setIsGraphLoading] = useState<boolean>(false);
  const [graphError, setGraphError] = useState<string | null>(null);

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>(DEMO_SESSIONS);
  const [activeSession, setActiveSession] = useState<Session>(DEMO_SESSIONS[1]); // Default to S-2026-02
  const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Scenarios State
  const [scenarios, setScenarios] = useState<DemoScenario[]>(DEMO_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [isScenariosLoading, setIsScenariosLoading] = useState<boolean>(false);
  const [scenariosError, setScenariosError] = useState<string | null>(null);

  // Selected Entity
  const [selectedEntityId, setSelectedEntityId] = useState<string>('E-101');
  const [selectedEntity, setSelectedEntity] = useState<GraphEntity | null>(null);

  // Investigation State
  const [activeInvestigation, setActiveInvestigation] = useState<InvestigationResult | null>(INVESTIGATION_RESULT_E102);
  const [isInvestigationRunning, setIsInvestigationRunning] = useState<boolean>(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  // Demo flow progression
  const [demoStep, setDemoStep] = useState<
    'IDLE' | 'E101_INVESTIGATED' | 'SESSION_PRESERVED' | 'NEW_SESSION_STARTED' | 'E102_CORRELATED'
  >('IDLE');

  // Change Demo Mode
  const setIsDemoMode = useCallback((enabled: boolean) => {
    apiClient.setDemoMode(enabled);
    setIsDemoModeState(enabled);
  }, []);

  const toggleDemoMode = useCallback(() => {
    const nextVal = !apiClient.isDemo();
    apiClient.setDemoMode(nextVal);
    setIsDemoModeState(nextVal);
  }, []);

  const setBackendUrl = useCallback((url: string) => {
    apiClient.setBaseUrl(url);
    setBackendUrlState(url);
  }, []);

  // Fetch Graph
  const refreshGraph = useCallback(
    async (params?: { sessionId?: string; targetEntityId?: string }) => {
      setIsGraphLoading(true);
      setGraphError(null);
      try {
        const data = await apiClient.getGraph(params);
        setGraphData(data);
      } catch (err: any) {
        setGraphError(err.message || 'Failed to fetch graph data from backend adapter');
      } finally {
        setIsGraphLoading(false);
      }
    },
    []
  );

  // Fetch Sessions
  const refreshSessions = useCallback(async () => {
    setIsSessionsLoading(true);
    setSessionsError(null);
    try {
      const list = await apiClient.getSessions();
      setSessions(list);
      if (list.length > 0 && !list.some((s) => s.id === activeSession.id)) {
        setActiveSession(list[0]);
      }
    } catch (err: any) {
      setSessionsError(err.message || 'Failed to fetch sessions from backend adapter');
    } finally {
      setIsSessionsLoading(false);
    }
  }, [activeSession.id]);

  // Fetch Scenarios
  const refreshScenarios = useCallback(async () => {
    setIsScenariosLoading(true);
    setScenariosError(null);
    try {
      const list = await apiClient.getScenarios();
      setScenarios(list);
      if (list.length > 0 && !list.some((s) => s.id === selectedScenario.id)) {
        setSelectedScenario(list[0]);
      }
    } catch (err: any) {
      setScenariosError(err.message || 'Failed to fetch scenarios from backend adapter');
    } finally {
      setIsScenariosLoading(false);
    }
  }, [selectedScenario.id]);

  // Re-fetch when demo mode or backend URL changes
  useEffect(() => {
    refreshGraph();
    refreshSessions();
    refreshScenarios();
  }, [isDemoMode, backendUrl, refreshGraph, refreshSessions, refreshScenarios]);

  // Sync selectedEntity object when selectedEntityId or graphData changes
  useEffect(() => {
    if (graphData && selectedEntityId) {
      const match = graphData.nodes.find(
        (n) => n.id.toLowerCase() === selectedEntityId.toLowerCase()
      );
      if (match) setSelectedEntity(match);
    }
  }, [selectedEntityId, graphData]);

  // Demo flow helpers
  const launchE101Demo = useCallback(() => {
    const s1 = sessions.find((s) => s.id === 'S-2026-01') || DEMO_SESSIONS[0];
    setActiveSession(s1);
    setSelectedEntityId('E-101');
    setActiveInvestigation(INVESTIGATION_RESULT_E101);
    setDemoStep('E101_INVESTIGATED');
  }, [sessions]);

  const launchE102CrossSessionDemo = useCallback(() => {
    const s2 = sessions.find((s) => s.id === 'S-2026-02') || DEMO_SESSIONS[1];
    setActiveSession(s2);
    setSelectedEntityId('E-102');
    setActiveInvestigation(INVESTIGATION_RESULT_E102);
    setDemoStep('E102_CORRELATED');
  }, [sessions]);

  return (
    <AppContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        toggleDemoMode,
        backendUrl,
        setBackendUrl,
        falkorDbStatus,
        checkFalkorDbHealth,
        graphData,
        isGraphLoading,
        graphError,
        refreshGraph,
        sessions,
        activeSession,
        setActiveSession,
        isSessionsLoading,
        sessionsError,
        refreshSessions,
        scenarios,
        selectedScenario,
        setSelectedScenario,
        isScenariosLoading,
        scenariosError,
        refreshScenarios,
        selectedEntityId,
        setSelectedEntityId,
        selectedEntity,
        setSelectedEntity,
        activeInvestigation,
        setActiveInvestigation,
        isInvestigationRunning,
        setIsInvestigationRunning,
        investigationError,
        setInvestigationError,
        launchE101Demo,
        launchE102CrossSessionDemo,
        isQuickDemoActive: demoStep !== 'IDLE',
        demoStep,
        setDemoStep,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
