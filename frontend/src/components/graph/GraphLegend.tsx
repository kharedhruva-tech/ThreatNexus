import React from 'react';
import { GlassCard } from '../ui/GlassCard';

export function GraphLegend() {
  return (
    <GlassCard variant="subtle" className="p-3 text-[11px] space-y-2">
      <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
        Graph Legend & Types
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Host (Server / Jumpbox)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span>Database (SQL / Prod)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>File / DLL Artifact</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span>IP Address / C2</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span>User / Service Account</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Process (PowerShell/LSASS)</span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400" />
          <span className="text-slate-300">Active Critical Path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-amber-400" />
          <span className="text-slate-300">Cross-Session Pivot</span>
        </div>
      </div>
    </GlassCard>
  );
}
