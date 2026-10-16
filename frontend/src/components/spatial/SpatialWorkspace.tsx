'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/context/AppContext';
import { GraphEntity } from '../../lib/types/graph';
import { HolographicGraphStage } from './HolographicGraphStage';
import { SpatialGlassTile } from './SpatialGlassTile';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Activity,
  Layers,
  Database,
  ShieldAlert,
  Sliders,
  Sparkles,
  PlayCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Radio,
  Clock,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function SpatialWorkspace() {
  const router = useRouter();
  const {
    graphData,
    selectedEntity,
    setSelectedEntity,
    sessions,
    launchE101Demo,
    launchE102CrossSessionDemo,
    isDemoMode,
  } = useApp();

  // Investigation reasoning parameter sliders (simulating the bottom-center sliders in reference image)
  const [hopDepth, setHopDepth] = useState<number>(3);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85);
  const [isAutoPreserve, setIsAutoPreserve] = useState<boolean>(true);

  // Entities & Relationships from context
  const entities = graphData?.nodes || [];
  const relationships = graphData?.edges || [];

  // Currently inspected entity (defaults to E-102 SQL-PROD-09)
  const currentEntity: GraphEntity =
    selectedEntity ||
    entities.find((e) => e.id === 'E-102') ||
    entities[0] || {
      id: 'E-102',
      name: 'SQL-PROD-09',
      label: 'SQL-PROD-09',
      type: 'Database',
      riskLevel: 'CRITICAL',
      confidence: 0.96,
      description: 'Core financial database storing master transaction logs',
      firstSeen: '2026-10-15T18:00:00Z',
      lastObserved: '2026-10-15T20:00:00Z',
      provenance: {
        source: 'FalkorDB',
        timestamp: '2026-10-15T20:00:00Z',
        verified: true,
      },
      tags: ['Production', 'Financial', 'Database'],
      metadata: {
        ip: '10.0.4.15',
        role: 'Core Financial Ledger',
        status: 'ANOMALOUS_QUERY_DETECTED',
        threatLevel: 'Critical',
        blastRadius: 'Severe - Enterprise Core',
        isSimulated: true,
      },
    };

  return (
    <div className="space-y-6">
      {/* Top Floating Spatial HUD Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(4,8,20,0.70) 0%, rgba(7,16,38,0.65) 50%, rgba(4,8,20,0.70) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(6,182,212,0.20)',
          boxShadow: '0 8px 32px -4px rgba(0,0,0,0.65), 0 0 24px -8px rgba(6,182,212,0.20), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        {/* Specular sheen */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Radio size={18} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                ThreatNexus Spatial Intelligence Engine
              </h2>
              <Badge variant="cyan" size="sm" dot>
                Spatial Mode
              </Badge>
              {isDemoMode && (
                <Badge variant="slate" size="sm">
                  Synthetic Mesh
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Live Topology: {entities.length} Nodes • {relationships.length} Edges • Active Focus:{' '}
              <span className="text-cyan-300 font-bold">{currentEntity.name} ({currentEntity.id})</span>
            </p>
          </div>
        </div>

        {/* Quick Demo Workflow Triggers */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              launchE101Demo();
              router.push('/investigation');
            }}
            variant="secondary"
            size="sm"
            icon={<PlayCircle size={14} />}
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
            icon={<Sparkles size={14} />}
          >
            Launch E-102 Recall
          </Button>
        </div>
      </div>

      {/* Primary Spatial Workspace Grid: Central Holographic Stage framed by Interactive Floating Glass Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN (Tiles 1 & 4)
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* TILE 1: Telemetry & Threat Signals (Inspired by top-left tile of reference image) */}
          <SpatialGlassTile
            id="tile-telemetry"
            title="Signal Telemetry"
            subtitle="Ingress & Threat Activity"
            icon={<Activity size={15} />}
            badge={<Badge variant="cyan" size="sm">14.2k/s</Badge>}
            accentColor="cyan"
            className="w-full"
            expandedContent={
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time spectral analysis of ingress telemetry streams from endpoint EDR agents,
                  network flow taps, and database audit logs. The system continuously maps raw events
                  to ontological knowledge entities in FalkorDB.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
                    <span className="text-[10px] text-slate-400 font-mono">Total Event Rate</span>
                    <p className="text-base font-bold text-cyan-300 font-mono mt-0.5">14,290 / sec</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
                    <span className="text-[10px] text-slate-400 font-mono">Beacon Interval</span>
                    <p className="text-base font-bold text-amber-300 font-mono mt-0.5">45.2s (Jitter 12%)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10">
                    <span className="text-[10px] text-slate-400 font-mono">Graph Ingestion Delay</span>
                    <p className="text-base font-bold text-emerald-300 font-mono mt-0.5">38 ms</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300">Active C2 Channel Signal</span>
                    <span className="text-[10px] text-slate-400 font-mono">185.220.101.42:443</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    High entropy payload detected matching known Cobalt Strike malleable C2 profile.
                    Connected directly to entity <strong className="text-cyan-300">E-104</strong>.
                  </p>
                </div>
              </div>
            }
          >
            {/* Tile Mini Content: Mini Histogram Bars like in reference image */}
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-1.5 h-16 pt-2 px-1">
                {[35, 60, 45, 80, 50, 95, 70, 40, 85, 65, 90, 75, 100, 55, 30].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-cyan-600/60 to-cyan-300 rounded-t-sm transition-all duration-300 group-hover:from-cyan-500/80 group-hover:to-cyan-200"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-mono">Peak Anomaly</span>
                  <span className="font-mono font-bold text-cyan-300">0.88 Entropy</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-mono">C2 Beacon Rate</span>
                  <span className="font-mono font-bold text-amber-300">45s Pulse</span>
                </div>
              </div>
            </div>
          </SpatialGlassTile>

          {/* TILE 4: Active Entity Matrix & Inspector (Inspired by bottom-left tile of reference image) */}
          <SpatialGlassTile
            id="tile-entity-matrix"
            title="Entity Matrix"
            subtitle={`${currentEntity.id} • ${currentEntity.type}`}
            icon={<Database size={15} />}
            accentColor="violet"
            badge={
              <Badge
                variant={currentEntity.riskLevel === 'CRITICAL' ? 'rose' : 'cyan'}
                size="sm"
                dot
              >
                {currentEntity.riskLevel}
              </Badge>
            }
            className="w-full"
            expandedContent={
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white">{currentEntity.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Entity Identifier: {currentEntity.id}</p>
                  </div>
                  <Button
                    onClick={() => router.push(`/graph?entity=${currentEntity.id}`)}
                    variant="primary"
                    size="sm"
                    icon={<ExternalLink size={13} />}
                  >
                    Open in Graph Explorer
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(currentEntity.metadata || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between"
                    >
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                        {key}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-200 mt-1 break-all">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-[#030611] border border-cyan-500/20 font-mono text-[11px] text-slate-300">
                  <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1.5 font-bold">
                    FalkorDB Cypher Provenance
                  </div>
                  <code>
                    MATCH (n:Entity &#123;id: &apos;{currentEntity.id}&apos;&#125;)&lt;-[r]-(upstream)
                    RETURN n, r, upstream;
                  </code>
                </div>
              </div>
            }
          >
            {/* Tile Mini Content: Entity snapshot rows */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-xs font-bold text-white truncate max-w-[150px]">
                  {currentEntity.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                  {currentEntity.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-1.5 rounded-lg bg-slate-900/40 border border-white/5">
                  <span className="text-slate-400 block">Class</span>
                  <span className="text-cyan-200 font-semibold">{currentEntity.type}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/40 border border-white/5">
                  <span className="text-slate-400 block">Posture</span>
                  <span className="text-rose-300 font-semibold">{currentEntity.riskLevel}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {currentEntity.metadata?.role ||
                  currentEntity.description ||
                  'High-value asset mapped in FalkorDB entity relationship graph.'}
              </p>
            </div>
          </SpatialGlassTile>
        </div>

        {/* =========================================================================
            CENTER STAGE (Tile 2 on Top, Holographic Graph Stage in Center, Tile 5 at Bottom)
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* TILE 2: Investigation Intelligence & Waveform */}
          <SpatialGlassTile
            id="tile-investigation-wave"
            title="Investigation Waveform"
            subtitle="Autonomous Traversal & Memory Recall"
            icon={<Layers size={15} />}
            badge={<Badge variant="emerald" size="sm" dot>Path Active</Badge>}
            accentColor="emerald"
            className="w-full"
            expandedContent={
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-cyan-300" />
                    <span className="text-xs font-bold text-white">Cross-Session Latent Link</span>
                  </div>
                  <Badge variant="cyan" size="sm">Bridged: S-2026-01 ➔ S-2026-02</Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Lateral Traversal Chain (5-Hop Multi-Hop Reasoning)
                  </h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { step: 1, id: 'E-104', name: '185.220.101.42', role: 'External C2 Server', type: 'IP_Address' },
                      { step: 2, id: 'E-103', name: 'svchost_updater.dll', role: 'Injected Backdoor DLL', type: 'File' },
                      { step: 3, id: 'E-101', name: 'Jumpbox-East-01', role: 'Session 1 Investigated Pivot', type: 'Host' },
                      { step: 4, id: 'E-105', name: 'svc_backup', role: 'Compromised Domain Service Account', type: 'Account' },
                      { step: 5, id: 'E-102', name: 'SQL-PROD-09', role: 'Target Financial Ledger Database', type: 'Database' },
                    ].map((hop) => (
                      <div
                        key={hop.id}
                        onClick={() => {
                          const ent = entities.find((e) => e.id === hop.id);
                          if (ent) setSelectedEntity(ent);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
                            {hop.step}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{hop.name}</span>
                              <span className="text-[10px] text-cyan-400 font-mono">({hop.id})</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{hop.role}</span>
                          </div>
                        </div>
                        <Badge variant="slate" size="sm">{hop.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            {/* Tile Mini Content: Dual-wave frequency graph like in reference image */}
            <div className="space-y-2">
              <div className="relative h-14 w-full overflow-hidden flex items-center">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 60">
                  <path
                    d="M 0,30 Q 35,5 75,30 T 150,30 T 225,30 T 300,30"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeOpacity="0.8"
                  />
                  <path
                    d="M 0,35 Q 40,55 80,35 T 160,35 T 240,35 T 300,35"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                <span className="text-cyan-300 font-bold">E-104 ➔ E-101 ➔ E-102</span>
                <span className="text-emerald-400">Recall Verified (99.2%)</span>
              </div>
            </div>
          </SpatialGlassTile>

          {/* CENTRAL HOLOGRAPHIC 3D GRAPH STAGE */}
          <HolographicGraphStage
            entities={entities}
            relationships={relationships}
            selectedEntityId={currentEntity.id}
            onSelectEntity={(entity) => setSelectedEntity(entity)}
            highlightPath={['E-104', 'E-103', 'E-101', 'E-105', 'E-102']}
          />

          {/* TILE 5: Reasoning Controls & Sliders */}
          <SpatialGlassTile
            id="tile-reasoning-controls"
            title="Autonomous Reasoning Sliders"
            subtitle="Multi-Hop Parameters & Graph Memory"
            icon={<Sliders size={15} />}
            badge={<Badge variant="cyan" size="sm">FalkorDB</Badge>}
            accentColor="cyan"
            className="w-full"
            expandedContent={
              <div className="space-y-5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Calibrate the autonomous agent&apos;s graph exploration depth, heuristic confidence
                  thresholds, and cross-session memory preservation policies.
                </p>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">Multi-Hop Traversal Depth</span>
                      <span className="text-cyan-300 font-bold">{hopDepth} Hops</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={hopDepth}
                      onChange={(e) => setHopDepth(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>1 Direct</span>
                      <span>3 Lateral (Recommended)</span>
                      <span>5 Full Perimeter</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">Agent Confidence Threshold</span>
                      <span className="text-cyan-300 font-bold">{confidenceThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={99}
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>50% Loose</span>
                      <span>85% Balanced</span>
                      <span>99% High Precision</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10">
                  <div>
                    <span className="text-xs font-bold text-white block">Auto-Preserve Session Context</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Snapshot verified investigation paths to FalkorDB
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAutoPreserve(!isAutoPreserve)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isAutoPreserve
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}
                  >
                    {isAutoPreserve ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            }
          >
            {/* Tile Mini Content: Dual Horizontal Sliders like in reference image */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Hop Depth</span>
                  <span className="text-cyan-300 font-bold">{hopDepth} Hops</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
                    style={{ width: `${(hopDepth / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Confidence Floor</span>
                  <span className="text-cyan-300 font-bold">{confidenceThreshold}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
                    style={{ width: `${confidenceThreshold}%` }}
                  />
                </div>
              </div>
            </div>
          </SpatialGlassTile>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (Tiles 3 & 6)
           ========================================================================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* TILE 3: Posture Dials & Gauges */}
          <SpatialGlassTile
            id="tile-posture-dials"
            title="Posture & Dial Gauges"
            subtitle="Graph Health & Threat State"
            icon={<ShieldAlert size={15} />}
            badge={<Badge variant="rose" size="sm" dot>Severe</Badge>}
            accentColor="rose"
            className="w-full"
            expandedContent={
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Composite diagnostic metrics synthesized across FalkorDB relationship density,
                  cross-session memory coherence, and active threat blast radius.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 font-mono block">Coherence</span>
                    <span className="text-lg font-bold text-cyan-300 font-mono">94%</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">Cross-Session Sync</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 font-mono block">Threat Posture</span>
                    <span className="text-lg font-bold text-rose-400 font-mono">88%</span>
                    <span className="text-[10px] text-rose-400 block mt-1">Critical Tier</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-center">
                    <span className="text-[10px] text-slate-400 font-mono block">Graph Integrity</span>
                    <span className="text-lg font-bold text-emerald-300 font-mono">99.4%</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">FalkorDB Validated</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                  <span className="text-xs font-bold text-white block">Active ATT&CK TTP Alignment</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['T1078 Valid Accounts', 'T1059.001 PowerShell', 'T1021.002 SMB Exec', 'T1003 LSASS Dump'].map(
                      (tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
                        >
                          {tech}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            }
          >
            {/* Tile Mini Content: 3 Circular Gauges like in reference image top-right! */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 py-1">
                {/* Dial 1: Coherence */}
                <div className="flex flex-col items-center">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-cyan-400"
                        strokeDasharray="94, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-white">94%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1">Memory</span>
                </div>

                {/* Dial 2: Risk */}
                <div className="flex flex-col items-center">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-rose-400"
                        strokeDasharray="88, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-rose-300">88%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1">Threat</span>
                </div>

                {/* Dial 3: Graph */}
                <div className="flex flex-col items-center">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-400"
                        strokeDasharray="99, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-emerald-300">99%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1">Integrity</span>
                </div>
              </div>
            </div>
          </SpatialGlassTile>

          {/* TILE 6: Memory & Sessions Bank */}
          <SpatialGlassTile
            id="tile-memory-sessions"
            title="Memory & Sessions"
            subtitle="Cross-Session Context Bank"
            icon={<Clock size={15} />}
            badge={<Badge variant="violet" size="sm">{sessions.length} Vaulted</Badge>}
            accentColor="violet"
            className="w-full"
            expandedContent={
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white">Preserved Session Graph Contexts</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Persistent memory bank linking previous investigations to current alerts
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/sessions')}
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink size={13} />}
                  >
                    View All Sessions
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => router.push('/sessions')}
                      className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-cyan-300 font-bold">{session.id}</span>
                        <Badge
                          variant={session.status === 'ACTIVE' ? 'emerald' : 'cyan'}
                          size="sm"
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-white font-medium">{session.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{session.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            {/* Tile Mini Content: Session entries & radar trace */}
            <div className="space-y-2.5">
              {sessions.slice(0, 2).map((s) => (
                <div
                  key={s.id}
                  className="p-2 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-cyan-300 font-bold">{s.id}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{s.entityCount} nodes</span>
                  </div>
                  <p className="text-[11px] text-slate-200 truncate">{s.name}</p>
                </div>
              ))}
              <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Context Recall:</span>
                <span className="text-cyan-300 font-bold">Enabled</span>
              </div>
            </div>
          </SpatialGlassTile>
        </div>
      </div>
    </div>
  );
}
