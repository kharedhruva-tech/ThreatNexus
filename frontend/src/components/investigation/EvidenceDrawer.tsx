'use client';

import React, { useState } from 'react';
import { EvidenceItem } from '../../lib/types/investigation';
import { GlassCard } from '../ui/GlassCard';
import { FactBadge, Badge } from '../ui/Badge';
import {
  FileText,
  ShieldCheck,
  Hash,
  Clock,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface EvidenceDrawerProps {
  evidenceList: EvidenceItem[];
}

export function EvidenceDrawer({ evidenceList }: EvidenceDrawerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(evidenceList[0]?.id || null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-400" />
          <span>Supporting Evidence & Provenance ({evidenceList.length} Items)</span>
        </h4>
        <span className="text-[11px] font-mono text-slate-500">Immutable Cryptographic Log</span>
      </div>

      <div className="space-y-2">
        {evidenceList.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <GlassCard
              key={item.id}
              variant="default"
              noPadding
              className="border-white/10 hover:border-cyan-500/30 transition-all duration-200"
            >
              {/* Header Toggle */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-cyan-400">{item.id}</span>
                  <FactBadge type={item.factType} />
                  <span className="text-xs font-semibold text-white tracking-tight truncate max-w-sm sm:max-w-md">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                    {Math.round(item.confidence * 100)}% Conf
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {/* Expanded Evidence Detail */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-3 text-xs">
                  {/* Meta Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-400 block">Collector</span>
                      <span className="text-slate-200 font-medium truncate block">
                        {item.provenanceDetails.collector}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-400 block">Timestamp</span>
                      <span className="font-mono text-slate-300">
                        {new Date(item.timestamp).toUTCString()}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                      <span className="text-slate-400 block">Immutable Receipt</span>
                      <span className="font-mono text-cyan-300">
                        {item.provenanceDetails.immutableHash}
                      </span>
                    </div>
                  </div>

                  {/* Raw Log Terminal Snippet */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1 font-mono uppercase">
                        <Terminal size={11} /> Raw Event Stream Snippet
                      </span>
                      {item.sha256 && (
                        <span className="font-mono text-slate-500 truncate max-w-[200px]" title={item.sha256}>
                          SHA: {item.sha256.substring(0, 16)}...
                        </span>
                      )}
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-200/90 overflow-x-auto border border-white/10 whitespace-pre-wrap leading-relaxed">
                      {item.rawSnippet}
                    </pre>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
