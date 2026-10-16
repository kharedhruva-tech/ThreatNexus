import React, { useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 tile-modal-backdrop backdrop-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx('relative w-full rounded-2xl overflow-hidden tile-expand-enter', maxWidth)}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(20, 32, 49, 0.62)',
          backdropFilter: 'blur(22px) saturate(145%)',
          WebkitBackdropFilter: 'blur(22px) saturate(145%)',
          border: '1px solid rgba(6, 182, 212, 0.28)',
          boxShadow: '0 28px 72px -10px rgba(0,0,0,0.82), 0 0 40px -12px rgba(6,182,212,0.18), inset 0 1px 0 0 rgba(255,255,255,0.18)',
          animation: 'tileExpand 0.40s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Top specular sheen */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/55 to-transparent pointer-events-none" />
        {/* Left edge highlight */}
        <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/16 via-transparent to-transparent pointer-events-none" />

        <div className="p-6">
          <div className="flex items-start justify-between pb-4 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10 ml-4 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500/80 focus-visible:outline-offset-2"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
