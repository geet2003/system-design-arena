import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DiagramNode, DiagramEdge } from '@sds/shared-types';

interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  isDirty: boolean;
  isSaving: boolean;
  hydrated: boolean;
  setNodes: (nodes: DiagramNode[]) => void;
  setEdges: (edges: DiagramEdge[]) => void;
  addNode: (node: DiagramNode) => void;
  markSaved: () => void;
  markSaving: () => void;
}

export const useDiagramStore = create<DiagramState>()(
  subscribeWithSelector((set) => ({
    nodes: [],
    edges: [],
    isDirty: false,
    isSaving: false,
    hydrated: false,
    setNodes: (nodes) => set({ nodes, isDirty: true }),
    setEdges: (edges) => set({ edges, isDirty: true }),
    addNode: (node) => set((s) => ({ nodes: [...s.nodes, node], isDirty: true })),
    markSaved: () => set({ isDirty: false, isSaving: false }),
    markSaving: () => set({ isSaving: true }),
  })),
);
