'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { GlassCard } from '../../components/ui/GlassCard';
import { FactBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  FileCheck2,
  ShieldCheck,
  Binary,
  Layers,
  ArrowRight,
  Fingerprint,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';
import { apiClient } from '../../lib/api/apiClient';
import { EvidenceItem, FactType } from '../../lib/types/investigation';

export default function ExplainabilityPage() {
  const { isDemoMode } = useApp();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFactFilter, setSelectedFactFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadEvidence = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getEvidence();
      setEvidenceList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch evidence from backend adapter');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence, isDemoMode]);

  const filteredEvidence = evidenceList.filter((item) => {
    if (selectedFactFilter !== 'ALL' && item.factType !== selectedFactFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.entityId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const factCounts = {
    FACT: evidenceList.filter((e) => e.factType === 'FACT').length,
    INFERENCE: evidenceList.filter((e) => e.factType === 'INFERENCE').length,
    HYPOTHESIS: evidenceList.filter((e) => e.factType === 'HYPOTHESIS').length,
    UNKNOWN: evidenceList.filter((e) => e.factType === 'UNKNOWN').length,
  };

  return (
    <PageShell
      title="Explainability & Provenance"
      description="Evidence-centered explainability workbench. Rigorously distinguishes verified facts from probabilistic inferences and hypotheses, with immutable cryptographic citations."
      badge={
        isDemoMode ? (
          <Badge variant="cyan" size="md" dot>
            Simulated Evidence Corpus
          </Badge>
        ) : (
          <Badge variant="emerald" size="md" dot>
            Live FalkorDB Grounding
          </Badge>
        )
      }
      actions={
        <Button
          onClick={loadEvidence}
          loading={isLoading}
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
        >
          Refresh Evidence
        </Button>
      }
    >
      <div className="space-y-6">
        {error && (
          <GlassCard variant="default" className="p-4 border-rose-500/30 bg-rose-950/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-medium">
              <AlertTriangle size={16} />
              <span>Failed to fetch evidence: {error}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={loadEvidence}>
              Retry
            </Button>
          </GlassCard>
        )}

        {/* Top Fact Classification Matrix Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard variant="default" className="p-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Verified Facts
              </span>
              <span className="text-xl font-bold font-mono text-white">{factCounts.FACT}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Raw log receipts with cryptographic hash matching.
            </p>
          </GlassCard>

          <GlassCard variant="default" className="p-4 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Graph Inferences
              </span>
              <span className="text-xl font-bold font-mono text-white">{factCounts.INFERENCE}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Correlated multi-hop threat relationships & TTPs.
            </p>
          </GlassCard>

          <GlassCard variant="default" className="p-4 border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Hypotheses
              </span>
              <span className="text-xl font-bold font-mono text-white">{factCounts.HYPOTHESIS}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Projected attacker next-steps awaiting log validation.
            </p>
          </GlassCard>

          <GlassCard variant="default" className="p-4 border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unknowns
              </span>
              <span className="text-xl font-bold font-mono text-slate-400">{factCounts.UNKNOWN || 1}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Encrypted archive payload content (unopened).
            </p>
          </GlassCard>
        </div>

        {/* Provenance Walkthrough: The Multi-Hop Inference Chain */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Fingerprint size={16} className="text-cyan-400" />
              <span>Multi-Hop Provenance Chain: Attack Reconstruction</span>
            </h3>
            <span className="text-xs font-mono text-cyan-300">5-Hop Graph Trail</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">1. Exploit</span>
                <Badge variant="rose" size="sm">E-107</Badge>
              </div>
              <p className="text-white font-medium">CVE-2024-38077</p>
              <p className="text-[10px] text-slate-400">RDP licensing buffer overflow inbound.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">2. Pivot Host</span>
                <Badge variant="rose" size="sm">E-101</Badge>
              </div>
              <p className="text-white font-medium">Host-Finance-01</p>
              <p className="text-[10px] text-slate-400">Compromised jumpbox in Session 1.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">3. C2 & Dropper</span>
                <Badge variant="cyan" size="sm">E-103</Badge>
              </div>
              <p className="text-white font-medium">svchost_updater.dll</p>
              <p className="text-[10px] text-slate-400">Beacons to 185.220.101.42 C2.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/30 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber-300 font-bold">4. Credential</span>
                <Badge variant="amber" size="sm">E-105</Badge>
              </div>
              <p className="text-white font-medium">svc_backup</p>
              <p className="text-[10px] text-slate-400">Harvested via LSASS memory dump.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-300 font-bold">5. Target DB</span>
                <Badge variant="emerald" size="sm">E-102</Badge>
              </div>
              <p className="text-white font-medium">SQL-PROD-09</p>
              <p className="text-[10px] text-slate-400">Unauthorized ledger query in Session 2.</p>
            </div>
          </div>
        </GlassCard>

        {/* Evidence Records Table with Fact Filtering & Search */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-400" />
              <span>Evidence Record Corpus ({filteredEvidence.length} Entries)</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search evidence..."
                className="bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500/50"
              />
              <div className="flex items-center gap-1">
                {['ALL', 'FACT', 'INFERENCE', 'HYPOTHESIS'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedFactFilter(type)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                      selectedFactFilter === type
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400'
                        : 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <GlassCard variant="default" noPadding className="overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-cyan-400 text-xs flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading Evidence Corpus...</span>
              </div>
            ) : filteredEvidence.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No evidence records found matching your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Evidence ID</th>
                      <th className="px-4 py-3 font-semibold">Classification</th>
                      <th className="px-4 py-3 font-semibold">Associated Entity</th>
                      <th className="px-4 py-3 font-semibold">Collector Source</th>
                      <th className="px-4 py-3 font-semibold">Session Reference</th>
                      <th className="px-4 py-3 font-semibold">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEvidence.map((ev) => (
                      <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-cyan-300">{ev.id}</td>
                        <td className="px-4 py-3">
                          <FactBadge type={ev.factType} />
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-200">{ev.entityId}</td>
                        <td className="px-4 py-3 text-slate-300">{ev.source}</td>
                        <td className="px-4 py-3">
                          <Badge variant="cyan" size="sm">
                            {ev.sessionId}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {Math.round(ev.confidence * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
