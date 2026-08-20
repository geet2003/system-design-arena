export interface DiagramSnapshot {
  nodes: string[];
  edges: string[]; // format: "A -> B"
}

export interface DiagramDiff {
  isFirstSubmit: boolean;
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
}

export function computeDiagramDiff(
  prev: DiagramSnapshot | null,
  current: DiagramSnapshot,
): DiagramDiff {
  if (!prev) {
    return {
      isFirstSubmit: true,
      addedNodes: [],
      removedNodes: [],
      addedEdges: [],
      removedEdges: [],
    };
  }

  const prevNodeSet = new Set(prev.nodes);
  const currNodeSet = new Set(current.nodes);
  const prevEdgeSet = new Set(prev.edges);
  const currEdgeSet = new Set(current.edges);

  return {
    isFirstSubmit: false,
    addedNodes: current.nodes.filter((n) => !prevNodeSet.has(n)),
    removedNodes: prev.nodes.filter((n) => !currNodeSet.has(n)),
    addedEdges: current.edges.filter((e) => !prevEdgeSet.has(e)),
    removedEdges: prev.edges.filter((e) => !currEdgeSet.has(e)),
  };
}

export function serializeDiagram(snapshot: DiagramSnapshot): string {
  const nodeList = snapshot.nodes.join(', ');
  const edgeList = snapshot.edges.map((e) => `- ${e}`).join('\n');
  return `Nodes: ${nodeList}\n\nConnections:\n${edgeList}`;
}

export function serializeDiff(diff: DiagramDiff): string | null {
  if (diff.isFirstSubmit) return null;

  const lines: string[] = [];

  if (diff.addedNodes.length > 0) {
    lines.push(`Added components: ${diff.addedNodes.join(', ')}`);
  }
  if (diff.removedNodes.length > 0) {
    lines.push(`Removed components: ${diff.removedNodes.join(', ')}`);
  }
  if (diff.addedEdges.length > 0) {
    lines.push(`New connections: ${diff.addedEdges.join(', ')}`);
  }
  if (diff.removedEdges.length > 0) {
    lines.push(`Removed connections: ${diff.removedEdges.join(', ')}`);
  }

  return lines.length > 0 ? lines.join('\n') : null;
}

export function diffBadgeSummary(diff: DiagramDiff): string {
  if (diff.isFirstSubmit) return 'Design submitted';

  const parts: string[] = [];
  const nodesDelta = diff.addedNodes.length - diff.removedNodes.length;
  const edgesDelta = diff.addedEdges.length - diff.removedEdges.length;

  if (nodesDelta !== 0) {
    parts.push(`${nodesDelta > 0 ? '+' : ''}${nodesDelta} component${Math.abs(nodesDelta) !== 1 ? 's' : ''}`);
  }
  if (edgesDelta !== 0) {
    parts.push(`${edgesDelta > 0 ? '+' : ''}${edgesDelta} connection${Math.abs(edgesDelta) !== 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? `Design updated (${parts.join(', ')})` : 'Design resubmitted (no changes)';
}
