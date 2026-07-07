import { NodeType } from '@sds/shared-types';
import type { EvaluationWarning, EvaluationStrength } from '@sds/shared-types';
import { ArchitectureGraph } from '../graph';

export interface EvaluationTemplate {
  requiredConcepts: string[];
  antiPatterns: string[];
  hints: Record<string, string>;
  /**
   * Directed connection pairs expected for this specific prompt.
   * Each pair [A, B] means A should be able to reach B.
   */
  expectedConnections: [string, string][];
  /**
   * Per-component role descriptions for this specific prompt.
   */
  componentRoles: Record<string, string>;
}

// ---------- Presence-based antiPattern detectors ----------

type Detector = (graph: ArchitectureGraph) => boolean;

export const ANTI_PATTERN_DETECTORS: Record<string, Detector> = {
  no_cache: (g) => !g.hasNodeType(NodeType.CACHE),
  no_load_balancer: (g) => !g.hasNodeType(NodeType.LOAD_BALANCER),
  no_cdn: (g) => !g.hasNodeType(NodeType.CDN),
  no_object_storage: (g) => !g.hasNodeType(NodeType.OBJECT_STORAGE),
  no_async_processing: (g) => !g.hasNodeType(NodeType.QUEUE),
  no_api_gateway: (g) => !g.hasNodeType(NodeType.API_GATEWAY),
  single_service: (g) => g.countNodeType(NodeType.SERVICE) < 2,
  no_shared_rate_limit_store: (g) => {
    const services = g.getNodesByType(NodeType.SERVICE);
    if (services.length < 2) return false;
    if (!g.hasNodeType(NodeType.CACHE)) return true;
    return !g.canReach(NodeType.SERVICE, NodeType.CACHE);
  },
  single_database: (g) => g.countNodeType(NodeType.DATABASE) < 2,
  direct_db_access_from_client: (g) => g.anyDirectEdge(NodeType.CLIENT, NodeType.DATABASE),
  no_gateway_cache_link: (g) => {
    if (!g.hasNodeType(NodeType.API_GATEWAY)) return false;
    if (!g.hasNodeType(NodeType.CACHE)) return false;
    return !g.canReachUndirected(NodeType.API_GATEWAY, NodeType.CACHE);
  },
  rate_limit_cache_has_outgoing: (g) => {
    const gateways = g.getNodesByType(NodeType.API_GATEWAY);
    for (const gw of gateways) {
      for (const neighborId of g.adjacency.get(gw.id) ?? []) {
        const neighbor = g.nodes.get(neighborId);
        if (neighbor?.type === NodeType.CACHE) {
          if ((g.adjacency.get(neighborId)?.size ?? 0) > 0) return true;
        }
      }
    }
    return false;
  },
};

const HIGH_SEVERITY_ANTI_PATTERNS = new Set([
  'no_cdn',
  'no_object_storage',
  'direct_db_access_from_client',
]);

