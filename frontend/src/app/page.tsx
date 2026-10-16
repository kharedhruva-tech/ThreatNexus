'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell } from '../components/layout/PageShell';
import { GlassCard } from '../components/ui/GlassCard';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';
import {
  Network,
  Cpu,
  Database,
  ShieldAlert,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useApp } from '../lib/context/AppContext';

import { SpatialWorkspace } from '../components/spatial/SpatialWorkspace';

export default function OverviewPage() {
  const router = useRouter();
  const {
    graphData,
    isGraphLoading,
    graphError,
    sessions,
    isDemoMode,
    launchE101Demo,
    launchE102CrossSessionDemo,
  } = useApp();

  const nodeCount      = graphData?.nodes?.length || 0;
  const edgeCount      = graphData?.edges?.length || 0;
  const criticalCount  = graphData?.nodes?.filter((n) => n.riskLevel === 'CRITICAL').length || 0;

  /* ── Rich expanded content for each stat card ── */

  const graphEntitiesExpanded = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Nodes', value: nodeCount, color: 'text-cyan-300' },
          { label: 'Critical Risk', value: criticalCount, color: 'text-rose-300' },
          { label: 'Entity Types', value: '5', color: 'text-violet-300' },
        ].map((m) => (
          <div key={m.label} className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-center">
            <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">{m.label}</span>
            <span className={`text-2xl font-bold font-mono mt-1 block ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Entity Type Breakdown</h4>
        {[
          { type: 'Host',       count: graphData?.nodes?.filter(n => n.type === 'Host').length ?? 2,           hex: '#06b6d4' },
          { type: 'Database',   count: graphData?.nodes?.filter(n => n.type === 'Database').length ?? 1,       hex: '#8b5cf6' },
          { type: 'File',       count: graphData?.nodes?.filter(n => n.type === 'File_Artifact').length ?? 2,  hex: '#10b981' },
          { type: 'IP Address', count: graphData?.nodes?.filter(n => n.type === 'IP_Address').length ?? 2,     hex: '#f59e0b' },
          { type: 'Account',    count: graphData?.nodes?.filter(n => n.type === 'User_Account').length ?? 1,   hex: '#f43f5e' },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.hex }} />
            <span className="text-xs text-slate-300 w-24">{item.type}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full opacity-80" style={{ width: `${(item.count / Math.max(nodeCount, 1)) * 100}%`, background: item.hex }} />
            </div>
            <span className="text-xs font-mono text-slate-400 w-5 text-right">{item.count}</span>
          </div>
        ))}
      </div>
      <Button onClick={() => router.push('/graph')} variant="primary" size="sm" icon={<ExternalLink size={13} />}>
        Open Graph Explorer
      </Button>
    </div>
  );

  const relationshipEdgesExpanded = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Edges', value: edgeCount, color: 'text-emerald-300' },
          { label: 'Attack Paths', value: '1', color: 'text-rose-300' },
        ].map((m) => (
          <div key={m.label} className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-center">
            <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">{m.label}</span>
            <span className={`text-2xl font-bold font-mono mt-1 block ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Relationship Types</h4>
        {[
          { rel: 'LATERAL_MOVE',   count: 3, color: 'text-rose-400' },
          { rel: 'EXPLOITS',       count: 2, color: 'text-amber-400' },
          { rel: 'C2_BEACONS',     count: 2, color: 'text-cyan-400' },
          { rel: 'RUNS_PROCESS',   count: 2, color: 'text-emerald-400' },
          { rel: 'AUTHENTICATED',  count: 1, color: 'text-violet-400' },
        ].map((item) => (
          <div key={item.rel} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-white/[0.05]">
            <span className={`text-[11px] font-mono font-bold ${item.color}`}>{item.rel}</span>
            <span className="text-xs text-slate-400 font-mono">{item.count} edges</span>
          </div>
        ))}
      </div>
      <Button onClick={() => router.push('/graph')} variant="secondary" size="sm" icon={<Eye size={13} />}>
        Inspect in Graph Explorer
      </Button>
    </div>
  );

  const sessionsExpanded = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Preserved Sessions</h4>
        <Badge variant="violet" size="sm" dot>{sessions.length} Vaulted</Badge>
      </div>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => router.push('/sessions')}
            className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-cyan-500/30 cursor-pointer transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-cyan-300 font-bold text-xs">{session.id}</span>
              <Badge variant={session.status === 'ACTIVE' ? 'emerald' : 'cyan'} size="sm">
                {session.status}
              </Badge>
            </div>
            <p className="text-sm text-white font-medium">{session.name}</p>
            <p className="text-xs text-slate-400 line-clamp-2">{session.description}</p>
            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500 font-mono">
              <span>{session.entityCount} entities</span>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={() => router.push('/sessions')} variant="primary" size="sm" icon={<ExternalLink size={13} />}>
        Manage All Sessions
      </Button>
    </div>
  );

  const criticalAssetsExpanded = (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/25 flex items-center gap-3">
        <ShieldAlert size={20} className="text-rose-400 shrink-0" />
        <div>
          <span className="text-sm font-bold text-white block">{criticalCount} Critical-Risk Assets</span>
          <span className="text-xs text-rose-300/80">Require immediate investigation</span>
        </div>
      </div>
      <div className="space-y-2">
        {(graphData?.nodes?.filter(n => n.riskLevel === 'CRITICAL') ?? []).map((node) => (
          <div key={node.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-rose-500/20">
            <div>
              <span className="text-xs font-bold text-white">{node.name}</span>
              <span className="text-[10px] text-slate-400 font-mono ml-2">({node.id})</span>
            </div>
            <Badge variant="rose" size="sm" dot>CRITICAL</Badge>
          </div>
        ))}
        {criticalCount === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
            No critical assets detected
          </div>
        )}
      </div>
      <Button onClick={() => { launchE102CrossSessionDemo(); router.push('/investigation'); }} variant="primary" size="sm" icon={<Sparkles size={13} />}>
        Launch Investigation
      </Button>
    </div>
  );

  return (
    <PageShell
      icon={
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-cyan-600 via-indigo-500 to-purple-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
          <img src="/threatnexus-logo.jpg" alt="ThreatNexus" className="w-full h-full object-cover rounded-[9px]" />
        </div>
      }
      title="ThreatNexus Platform"
      description="Spatial graph computing workspace for AI agents. Bridging disparate security telemetry through multi-hop knowledge graph reasoning and cross-session context memory."
      badge={
        isDemoMode ? (
          <Badge variant="cyan" size="md" dot>
            Demo Mode • Spatial Mesh
          </Badge>
        ) : (
          <Badge variant="emerald" size="md" dot>
            Live FalkorDB Connected
          </Badge>
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              launchE101Demo();
              router.push('/investigation');
            }}
            variant="secondary"
            size="sm"
            icon={<PlayCircle size={15} />}
          >
            Run E-101 Demo
          </Button>
          <Button
            onClick={() => {
              launchE102CrossSessionDemo();
              router.push('/investigation');
            }}
            variant="primary"
            size="sm"
            icon={<Sparkles size={15} />}
          >
            Launch Cross-Session Flow
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Error notification if backend connection fails in Live mode */}
        {graphError && (
          <GlassCard variant="default" className="p-4 border-rose-500/30 bg-rose-950/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-medium">
              <AlertTriangle size={16} />
              <span>Backend data unavailable: {graphError}</span>
            </div>
            <Link href="/health" className="text-cyan-400 hover:underline font-semibold">
              Diagnose Connection ➔
            </Link>
          </GlassCard>
        )}

        {/* Core Metric Stat Cards — expandable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Graph Entities"
            value={nodeCount}
            subtitle="Hosts, DBs, Files, IPs, Accounts"
            icon={<Network size={18} />}
            accentColor="cyan"
            expandable
            expandedContent={graphEntitiesExpanded}
          />
          <StatCard
            title="Relationship Edges"
            value={edgeCount}
            subtitle="C2, Exploits, Lateral Pivots"
            icon={<Layers size={18} />}
            accentColor="emerald"
            expandable
            expandedContent={relationshipEdgesExpanded}
          />
          <StatCard
            title="Preserved Sessions"
            value={`${sessions.length} Sessions`}
            subtitle="Cross-session context bank"
            icon={<Database size={18} />}
            accentColor="violet"
            expandable
            expandedContent={sessionsExpanded}
          />
          <StatCard
            title="Critical Assets"
            value={criticalCount}
            subtitle="High-risk perimeter & ledger nodes"
            icon={<ShieldAlert size={18} />}
            accentColor="rose"
            expandable
            expandedContent={criticalAssetsExpanded}
          />
        </div>

        {/* SIGNATURE SPATIAL WORKSPACE: 3D Holographic Graph Stage & Floating Glass Tiles */}
        <SpatialWorkspace />

        {/* Featured Hackathon Hero Banner: E-101 -> E-102 Flow */}
        <GlassCard
          variant="glow-cyan"
          className="p-6 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/40 relative overflow-hidden"
        >
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] tracking-wider uppercase border border-cyan-500/30">
                Core Hackathon Demonstration
              </span>
              <span className="text-xs text-slate-400 font-mono">Workflow: E-101 ➔ E-102</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Cross-Session Context Recall: Connecting the Phantom Lateral Pivot
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Experience how ThreatNexus allows an agent in <strong>Session 2 (E-102)</strong> to
              automatically retrieve context preserved in <strong>Session 1 (E-101)</strong>. Without
              this graph memory, an anomalous query on the core database appears isolated; with
              ThreatNexus, the entire lateral intrusion chain is surfaced instantly.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  launchE101Demo();
                  router.push('/investigation');
                }}
                variant="primary"
                size="md"
                icon={<PlayCircle size={16} />}
              >
                Start Step 1: Investigate E-101 Jumpbox
              </Button>
              <Button
                onClick={() => {
                  launchE102CrossSessionDemo();
                  router.push('/investigation');
                }}
                variant="secondary"
                size="md"
                icon={<Sparkles size={16} />}
              >
                Skip to Step 2: E-102 Memory Recall
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
