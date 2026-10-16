import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'active' | 'subtle' | 'glow-cyan' | 'elevated';
  noPadding?: boolean;
  accentGlow?: 'cyan' | 'emerald' | 'rose' | 'violet' | 'amber' | 'none';
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  noPadding = false,
  accentGlow = 'none',
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: 'liquid-glass',
    interactive: 'liquid-glass-interactive',
    active: 'liquid-glass-active',
    subtle: [
      'bg-[rgba(7,12,24,0.42)]',
      'backdrop-blur-xl',
      'border border-white/[0.06]',
      'shadow-[0_6px_24px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
    ].join(' '),
    'glow-cyan': 'liquid-glass glow-cyan border-cyan-500/28',
    elevated: [
      'bg-[rgba(7,12,26,0.60)]',
      'backdrop-blur-2xl',
      'border border-white/[0.10]',
      'shadow-[0_20px_60px_-8px_rgba(0,0,0,0.75),0_0_30px_-8px_rgba(6,182,212,0.18),inset_0_1px_0_0_rgba(255,255,255,0.16)]',
    ].join(' '),
  };

  const glowStyles = {
    none: '',
    cyan: 'glow-accent-cyan',
    emerald: 'glow-accent-emerald',
    rose: 'glow-accent-rose',
    violet: 'glow-accent-violet',
    amber: 'glow-accent-amber',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-xl overflow-hidden transition-all duration-300',
          !noPadding && 'p-5',
          variantStyles[variant],
          glowStyles[accentGlow],
          className
        )
      )}
      {...props}
    >
      {/* Specular top sheen — simulates light reflection on glass */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent pointer-events-none" />
      {/* Left edge micro-highlight */}
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
