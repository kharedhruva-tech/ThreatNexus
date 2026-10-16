'use client';

import React from 'react';

interface HolographicBeamProps {
  height?: number;
  width?: number;
  color?: string;
  className?: string;
}

export function HolographicBeam({
  height = 90,
  width = 60,
  color = '#06b6d4',
  className = '',
}: HolographicBeamProps) {
  return (
    <div
      className={`relative pointer-events-none flex flex-col items-center justify-end ${className}`}
      style={{ height, width }}
    >
      {/* Ascending conical light beam */}
      <div
        className="w-full h-full holographic-beam"
        style={{
          background: `linear-gradient(to top, rgba(6, 182, 212, 0.7) 0%, rgba(34, 211, 238, 0.2) 60%, transparent 100%)`,
        }}
      />

      {/* Floating horizontal holographic emitter scanline */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />

      {/* Base contact point */}
      <div className="w-3 h-3 rounded-full bg-cyan-400/80 blur-[2px] shadow-[0_0_12px_#06b6d4] -mb-1.5" />
    </div>
  );
}
