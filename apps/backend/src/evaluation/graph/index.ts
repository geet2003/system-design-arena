import { NodeType } from '@sds/shared-types';
import type { DiagramNode, DiagramEdge } from '@sds/shared-types';

export class ArchitectureGraph {
  readonly nodes: Map<string, DiagramNode>;
  readonly adjacency: Map<string, Set<string>>;
  readonly reverseAdj: Map<string, Set<string>>;

  constructor(nodes: DiagramNode[], edges: DiagramEdge[]) {
    this.nodes = new Map(nodes.map((n) => [n.id, n]));
    this.adjacency = new Map(nodes.map((n) => [n.id, new Set<string>()]));
    this.reverseAdj = new Map(nodes.map((n) => [n.id, new Set<string>()]));

    for (const edge of edges) {
      if (this.adjacency.has(edge.source) && this.nodes.has(edge.target)) {
        this.adjacency.get(edge.source)!.add(edge.target);
        this.reverseAdj.get(edge.target)!.add(edge.source);
      }
    }
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  hasNodeType(type: NodeType): boolean {
    for (const node of this.nodes.values()) {
      if (node.type === type) return true;
    }
    return false;
  }

  countNodeType(type: NodeType): number {
    let count = 0;
    for (const node of this.nodes.values()) {
      if (node.type === type) count++;
    }
    return count;
  }

  getNodesByType(type: NodeType): DiagramNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type);
  }

  /** Nodes with zero incoming AND zero outgoing edges */
  getIsolatedNodes(): DiagramNode[] {
    return Array.from(this.nodes.values()).filter(
      (n) =>
        (this.adjacency.get(n.id)?.size ?? 0) === 0 &&
        (this.reverseAdj.get(n.id)?.size ?? 0) === 0,
    );
  }

  /**
   * Nodes that are connected to the graph (not isolated) but have no directed
   * path from any CLIENT node to them. These are "orphaned" nodes that appear
   * wired up but are unreachable from the ingress.
   * CLIENT nodes themselves and truly isolated nodes are excluded.
   */
  getUnreachableFromClient(): DiagramNode[] {
    if (!this.hasNodeType(NodeType.CLIENT)) return [];

    const reachable = new Set<string>();
    for (const client of this.getNodesByType(NodeType.CLIENT)) {
      this._bfsCollect(client.id, reachable);
    }

    return Array.from(this.nodes.values()).filter((n) => {
      if (n.type === NodeType.CLIENT) return false;
      const hasEdge =
        (this.adjacency.get(n.id)?.size ?? 0) > 0 ||
        (this.reverseAdj.get(n.id)?.size ?? 0) > 0;
      return hasEdge && !reachable.has(n.id);
    });
  }

  hasDirectEdge(sourceId: string, targetId: string): boolean {
    return this.adjacency.get(sourceId)?.has(targetId) ?? false;
  }

  /** True if any node of fromType has a direct edge to any node of toType */
  anyDirectEdge(fromType: NodeType, toType: NodeType): boolean {
    for (const s of this.getNodesByType(fromType)) {
      for (const t of this.getNodesByType(toType)) {
        if (this.hasDirectEdge(s.id, t.id)) return true;
      }
    }
    return false;
  }

  /** True if any node of toType has a direct incoming edge from any node of fromType
   *  OR any node of fromType has a direct incoming edge from any node of toType
   *  (i.e. an edge exists between the two types in either direction) */
  anyEdgeBetween(typeA: NodeType, typeB: NodeType): boolean {
    return this.anyDirectEdge(typeA, typeB) || this.anyDirectEdge(typeB, typeA);
  }

  /** BFS: can we reach any node of toType from any node of fromType? (directed) */
  canReach(fromType: NodeType, toType: NodeType): boolean {
    for (const src of this.getNodesByType(fromType)) {
      if (this._bfsReaches(src.id, toType)) return true;
    }
    return false;
  }

  /**
   * Undirected connectivity check: is any node of typeA connected to any node of typeB
   * via any path, ignoring edge direction?
   */
  canReachUndirected(typeA: NodeType, typeB: NodeType): boolean {
    for (const src of this.getNodesByType(typeA)) {
      if (this._bfsUndirected(src.id, typeB)) return true;
    }
    return false;
  }

  /**
   * BFS: does any path from fromType to toType pass through throughType?
   * Used to check e.g. "does the CLIENT→DATABASE path go through CACHE?"
   */
  pathPassesThrough(fromType: NodeType, toType: NodeType, throughType: NodeType): boolean {
    const targets = new Set(this.getNodesByType(toType).map((n) => n.id));
    for (const src of this.getNodesByType(fromType)) {
      if (this._bfsWithThrough(src.id, targets, throughType)) return true;
    }
    return false;
  }

  /**
   * True if typeA appears before typeB in the directed flow
   * (i.e. from any A node we can reach any B node).
   */
  appearsBeforeInFlow(typeA: NodeType, typeB: NodeType): boolean {
    return this.canReach(typeA, typeB);
  }

  /** True if CLIENT has a direct edge to any node of the given type */
  isFirstHopFromClient(type: NodeType): boolean {
    return this.anyDirectEdge(NodeType.CLIENT, type);
  }

  /** True if the directed graph contains at least one cycle (DFS-based) */
  hasCycle(): boolean {
    // 0 = unvisited, 1 = in current path, 2 = fully processed
    const state = new Map<string, 0 | 1 | 2>();
    for (const id of this.nodes.keys()) state.set(id, 0);

    const dfs = (id: string): boolean => {
      state.set(id, 1);
      for (const neighbor of this.adjacency.get(id) ?? []) {
        const s = state.get(neighbor);
        if (s === 1) return true; // back-edge → cycle
        if (s === 0 && dfs(neighbor)) return true;
      }
      state.set(id, 2);
      return false;
    };

    for (const id of this.nodes.keys()) {
      if (state.get(id) === 0 && dfs(id)) return true;
    }
    return false;
  }

  /**
   * Like hasCycle(), but ignores back-edges that are part of an expected
   * bidirectional pair (e.g. SERVICE ↔ QUEUE). A cycle is only flagged if
   * at least one of its back-edges is NOT an expected bidirectional connection.
   */
  hasUnexpectedCycle(expectedConnections: [string, string][]): boolean {
    const bidir = new Set(
      expectedConnections
        .filter(([a, b]) => expectedConnections.some(([x, y]) => x === b && y === a))
        .map(([a, b]) => `${a}|${b}`),
    );

    const state = new Map<string, 0 | 1 | 2>();
    for (const id of this.nodes.keys()) state.set(id, 0);

    const dfs = (id: string): boolean => {
      state.set(id, 1);
      for (const neighbor of this.adjacency.get(id) ?? []) {
        const s = state.get(neighbor);
        if (s === 1) {
          const srcType = this.nodes.get(id)?.type ?? '';
          const tgtType = this.nodes.get(neighbor)?.type ?? '';
          if (!bidir.has(`${srcType}|${tgtType}`)) return true;
        } else if (s === 0 && dfs(neighbor)) return true;
      }
      state.set(id, 2);
      return false;
    };

    for (const id of this.nodes.keys()) {
      if (state.get(id) === 0 && dfs(id)) return true;
    }
    return false;
  }

  /** True if the directed graph contains at least one cycle involving the given node type */
  hasCycleInvolvingType(type: NodeType): boolean {
    const nodesOfType = this.getNodesByType(type);
    if (nodesOfType.length === 0) return false;

    const typeIds = new Set(nodesOfType.map((n) => n.id));

    for (const id of typeIds) {
      const visited = new Set<string>();
      const queue = Array.from(this.adjacency.get(id) ?? []);
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === id) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        for (const neighbor of this.adjacency.get(current) ?? []) {
          queue.push(neighbor);
        }
      }
    }
    return false;
  }

  // ---------- private BFS helpers ----------

  private _bfsReaches(startId: string, targetType: NodeType): boolean {
    const visited = new Set<string>([startId]);
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.nodes.get(current);
      if (node && node.type === targetType && current !== startId) return true;

      for (const neighbor of this.adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return false;
  }

  /** BFS over both adjacency and reverseAdj — ignores edge direction */
  private _bfsUndirected(startId: string, targetType: NodeType): boolean {
    const visited = new Set<string>([startId]);
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.nodes.get(current);
      if (node && node.type === targetType && current !== startId) return true;

      const neighbors = [
        ...(this.adjacency.get(current) ?? []),
        ...(this.reverseAdj.get(current) ?? []),
      ];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return false;
  }

  /**
   * BFS from startId tracking whether we've passed through throughType.
   * Returns true if we reach any targetId after having seen throughType.
   */
  private _bfsWithThrough(
    startId: string,
    targetIds: Set<string>,
    throughType: NodeType,
  ): boolean {
    // [nodeId, hasThroughBeenSeen]
    const visited = new Map<string, boolean>([[startId, false]]);
    const queue: [string, boolean][] = [[startId, false]];

    while (queue.length > 0) {
      const [current, throughSeen] = queue.shift()!;
      const currentNode = this.nodes.get(current);
      const nowThrough =
        throughSeen || (currentNode?.type === throughType && current !== startId);

      if (targetIds.has(current) && current !== startId && nowThrough) return true;

      for (const neighbor of this.adjacency.get(current) ?? []) {
        const bestSeen = visited.get(neighbor);
        if (bestSeen === undefined || (!bestSeen && nowThrough)) {
          visited.set(neighbor, nowThrough);
          queue.push([neighbor, nowThrough]);
        }
      }
    }
    return false;
  }

  /** BFS collect — adds all reachable node IDs from startId into the provided Set */
  private _bfsCollect(startId: string, reachable: Set<string>): void {
    const queue = [startId];
    reachable.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of this.adjacency.get(current) ?? []) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }
}
