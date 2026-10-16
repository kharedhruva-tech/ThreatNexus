import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel } from '../../lib/types/graph';
import { FactType } from '../../lib/types/investigation';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export function Badge({
  children,
  className,
  variant = 'cyan',
  size = 'md',
  dot = false,
  ...props
}: BadgeProps) {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    violet: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
    outline: 'bg-transparent text-slate-300 border-white/15',
  };

  const dotColors = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    violet: 'bg-purple-400',
    slate: 'bg-slate-400',
    outline: 'bg-slate-300',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md uppercase tracking-wider',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { variant: 'rose' | 'amber' | 'cyan' | 'slate'; label: string }> = {
    CRITICAL: { variant: 'rose', label: 'CRITICAL' },
    HIGH: { variant: 'rose', label: 'HIGH' },
    MEDIUM: { variant: 'amber', label: 'MEDIUM' },
    LOW: { variant: 'cyan', label: 'LOW' },
    INFO: { variant: 'slate', label: 'INFO' },
  };

  const config = map[level] || map.INFO;
  return (
    <Badge variant={config.variant} size="sm" dot>
      {config.label}
    </Badge>
  );
}

export function FactBadge({ type }: { type: FactType }) {
  const map: Record<FactType, { variant: 'emerald' | 'cyan' | 'amber' | 'slate'; label: string }> = {
    FACT: { variant: 'emerald', label: 'FACT' },
    INFERENCE: { variant: 'cyan', label: 'INFERENCE' },
    HYPOTHESIS: { variant: 'amber', label: 'HYPOTHESIS' },
    UNKNOWN: { variant: 'slate', label: 'UNKNOWN' },
  };

  const config = map[type] || map.FACT;
  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}
