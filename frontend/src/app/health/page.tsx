'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Cpu,
  Layers,
  Link2,
  Clock,
  ShieldAlert,
  Radio,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { healthService } from '../../lib/services/healthService';
import { SystemHealth, ComponentStatus } from '../../lib/types/health';
import { apiClient } from '../../lib/api/apiClient';
import { useApp } from '../../lib/context/AppContext';

export default function HealthPage() {
  const { isDemoMode, setIsDemoMode, backendUrl, setBackendUrl } = useApp();
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState(backendUrl);
  const [pingStatus, setPingStatus] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getHealth();
      setHealthData(data);
    } catch (err: any) {
      setHealthData({
        overallStatus: 'DOWN',
        mode: 'LIVE',
        uptimeSeconds: 0,
        totalRequestsHandled: 0,
        lastChecked: new Date().toISOString(),
        backendConfiguredUrl: backendUrl,
        graphStats: { nodeCount: 0, edgeCount: 0, memoryTriples: 0 },
        services: [
          {
            name: 'Frontend Engine (Next.js & React 19)',
            key: 'frontend',
            status: 'OPERATIONAL',
            latencyMs: 8,
            lastChecked: new Date().toISOString(),
            version: '1.0.0',
            endpoint: 'Client-side SPA Runtime',
            isSimulated: false,
            details: 'Frontend is running healthy.',
          },
          {
            name: 'Python Backend Adapter',
            key: 'backend_adapter',
            status: 'DOWN',
            latencyMs: 0,
            lastChecked: new Date().toISOString(),
            version: 'Unreachable',
            endpoint: backendUrl,
            isSimulated: false,
            details: `Failed to connect: ${err.message}`,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [isDemoMode, backendUrl]);

  const handleSaveUrl = () => {
    setBackendUrl(inputUrl.trim());
    setPingStatus({ message: `Updated backend target URL to ${inputUrl.trim()}`, isSuccess: true });
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    setPingStatus(null);
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${inputUrl.trim()}/health`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        setPingStatus({
          message: 'Success: Python backend detected and responding healthy (HTTP 200)!',
          isSuccess: true,
        });
      } else {
        setPingStatus({
          message: `Endpoint reachable, but returned HTTP ${res.status}: ${res.statusText}`,
          isSuccess: false,
        });
      }
    } catch (err: any) {
      setPingStatus({
        message: `Could not reach ${inputUrl.trim()}. Ensure the Python backend server is running and CORS is enabled. The app remains fully functional in Demo Mode.`,
        isSuccess: false,
      });
    } finally {
      setIsPinging(false);
    }
  };

  const getStatusBadge = (status: ComponentStatus) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <Badge variant="emerald" size="sm" dot>
            OPERATIONAL
          </Badge>
        );
      case 'DEMO_SIMULATED':
        return (
          <Badge variant="cyan" size="sm" dot>
            SIMULATED DEMO
          </Badge>
        );
      case 'DEGRADED':
        return (
          <Badge variant="amber" size="sm" dot>
            DEGRADED
          </Badge>
        );
      case 'DOWN':
        return (
          <Badge variant="rose" size="sm" dot>
            DOWN / UNREACHABLE
          </Badge>
        );
      default:
        return (
          <Badge variant="amber" size="sm" dot>
            {status || 'UNKNOWN'}
          </Badge>
        );
    }
  };

  return (
    <PageShell
      title="System Health & Diagnostics"
      description="Monitor frontend runtime status, mock service adapters, and future backend integration readiness. Real services are cleanly isolated and clearly labelled."
      badge={
        isDemoMode ? (
          <Badge variant="cyan" size="md" dot>
            Demo Mode Active
          </Badge>
        ) : (
          <Badge variant="emerald" size="md" dot>
            Live Mode Active
          </Badge>
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsDemoMode(!isDemoMode)}
            variant={isDemoMode ? 'glow' : 'secondary'}
            size="sm"
            icon={isDemoMode ? <Radio size={14} /> : <Server size={14} />}
          >
            {isDemoMode ? 'Mode: DEMO' : 'Mode: LIVE BACKEND'}
          </Button>
          <Button
            onClick={fetchHealth}
            loading={loading}
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Architecture & Backend Teammate Notice */}
        <GlassCard
          variant="default"
          className="p-5 border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/40"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
              <Link2 size={18} />
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Backend Compatibility & Integration Boundary
              </h4>
              <p className="leading-relaxed">
                The Python backend, FalkorDB graph database, and Gemini AI agent services are
                developed independently by my teammate. The frontend uses a clean adapter (
                <code>src/lib/api/apiClient.ts</code>) ready to swap mock services for live REST
                endpoints upon final merge. No live API credentials or direct database connections are
                held in the client.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Live Backend Connection Tester & Switcher */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Server size={16} className="text-teal-400" />
              <span>Python Backend Integration Endpoint Configuration</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Current Mode: <strong className={isDemoMode ? 'text-cyan-300' : 'text-emerald-300'}>{isDemoMode ? 'DEMO (Synthetic)' : 'LIVE (Adapter)'}</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1"
                className="font-mono"
              />
            </div>
            <Button onClick={handleSaveUrl} variant="secondary" size="md">
              Save URL
            </Button>
            <Button onClick={handleTestPing} loading={isPinging} variant="primary" size="md">
              Test Connection Ping
            </Button>
          </div>

          {pingStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-mono border flex items-center justify-between gap-2 ${
                pingStatus.isSuccess
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {pingStatus.isSuccess ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{pingStatus.message}</span>
              </div>
              {pingStatus.isSuccess && isDemoMode && (
                <Button size="sm" variant="primary" onClick={() => setIsDemoMode(false)}>
                  Switch to Live Mode Now
                </Button>
              )}
            </div>
          )}
        </GlassCard>

        {/* Services Status Cards */}
        {healthData?.services && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthData.services.map((service) => (
              <GlassCard
                key={service.key}
                variant="default"
                className="p-5 space-y-3 border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-slate-900 border border-white/5 text-cyan-400">
                      {service.key === 'frontend' && <Cpu size={16} />}
                      {service.key === 'backend_adapter' && <Server size={16} />}
                      {service.key === 'falkordb' && <Database size={16} />}
                      {service.key === 'gemini_ai' && <Activity size={16} />}
                      {service.key === 'graph_cache' && <Layers size={16} />}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{service.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {service.version}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                  {service.details}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Latency</span>
                    <span className="font-mono text-cyan-300">{service.latencyMs}ms</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Endpoint Target</span>
                    <span className="font-mono text-slate-300 truncate block" title={service.endpoint}>
                      {service.endpoint}
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
