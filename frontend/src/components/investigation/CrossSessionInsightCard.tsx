import React from 'react';
import { CrossSessionMemoryInsight } from '../../lib/types/investigation';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Sparkles, DatabaseZap, ArrowRight, ShieldCheck } from 'lucide-react';

interface CrossSessionInsightCardProps {
  insight: CrossSessionMemoryInsight;
}

export function CrossSessionInsightCard({ insight }: CrossSessionInsightCardProps) {
  return (
    <GlassCard
      variant="default"
      className="border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900/70 to-teal-950/40 shadow-[0_0_25px_-5px_rgba(6,182,212,0.3)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <DatabaseZap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Cross-Session Graph Memory Recall
              </h4>
              <Badge variant="emerald" size="sm" dot>
                {Math.round(insight.similarityScore * 100)}% Match
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Correlated from historical investigation {insight.originalSessionId}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
          <Badge variant="cyan" size="sm">
            {insight.originalSessionId}
          </Badge>
          <ArrowRight size={14} className="text-slate-500" />
          <Badge variant="emerald" size="sm">
            Active Session
          </Badge>
        </div>
      </div>

      <div className="mt-3.5 space-y-2 text-xs text-slate-300">
        <p className="leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-white/5">
          {insight.contextSummary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400 block font-medium">Bridging Relationship:</span>
            <span className="font-mono text-cyan-300 font-semibold">{insight.bridgingRelationship}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
            <span className="text-slate-400 block font-medium">Operational Value:</span>
            <span className="text-emerald-300 font-medium">{insight.significance}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
