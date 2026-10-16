'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  PlayCircle,
  Radio,
  Sparkles,
  HelpCircle,
  Database,
  ArrowRight,
  CheckCircle2,
  Server,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    activeSession,
    sessions,
    setActiveSession,
    launchE101Demo,
    launchE102CrossSessionDemo,
    demoStep,
    isDemoMode,
    setIsDemoMode,
    backendUrl,
    falkorDbStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Overview Dashboard';
      case '/scenarios':
        return 'Scenario Explorer';
      case '/graph':
        return 'Graph Explorer';
      case '/investigation':
        return 'Agent Investigation Workspace';
      case '/sessions':
        return 'Memory & Sessions';
      case '/comparison':
        return 'Before vs. After Analysis';
      case '/explainability':
        return 'Explainability & Provenance';
      case '/health':
        return 'System Health & Diagnostics';
      default:
        return 'ThreatNexus';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/graph?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <header
        className="h-16 shrink-0 px-6 flex items-center justify-between sticky top-0 z-30"
        style={{
          background: 'rgba(4, 7, 16, 0.60)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: '0 2px 20px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(6,182,212,0.06)',
        }}
      >
        {/* Bottom specular sheen */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/12 to-transparent pointer-events-none" />
        {/* Left: Breadcrumbs & Page Title */}
        <div className="flex items-center gap-3 relative">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <img src="/threatnexus-logo.jpg" alt="ThreatNexus" className="w-4 h-4 rounded-sm object-cover inline-block border border-white/10" />
              <span className="font-semibold text-slate-300">ThreatNexus</span>
              <span className="text-slate-700">/</span>
              <span className="text-cyan-400 font-medium">{getPageTitle()}</span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">{getPageTitle()}</h1>
          </div>
        </div>

        {/* Center: Search Entities */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center w-72 relative">
          <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entity (e.g. E-101, E-102, IP)..."
            className="w-full rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-all font-mono"
            style={{
              background: 'rgba(6, 10, 22, 0.50)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(6,182,212,0.45)';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.08)';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.target as HTMLInputElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)';
            }}
          />
        </form>

        {/* Right: Quick Demo Actions & Status Indicator */}
        <div className="flex items-center gap-3">
          {/* Main Demo Flow Quick-Trigger */}
          <div className="hidden sm:flex items-center bg-slate-900/70 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => {
                launchE101Demo();
                router.push('/investigation');
              }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                demoStep === 'E101_INVESTIGATED'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Step 1: Investigate E-101 (Jumpbox) & Preserve Session Context"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              1. E-101 Triage
            </button>
            <ArrowRight size={12} className="text-slate-600" />
            <button
              onClick={() => {
                launchE102CrossSessionDemo();
                router.push('/investigation');
              }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                demoStep === 'E102_CORRELATED'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 animate-pulse'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Step 2: Investigate E-102 & Recall Stored Context Across Sessions"
            >
              <Sparkles size={13} className="text-teal-400" />
              2. E-102 Recall Demo
            </button>
          </div>

          {/* Prominent FalkorDB Connected Live Badge */}
          <div
            onClick={() => router.push('/health')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer shadow-sm ${
              falkorDbStatus?.connected
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/50'
            }`}
            title={
              falkorDbStatus?.connected
                ? `FalkorDB Connected at ${falkorDbStatus.endpoint} (${falkorDbStatus.nodeCount} graph nodes, ${falkorDbStatus.edgeCount} edges)`
                : 'FalkorDB Offline - Click to inspect diagnostics'
            }
          >
            <Database size={14} className={falkorDbStatus?.connected ? 'text-emerald-400' : 'text-rose-400'} />
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  falkorDbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span className="font-bold tracking-tight">
                {falkorDbStatus?.connected ? 'FalkorDB Connected' : 'FalkorDB Offline'}
              </span>
              {falkorDbStatus?.connected && (
                <span className="text-[10px] text-emerald-400/80 font-mono hidden lg:inline">
                  ({falkorDbStatus.endpoint} • {falkorDbStatus.nodeCount} nodes)
                </span>
              )}
            </span>
          </div>

          {/* Mode Pill Indicator & Toggle */}
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isDemoMode
                ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDemoMode ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span>{isDemoMode ? 'DEMO' : 'LIVE API'}</span>
            <HelpCircle size={13} className={isDemoMode ? 'text-cyan-400' : 'text-slate-400'} />
          </button>
        </div>
      </header>

      {/* Info Modal explaining Demo vs Live Mode & Architecture */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="ThreatNexus — Data Source & Adapter Configuration"
        subtitle="Manage live Python backend pairing or standalone demonstration mode"
      >
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Mode Toggle Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Active Data Source Mode:</span>
              <span className="text-[11px] text-slate-400">
                {isDemoMode
                  ? 'Currently serving realistic synthetic cybersecurity data (Standalone)'
                  : `Currently dispatching live requests to ${backendUrl}`}
              </span>
            </div>
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
              }`}
            >
              {isDemoMode ? 'Switch to LIVE API' : 'Switch to DEMO'}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/25 space-y-1.5">
            <h4 className="font-semibold text-cyan-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              <span>Architectural Boundary</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              Browser client connects exclusively through the typed adapter (<code>apiClient.ts</code>) to your teammate&apos;s Python server.
              Direct FalkorDB connections and Gemini API keys are never exposed in client code.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-white">Main Hackathon Flow (E-101 ➔ E-102):</h5>
            <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px]">
              <li>
                <strong>Investigate E-101:</strong> Analyze Host-Finance-01 (compromised jumpbox, DLL sideload,
                LSASS dump) in Session <code>S-2026-01</code>.
              </li>
              <li>
                <strong>Preserve Context:</strong> Threat triples and compromised credentials (<code>svc_backup</code>)
                are committed to the ThreatNexus Memory Bank.
              </li>
              <li>
                <strong>Investigate E-102:</strong> In Session <code>S-2026-02</code>, query high-value database
                SQL-PROD-09. ThreatNexus automatically recalls the prior session context to link the lateral movement path!
              </li>
            </ol>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                setIsDemoModalOpen(false);
                router.push('/health');
              }}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              Open Full Diagnostics ➔
            </button>
            <Button size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
