import { NodeType } from './enums';

export interface XYPosition {
  x: number;
  y: number;
}

export interface DiagramNodeData {
  label: string;
  metadata?: Record<string, unknown>;
}

export interface DiagramNode {
  id: string;
  type: NodeType;
  position: XYPosition;
  data: DiagramNodeData;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}