function antiPatternSeverity(code: string, expectedPatterns: string[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (HIGH_SEVERITY_ANTI_PATTERNS.has(code)) return 'HIGH';
  const nodeTypeEquiv: Record<string, string> = {
    no_cache: NodeType.CACHE,
    no_load_balancer: NodeType.LOAD_BALANCER,
    no_async_processing: NodeType.QUEUE,
    no_api_gateway: NodeType.API_GATEWAY,
    no_cdn: NodeType.CDN,
    no_object_storage: NodeType.OBJECT_STORAGE,
  };
  if (nodeTypeEquiv[code] && expectedPatterns.includes(nodeTypeEquiv[code])) return 'HIGH';
  return 'MEDIUM';
}

export function runAntiPatternRules(
  graph: ArchitectureGraph,
  template: EvaluationTemplate,
  expectedPatterns: string[],
): EvaluationWarning[] {
  const warnings: EvaluationWarning[] = [];

  for (const code of template.antiPatterns) {
    const detector = ANTI_PATTERN_DETECTORS[code];
    if (!detector) continue;

    if (detector(graph)) {
      const message =
        template.hints[code] ??
        `Anti-pattern detected: ${code.replace(/_/g, ' ')}.`;

      warnings.push({
        code: code.toUpperCase(),
        message,
        severity: antiPatternSeverity(code, expectedPatterns),
      });
    }
  }

  return warnings;
}

// ---------- Universal topology rules ----------

const NODE_TYPE_LABELS: Partial<Record<NodeType, string>> = {
  [NodeType.CLIENT]: 'Client',
  [NodeType.CACHE]: 'Cache',
  [NodeType.LOAD_BALANCER]: 'Load balancer',
  [NodeType.CDN]: 'CDN',
  [NodeType.QUEUE]: 'Async queue',
  [NodeType.API_GATEWAY]: 'API Gateway',
  [NodeType.OBJECT_STORAGE]: 'Object storage',
  [NodeType.DATABASE]: 'Database',
  [NodeType.SERVICE]: 'Service',
  [NodeType.AUTH_SERVICE]: 'Auth service',
  [NodeType.SEARCH_SERVICE]: 'Search service',
};

function label(type: string): string {
  return NODE_TYPE_LABELS[type as NodeType] ?? type.replace(/_/g, ' ');
}

export function runTopologyRules(
  graph: ArchitectureGraph,
  template: EvaluationTemplate,
): EvaluationWarning[] {
  const warnings: EvaluationWarning[] = [];

  // Short-circuit: empty / trivial diagram
  if (graph.nodeCount < 2) {
    warnings.push({
      code: 'EMPTY_DIAGRAM',
      message: 'Your diagram has fewer than 2 nodes. Add components to represent your design.',
      severity: 'HIGH',
    });
    return warnings;
  }

  // ---- Client directly wired to database (always wrong) ----
  if (graph.anyDirectEdge(NodeType.CLIENT, NodeType.DATABASE)) {
    warnings.push({
      code: 'DIRECT_DB_ACCESS_FROM_CLIENT',
      message:
        'The client connects directly to the database. Clients should never have direct DB access — route through a service or API layer.',
      severity: 'HIGH',
    });
  }

  // ---- Directed cycle ----
  if (graph.hasUnexpectedCycle(template.expectedConnections ?? [])) {
    warnings.push({
      code: 'CYCLE_DETECTED',
      message:
        'Your diagram contains a directed cycle. Real request flows are acyclic — remove the back-edge(s) causing the loop.',
      severity: 'HIGH',
    });
  }

  // ---- CLIENT has no outgoing connections ----
  if (graph.hasNodeType(NodeType.CLIENT) && graph.nodeCount >= 2) {
    const clientNodes = graph.getNodesByType(NodeType.CLIENT);
    const clientHasOutgoing = clientNodes.some(
      (n) => (graph.adjacency.get(n.id)?.size ?? 0) > 0,
    );
    if (!clientHasOutgoing) {
      warnings.push({
        code: 'CLIENT_NO_OUTGOING',
        message:
          'The client has no outgoing connections. Traffic must flow from the client outward — your connections appear to be reversed.',
        severity: 'HIGH',
      });
    }
  }

  // ---- Wrong-direction connections (prompt-aware) ----
  // Build a Set of valid directed pairs from the template.
  // Any actual direct edge between two types that is the REVERSE of an expected
  // pair — and has no corresponding forward expected pair — is flagged.
  const expectedPairs = new Set(
    (template.expectedConnections ?? []).map(([a, b]) => `${a}|${b}`),
  );

  // Collect all node-type pairs that have at least one actual direct edge in the diagram
  const actualTypePairs = new Set<string>();
  for (const [srcId, targets] of graph.adjacency) {
    const srcNode = graph.nodes.get(srcId);
    if (!srcNode) continue;
    for (const tgtId of targets) {
      const tgtNode = graph.nodes.get(tgtId);
      if (!tgtNode) continue;
      actualTypePairs.add(`${srcNode.type}|${tgtNode.type}`);
    }
  }

  for (const pair of actualTypePairs) {
    const [fromType, toType] = pair.split('|');
    const reversePair = `${toType}|${fromType}`;

    // If the reverse is expected but the forward is not → wrong direction
    if (expectedPairs.has(reversePair) && !expectedPairs.has(pair)) {
      warnings.push({
        code: `WRONG_DIRECTION_${fromType}_${toType}`,
        message: `${label(fromType)} → ${label(toType)} is backwards — the arrow should point from ${label(toType)} to ${label(fromType)}.`,
        severity: 'MEDIUM',
      });
    }
  }

  // ---- Spurious connections (neither direction is expected for this prompt) ----
  // Only fire when both node types are in the expected component set for this prompt,
  // so we don't spam warnings about extra/bonus components the user added.
  const expectedNodeTypes = new Set(
    (template.expectedConnections ?? []).flatMap(([a, b]) => [a, b]),
  );

  for (const pair of actualTypePairs) {
    const [fromType, toType] = pair.split('|');
    if (fromType === toType) continue; // self-loops handled by cycle detection
    // Skip CLIENT — it originates all flows so spurious CLIENT→X is already
    // caught by wrong-direction or missing-connection warnings
    if (fromType === NodeType.CLIENT || toType === NodeType.CLIENT) continue;

    const forwardExpected = expectedPairs.has(pair);
    const reverseExpected = expectedPairs.has(`${toType}|${fromType}`);
    const bothInScope =
      expectedNodeTypes.has(fromType) && expectedNodeTypes.has(toType);

    if (!forwardExpected && !reverseExpected && bothInScope) {
      warnings.push({
        code: `SPURIOUS_CONNECTION_${fromType}_${toType}`,
        message: `${label(fromType)} → ${label(toType)} is not a valid connection in this design — remove it or rewire the components correctly.`,
        severity: 'MEDIUM',
      });
    }
  }

  // ---- Nodes unreachable from the client chain ----
  // A node that is connected to *something* but has no directed path from CLIENT
  // is not part of the real request flow — it's a floating subgraph.
  if (graph.hasNodeType(NodeType.CLIENT)) {
    const unreachable = graph.getUnreachableFromClient();
    for (const node of unreachable) {
      warnings.push({
        code: `UNREACHABLE_NODE_${node.type}_${node.id}`,
        message: `${node.data.label ?? label(node.type)} is not reachable from the client. Make sure it is wired into the main request flow.`,
        severity: 'MEDIUM',
      });
    }
  }

  // ---- Isolated nodes ----
  const isolated = graph
    .getIsolatedNodes()
    .filter((n) => n.type !== NodeType.CLIENT);

  for (const node of isolated) {
    warnings.push({
      code: `ISOLATED_NODE_${node.id}`,
      message: `${node.data.label ?? label(node.type)} is not connected to anything. Connect it into the architecture or remove it.`,
      severity: 'LOW',
    });
  }

  return warnings;
}

// ---------- Strength detection ----------

export function detectStrengths(
  graph: ArchitectureGraph,
  expectedPatterns: string[],
): EvaluationStrength[] {
  const strengths: EvaluationStrength[] = [];

  for (const pattern of expectedPatterns) {
    const nodeType = pattern as NodeType;
    if (graph.hasNodeType(nodeType)) {
      const lbl = NODE_TYPE_LABELS[nodeType] ?? nodeType;
      strengths.push({
        code: `HAS_${nodeType}`,
        message: `Includes ${lbl}.`,
      });
    }
  }

  return strengths;
}
