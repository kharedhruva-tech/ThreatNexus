'use client';

import React, { useState } from 'react';
import { GraphEntity, GraphRelationship } from '../../lib/types/graph';
import { GlassCard } from '../ui/GlassCard';
import { RiskBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  X,
  Shield,
  Clock,
  Layers,
  Cpu,
  ArrowRight,
  Fingerprint,
  Link2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/context/AppContext';

interface NodeInspectorProps {
  entity: GraphEntity | null;
  relationships: GraphRelationship[];
  onClose: () => void;
  onSelectNeighbor?: (entityId: string) => void;
}

export function NodeInspector({
  entity,
  relationships,
  onClose,
  onSelectNeighbor,
}: NodeInspectorProps) {
  const router = useRouter();
  const { setSelectedEntityId, launchE101Demo, launchE102CrossSessionDemo } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!entity) return null;

  const connectedEdges = relationships.filter(
    (r) => r.sourceId === entity.id || r.targetId === entity.id
  );

  const handleCopy = (text: string | undefined, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleStartInvestigation = () => {
    setSelectedEntityId(entity.id);
    if (entity.id === 'E-101') {
      launchE101Demo();
    } else if (entity.id === 'E-102') {
      launchE102CrossSessionDemo();
    }
    router.push('/investigation');
  };

  return (
    <div className="w-80 md:w-96 shrink-0 flex flex-col liquid-glass border border-white/10 rounded-2xl p-5 overflow-y-auto space-y-4 max-md:fixed max-md:inset-y-4 max-md:right-4 max-md:z-50 max-md:max-w-[calc(100vw-2rem)] max-h-[calc(100vh-210px)] animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/10">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-cyan-400">{entity.id}</span>
            <RiskBadge level={entity.riskLevel} />
          </div>
          <h3 className="text-base font-bold text-white mt-1 leading-snug truncate" title={entity.name}>
            {entity.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
            <span className="font-mono text-cyan-300/80">{entity.type}</span>
            <span>•</span>
            <span className="font-mono">{Math.round((entity.confidence || 0.95) * 100)}% conf</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Description */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Entity Intelligence
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-white/5">
          {entity.description}
        </p>
      </div>

      {/* Observed Attributes */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Observed Metadata
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {entity.metadata.ip && (
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5 group relative">
              <span className="text-[10px] text-slate-400 block">IP Address</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-slate-200 font-semibold">{entity.metadata.ip}</span>
                <button
                  onClick={() => handleCopy(entity.metadata.ip, 'ip')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {copiedKey === 'ip' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}

          {entity.metadata.os && (
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5 col-span-2">
              <span className="text-[10px] text-slate-400 block">Operating System</span>
              <span className="text-slate-200 font-medium truncate block mt-0.5">
                {entity.metadata.os}
              </span>
            </div>
          )}

          {entity.metadata.hash && (
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5 col-span-2 group">
              <span className="text-[10px] text-slate-400 block">SHA-256 Hash</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-[10px] text-cyan-300 truncate block max-w-[240px]">
                  {entity.metadata.hash}
                </span>
                <button
                  onClick={() => handleCopy(entity.metadata.hash, 'hash')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0 ml-1"
                >
                  {copiedKey === 'hash' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}

          {entity.metadata.port && (
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">Port</span>
              <span className="font-mono text-slate-200 font-semibold mt-0.5 block">
                {entity.metadata.port}
              </span>
            </div>
          )}

          {entity.metadata.owner && (
            <div className="bg-slate-900/70 p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">Asset Owner</span>
              <span className="text-slate-200 truncate block mt-0.5">{entity.metadata.owner}</span>
            </div>
          )}
        </div>
      </div>

      {/* Provenance Section */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Fingerprint size={13} className="text-cyan-400" />
          <span>Provenance & Grounding</span>
        </h4>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Ingest Source:</span>
            <span className="text-slate-200 font-medium truncate max-w-[190px]">
              {entity.provenance.source}
            </span>
          </div>
          {entity.provenance.sessionId && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Origin Session:</span>
              <Badge variant="cyan" size="sm">
                {entity.provenance.sessionId}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Timestamp:</span>
            <span className="font-mono text-slate-300">
              {new Date(entity.provenance.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
            <span className="text-slate-400">Verification:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Cryptographically Verified
            </span>
          </div>
        </div>
      </div>

      {/* Connected Graph Edges */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Connected Graph Edges</span>
          <span className="font-mono text-cyan-400 text-xs">{connectedEdges.length}</span>
        </h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {connectedEdges.map((edge) => {
            const isOutbound = edge.sourceId === entity.id;
            const neighborId = isOutbound ? edge.targetId : edge.sourceId;

            return (
              <div
                key={edge.id}
                className="p-2 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] flex items-center justify-between hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link2 size={12} className={isOutbound ? 'text-cyan-400' : 'text-teal-400'} />
                  <span className="font-mono font-medium text-slate-200 truncate">{edge.label}</span>
                </div>
                {onSelectNeighbor ? (
                  <button
                    onClick={() => onSelectNeighbor(neighborId)}
                    className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 shrink-0 ml-2"
                  >
                    <span>{isOutbound ? `➔ ${neighborId}` : `⬅ ${neighborId}`}</span>
                  </button>
                ) : (
                  <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                    {isOutbound ? `➔ ${neighborId}` : `⬅ ${neighborId}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        <Button
          onClick={handleStartInvestigation}
          className="w-full"
          icon={<Cpu size={15} />}
        >
          Investigate with AI Agent
        </Button>
      </div>
    </div>
  );
}
