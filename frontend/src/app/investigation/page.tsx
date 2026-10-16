'use client';

import React, { useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { InteractiveGraph } from '../../components/graph/InteractiveGraph';
import { AgentTimeline } from '../../components/investigation/AgentTimeline';
import { CrossSessionInsightCard } from '../../components/investigation/CrossSessionInsightCard';
import { EvidenceDrawer } from '../../components/investigation/EvidenceDrawer';
import {
  Cpu,
  Sparkles,
  PlayCircle,
  Database,
  ArrowRight,
  ShieldAlert,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';
import { apiClient } from '../../lib/api/apiClient';

export default function InvestigationPage() {
  const {
    activeSession,
    sessions,
    setActiveSession,
    selectedScenario,
    selectedEntityId,
    setSelectedEntityId,
    activeInvestigation,
    setActiveInvestigation,
    isInvestigationRunning,
    setIsInvestigationRunning,
    investigationError,
    setInvestigationError,
    isDemoMode,
    setIsDemoMode,
    launchE101Demo,
    launchE102CrossSessionDemo,
  } = useApp();

  const [inputEntityId, setInputEntityId] = useState(selectedEntityId || 'E-102');
  const [objective, setObjective] = useState(
    inputEntityId === 'E-101'
      ? 'Investigate abnormal outbound network connections and potential initial access on Host-Finance-01.'
      : 'Investigate anomalous high-volume SELECT query on core ledger database and verify account authorization.'
  );

  const handleSelectPreset = (id: 'E-101' | 'E-102') => {
    setInputEntityId(id);
    setSelectedEntityId(id);
    setInvestigationError(null);
    if (id === 'E-101') {
      setObjective('Investigate abnormal outbound network connections and potential initial access on Host-Finance-01.');
      launchE101Demo();
    } else {
      setObjective('Investigate anomalous high-volume SELECT query on core ledger database and verify account authorization.');
      launchE102CrossSessionDemo();
    }
  };

  const handleRunInvestigation = async () => {
    if (!inputEntityId.trim() || isInvestigationRunning) return;
    setIsInvestigationRunning(true);
    setInvestigationError(null);

    try {
      const result = await apiClient.runInvestigation({
        entityId: inputEntityId.trim(),
        objective: objective.trim(),
        scenarioId: selectedScenario?.id,
        sessionId: activeSession.id,
        depth: 3,
      });
      setActiveInvestigation(result);
    } catch (err: any) {
      setInvestigationError(err.message || 'Investigation run failed via backend adapter');
    } finally {
      setIsInvestigationRunning(false);
    }
  };

  return (
    <PageShell
      title="Agent Investigation Workspace"
      description="Autonomous AI Agent investigation workbench. The agent decomposes goals, executes multi-hop graph traversals, and recalls historical session memory."
      badge={
        isDemoMode ? (
          <Badge variant="cyan" size="md" dot>
            Simulated Agent Demo
          </Badge>
        ) : (
          <Badge variant="emerald" size="md" dot>
            Live Gemini Reasoning
          </Badge>
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectPreset('E-101')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
              inputEntityId === 'E-101'
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400'
                : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800'
            }`}
          >
            Load E-101 (Jumpbox)
          </button>
          <button
            onClick={() => handleSelectPreset('E-102')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
              inputEntityId === 'E-102'
                ? 'bg-teal-500/30 text-teal-200 border-teal-400 shadow-[0_0_15px_-3px_rgba(20,184,166,0.4)]'
                : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800'
            }`}
          >
            Load E-102 (Cross-Session)
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Error notification banner */}
        {investigationError && (
          <GlassCard variant="default" className="p-4 border-rose-500/40 bg-rose-950/20 text-xs space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertTriangle size={16} />
                <span>Investigation Execution Error</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleRunInvestigation}>
                  Retry
                </Button>
                <Button size="sm" variant="primary" onClick={() => setIsDemoMode(true)}>
                  Switch to Demo Mode
                </Button>
              </div>
            </div>
            <p className="text-rose-200/90 font-mono">{investigationError}</p>
          </GlassCard>
        )}

        {/* Workspace Controls Card */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Entity ID
              </label>
              <Input
                value={inputEntityId}
                onChange={(e) => setInputEntityId(e.target.value)}
                placeholder="e.g. E-101, E-102"
                className="font-mono text-cyan-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Active Session
              </label>
              <select
                value={activeSession.id}
                onChange={(e) => {
                  const s = sessions.find((item) => item.id === e.target.value);
                  if (s) setActiveSession(s);
                }}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 backdrop-blur-md outline-none focus:border-cyan-500/50"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.id} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Investigation Objective
              </label>
              <Input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Specify objective for autonomous agent..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Multi-Hop Traversal Depth: 3 Hops • Mode: Autonomous Context Retrieval</span>
            </div>
            <Button
              onClick={handleRunInvestigation}
              loading={isInvestigationRunning}
              disabled={isInvestigationRunning || !inputEntityId.trim()}
              variant="primary"
              size="md"
              icon={<Cpu size={16} />}
            >
              {isInvestigationRunning ? 'Agent Reasoning in Progress...' : 'Run Autonomous Investigation'}
            </Button>
          </div>
        </GlassCard>

        {/* Cross-Session Insight Highlight Banner */}
        {activeInvestigation?.crossSessionMemory && (
          <CrossSessionInsightCard insight={activeInvestigation.crossSessionMemory} />
        )}

        {/* Results Overview & Executive Summary */}
        {activeInvestigation && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2-Column: Executive Summary & Graph Visualizer */}
            <div className="lg:col-span-2 space-y-6">
              {/* Executive Summary Card */}
              <GlassCard variant="default" className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {activeInvestigation.id}
                      </span>
                      <RiskBadge level={activeInvestigation.riskLevel} />
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      Investigation Assessment: {activeInvestigation.targetEntity.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">
                      Risk Severity
                    </span>
                    <span className="text-xl font-bold font-mono text-rose-400">
                      {activeInvestigation.riskScore} / 100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                  {activeInvestigation.executiveSummary}
                </p>

                {/* Key Findings List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Key Correlated Findings
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeInvestigation.detailedFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-teal-400 shrink-0 mt-0.5" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>

              {/* Subgraph Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-cyan-400" />
                    <span>Discovered Investigation Subgraph</span>
                  </h4>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Critical Path: {activeInvestigation.subgraph.highlightPath.join(' ➔ ')}
                  </span>
                </div>

                <InteractiveGraph
                  entities={activeInvestigation.subgraph.entities}
                  relationships={activeInvestigation.subgraph.relationships}
                  highlightPath={activeInvestigation.subgraph.highlightPath}
                  height="420px"
                  showMiniMap={false}
                />
              </div>

              {/* Evidence Drawer */}
              <EvidenceDrawer evidenceList={activeInvestigation.evidenceList} />
            </div>

            {/* 1-Column: Autonomous Reasoning Timeline */}
            <div className="space-y-6">
              <GlassCard variant="default" className="p-5">
                <AgentTimeline steps={activeInvestigation.reasoningSteps} />
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
