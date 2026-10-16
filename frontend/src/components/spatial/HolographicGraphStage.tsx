'use client';

import React, { useState } from 'react';
import { GraphEntity, GraphRelationship } from '../../lib/types/graph';
import { InteractiveGraph } from '../graph/InteractiveGraph';
import { HolographicBeam } from './HolographicBeam';
import {
  Sparkles,
  Layers,
  Compass,
  Maximize2,
  Box,
  Eye,
  Server,
  Database,
  Globe,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

interface HolographicGraphStageProps {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  selectedEntityId?: string;
  onSelectEntity: (entity: GraphEntity) => void;
  highlightPath?: string[];
}

export function HolographicGraphStage({
  entities,
  relationships,
  selectedEntityId = 'E-102',
  onSelectEntity,
  highlightPath = ['E-104', 'E-103', 'E-101', 'E-105', 'E-102'],
}: HolographicGraphStageProps) {
  const [viewMode, setViewMode] = useState<'SPATIAL_3D' | 'PLANAR_CANVAS'>('SPATIAL_3D');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Isometric 2D-to-3D visual placement coordinates for the 10 demo nodes on the stage
  const SPATIAL_NODE_COORDS: Record<string, { top: string; left: string; hasBeam?: boolean }> = {
    'E-107': { top: '35%', left: '16%' },                 // CVE Exploit
    'E-101': { top: '48%', left: '32%', hasBeam: true },   // Jumpbox (Primary Pivot Beam!)
    'E-106': { top: '68%', left: '26%' },                 // PowerShell Stager
    'E-103': { top: '65%', left: '46%' },                 // svchost_updater.dll
    'E-110': { top: '32%', left: '48%' },                 // backup_agent.exe
    'E-104': { top: '78%', left: '68%' },                 // C2 IP 185.220.101.42
    'E-109': { top: '22%', left: '34%' },                 // lsass.exe
    'E-105': { top: '26%', left: '56%' },                 // svc_backup
    'E-108': { top: '18%', left: '72%' },                 // auth.corp-internal.net
    'E-102': { top: '50%', left: '76%', hasBeam: true },   // SQL-PROD-09 Database (Primary Target Beam!)
  };

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || entities[0];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden liquid-glass border border-cyan-500/30 bg-[#040711] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] min-h-[580px] flex flex-col justify-between">
      {/* Top Floating HUD Controls */}
      <div className="absolute top-4 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>SPATIAL COMPUTING VIEW</span>
          </span>
          <span className="hidden sm:inline text-xs text-slate-400 font-mono bg-slate-900/60 px-2.5 py-1 rounded-xl border border-white/5 backdrop-blur-md">
            Isometric Holographic Stage
          </span>
        </div>

        {/* View Mode Toggle: 3D Spatial vs 2D Canvas */}
        <div className="pointer-events-auto flex items-center bg-slate-900/80 border border-white/10 rounded-xl p-1 gap-1 backdrop-blur-md shadow-lg">
          <button
            onClick={() => setViewMode('SPATIAL_3D')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'SPATIAL_3D'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_15px_-2px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box size={13} />
            <span>Spatial 3D</span>
          </button>
          <button
            onClick={() => setViewMode('PLANAR_CANVAS')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'PLANAR_CANVAS'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_15px_-2px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Planar 2D</span>
          </button>
        </div>
      </div>

      {/* Main Graph Content: Spatial 3D Perspective vs Planar ReactFlow Canvas */}
      {viewMode === 'PLANAR_CANVAS' ? (
        <div className="w-full h-[580px] p-2 pt-14">
          <InteractiveGraph
            entities={entities}
            relationships={relationships}
            selectedEntityId={selectedEntityId}
            highlightPath={highlightPath}
            onSelectEntity={onSelectEntity}
            height="530px"
            showMiniMap={false}
          />
        </div>
      ) : (
        <div className="relative w-full h-[580px] overflow-hidden flex items-center justify-center perspective-spatial">
          {/* Spatial Grid Floor Plane directly inspired by reference image */}
          <div className="absolute inset-[-40%] spatial-grid-floor pointer-events-none opacity-70" />

          {/* Central Radial Atmospheric Glow */}
          <div className="absolute w-[650px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

          {/* SVG Connection Lines & Animated Pulse Streams */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="amberLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Path: E-107 (Exploit) to E-101 (Jumpbox) */}
            <line x1="16%" y1="35%" x2="32%" y2="48%" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.7" />
            
            {/* Path: E-101 to E-106 (PowerShell) */}
            <line x1="32%" y1="48%" x2="26%" y2="68%" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.7" />
            
            {/* Path: E-106 to E-103 (svchost_updater.dll) */}
            <line x1="26%" y1="68%" x2="46%" y2="65%" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.8" />
            
            {/* Path: E-103 to E-104 (C2 IP) */}
            <line x1="46%" y1="65%" x2="68%" y2="78%" stroke="#22d3ee" strokeWidth="3" strokeDasharray="6 6" className="animate-pulse" />
            
            {/* Path: E-110 (backup_agent.exe) to E-103 */}
            <line x1="48%" y1="32%" x2="46%" y2="65%" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.5" />
            
            {/* Path: E-101 to E-109 (LSASS) */}
            <line x1="32%" y1="48%" x2="34%" y2="22%" stroke="#06b6d4" strokeWidth="2" strokeOpacity="0.7" />
            
            {/* Path: E-109 to E-105 (svc_backup) */}
            <line x1="34%" y1="22%" x2="56%" y2="26%" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.8" />
            
            {/* Path: E-105 to E-108 (Kerberos KDC) */}
            <line x1="56%" y1="26%" x2="72%" y2="18%" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.5" />
            
            {/* CRITICAL CROSS-SESSION LATERAL PIVOT: E-101 Jumpbox to E-102 Database */}
            <line
              x1="32%"
              y1="48%"
              x2="76%"
              y2="50%"
              stroke="url(#amberLineGrad)"
              strokeWidth="4"
              strokeDasharray="8 6"
              className="animate-pulse"
              style={{ filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.9))' }}
            />

            {/* Path: svc_backup (E-105) to SQL-PROD-09 (E-102) */}
            <line x1="56%" y1="26%" x2="76%" y2="50%" stroke="#22d3ee" strokeWidth="3" strokeOpacity="0.85" />
          </svg>

          {/* Render Spatial Cylindrical Nodes on the Grid Plane */}
          <div className="absolute inset-0 z-20">
            {entities.map((entity) => {
              const coords = SPATIAL_NODE_COORDS[entity.id] || { top: '50%', left: '50%' };
              const isSelected = selectedEntityId === entity.id;
              const isHovered = hoveredNodeId === entity.id;
              const isCriticalPath = highlightPath.includes(entity.id);

              return (
                <div
                  key={entity.id}
                  style={{ top: coords.top, left: coords.left }}
                  onClick={() => onSelectEntity(entity)}
                  onMouseEnter={() => setHoveredNodeId(entity.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center"
                >
                  {/* Vertical Holographic Light Beam ascending into space (like in reference image!) */}
                  {coords.hasBeam && (
                    <div className="absolute bottom-6">
                      <HolographicBeam height={100} width={70} />
                    </div>
                  )}

                  {/* Ripple pulse ring */}
                  <div
                    className={`absolute -inset-3 rounded-full holographic-ripple pointer-events-none ${
                      isSelected || isCriticalPath ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                    }`}
                  />

                  {/* Luminous Cylindrical Node Button */}
                  <div
                    className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? 'holographic-cylinder ring-4 ring-cyan-400/60 scale-125'
                        : isCriticalPath
                        ? 'holographic-cylinder ring-2 ring-cyan-400/40 scale-110'
                        : 'bg-cyan-950/80 border border-cyan-500/50 hover:scale-115 hover:border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    }`}
                  >
                    <span className="text-white">
                      {entity.type === 'Host' && <Server size={14} />}
                      {entity.type === 'Database' && <Database size={14} />}
                      {entity.type === 'IP_Address' && <Globe size={14} />}
                      {entity.type === 'Process' && <Terminal size={14} />}
                      {entity.type === 'Vulnerability' && <ShieldAlert size={14} />}
                      {!['Host', 'Database', 'IP_Address', 'Process', 'Vulnerability'].includes(entity.type) && (
                        <Sparkles size={14} />
                      )}
                    </span>
                  </div>

                  {/* Node Label Capsule (Always crisp & high-contrast) */}
                  <div
                    className={`mt-2 px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all whitespace-nowrap shadow-md ${
                      isSelected
                        ? 'bg-cyan-950/90 text-cyan-200 border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                        : 'bg-slate-950/80 text-slate-300 border-white/15 group-hover:border-cyan-400/60 group-hover:text-white'
                    }`}
                  >
                    <span className="text-cyan-400 font-semibold mr-1">{entity.id}:</span>
                    <span>{entity.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Spatial Stage Legend */}
          <div className="absolute bottom-4 inset-x-6 z-20 flex items-center justify-between text-[11px] text-slate-400 font-mono pointer-events-none">
            <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md pointer-events-auto">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                Target Nodes
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-3 h-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                Cross-Session Lateral Bridge (E-101 ➔ E-102)
              </span>
            </div>

            <span className="hidden md:inline bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
              Click node to inspect intelligence tile
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
