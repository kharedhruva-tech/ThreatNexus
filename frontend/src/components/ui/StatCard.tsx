'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import { TileExpandModal, useTileExpand } from './TileExpandModal';
import { clsx } from 'clsx';
import { Maximize2, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
  /** Legacy router navigate action (still supported) */
  onClick?: () => void;
  /** Rich expanded content shown in the modal */
  expandedContent?: React.ReactNode;
  /** If true, tile is expandable; if false falls back to onClick nav */
  expandable?: boolean;
}

const ACCENT = {
  cyan: {
    iconBg: 'bg-cyan-500/12 text-cyan-400 border-cyan-500/25',
    valueBg: 'text-cyan-300',
    border: 'hover:border-cyan-500/42',
    glow: 'glow-accent-cyan',
    modalAccent: 'cyan' as const,
    expandHint: 'text-cyan-400',
  },
  emerald: {
    iconBg: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
    valueBg: 'text-emerald-300',
    border: 'hover:border-emerald-500/42',
    glow: 'glow-accent-emerald',
    modalAccent: 'emerald' as const,
    expandHint: 'text-emerald-400',
  },
  amber: {
    iconBg: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
    valueBg: 'text-amber-300',
    border: 'hover:border-amber-500/42',
    glow: 'glow-accent-amber',
    modalAccent: 'amber' as const,
    expandHint: 'text-amber-400',
  },
  rose: {
    iconBg: 'bg-rose-500/12 text-rose-400 border-rose-500/25',
    valueBg: 'text-rose-300',
    border: 'hover:border-rose-500/42',
    glow: 'glow-accent-rose',
    modalAccent: 'rose' as const,
    expandHint: 'text-rose-400',
  },
  violet: {
    iconBg: 'bg-purple-500/12 text-purple-400 border-purple-500/25',
    valueBg: 'text-purple-300',
    border: 'hover:border-purple-500/42',
    glow: 'glow-accent-violet',
    modalAccent: 'violet' as const,
    expandHint: 'text-purple-400',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'cyan',
  onClick,
  expandedContent,
  expandable = false,
}: StatCardProps) {
  const { isOpen, open, close } = useTileExpand();

  const a = ACCENT[accentColor];
  const isExpandable = expandable || !!expandedContent;

  const handleClick = (e: React.MouseEvent) => {
    if (isExpandable) {
      open();
    } else if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <>
      <div
        role={isExpandable || onClick ? 'button' : undefined}
        tabIndex={isExpandable || onClick ? 0 : undefined}
        aria-label={isExpandable ? `Expand ${title}` : title}
        aria-haspopup={isExpandable ? 'dialog' : undefined}
        aria-expanded={isExpandable ? isOpen : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={clsx(
          'group relative transition-all duration-300',
          isExpandable || onClick ? 'cursor-pointer tile-focusable' : ''
        )}
      >
        <GlassCard
          variant="interactive"
          className={clsx('relative', a.border, isExpandable || onClick ? a.glow : '')}
          noPadding
        >
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
                <h3 className={clsx('text-2xl font-bold mt-1.5 tracking-tight', a.valueBg)}>
                  {value}
                </h3>
                {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {icon && (
                  <div
                    className={clsx(
                      'p-2.5 rounded-xl border transition-all group-hover:scale-110',
                      a.iconBg
                    )}
                  >
                    {icon}
                  </div>
                )}
                {isExpandable && (
                  <span
                    className="opacity-0 group-hover:opacity-80 transition-opacity text-slate-400 group-hover:text-cyan-300"
                    aria-hidden="true"
                  >
                    <Maximize2 size={11} />
                  </span>
                )}
              </div>
            </div>

            {trend && (
              <div className="mt-3 flex items-center gap-1.5 text-xs pt-3 border-t border-white/[0.06]">
                {trend.isPositive ? (
                  <TrendingUp size={13} className="text-emerald-400" />
                ) : (
                  <TrendingDown size={13} className="text-rose-400" />
                )}
                <span
                  className={clsx(
                    'font-semibold',
                    trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {trend.value}
                </span>
                <span className="text-slate-500">vs historical baseline</span>
              </div>
            )}
          </div>

          {/* Bottom accent line */}
          <div
            className={clsx(
              'absolute bottom-0 inset-x-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity',
              'bg-gradient-to-r from-transparent via-current to-transparent',
              a.expandHint
            )}
          />
        </GlassCard>
      </div>

      {/* Expanded modal */}
      {isExpandable && (
        <TileExpandModal
          isOpen={isOpen}
          onClose={close}
          title={title}
          subtitle={subtitle}
          icon={icon}
          accentColor={a.modalAccent}
          maxWidth="max-w-2xl"
        >
          {expandedContent ?? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                {icon && (
                  <div className={clsx('p-4 rounded-2xl border', a.iconBg)}>
                    <div className="scale-150">{icon}</div>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">{title}</p>
                  <p className={clsx('text-4xl font-bold tracking-tight mt-1', a.valueBg)}>{value}</p>
                  {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
                </div>
              </div>
              {trend && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] text-sm">
                  {trend.isPositive ? (
                    <TrendingUp size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <TrendingDown size={15} className="text-rose-400 shrink-0" />
                  )}
                  <span className={trend.isPositive ? 'text-emerald-300' : 'text-rose-300'}>
                    {trend.value}
                  </span>
                  <span className="text-slate-500 text-xs">vs historical baseline</span>
                </div>
              )}
              <p className="text-sm text-slate-400 leading-relaxed">
                No additional details available for this metric. Click the related section in the navigation for deeper analysis.
              </p>
            </div>
          )}
        </TileExpandModal>
      )}
    </>
  );
}
