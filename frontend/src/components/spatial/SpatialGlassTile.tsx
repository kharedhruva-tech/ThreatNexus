'use client';

import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Maximize2, ChevronRight } from 'lucide-react';
import { TileExpandModal, useTileExpand } from '../ui/TileExpandModal';

interface SpatialGlassTileProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  className?: string;
  isFloating?: boolean;
  style?: React.CSSProperties;
  accentColor?: 'cyan' | 'emerald' | 'rose' | 'violet' | 'amber';
}

export function SpatialGlassTile({
  id,
  title,
  subtitle,
  badge,
  icon,
  children,
  expandedContent,
  className,
  isFloating = true,
  style,
  accentColor = 'cyan',
}: SpatialGlassTileProps) {
  const { isOpen, open, close } = useTileExpand();

  /* Prevent child interactive elements from accidentally opening the tile */
  const handleTileClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(
        'button, a, input, select, textarea, [role="button"], [data-no-expand]'
      );
      if (interactive && interactive !== e.currentTarget) return;
      open();
    },
    [open]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    },
    [open]
  );

  return (
    <>
      {/* ── Compact Tile ── */}
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-label={`Expand ${title}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={style}
        onClick={handleTileClick}
        onKeyDown={handleKeyDown}
        className={twMerge(
          clsx(
            'group relative rounded-2xl p-4 spatial-glass-tile cursor-pointer select-none',
            'tile-focusable',
            className
          )
        )}
      >
        {/* Top specular sheen */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent pointer-events-none rounded-t-2xl" />
        {/* Left edge micro-highlight */}
        <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/14 via-transparent to-transparent pointer-events-none" />
        {/* Subtle inner bottom glow */}
        <div className="absolute inset-x-4 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="p-1.5 rounded-xl bg-cyan-500/14 text-cyan-300 border border-cyan-500/28 shrink-0 group-hover:scale-105 transition-transform">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white tracking-tight truncate group-hover:text-cyan-200 transition-colors">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {badge}
            <span
              className="p-1 rounded-lg text-slate-500 group-hover:text-cyan-300 group-hover:bg-white/10 transition-all"
              aria-hidden="true"
              title="Click to expand"
            >
              <Maximize2 size={12} />
            </span>
          </div>
        </div>

        {/* Compact body */}
        <div className="pt-3">{children}</div>

        {/* Hover hint */}
        <div className="absolute bottom-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] text-cyan-300/70 font-mono pointer-events-none select-none">
          <span>Expand</span>
          <ChevronRight size={9} />
        </div>
      </div>

      {/* ── Expanded Modal ── */}
      <TileExpandModal
        isOpen={isOpen}
        onClose={close}
        title={title}
        subtitle={subtitle}
        badge={badge}
        icon={icon}
        accentColor={accentColor}
      >
        {expandedContent ?? children}
      </TileExpandModal>
    </>
  );
}
