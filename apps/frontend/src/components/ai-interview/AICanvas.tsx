'use client';

import { useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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
import { FreeNode } from './FreeNode';

const nodeTypes = { free: FreeNode };

const EDGE_DEFAULTS = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#b0a090' },
  style: { stroke: '#b0a090', strokeWidth: 1.5 },
};

function edgeStyle(selected: boolean) {
  if (!selected) return EDGE_DEFAULTS;
  return {
    ...EDGE_DEFAULTS,
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#2563eb' },
    style: { stroke: '#2563eb', strokeWidth: 2.5 },
  };
}

export interface AICanvasHandle {
  getSnapshot: () => { nodes: { id: string; label: string }[]; edges: { source: string; target: string }[] };
}

// eslint-disable-next-line react/display-name
export const AICanvas = forwardRef<AICanvasHandle>((_props, ref) => {
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  // Expose snapshot for diagram submit
  useImperativeHandle(ref, () => ({
    getSnapshot() {
      return {
        nodes: nodes.map((n) => ({ id: n.id, label: (n.data as { label: string }).label })),
        edges: edges.map((e) => ({ source: e.source, target: e.target })),
      };
    },
  }));

  const onConnect: OnConnect = useCallback(
    (params) =>
      setEdges((eds) => addEdge({ ...params, animated: false, ...EDGE_DEFAULTS }, eds)),
    [setEdges],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      setEdges((eds) =>
        applyEdgeChanges(changes, eds).map((e) => ({
          ...e,
          ...edgeStyle(e.selected ?? false),
        })),
      ),
    [setEdges],
  );

  function addNode() {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'free',
      position: { x: 200 + Math.random() * 100, y: 150 + Math.random() * 80 },
      data: { label: 'New Component', isNew: true },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  return (
    <div className="relative w-full h-full">
      {/* Add Node button */}
      <button
        onClick={addNode}
        className="absolute top-3 left-3 z-10 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest text-[#1a1a1a] bg-[#faf7f2] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        style={{ border: '1.5px solid #1a1a1a', borderRadius: '2px' }}
      >
        ＋ ADD NODE
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={EDGE_DEFAULTS}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        style={{ backgroundColor: 'transparent' }}
      >
        <Background color="#d4c9b0" gap={24} />
        <Controls className="!bg-[#f5f0e8] !border-[#d4c9b0] !shadow-none" />
      </ReactFlow>

      {/* Direction hint */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-widest pointer-events-none"
        style={{ color: '#1a1a1a40' }}
      >
        double-click node to rename · drag handle to connect
      </div>
    </div>
  );
});
