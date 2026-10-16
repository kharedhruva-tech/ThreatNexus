import { InvestigationRequest, InvestigationResult, ReasoningStep, EvidenceItem } from '../types/investigation';
import { DemoScenario } from '../types/scenario';
import { INVESTIGATION_RESULT_E101, INVESTIGATION_RESULT_E102, DEMO_EVIDENCE } from '../demo/investigationData';
import { DEMO_SCENARIOS } from '../demo/scenariosData';
import { DEMO_ENTITIES } from '../demo/graphData';

export interface IInvestigationService {
  runInvestigation(
    request: InvestigationRequest,
    onStepUpdate?: (step: ReasoningStep) => void
  ): Promise<InvestigationResult>;
  getInvestigationById(id: string): Promise<InvestigationResult | null>;
  getEvidence(filter?: { sessionId?: string; entityId?: string; factType?: string }): Promise<EvidenceItem[]>;
  getScenarios(): Promise<DemoScenario[]>;
}

class MockInvestigationService implements IInvestigationService {
  async runInvestigation(
    request: InvestigationRequest,
    onStepUpdate?: (step: ReasoningStep) => void
  ): Promise<InvestigationResult> {
    const isE102 = request.entityId.toUpperCase() === 'E-102';
    const baseResult = isE102 ? INVESTIGATION_RESULT_E102 : INVESTIGATION_RESULT_E101;

    // Simulate multi-step reasoning progression with callbacks if supplied
    if (onStepUpdate) {
      for (const step of baseResult.reasoningSteps) {
        onStepUpdate({ ...step, status: 'RUNNING' });
        await new Promise((r) => setTimeout(r, 180));
        onStepUpdate({ ...step, status: 'COMPLETED' });
      }
    }

    return Promise.resolve({
      ...baseResult,
      request,
      completedAt: new Date().toISOString(),
    });
  }

  async getInvestigationById(id: string): Promise<InvestigationResult | null> {
    if (id === 'INV-2026-001') return Promise.resolve(INVESTIGATION_RESULT_E101);
    if (id === 'INV-2026-002') return Promise.resolve(INVESTIGATION_RESULT_E102);
    return Promise.resolve(INVESTIGATION_RESULT_E102);
  }

  async getEvidence(filter?: { sessionId?: string; entityId?: string; factType?: string }): Promise<EvidenceItem[]> {
    let list = [...DEMO_EVIDENCE];
    if (filter?.sessionId) {
      list = list.filter((e) => e.sessionId === filter.sessionId);
    }
    if (filter?.entityId) {
      list = list.filter((e) => e.entityId === filter.entityId);
    }
    if (filter?.factType && filter.factType !== 'ALL') {
      list = list.filter((e) => e.factType === filter.factType);
    }
    return Promise.resolve(list);
  }

  async getScenarios(): Promise<DemoScenario[]> {
    return Promise.resolve([...DEMO_SCENARIOS]);
  }
}

export const investigationService = new MockInvestigationService();
