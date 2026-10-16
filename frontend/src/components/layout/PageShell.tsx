import React from 'react';
import { clsx } from 'clsx';

interface PageShellProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  badge,
  actions,
  icon,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={clsx('flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6', className)}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            {icon && <div className="shrink-0">{icon}</div>}
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
            {badge}
          </div>
          {description && (
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
