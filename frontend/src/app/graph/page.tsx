'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '../../components/layout/PageShell';
import { InteractiveGraph } from '../../components/graph/InteractiveGraph';
import { NodeInspector } from '../../components/graph/NodeInspector';
import { EdgeInspector } from '../../components/graph/EdgeInspector';
import { GraphLegend } from '../../components/graph/GraphLegend';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  Eye,
  AlertTriangle,
  Database,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { useApp } from '../../lib/context/AppContext';
import { GraphEntity, GraphRelationship, EntityType, RiskLevel } from '../../lib/types/graph';

function GraphExplorerContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialEntityParam = searchParams.get('entity') || 'E-101';

  const {
    graphData,
    isGraphLoading,
    graphError,
    refreshGraph,
    isDemoMode,
    setIsDemoMode,
    selectedEntityId,
    setSelectedEntityId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<RiskLevel[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<GraphEntity | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<GraphRelationship | null>(null);
  const [isPathHighlighted, setIsPathHighlighted] = useState(true);

  const entities = graphData?.nodes || [];
  const relationships = graphData?.edges || [];

  // Sync selected entity from params or context
  useEffect(() => {
    if (entities.length > 0) {
      const targetId = initialEntityParam || selectedEntityId;
      const match = entities.find((e) => e.id.toLowerCase() === targetId.toLowerCase()) || entities[0];
      setSelectedEntity(match);
    }
  }, [entities, initialEntityParam, selectedEntityId]);

  // Filter entities based on search and filters
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          entity.id.toLowerCase().includes(q) ||
          entity.name.toLowerCase().includes(q) ||
          entity.label.toLowerCase().includes(q) ||
          entity.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesText) return false;
      }
      if (selectedTypes.length > 0 && !selectedTypes.includes(entity.type)) {
        return false;
      }
      if (selectedRiskLevels.length > 0 && !selectedRiskLevels.includes(entity.riskLevel)) {
        return false;
      }
      return true;
    });
  }, [entities, searchQuery, selectedTypes, selectedRiskLevels]);

  const toggleTypeFilter = (type: EntityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleRiskFilter = (risk: RiskLevel) => {
    setSelectedRiskLevels((prev) =>
      prev.includes(risk) ? prev.filter((r) => r !== risk) : [...prev, risk]
    );
  };

  const allTypes: EntityType[] = [
    'Host',
    'Database',
    'Process',
    'IP_Address',
    'User_Account',
    'File_Artifact',
    'Vulnerability',
    'Domain',
  ];

  return (
    <PageShell
      title="Graph Explorer"
      description="Interactive multi-hop cyber threat topology. Inspect entity attributes, trace traversal paths, and evaluate graph-grounded evidence citations."
      badge={
        isDemoMode ? (
          <Badge variant="cyan" size="md" dot>
            DEMO DATA • Synthetic Topology
          </Badge>
        ) : (
          <Badge variant="emerald" size="md" dot>
            LIVE FALKORDB DATA
          </Badge>
        )
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refreshGraph()}
            loading={isGraphLoading}
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setIsPathHighlighted(!isPathHighlighted)}
            variant={isPathHighlighted ? 'glow' : 'secondary'}
            size="sm"
            icon={<Eye size={14} />}
          >
            {isPathHighlighted ? 'Critical Path Active' : 'Highlight Path'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error State Banner with Retry and Mode Switcher */}
        {graphError && (
          <GlassCard variant="default" className="p-4 border-rose-500/40 bg-rose-950/20 text-xs space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertTriangle size={16} />
                <span>Backend Graph Retrieval Error</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => refreshGraph()}>
                  Retry
                </Button>
                <Button size="sm" variant="primary" onClick={() => setIsDemoMode(true)}>
                  Switch to Demo Mode
                </Button>
              </div>
            </div>
            <p className="text-rose-200/90 font-mono">{graphError}</p>
          </GlassCard>
        )}

        {/* Filter and Search Bar */}
        <GlassCard variant="default" className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="w-full md:w-80">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter entities by ID, label, tag..."
                icon={<Search size={15} />}
              />
            </div>

            {/* Quick Type Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
                <Filter size={12} /> Types:
              </span>
              {allTypes.slice(0, 6).map((type) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_10px_-2px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
              {(selectedTypes.length > 0 || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedTypes([]);
                    setSearchQuery('');
                  }}
                  className="text-[10px] text-cyan-400 hover:underline ml-1 cursor-pointer font-medium"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Main Canvas + Slide-Over Inspectors Layout */}
        <div className="flex relative gap-4 items-start">
          {/* Interactive Graph Canvas Area */}
          <div className="flex-1 min-w-0 relative">
            {isGraphLoading ? (
              <div className="w-full h-[620px] rounded-2xl liquid-glass border border-white/10 flex items-center justify-center text-cyan-400">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-mono">Loading Graph Topology from Backend Adapter...</span>
                </div>
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="w-full h-[620px] rounded-2xl liquid-glass border border-white/10 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <Database size={32} className="text-slate-500" />
                <h4 className="text-base font-bold text-white">No Entities Match Your Filter</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Try adjusting the search query or clearing the selected type filters to reveal graph entities.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedTypes([]);
                    setSearchQuery('');
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                <InteractiveGraph
                  entities={filteredEntities}
                  relationships={relationships}
                  selectedEntityId={selectedEntity?.id}
                  highlightPath={isPathHighlighted ? ['E-104', 'E-103', 'E-101', 'E-105', 'E-102'] : []}
                  onSelectEntity={(entity) => {
                    setSelectedEntity(entity);
                    setSelectedEntityId(entity.id);
                    setSelectedRelationship(null);
                  }}
                  onSelectRelationship={(rel) => {
                    setSelectedRelationship(rel);
                    setSelectedEntity(null);
                  }}
                  height="640px"
                  showMiniMap={true}
                />

                {/* Floating Legend */}
                <div className="absolute bottom-4 left-4 z-10 max-w-sm hidden sm:block">
                  <GraphLegend />
                </div>
              </>
            )}
          </div>

          {/* Slide-over Node Inspector */}
          {selectedEntity && (
            <NodeInspector
              entity={selectedEntity}
              relationships={relationships}
              onClose={() => setSelectedEntity(null)}
              onSelectNeighbor={(neighborId) => {
                const neighbor = entities.find((e) => e.id === neighborId);
                if (neighbor) {
                  setSelectedEntity(neighbor);
                  setSelectedEntityId(neighbor.id);
                }
              }}
            />
          )}

          {/* Slide-over Edge Inspector */}
          {selectedRelationship && (
            <EdgeInspector
              relationship={selectedRelationship}
              onClose={() => setSelectedRelationship(null)}
              onSelectNode={(nodeId) => {
                const node = entities.find((e) => e.id === nodeId);
                if (node) {
                  setSelectedEntity(node);
                  setSelectedEntityId(node.id);
                  setSelectedRelationship(null);
                }
              }}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default function GraphExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh] text-cyan-400">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-mono">Loading Graph Topology...</span>
          </div>
        </div>
      }
    >
      <GraphExplorerContent />
    </Suspense>
  );
}
