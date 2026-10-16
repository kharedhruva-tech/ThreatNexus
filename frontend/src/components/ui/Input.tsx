import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

export function Input({
  className,
  icon,
  label,
  error,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          className={twMerge(
            clsx(
              'w-full bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 backdrop-blur-md transition-all duration-200 outline-none',
              'focus:border-cyan-500/60 focus:bg-slate-900/80 focus:shadow-[0_0_20px_-3px_rgba(6,182,212,0.25)]',
              icon && 'pl-10',
              error && 'border-rose-500/60 focus:border-rose-500',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
