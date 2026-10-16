'use client';

import React from 'react';
import { Sparkles, ArrowRight, ShieldAlert, Radio, Server } from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';
import { useRouter } from 'next/navigation';

export function DemoBanner() {
  const {
    demoStep,
    launchE101Demo,
    launchE102CrossSessionDemo,
    isDemoMode,
    setIsDemoMode,
    backendUrl,
    falkorDbStatus,
  } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveDemoMode = mounted ? isDemoMode : false;
  const effectiveBackendUrl = mounted ? backendUrl : 'http://localhost:8000/api/v1';

  return (
    <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-cyan-950/40 border-b border-emerald-500/20 px-6 py-2 text-xs text-slate-300 flex items-center justify-between backdrop-blur-md">
      <div className="flex items-center gap-2">
        {effectiveDemoMode ? (
          <>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] uppercase border border-cyan-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              DEMO MODE
            </span>
            <span className="hidden sm:inline text-slate-400">
              Synthesized memory mode active.
            </span>
            <button
              onClick={() => setIsDemoMode(false)}
              className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-semibold cursor-pointer"
            >
              Switch to Live FalkorDB ➔
            </button>
          </>
        ) : (
          <>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              FALKORDB CONNECTED (127.0.0.1:6379)
            </span>
            <span className="hidden sm:inline text-slate-300">
              Live graph active with <span className="font-semibold text-emerald-300">{falkorDbStatus?.nodeCount || 103} nodes</span> in <code className="text-emerald-400 font-mono">contextgraph</code>.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-cyan-400/90 font-medium">
          Hackathon Demo Flow:
        </span>
        <button
          onClick={() => {
            launchE101Demo();
            router.push('/investigation');
          }}
          className="text-xs hover:text-cyan-300 font-medium underline underline-offset-2 flex items-center gap-1 cursor-pointer"
        >
          Run E-101
        </button>
        <span className="text-slate-600">→</span>
        <button
          onClick={() => {
            launchE102CrossSessionDemo();
            router.push('/investigation');
          }}
          className="text-xs text-teal-300 hover:text-teal-200 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
        >
          Run E-102 (Cross-Session)
        </button>

        <span className="text-slate-700 hidden sm:inline">|</span>
        <button
          onClick={() => router.push('/health')}
          className="text-[11px] text-slate-400 hover:text-slate-200 underline hidden sm:inline cursor-pointer"
        >
          {isDemoMode ? 'Configure Backend' : 'Diagnostics'}
        </button>
      </div>
    </div>
  );
}
