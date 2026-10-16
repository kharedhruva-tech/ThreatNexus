'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '../../components/layout/PageShell';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
  ShieldAlert,
  PlayCircle,
  HelpCircle,
  GitFork,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';
import { DemoScenario } from '../../lib/types/scenario';

export default function ScenariosPage() {
  const router = useRouter();
  const {
    scenarios,
    isScenariosLoading,
    scenariosError,
    refreshScenarios,
    isDemoMode,
    setSelectedScenario,
    launchE101Demo,
  } = useApp();

  const handleLaunch = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    if (scenario.id === 'SCN-01') {
      launchE101Demo();
    }
    router.push('/investigation');
  };

  return (
    <PageShell
      title="Scenario Explorer"
      description="Select and launch configurable threat scenarios to evaluate how graph memory bridges multi-stage agent investigations."
      badge={
        isDemoMode ? (
          <Badge variant="cyan" size="md">
            {scenarios.length} Demo Presets Available
          </Badge>
        ) : (
          <Badge variant="emerald" size="md" dot>
            Live Backend Scenarios
          </Badge>
        )
      }
      actions={
        <Button
          onClick={() => refreshScenarios()}
          loading={isScenariosLoading}
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
        >
          Refresh Scenarios
        </Button>
      }
    >
      <div className="space-y-6">
        {scenariosError && (
          <GlassCard variant="default" className="p-4 border-rose-500/30 bg-rose-950/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-medium">
              <AlertTriangle size={16} />
              <span>Failed to load scenarios: {scenariosError}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => refreshScenarios()}>
              Retry
            </Button>
          </GlassCard>
        )}

        {isScenariosLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl liquid-glass animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => {
              const isMainDemo = scenario.id === 'SCN-01';

              return (
                <GlassCard
                  key={scenario.id}
                  variant={isMainDemo ? 'glow-cyan' : 'interactive'}
                  className="flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            {scenario.id}
                          </span>
                          <RiskBadge level={scenario.riskLevel} />
                        </div>
                        <h3 className="text-base font-bold text-white mt-1 leading-snug">
                          {scenario.title}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          Codename: {scenario.codename}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5 shrink-0">
                        {scenario.difficulty}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-white/5">
                      {scenario.description}
                    </p>

                    {/* Objective */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Investigation Objective
                      </h4>
                      <p className="text-xs text-cyan-200/90 leading-relaxed font-medium">
                        {scenario.objective}
                      </p>
                    </div>

                    {/* Entities Involved */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Target Entities Involved</span>
                        <span className="font-mono text-cyan-400 text-[10px]">
                          {scenario.estimatedHops} Graph Hops
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {scenario.entitiesInvolved.map((eId) => (
                          <span
                            key={eId}
                            className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-cyan-500/20"
                          >
                            {eId}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Cross-Session Bridge Details */}
                    {scenario.crossSessionBridge && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-teal-400 font-semibold text-[11px]">
                          <GitFork size={13} />
                          <span>Cross-Session Bridge</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {scenario.crossSessionBridge.missingLinkSummary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <Button
                      onClick={() => handleLaunch(scenario)}
                      variant={isMainDemo ? 'primary' : 'secondary'}
                      className="w-full"
                      icon={isMainDemo ? <Sparkles size={16} /> : <PlayCircle size={16} />}
                    >
                      {isMainDemo ? 'Launch Main E-101 Demo' : 'Launch Scenario'}
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
