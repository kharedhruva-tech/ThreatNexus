'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Server,
  Terminal,
  Globe,
  UserCheck,
  FileCode,
  Database,
  ShieldAlert,
  Compass,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
import { EntityType, RiskLevel } from '../../lib/types/graph';
import { clsx } from 'clsx';

export interface CustomNodeData {
  id: string;
  label: string;
  name: string;
  type: EntityType;
  riskLevel: RiskLevel;
  confidence: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isCrossSession?: boolean;
  provenance?: {
    source: string;
    verified: boolean;
    sessionId?: string;
  };
}

const typeIcons: Record<EntityType, React.ReactNode> = {
  Host: <Server size={14} />,
  Process: <Terminal size={14} />,
  IP_Address: <Globe size={14} />,
  User_Account: <UserCheck size={14} />,
  File_Artifact: <FileCode size={14} />,
  Database: <Database size={14} />,
  Vulnerability: <ShieldAlert size={14} />,
  Domain: <Compass size={14} />,
};

const typeColors: Record<EntityType, { text: string; bg: string; border: string; glow: string }> = {
  Host: { text: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/35', glow: 'rgba(6, 182, 212, 0.4)' },
  Process: { text: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/35', glow: 'rgba(245, 158, 11, 0.4)' },
  IP_Address: { text: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/35', glow: 'rgba(244, 63, 94, 0.4)' },
  User_Account: { text: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/35', glow: 'rgba(168, 85, 247, 0.4)' },
  File_Artifact: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/35', glow: 'rgba(16, 185, 129, 0.4)' },
  Database: { text: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/35', glow: 'rgba(59, 130, 246, 0.4)' },
  Vulnerability: { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/35', glow: 'rgba(239, 68, 68, 0.4)' },
  Domain: { text: 'text-teal-300', bg: 'bg-teal-500/15', border: 'border-teal-500/35', glow: 'rgba(20, 184, 166, 0.4)' },
};

export const CustomNode = memo(({ data }: NodeProps<any>) => {
  const nodeData = data as CustomNodeData;
  const colors = typeColors[nodeData.type] || typeColors.Host;

  const isCritical = nodeData.riskLevel === 'CRITICAL';
  const isHigh = nodeData.riskLevel === 'HIGH';

  return (
    <div
      className={clsx(
        'group relative rounded-xl p-3 min-w-[185px] max-w-[230px] transition-all duration-200 select-none cursor-pointer',
        'backdrop-blur-xl border bg-slate-900/90 shadow-[0_4px_20px_0_rgba(0,0,0,0.5)]',
        nodeData.isHighlighted
          ? 'border-cyan-400 shadow-[0_0_25px_0_rgba(6,182,212,0.6)] ring-2 ring-cyan-400/50 scale-[1.03]'
          : nodeData.isSelected
          ? 'border-cyan-400 shadow-[0_0_20px_-2px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400'
          : `${colors.border} hover:border-cyan-400/60 hover:shadow-[0_0_15px_-2px_rgba(6,182,212,0.3)] hover:scale-[1.01]`,
        nodeData.isDimmed && 'opacity-25 grayscale-[60%] pointer-events-none'
      )}
    >
      {/* 4 Multi-directional handles for natural edge routes */}
      <Handle id="top" type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle id="left" type="target" position={Position.Left} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle id="right" type="source" position={Position.Right} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900 !opacity-0 group-hover:!opacity-100 transition-opacity" />

      {/* Top Header: ID & Risk Badge */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={clsx('p-1 rounded-md shrink-0 border border-white/10', colors.bg, colors.text)}>
            {typeIcons[nodeData.type]}
          </span>
          <span className="font-mono text-xs font-bold text-white tracking-tight truncate">
            {nodeData.id}
          </span>
          {nodeData.provenance?.verified && (
            <span title="Cryptographically Verified Provenance" className="text-emerald-400 shrink-0">
              <Fingerprint size={11} />
            </span>
          )}
        </div>

        <span
          className={clsx(
            'text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold tracking-wider uppercase shrink-0',
            isCritical
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : isHigh
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800 text-slate-300 border border-white/10'
          )}
        >
          {nodeData.riskLevel}
        </span>
      </div>

      {/* Node Content */}
      <div className="pt-2 space-y-1">
        <p className="text-xs font-bold text-slate-100 truncate tracking-tight leading-tight" title={nodeData.name}>
          {nodeData.name}
        </p>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-medium text-slate-400">{nodeData.type}</span>
          <span className="font-mono text-cyan-300 font-semibold">
            {Math.round((nodeData.confidence || 0.95) * 100)}%
          </span>
        </div>

        {/* Cross-Session memory hit indicator */}
        {nodeData.isCrossSession && (
          <div className="mt-1 pt-1 border-t border-white/5 flex items-center gap-1 text-[9px] text-amber-300 font-mono">
            <Sparkles size={10} className="text-amber-400 shrink-0" />
            <span className="truncate">Recalled from Session 1</span>
          </div>
        )}
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
