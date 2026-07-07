'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  ConnectionMode,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeType } from '@sds/shared-types';
import type { DiagramNode, DiagramEdge } from '@sds/shared-types';
import { useDiagramStore } from '@/store/diagramStore';
import { CustomNode } from './CustomNode';

const nodeTypes = { custom: CustomNode };

const EDGE_DEFAULTS = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#b0a090' },
  style: { stroke: '#b0a090', strokeWidth: 1.5 },
};

// Applied on top of EDGE_DEFAULTS when an edge is selected
function edgeStyle(selected: boolean) {
  if (!selected) return EDGE_DEFAULTS;
  return {
    ...EDGE_DEFAULTS,
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#2563eb' },
    style: { stroke: '#2563eb', strokeWidth: 2.5 },
  };
}

function toFlowNode(n: DiagramNode): Node {
  return {
    id: n.id,
    type: 'custom',
    position: n.position,
    data: { label: n.data.label, nodeType: n.type },
  };
}

function toFlowEdge(e: DiagramEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated ?? false,
    ...EDGE_DEFAULTS,
  };
}

function fromFlowNode(n: Node): DiagramNode {
  return {
    id: n.id,
    type: (n.data as { nodeType: NodeType }).nodeType,
    position: n.position,
    data: { label: (n.data as { label: string }).label },
  };
}

function fromFlowEdge(e: Edge): DiagramEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: typeof e.label === 'string' ? e.label : undefined,
    animated: e.animated ?? false,
  };
}

// Reads initial nodes/edges from the Zustand store (hydrated by useCanvas)
export function InterviewCanvas() {
  const storeNodes = useDiagramStore((s) => s.nodes);
  const storeEdges = useDiagramStore((s) => s.edges);
  const storeHydrated = useDiagramStore((s) => s.hydrated);
  const { setNodes: storeSetNodes, setEdges: storeSetEdges } = useDiagramStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  // Whenever the store is (re)hydrated, replace RF state wholesale.
  // This handles both initial load and session switches.
  useEffect(() => {
    if (!storeHydrated) {
      setNodes([]);
      setEdges([]);
      return;
    }
    setNodes(storeNodes.map(toFlowNode));
    setEdges(storeEdges.map(toFlowEdge));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeHydrated]);

  // Sync nodes added externally (e.g. palette click via addNode) into React Flow
  useEffect(() => {
    if (!storeHydrated) return;
    setNodes((rfNodes) => {
      const rfIds = new Set(rfNodes.map((n) => n.id));
      const incoming = storeNodes.filter((n) => !rfIds.has(n.id)).map(toFlowNode);
      if (incoming.length === 0) return rfNodes;
      return [...rfNodes, ...incoming];
    });
  }, [storeNodes, setNodes, storeHydrated]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const next = addEdge({ ...params, animated: false, ...EDGE_DEFAULTS }, eds);
        storeSetEdges(next.map(fromFlowEdge));
        return next;
      });
    },
    [setEdges, storeSetEdges],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        storeSetNodes(next.map(fromFlowNode));
        return next;
      });
    },
    [setNodes, storeSetNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds).map((e) => ({
          ...e,
          ...edgeStyle(e.selected ?? false),
        }));
        storeSetEdges(next.map(fromFlowEdge));
        return next;
      });
    },
    [setEdges, storeSetEdges],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/sds-node-type') as NodeType;
      if (!nodeType || !reactFlowWrapper.current) return;

      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left - 55,
        y: e.clientY - rect.top - 20,
      };

      const newNode: DiagramNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { label: nodeType.replace(/_/g, ' ') },
      };

      setNodes((nds) => {
        const next = [...nds, toFlowNode(newNode)];
        storeSetNodes(next.map(fromFlowNode));
        return next;
      });
    },
    [setNodes, storeSetNodes],
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={EDGE_DEFAULTS}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        selectionOnDrag
        style={{ backgroundColor: 'transparent' }}
      >
        <Background color="#d4c9b0" gap={24} />
        <Controls className="!bg-[#f5f0e8] !border-[#d4c9b0] !text-[#1a1a1a]/60 !shadow-none" />
        <MiniMap
          nodeColor="#c9b99a"
          maskColor="rgba(245,240,232,0.7)"
          style={{ backgroundColor: '#ede8df', border: '1px solid #d4c9b0' }}
        />
      </ReactFlow>
      {/* Direction hint */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-widest pointer-events-none"
        style={{ color: '#1a1a1a40' }}
      >
        arrows show request direction — drag from source to destination
      </div>
    </div>
  );
}
