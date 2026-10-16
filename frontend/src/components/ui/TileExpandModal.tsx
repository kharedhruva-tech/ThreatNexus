'use client';

/**
 * TileExpandModal — Premium Liquid Glass expandable panel.
 *
 * ROOT CAUSE FIX (2nd rewrite):
 * ─────────────────────────────────────────────────────────────
 * The previous version used `phase` state inside a useEffect that
 * only depended on `isOpen`. This created a stale closure where
 * `phase` was always 'closed' when the close branch ran, so
 * `startClose()` was never called → modal unmounted instantly.
 *
 * Fix: track phase in a ref (phaseRef) alongside state, so the
 * effect can read the current phase without being a dependency.
 *
 * Layer architecture (backdrop sibling, panel above):
 *   z:50 — dark overlay div (dims dashboard, clickable to close)
 *   z:51 — centering wrapper (pointer-events:none transparent)
 *   z:51 — glass panel (backdrop-filter samples live dashboard)
 */

import React, {
  useEffect,
  useId,
  useCallback,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface TileExpandModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  accentColor?: 'cyan' | 'emerald' | 'rose' | 'violet' | 'amber';
  maxWidth?: string;
}

type Phase = 'closed' | 'entering' | 'open' | 'closing';

/* ─── Accent colour maps ─────────────────────────────────────────────────── */

