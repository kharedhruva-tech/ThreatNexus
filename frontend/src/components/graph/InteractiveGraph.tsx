'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNode';
import { GraphEntity, GraphRelationship } from '../../lib/types/graph';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Eye,
  Tag,
  Crosshair,
  Layers,
  Sparkles,
} from 'lucide-react';

interface InteractiveGraphProps {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  selectedEntityId?: string;
  highlightPath?: string[]; // array of entity IDs along critical path
  onSelectEntity?: (entity: GraphEntity) => void;
  onSelectRelationship?: (rel: GraphRelationship) => void;
  height?: string;
  showMiniMap?: boolean;
}

const nodeTypes = {
  customNode: CustomNode as any,
};

// Curated 2D layout coordinates for cyber graph nodes
const DEFAULT_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'E-107': { x: 40, y: 160 },    // CVE Exploit
  'E-101': { x: 300, y: 160 },   // Host-Finance-01 (Jumpbox)
  'E-106': { x: 300, y: 340 },   // PowerShell stager
  'E-103': { x: 560, y: 340 },   // svchost_updater.dll
  'E-110': { x: 560, y: 160 },   // backup_agent.exe
  'E-104': { x: 820, y: 340 },   // C2 Node IP
  'E-109': { x: 300, y: -20 },   // lsass.exe
  'E-105': { x: 560, y: -20 },   // svc_backup (Kerberoast)
  'E-108': { x: 820, y: -20 },   // auth.corp-internal.net
  'E-102': { x: 820, y: 160 },   // SQL-PROD-09 (Target DB)
};

// Dynamic layout algorithm for arbitrary nodes returned by live backend
function calculateDynamicPosition(
  entity: GraphEntity,
  index: number,
  total: number
): { x: number; y: number } {
  if (DEFAULT_NODE_POSITIONS[entity.id]) {
    return DEFAULT_NODE_POSITIONS[entity.id];
  }

  // Hierarchical columns based on entity type
  const columnMap: Record<string, number> = {
    Vulnerability: 40,
    Host: 300,
    Process: 300,
    File_Artifact: 560,
    User_Account: 560,
    IP_Address: 820,
    Domain: 820,
    Database: 820,
  };

  const x = columnMap[entity.type] ?? 100 + (index % 4) * 240;
  const y = 80 + Math.floor(index / 3) * 140;
  return { x, y };
}

