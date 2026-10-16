'use client';

import React from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  GitCompare,
  FileQuestion,
  Network,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Database,
  History,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/context/AppContext';

export default function ComparisonPage() {
  const router = useRouter();
  const { launchE102CrossSessionDemo } = useApp();

  return (
    <PageShell
      title="Before vs. After Comparison"
      description="Side-by-side evaluation: Investigating isolated records with disconnected queries vs. investigating connected telemetry using ThreatNexus's graph-powered memory."
      badge={
        <Badge variant="cyan" size="md">
          Simulation Walkthrough
        </Badge>
      }
      actions={
        <Button
          onClick={() => {
            launchE102CrossSessionDemo();
            router.push('/investigation');
          }}
          variant="primary"
          size="sm"
          icon={<Network size={15} />}
        >
          Test Connected Retrieval
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Scenario Header: Equivalent Input */}
        <GlassCard variant="default" className="p-4 bg-slate-900/80 border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <span>Identical Starting Telemetry & Input</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-white font-medium">
                Target Entity: <code className="font-mono text-cyan-300">E-102 (SQL-PROD-09)</code>
              </p>
              <p className="text-slate-400 mt-0.5">
                Trigger Event: Database query on table <code>customer_transaction_ledger_2026</code> with threshold &gt; $500,000 by account <code>svc_backup</code>.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-white/10 shrink-0">
              Evaluated in Session S-2026-02
            </span>
          </div>
        </GlassCard>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Disconnected Records (Traditional Siloed Retrieval) */}
          <GlassCard
            variant="default"
            className="p-6 border-rose-500/20 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-rose-950/20 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <FileQuestion size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Disconnected Records
                  </h3>
                  <p className="text-xs text-rose-300/80 font-mono">Traditional Siloed Search</p>
                </div>
              </div>
              <Badge variant="rose" size="sm">
                Blind Spot Risk
              </Badge>
            </div>

            {/* Retrieval Method */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Retrieval Mechanism
              </span>
              <p className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                Keyword search on SQL audit logs. Checks database firewall, IP destination, and process list on <code>SQL-PROD-09</code> only.
              </p>
            </div>

            {/* Discovered Context */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Retrieved Context & Findings
              </span>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-white/5">
                  <CheckCircle2 size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">
                    Query executed successfully with zero syntax errors.
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-white/5">
                  <CheckCircle2 size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">
                    User account <code>svc_backup</code> is listed as an authorized database backup role.
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20">
                  <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-rose-200">
                    <strong>Blind Spot:</strong> No historical memory of yesterday&apos;s LSASS memory dump on jumpbox <code>Host-Finance-01</code>.
                  </span>
                </div>
              </div>
            </div>

            {/* Conclusion / Diagnosis */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/20 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                <AlertTriangle size={14} />
                <span>Resulting Incident Triage</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Incident classified as <em>routine maintenance activity</em>. Alert closed as a false positive. Attacker exfiltration proceeds undetected.
              </p>
            </div>
          </GlassCard>

          {/* Right Column: Connected ThreatNexus */}
          <GlassCard
            variant="default"
            className="p-6 border-cyan-500/40 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-cyan-950/30 shadow-[0_0_25px_-5px_rgba(6,182,212,0.3)] space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Network size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    ThreatNexus
                  </h3>
                  <p className="text-xs text-cyan-300/80 font-mono">Connected Graph Memory</p>
                </div>
              </div>
              <Badge variant="emerald" size="sm" dot>
                Threat Thwarted
              </Badge>
            </div>

            {/* Retrieval Method */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Retrieval Mechanism
              </span>
              <p className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                Multi-hop graph traversal combined with cross-session semantic memory retrieval across FalkorDB knowledge graph.
              </p>
            </div>

            {/* Discovered Context */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Retrieved Context & Findings
              </span>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-cyan-200">
                    <strong>Cross-Session Match:</strong> Recalled <code>S-2026-01</code> finding that <code>svc_backup</code> was stolen from LSASS memory.
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-cyan-200">
                    <strong>4-Hop Path:</strong> Reconstructed attack chain: <code>C2 (E-104) ➔ Trojan DLL ➔ Jumpbox (E-101) ➔ DB (E-102)</code>.
                  </span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-950/30 border border-teal-500/30">
                  <CheckCircle2 size={14} className="text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-teal-200">
                    <strong>Evidence Provenance:</strong> Verified cryptographic receipts for both the Sysmon process injection and the database query.
                  </span>
                </div>
              </div>
            </div>

            {/* Conclusion / Diagnosis */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                <ShieldAlert size={14} />
                <span>Resulting Incident Triage</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Incident escalated as <strong>CRITICAL APT-41 Lateral Exfiltration</strong>. Immediate automated containment executed: ticket revoked, host quarantined.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