const BORDER: Record<string, string> = {
  cyan:    'rgba(34, 211, 238, 0.35)',
  emerald: 'rgba(52, 211, 153, 0.35)',
  rose:    'rgba(251, 113, 133, 0.35)',
  violet:  'rgba(167, 139, 250, 0.35)',
  amber:   'rgba(251, 191, 36, 0.35)',
};
const GLOW: Record<string, string> = {
  cyan:    'rgba(6, 182, 212, 0.16)',
  emerald: 'rgba(16, 185, 129, 0.16)',
  rose:    'rgba(244, 63, 94, 0.16)',
  violet:  'rgba(139, 92, 246, 0.16)',
  amber:   'rgba(245, 158, 11, 0.16)',
};
const SHEEN: Record<string, string> = {
  cyan:    'rgba(34, 211, 238, 0.70)',
  emerald: 'rgba(52, 211, 153, 0.70)',
  rose:    'rgba(251, 113, 133, 0.70)',
  violet:  'rgba(167, 139, 250, 0.70)',
  amber:   'rgba(251, 191, 36, 0.70)',
};
const ICON_BG: Record<string, string> = {
  cyan:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  rose:    'bg-rose-500/20 text-rose-300 border-rose-500/40',
  violet:  'bg-purple-500/20 text-purple-300 border-purple-500/40',
  amber:   'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export function TileExpandModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  children,
  expandedContent,
  accentColor = 'cyan',
  maxWidth = 'max-w-4xl',
}: TileExpandModalProps) {
  const dialogId = useId();

  const [phase, setPhase] = useState<Phase>('closed');

  /*
   * phaseRef mirrors `phase` state synchronously.
   * Used inside effects/callbacks to avoid stale closure bugs
   * when reading phase without listing it as a dependency.
   */
  const phaseRef  = useRef<Phase>('closed');
  const panelRef  = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refractionBackdropRef = useRef<HTMLDivElement>(null);

  const setP = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* ── Cleanup timer on unmount ── */
  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const CLOSE_DURATION_MS = 280;
  const OPEN_DURATION_MS  = 400;

  /* ── Play exit animation then fully unmount ── */
  const triggerClose = useCallback(() => {
    if (phaseRef.current === 'closing' || phaseRef.current === 'closed') return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setP('closing');

    // Both panel and backdrop finish together in exactly CLOSE_DURATION_MS (280ms)
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setP('closed');
    }, CLOSE_DURATION_MS);
  }, [setP]);

  /* ── Unified close handler (button / Escape / backdrop) ── */
  const handleClose = useCallback(() => {
    const cur = phaseRef.current;
    if (cur === 'closing' || cur === 'closed') return;
    onClose();      // tells parent isOpen→false
    triggerClose(); // immediately start exit animation synchronized together
  }, [onClose, triggerClose]);

  /* ── Drive phase from isOpen prop ── */
  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setP('entering');
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setP('open');
      }, OPEN_DURATION_MS);
    } else {
      const cur = phaseRef.current;
      if (cur === 'entering' || cur === 'open') {
        triggerClose();
      }
    }
  }, [isOpen, triggerClose, setP]);

  /* ── Escape key + scroll lock ── */
  useEffect(() => {
    if (phase === 'closed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [phase, handleClose]);

  /* ── Genuine Refraction: Captured background representation with SVG displacement ── */
  useEffect(() => {
    if (phase === 'closed') {
      if (refractionBackdropRef.current) {
        refractionBackdropRef.current.innerHTML = '';
      }
      return;
    }

    const container = refractionBackdropRef.current;
    const panel = panelRef.current;
    if (!container || !panel) return;

    // Find main dashboard container behind the modal
    const mainEl = (document.querySelector('main') || document.querySelector('.min-h-screen')) as HTMLElement | null;
    if (!mainEl) return;

    container.innerHTML = '';

    const panelRect = panel.getBoundingClientRect();
    const mainRect  = mainEl.getBoundingClientRect();

    // Clone dashboard content
    const clone = mainEl.cloneNode(true) as HTMLElement;

    // Strip modals, dialogs, and fixed overlays from clone to avoid self-nesting
    clone.querySelectorAll('[role="dialog"], [aria-modal="true"]').forEach((el) => el.remove());
    clone.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]').forEach((el) => el.remove());

    // Disable interaction and accessibility tree on cloned background
    clone.setAttribute('aria-hidden', 'true');
    clone.style.pointerEvents = 'none';
    clone.style.userSelect = 'none';

    // Position inner wrapper aligned with viewport coordinates
    const innerWrapper = document.createElement('div');
    innerWrapper.style.position = 'absolute';
    innerWrapper.style.top = `${mainRect.top - panelRect.top}px`;
    innerWrapper.style.left = `${mainRect.left - panelRect.left}px`;
    innerWrapper.style.width = `${mainRect.width}px`;
    innerWrapper.style.height = `${mainRect.height}px`;
    innerWrapper.style.pointerEvents = 'none';
    innerWrapper.style.userSelect = 'none';

    // Genuine SVG Refraction: Apply optical displacement filter
    innerWrapper.style.filter = 'url(#liquidGlassRefract)';
    innerWrapper.style.opacity = '0.52';

    innerWrapper.appendChild(clone);
    container.appendChild(innerWrapper);

    // Keep aligned on resize and scroll
    const updatePosition = () => {
      if (!panel || !mainEl || !innerWrapper) return;
      const pR = panel.getBoundingClientRect();
      const mR = mainEl.getBoundingClientRect();
      innerWrapper.style.top = `${mR.top - pR.top}px`;
      innerWrapper.style.left = `${mR.left - pR.left}px`;
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      if (container) container.innerHTML = '';
    };
  }, [phase]);

  /* ── Nothing to show when fully closed ── */
  if (phase === 'closed') return null;

  const isEntering = phase === 'entering';
  const isClosing  = phase === 'closing';
  const isStableOpen = phase === 'open';

  /*
   * Animation strings.
   * Both EXIT and BG_OUT share the exact same 0.28s duration and curve,
   * so the modal and the backdrop fade and move together in perfect unison.
   */
  const ENTER = 'lgModalIn  0.40s cubic-bezier(0.22, 1, 0.36, 1) both';
  const EXIT  = 'lgModalOut 0.28s cubic-bezier(0.4, 0, 0.2, 1) both';
  const BG_IN = 'lgBgIn     0.35s ease-out both';
  const BG_OUT= 'lgBgOut    0.28s cubic-bezier(0.4, 0, 0.2, 1) both';

  const borderColor = BORDER[accentColor];
  const glowColor   = GLOW[accentColor];
  const sheenColor  = SHEEN[accentColor];
  const iconClass   = ICON_BG[accentColor];

  return (
    <>
      {/*
       * Layer 1 — Dark backdrop (z:50)
       * Dims the dashboard. Sibling to the panel, so the panel's
       * backdrop-filter sees the live page instead of this overlay.
       */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(3, 6, 18, 0.65)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: isEntering ? BG_IN : isClosing ? BG_OUT : 'none',
          opacity: isStableOpen ? 1 : undefined,
          pointerEvents: isClosing ? 'none' : 'auto',
        }}
      />

      {/* ── Optical Refraction SVG Definition (Lens Displacement Filter) ── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        <defs>
          <filter id="liquidGlassRefract" x="-10%" y="-10%" width="120%" height="120%">
            {/* Smooth optical lens curvature: lower baseFrequency = smooth glass bending rather than high-frequency noise */}
            <feTurbulence type="fractalNoise" baseFrequency="0.007" numOctaves="2" result="noise" />
            {/* Spatial optical displacement: 14px displacement creates visible physical bending of lines and nodes */}
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            {/* Gentle optical edge diffusion */}
            <feGaussianBlur in="displaced" stdDeviation="0.8" result="blurred" />
          </filter>
        </defs>
      </svg>

      {/*
       * Layer 2 — Transparent centering container (z:51)
       * pointer-events:none so clicks on the transparent area
       * fall through to Layer 1 (backdrop click-to-close works).
       */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 51,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        {/*
         * Layer 3 — The Glass Panel
         * background is translucent → backdrop-filter blurs the REAL
         * dashboard beneath, producing genuine glass translucency.
         * brightness(1.18) makes it noticeably lighter than the dim overlay.
         */}
        <div
          ref={panelRef}
          className={clsx('relative rounded-2xl overflow-hidden', maxWidth)}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxHeight: '88vh',
            pointerEvents: isClosing ? 'none' : 'all',

            /* ── Liquid Glass Surface (Luminous Translucency & Full-Surface Refraction) ── */
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(28, 45, 72, 0.34) 20%, rgba(14, 26, 46, 0.28) 60%, rgba(10, 20, 36, 0.36) 100%)',
            backdropFilter: 'blur(22px) saturate(210%) brightness(1.32) contrast(1.06)',
            WebkitBackdropFilter: 'blur(22px) saturate(210%) brightness(1.32) contrast(1.06)',

            border: `1px solid ${borderColor}`,

            boxShadow: [
              /* Deep ambient float shadow */
              '0 32px 84px -10px rgba(0, 0, 0, 0.85)',
              /* Contact shadow */
              '0 12px 32px -4px rgba(0, 0, 0, 0.40)',
              /* Ambient chromatic glow aura */
              `0 0 44px -10px ${glowColor}`,
              /* Top crystalline specular rim (Fresnel reflection) */
              'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.42)',
              /* Left edge cyan refractive rim */
              'inset 1.5px 0 1px 0 rgba(34, 211, 238, 0.25)',
              /* Right edge chromatic fringe */
              'inset -1.5px 0 1px 0 rgba(168, 85, 247, 0.15)',
              /* Bottom bevel shadow for physical glass thickness */
              'inset 0 -1.5px 1px 0 rgba(0, 0, 0, 0.45)',
              /* Volumetric internal light dispersion */
              'inset 0 0 50px 0 rgba(255, 255, 255, 0.02)',
            ].join(', '),

            /*
             * Animation — inline style wins over any CSS class conflict.
             * During 'open' phase: remove animation so it stays visible.
             */
            animation: isEntering
              ? ENTER
              : isClosing
              ? EXIT
              : 'none',

            opacity:   isStableOpen ? 1 : undefined,
            transform: isStableOpen ? 'scale(1) translateY(0)' : undefined,
          }}
        >
          {/*
           * Layer 0 — Genuine Refraction Layer (Captured background representation with SVG displacement)
           * Replicates the underlying dashboard region directly behind the glass pane and applies
           * physical optical displacement to bend graph lines, telemetry nodes, and charts.
           * Features a radial mask (gentler in the center, stronger near the perimeter edges).
           */}
          <div
            ref={refractionBackdropRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              borderRadius: 'inherit',
              pointerEvents: 'none',
              zIndex: 0,
              maskImage: 'radial-gradient(ellipse 95% 85% at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.88) 65%, rgba(0,0,0,1) 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.88) 65%, rgba(0,0,0,1) 100%)',
            }}
          />

          {/* Top specular sheen — razor-thin crystalline rim */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '0 0 auto',
              height: '1.5px',
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 15%, ${sheenColor} 38%, rgba(255,255,255,0.80) 50%, ${sheenColor} 62%, rgba(255,255,255,0.15) 85%, transparent 100%)`,
              borderRadius: '1rem 1rem 0 0',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />

          {/* Full-surface Optical Caustic & Prism Refraction Mesh */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: [
                'radial-gradient(ellipse 80% 50% at 15% 10%, rgba(56, 189, 248, 0.16) 0%, rgba(99, 102, 241, 0.06) 45%, transparent 75%)',
                'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, transparent 28%, rgba(34, 211, 238, 0.05) 52%, transparent 75%)',
                'radial-gradient(circle at 85% 85%, rgba(168, 85, 247, 0.09) 0%, transparent 55%)',
              ].join(', '),
              pointerEvents: 'none',
              borderRadius: '1rem',
              zIndex: 1,
            }}
          />

          {/* Static Frosted Glass Micro-Texture */}
          <svg
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0.035,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
              borderRadius: '1rem',
              zIndex: 2,
            }}
          >
            <filter id="liquidGlassNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#liquidGlassNoise)" />
          </svg>

          {/* Left edge highlight — delicate vertical rim reflection */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1px',
              height: '100%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 35%, transparent 80%)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />

          {/* Scrollable content */}
          <div style={{ position: 'relative', zIndex: 10, overflowY: 'auto', maxHeight: '88vh' }}>

            {/* Sticky header */}
            <div
              className="flex items-start justify-between p-6 pb-4"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: '1px solid rgba(255, 255, 255, 0.09)',
                background: 'rgba(14, 24, 42, 0.38)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div className="flex items-center gap-3">
                {icon && (
                  <span className={clsx('p-2 rounded-xl border shrink-0', iconClass)}>
                    {icon}
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2
                      id={dialogId}
                      className="text-base sm:text-lg font-bold text-white tracking-tight"
                    >
                      {title}
                    </h2>
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={isClosing}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/12 transition-colors cursor-pointer shrink-0 ml-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500/80 focus-visible:outline-offset-2"
                aria-label="Close panel (Escape)"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="tile-modal-body p-6 pt-5">
              <style dangerouslySetInnerHTML={{ __html: `
                .tile-modal-body .bg-slate-900\\/60 {
                  background-color: rgba(255, 255, 255, 0.05) !important;
                  border-color: rgba(255, 255, 255, 0.09) !important;
                  backdrop-filter: blur(12px) !important;
                  -webkit-backdrop-filter: blur(12px) !important;
                }
                .tile-modal-body .bg-slate-900\\/40 {
                  background-color: rgba(255, 255, 255, 0.03) !important;
                  border-color: rgba(255, 255, 255, 0.07) !important;
                }
              `}} />
              {expandedContent ?? children}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* ─── useTileExpand ─────────────────────────────────────────────────────── */

export function useTileExpand() {
  const [isOpen, setIsOpen] = useState(false);
  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}
