'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  Network,
  Cpu,
  DatabaseZap,
  GitCompare,
  FileCheck2,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../../lib/context/AppContext';
import { Badge } from '../ui/Badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'cyan' | 'emerald' | 'amber' | 'rose';
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeSession, isDemoMode } = useApp();

  const navigation: NavItem[] = [
    { name: 'Overview',            href: '/',              icon: <LayoutDashboard size={17} /> },
    { name: 'Scenario Explorer',   href: '/scenarios',     icon: <Compass size={17} />,       badge: '3 Presets',   badgeVariant: 'cyan' },
    { name: 'Graph Explorer',      href: '/graph',         icon: <Network size={17} />,        badge: 'Interactive', badgeVariant: 'emerald' },
    { name: 'Agent Investigation', href: '/investigation', icon: <Cpu size={17} />,            badge: 'E-101/102',   badgeVariant: 'rose' },
    { name: 'Memory & Sessions',   href: '/sessions',      icon: <DatabaseZap size={17} />,    badge: 'Cross-Session', badgeVariant: 'cyan' },
    { name: 'Before vs. After',    href: '/comparison',    icon: <GitCompare size={17} /> },
    { name: 'Explainability',      href: '/explainability',icon: <FileCheck2 size={17} /> },
    { name: 'System Health',       href: '/health',        icon: <Activity size={17} />,       badge: 'Status',      badgeVariant: 'amber' },
  ];

  return (
    <aside
      className="w-64 shrink-0 h-screen sticky top-0 flex flex-col z-40"
      style={{
        background: 'rgba(5, 9, 19, 0.62)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: '2px 0 24px 0 rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Vertical edge specular sheen */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-cyan-500/20 via-transparent to-cyan-500/10 pointer-events-none" />

      {/* Brand Header */}
      <div
        className="p-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-cyan-600 via-indigo-500 to-purple-500 p-0.5 shadow-[0_0_20px_-3px_rgba(6,182,212,0.6)] group-hover:shadow-[0_0_28px_-2px_rgba(168,85,247,0.85)] transition-all shrink-0">
            <img
              src="/threatnexus-logo.jpg"
              alt="ThreatNexus Logo"
              className="w-full h-full object-cover rounded-[9px] group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">ThreatNexus</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Graph Threat Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Platform Workspace
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative',
                isActive
                  ? [
                      'text-cyan-300 border',
                      'border-cyan-500/28',
                      'shadow-[0_0_18px_-4px_rgba(6,182,212,0.3)]',
                    ].join(' ')
                  : 'text-slate-500 hover:text-slate-100 border border-transparent hover:border-white/[0.05]'
              )}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(90deg, rgba(6,182,212,0.12) 0%, rgba(20,184,166,0.06) 60%, transparent 100%)',
                    }
                  : {
                      background: 'transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className={clsx('transition-colors', isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300')}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <Badge variant={item.badgeVariant || 'cyan'} size="sm">
                    {item.badge}
                  </Badge>
                )}
                {isActive && <ChevronRight size={13} className="text-cyan-400" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Active Session Card — footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="p-3 rounded-xl space-y-1.5"
          style={{
            background: 'rgba(6, 10, 22, 0.55)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Active Session:</span>
            <span className="font-mono text-cyan-300 font-semibold">{activeSession.id}</span>
          </div>
          <p className="text-[11px] text-slate-300 truncate font-medium">{activeSession.name}</p>
          <div className="flex items-center justify-between pt-1 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Memory Linked
            </span>
            <span className="text-slate-600 font-mono">v1.0-Demo</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
