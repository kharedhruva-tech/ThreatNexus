'use client';

import React from 'react';
import { GraphRelationship } from '../../lib/types/graph';
import { RiskBadge, Badge } from '../ui/Badge';
import { X, Link2, Clock, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface EdgeInspectorProps {
  relationship: GraphRelationship | null;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export function EdgeInspector({ relationship, onClose, onSelectNode }: EdgeInspectorProps) {
  if (!relationship) return null;

  const isLateralBridge = relationship.id === 'R-209' || relationship.type === 'LATERAL_MOVEMENT_TO';

  return (
    <div className="w-80 md:w-96 shrink-0 flex flex-col liquid-glass border border-white/10 rounded-2xl p-5 overflow-y-auto space-y-4 max-md:fixed max-md:inset-y-4 max-md:right-4 max-md:z-50 max-md:max-w-[calc(100vw-2rem)] max-h-[calc(100vh-210px)] animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/10">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-teal-400">{relationship.id}</span>
            <RiskBadge level={relationship.riskLevel} />
          </div>
          <h3 className="text-base font-bold text-white mt-1 leading-snug truncate" title={relationship.label}>
            {relationship.label}
          </h3>
          <p className="text-xs text-slate-400 font-mono">{relationship.type}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Traversal Triple Visualization */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>Graph Traversal Triple</span>
          {isLateralBridge && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              CROSS-SESSION
            </span>
          )}
        </h4>
        <div className="flex items-center justify-between text-xs font-mono gap-1 pt-1">
          <button
            onClick={() => onSelectNode?.(relationship.sourceId)}
            className="text-cyan-300 font-bold hover:underline hover:text-cyan-200 truncate max-w-[100px]"
            title={`View ${relationship.sourceId}`}
          >
            {relationship.sourceId}
          </button>
          <span className="text-slate-500 text-[11px] shrink-0">
            ━━[{relationship.label}]━━▶
          </span>
          <button
            onClick={() => onSelectNode?.(relationship.targetId)}
            className="text-teal-300 font-bold hover:underline hover:text-teal-200 truncate max-w-[100px]"
            title={`View ${relationship.targetId}`}
          >
            {relationship.targetId}
          </button>
        </div>
      </div>

      {/* Relationship Intelligence & Description */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Relationship Evidence Summary
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-white/5">
          {relationship.description}
        </p>
      </div>

      {/* Diagnostics */}
      <div className="space-y-2 text-xs">
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Edge Diagnostics
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 block">Confidence</span>
            <span className="font-mono text-cyan-300 font-bold">
              {Math.round(relationship.confidence * 100)}%
            </span>
          </div>
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 block">Edge Weight</span>
            <span className="font-mono text-slate-200 font-bold">{relationship.weight}</span>
          </div>
          {relationship.evidenceId && (
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5 col-span-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Cited Evidence ID</span>
              <Badge variant="cyan" size="sm">
                {relationship.evidenceId}
              </Badge>
            </div>
          )}
          {relationship.sessionId && (
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5 col-span-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Preserved In Session</span>
              <Badge variant="emerald" size="sm">
                {relationship.sessionId}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
