'use client';

import React from 'react';
import { ReasoningStep } from '../../lib/types/investigation';
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/Badge';

interface AgentTimelineProps {
  steps: ReasoningStep[];
  activeStepIndex?: number;
}

export function AgentTimeline({ steps, activeStepIndex }: AgentTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-cyan-400" />
          <span>Multi-Stage Autonomous Reasoning Timeline</span>
        </h4>
        <span className="text-[11px] font-mono text-slate-500">
          {steps.filter((s) => s.status === 'COMPLETED').length} / {steps.length} Stages Complete
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'COMPLETED';
          const isRunning = step.status === 'RUNNING';
          const isFailed = step.status === 'FAILED';

          return (
            <div key={step.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={clsx(
                  'absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10',
                  isCompleted && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_0_rgba(16,185,129,0.4)]',
                  isRunning && 'bg-cyan-500/20 text-cyan-400 border border-cyan-400 animate-spin',
                  isFailed && 'bg-rose-500/20 text-rose-400 border border-rose-500',
                  !isCompleted && !isRunning && !isFailed && 'bg-slate-900 border border-white/20 text-slate-500'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <span className="text-[9px] font-mono font-bold">{step.stepNumber}</span>
                )}
              </div>

              {/* Step Card */}
              <div
                className={clsx(
                  'p-3.5 rounded-xl border transition-all duration-200',
                  isRunning
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_20px_-3px_rgba(6,182,212,0.3)]'
                    : isCompleted
                    ? 'bg-slate-900/60 border-white/10'
                    : 'bg-slate-900/30 border-white/5 opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">{step.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                        {step.stage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {step.durationMs}ms
                  </span>
                </div>

                {/* Discovered Entities & Relationships Pills */}
                {(step.entitiesDiscovered.length > 0 || step.relationshipsTraversed.length > 0) && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-[11px]">
                    {step.entitiesDiscovered.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Entities:</span>
                        {step.entitiesDiscovered.map((e) => (
                          <span
                            key={e}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/30"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                    {step.relationshipsTraversed.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Traversed:</span>
                        {step.relationshipsTraversed.map((r) => (
                          <span
                            key={r}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-teal-950/50 text-teal-300 border border-teal-500/30"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step.notes && (
                  <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    💡 {step.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
