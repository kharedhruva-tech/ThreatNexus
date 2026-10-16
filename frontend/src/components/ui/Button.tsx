import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-semibold shadow-[0_0_20px_-3px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_-2px_rgba(6,182,212,0.7)] hover:from-cyan-400 hover:to-teal-400 border border-cyan-300/40 active:scale-[0.98]',
    secondary:
      'bg-slate-900/60 text-slate-200 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-800/80 hover:text-white backdrop-blur-md active:scale-[0.98]',
    ghost:
      'bg-transparent text-slate-300 hover:bg-white/5 hover:text-white border border-transparent active:scale-[0.98]',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold shadow-[0_0_20px_-3px_rgba(244,63,94,0.5)] hover:from-rose-500 hover:to-red-500 border border-rose-400/40 active:scale-[0.98]',
    glow:
      'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/20 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_0_rgba(6,182,212,0.4)]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 gap-2 rounded-xl',
    lg: 'text-base px-6 py-2.5 gap-2.5 rounded-xl',
  };

  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