// Inner graph canvas component using useReactFlow hooks
function InteractiveGraphCanvas({
  entities,
  relationships,
  selectedEntityId,
  highlightPath = [],
  onSelectEntity,
  onSelectRelationship,
  height = '620px',
  showMiniMap = true,
}: InteractiveGraphProps) {
  const { fitView, setCenter, zoomIn, zoomOut } = useReactFlow();
  const [highlightOnlyPath, setHighlightOnlyPath] = useState(false);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);

  // Convert GraphEntity[] to ReactFlow Node[]
  const initialNodes: Node[] = useMemo(() => {
    return entities.map((entity, idx) => {
      const pos = calculateDynamicPosition(entity, idx, entities.length);
      const isSelected = selectedEntityId === entity.id;
      const isHighlighted = highlightPath.includes(entity.id);
      const isDimmed = highlightOnlyPath && !isHighlighted;
      const isCrossSession = entity.metadata?.sourceSessionId === 'S-2026-01' && entity.id === 'E-105';

      return {
        id: entity.id,
        type: 'customNode',
        position: pos,
        data: {
          ...entity,
          isSelected,
          isHighlighted,
          isDimmed,
          isCrossSession,
        },
      };
    });
  }, [entities, selectedEntityId, highlightPath, highlightOnlyPath]);

  // Convert GraphRelationship[] to ReactFlow Edge[] with intelligent handle targeting
  const initialEdges: Edge[] = useMemo(() => {
    return relationships.map((rel) => {
      const isPathEdge =
        highlightPath.length > 1 &&
        highlightPath.some((nodeId, idx) => {
          if (idx === highlightPath.length - 1) return false;
          const nextNodeId = highlightPath[idx + 1];
          return (
            (rel.sourceId === nodeId && rel.targetId === nextNodeId) ||
            (rel.sourceId === nextNodeId && rel.targetId === nodeId)
          );
        });

      const isLateralBridge = rel.id === 'R-209' || rel.type === 'LATERAL_MOVEMENT_TO';

      // Determine orientation between source and target coordinates
      const sPos = calculateDynamicPosition(
        entities.find((e) => e.id === rel.sourceId) || ({} as any),
        0,
        1
      );
      const tPos = calculateDynamicPosition(
        entities.find((e) => e.id === rel.targetId) || ({} as any),
        0,
        1
      );

      let sourceHandle = 'right';
      let targetHandle = 'left';
      if (Math.abs(sPos.x - tPos.x) < 80) {
        if (sPos.y < tPos.y) {
          sourceHandle = 'bottom';
          targetHandle = 'top';
        } else {
          sourceHandle = 'top';
          targetHandle = 'bottom';
        }
      } else if (sPos.x > tPos.x) {
        sourceHandle = 'left';
        targetHandle = 'right';
      }

      return {
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        sourceHandle,
        targetHandle,
        label: showEdgeLabels ? rel.label : undefined,
        animated: isPathEdge || isLateralBridge,
        style: {
          stroke: isLateralBridge
            ? '#f59e0b'
            : isPathEdge
            ? '#22d3ee'
            : 'rgba(148, 163, 184, 0.45)',
          strokeWidth: isLateralBridge ? 3.5 : isPathEdge ? 2.8 : 1.6,
          filter: isLateralBridge
            ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))'
            : isPathEdge
            ? 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.7))'
            : undefined,
        },
        labelStyle: {
          fill: isLateralBridge ? '#fbbf24' : isPathEdge ? '#67e8f9' : '#cbd5e1',
          fontSize: 9.5,
          fontWeight: 600,
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
        },
        labelBgStyle: {
          fill: '#090d16',
          fillOpacity: 0.95,
          stroke: isLateralBridge ? '#f59e0b' : isPathEdge ? '#06b6d4' : 'rgba(255,255,255,0.12)',
          strokeWidth: 1,
          rx: 5,
          ry: 5,
        },
        labelBgPadding: [6, 4] as [number, number],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isLateralBridge ? '#f59e0b' : isPathEdge ? '#22d3ee' : 'rgba(148, 163, 184, 0.6)',
        },
      };
    });
  }, [relationships, entities, highlightPath, showEdgeLabels]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize when inputs change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Center on selected node when selectedEntityId changes
  useEffect(() => {
    if (selectedEntityId) {
      const match = nodes.find((n) => n.id === selectedEntityId);
      if (match) {
        setCenter(match.position.x + 90, match.position.y + 40, { duration: 500, zoom: 1.05 });
      }
    }
  }, [selectedEntityId, nodes, setCenter]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const entity = entities.find((e) => e.id === node.id);
      if (entity && onSelectEntity) {
        onSelectEntity(entity);
      }
    },
    [entities, onSelectEntity]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const rel = relationships.find((r) => r.id === edge.id);
      if (rel && onSelectRelationship) {
        onSelectRelationship(rel);
      }
    },
    [relationships, onSelectRelationship]
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  return (
    <div
      className="w-full relative rounded-2xl overflow-hidden liquid-glass border border-white/10 group/canvas"
      style={{ height }}
    >
      {/* Top Floating Control Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {highlightPath.length > 0 && (
          <button
            onClick={() => setHighlightOnlyPath(!highlightOnlyPath)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all cursor-pointer select-none ${
              highlightOnlyPath
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_15px_-2px_rgba(6,182,212,0.5)]'
                : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800'
            }`}
          >
            <Eye size={13} />
            <span>{highlightOnlyPath ? 'Critical Path Isolated' : 'Highlight Path'}</span>
          </button>
        )}

        <button
          onClick={() => setShowEdgeLabels(!showEdgeLabels)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all cursor-pointer select-none ${
            showEdgeLabels
              ? 'bg-slate-900/80 text-cyan-300 border-cyan-500/30'
              : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title="Toggle relationship label visibility"
        >
          <Tag size={13} />
          <span>Labels {showEdgeLabels ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={handleFitView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 text-slate-300 border border-white/10 hover:bg-slate-800 backdrop-blur-md transition-all cursor-pointer select-none"
          title="Fit graph to view"
        >
          <Maximize2 size={13} />
          <span>Fit View</span>
        </button>

        <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-white/10 text-[11px] font-mono text-slate-400 backdrop-blur-md">
          {entities.length} Nodes • {relationships.length} Edges
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={2.2}
        className="bg-[#070b14]"
      >
        <Background color="#06b6d4" gap={28} size={1} style={{ opacity: 0.12 }} />
        <Controls
          className="!bg-slate-900/85 !border !border-white/15 !rounded-xl !overflow-hidden !shadow-2xl [&>button]:!bg-transparent [&>button]:!border-b [&>button]:!border-white/10 [&>button]:!text-slate-300 hover:[&>button]:!bg-white/10"
          showInteractive={false}
        />
        {showMiniMap && (
          <MiniMap
            className="!bg-slate-950/90 !border !border-white/15 !rounded-xl !overflow-hidden !shadow-xl"
            nodeColor={(node) => {
              const d = node.data as any;
              return d?.riskLevel === 'CRITICAL' ? '#f43f5e' : '#06b6d4';
            }}
            maskColor="rgba(7, 11, 20, 0.75)"
          />
        )}
      </ReactFlow>
    </div>
  );
}

// Wrapper with ReactFlowProvider so useReactFlow hooks work seamlessly
export function InteractiveGraph(props: InteractiveGraphProps) {
  return (
    <ReactFlowProvider>
      <InteractiveGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}
