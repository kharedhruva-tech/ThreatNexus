'use client';

import React, { useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  DatabaseZap,
  PlusCircle,
  History,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Calendar,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';
import { sessionService } from '../../lib/services/sessionService';
import { Session } from '../../lib/types/session';

export default function SessionsPage() {
  const {
    sessions,
    activeSession,
    setActiveSession,
    refreshSessions,
    isSessionsLoading,
    sessionsError,
    isDemoMode,
    launchE102CrossSessionDemo,
  } = useApp();

  const [selectedSession, setSelectedSession] = useState<Session>(activeSession || sessions[0]);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionTarget, setNewSessionTarget] = useState('E-102');
  const [isCreating, setIsCreating] = useState(false);

  // Keep selected session synced if list updates
  React.useEffect(() => {
    if (sessions.length > 0 && !sessions.some((s) => s.id === selectedSession?.id)) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  const handleCreateSession = async () => {
    if (!newSessionName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const created = await sessionService.createSession(
        newSessionName.trim(),
        'Autonomous investigation session',
        newSessionTarget.trim()
      );
      await refreshSessions();
      setSelectedSession(created);
      setActiveSession(created);
      setIsNewSessionModalOpen(false);
      setNewSessionName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <PageShell
      title="Memory & Sessions"
      description="Inspect cross-session persistent context, memory triples, and session history. ThreatNexus preserves threat knowledge across investigative boundaries."
      badge={
        isDemoMode ? (
          <Badge variant="cyan" size="md" dot>
            {sessions.length} Demo Sessions
          </Badge>
        ) : (
          <Badge variant="emerald" size="md" dot>
            Live FalkorDB Memory
          </Badge>
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refreshSessions()}
            loading={isSessionsLoading}
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setIsNewSessionModalOpen(true)}
            variant="primary"
            size="sm"
            icon={<PlusCircle size={15} />}
          >
            Start New Session
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {sessionsError && (
          <GlassCard variant="default" className="p-4 border-rose-500/30 bg-rose-950/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-medium">
              <AlertTriangle size={16} />
              <span>Failed to load sessions: {sessionsError}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => refreshSessions()}>
              Retry
            </Button>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Session List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center justify-between">
              <span>Historical Sessions</span>
              <span className="text-[11px] font-mono text-slate-400">Memory Bank Active</span>
            </h3>

            {isSessionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl liquid-glass animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id;

                  return (
                    <GlassCard
                      key={session.id}
                      variant={isSelected ? 'active' : 'interactive'}
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveSession(session);
                      }}
                      className="p-4 space-y-2 select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          {session.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {session.status === 'ACTIVE' && (
                            <Badge variant="emerald" size="sm" dot>
                              ACTIVE
                            </Badge>
                          )}
                          {session.status === 'DEMO_PRESERVED' && (
                            <Badge variant="cyan" size="sm">
                              PRESERVED
                            </Badge>
                          )}
                          {session.status === 'ARCHIVED' && (
                            <Badge variant="slate" size="sm">
                              ARCHIVED
                            </Badge>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate">{session.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                        <span>Target: {session.primaryTarget}</span>
                        <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 2 Columns: Selected Session Detail & Memory Bank */}
          <div className="lg:col-span-2 space-y-5">
            {selectedSession ? (
              <>
                {/* Session Header Card */}
                <GlassCard variant="default" className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {selectedSession.id}
                        </span>
                        <Badge variant="cyan" size="sm">
                          {selectedSession.status}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{selectedSession.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Investigator: <span className="text-slate-200">{selectedSession.investigator}</span> • Target: <span className="font-mono text-cyan-300">{selectedSession.primaryTarget}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedSession.id === 'S-2026-01' && (
                        <Button
                          onClick={launchE102CrossSessionDemo}
                          variant="glow"
                          size="sm"
                          icon={<Sparkles size={14} />}
                        >
                          Trigger S-2026-02 Memory Recall
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                    {selectedSession.description}
                  </p>
                </GlassCard>

                {/* Stored Memory Triples Bank */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DatabaseZap size={14} className="text-teal-400" />
                      <span>ThreatNexus Memory Bank: Stored Triples ({selectedSession.context?.storedMemoryRecords?.length || 0})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Deterministic Graph Embeddings
                    </span>
                  </div>

                  {selectedSession.context?.storedMemoryRecords && selectedSession.context.storedMemoryRecords.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedSession.context.storedMemoryRecords.map((record) => (
                        <GlassCard
                          key={record.id}
                          variant="default"
                          className="p-4 space-y-2 border-white/10 hover:border-cyan-500/30 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-teal-300">
                              {record.id}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              Relevance: {Math.round(record.relevanceScore * 100)}%
                            </span>
                          </div>

                          {/* Subject - Predicate - Object Visual Triple */}
                          <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-white/5">
                            <span className="text-cyan-400 font-semibold">{record.triple.subject}</span>
                            <span className="text-slate-500 text-center text-[10px]">
                              ━━[{record.triple.predicate}]━━▶
                            </span>
                            <span className="text-teal-300 font-semibold">{record.triple.object}</span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {record.summary}
                          </p>
                        </GlassCard>
                      ))}
                    </div>
                  ) : (
                    <GlassCard variant="default" className="p-8 text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        No memory triples preserved in this session.
                      </p>
                    </GlassCard>
                  )}
                </div>
              </>
            ) : (
              <GlassCard variant="default" className="p-12 text-center text-slate-400 text-xs">
                Select a session from the list to inspect preserved context.
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Start New Session Modal */}
      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        title="Start New Investigation Session"
        subtitle="Initialize an isolated session workspace that can query ContextGraph memory"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Session Title</label>
            <Input
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="e.g. Core Ledger DB Lateral Pivot Investigation"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Primary Investigation Target</label>
            <Input
              value={newSessionTarget}
              onChange={(e) => setNewSessionTarget(e.target.value)}
              placeholder="e.g. E-102"
              className="font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-slate-300 space-y-1">
            <span className="font-semibold text-cyan-300 block">Cross-Session Retrieval Enabled:</span>
            <p>
              The new session will inherit semantic query capabilities across prior sessions (including <code>S-2026-01</code>),
              enabling automatic recall of compromised credentials and pivot bridges.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="secondary" size="sm" onClick={() => setIsNewSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isCreating}
              disabled={!newSessionName.trim() || isCreating}
              onClick={handleCreateSession}
            >
              Initialize Session
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
