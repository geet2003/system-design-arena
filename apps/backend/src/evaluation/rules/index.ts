import { NodeType } from '@sds/shared-types';
import type { EvaluationWarning, EvaluationStrength, ReferenceEdge, IllegalEdge, EvaluationTemplate } from '@sds/shared-types';
import { ArchitectureGraph } from '../graph';

export type { EvaluationTemplate };

// Human-readable labels for NodeType values used in warning messages
const NODE_LABELS: Record<string, string> = {
  CLIENT:                 'Client',
  API_GATEWAY:            'API Gateway',
  LOAD_BALANCER:          'Load Balancer',
  SERVICE:                'Service',
  CACHE:                  'Cache',
  DATABASE:               'Database',
  QUEUE:                  'Message Queue',
  CDN:                    'CDN',
  OBJECT_STORAGE:         'Object Storage',
  AUTH_SERVICE:           'Auth Service',
  SEARCH_SERVICE:         'Search Service',
  RELATIONAL_DB:          'Relational Database',
  NON_RELATIONAL_DB:      'Non-Relational Database',
  REDIS_CACHE:            'Redis Cache',
  URL_WRITE_SERVICE:      'URL Write Service',
  URL_READ_SERVICE:       'URL Read Service',
  ID_GENERATOR:           'ID Generator',
  ANALYTICS_SERVICE:      'Analytics Service',
  RATE_LIMITER_SERVICE:   'Rate Limiter Service',
  APP_SERVICE:            'Application Service',
  POST_SERVICE:           'Post Service',
  FEED_SERVICE:           'Feed Service',
  USER_SERVICE:           'User Service',
  MEDIA_SERVICE:          'Media Service',
  TIMELINE_WORKER:        'Timeline Worker',
  UPLOAD_SERVICE:         'Upload Service',
  STREAMING_SERVICE:      'Streaming Service',
  METADATA_SERVICE:       'Metadata Service',
  RECOMMENDATION_SERVICE: 'Recommendation Service',
  TRANSCODING_SERVICE:    'Transcoding Service',
  THUMBNAIL_SERVICE:      'Thumbnail Service',
  LOCATION_SERVICE:       'Location Service',
  MATCHING_SERVICE:       'Matching Service',
  TRIP_SERVICE:           'Trip Service',
  PAYMENT_SERVICE:        'Payment Service',
  NOTIFICATION_SERVICE:   'Notification Service',
  CHAT_SERVICE:           'Chat Service',
  PRESENCE_SERVICE:       'Presence Service',
};

export function nodeLabel(type: string): string {
  return NODE_LABELS[type] ?? type.replace(/_/g, ' ');
}

// ─── Step 1: Illegal edge check ───────────────────────────────────────────────
// Each illegalEdge present in the diagram emits a HIGH warning and blocks the
// topology bonus.

export function checkIllegalEdges(
  graph: ArchitectureGraph,
  illegalEdges: IllegalEdge[],
): EvaluationWarning[] {
  const warnings: EvaluationWarning[] = [];
  for (const { from, to, reason } of illegalEdges) {
    if (graph.anyDirectEdge(from as NodeType, to as NodeType)) {
      warnings.push({
        code: `ILLEGAL_EDGE_${reason}`,
        message: illegalEdgeMessage(from, to, reason),
        severity: 'HIGH',
      });
    }
  }
  return warnings;
}

function illegalEdgeMessage(from: string, to: string, reason: string): string {
  switch (reason) {
    case 'CLIENT_BYPASS_GATEWAY':
      return `${nodeLabel(from)} connects directly to ${nodeLabel(to)} — clients must route through the Load Balancer and API Gateway first.`;
    case 'DIRECT_DB_ACCESS':
      return `${nodeLabel(from)} has a direct connection to ${nodeLabel(to)} — databases must never be directly exposed to clients.`;
    case 'GATEWAY_DIRECT_DB':
      return `${nodeLabel(from)} connects directly to ${nodeLabel(to)} — the Gateway should route to a service layer, not the database.`;
    case 'SERVICE_DIRECT_CLIENT':
      return `${nodeLabel(from)} connects directly back to ${nodeLabel(to)} — responses should flow through the gateway, not bypass it.`;
    default:
      return `${nodeLabel(from)} → ${nodeLabel(to)} is a forbidden connection in this architecture (${reason}).`;
  }
}

// ─── Step 2: Reference edge scoring ──────────────────────────────────────────
// Each required referenceEdge is checked with anyDirectEdge — strict single hop,
// correct direction. No BFS, no path-finding. You either have the edge or you don't.
//
// Matched   → strength entry
// Missing (both nodes present) → MEDIUM warning
// Missing (node absent)        → MEDIUM warning per absent node (deduplicated)

export interface EdgeScoringResult {
  matched: number;
  total: number;
  warnings: EvaluationWarning[];
  strengths: EvaluationStrength[];
}

export function scoreReferenceEdges(
  graph: ArchitectureGraph,
  referenceEdges: ReferenceEdge[],
  componentRoles: Record<string, string>,
): EdgeScoringResult {
  const required = referenceEdges.filter((e) => e.required);
  let matched = 0;
  const warningMap = new Map<string, EvaluationWarning>();
  const strengths: EvaluationStrength[] = [];

  for (const edge of required) {
    const fromType = edge.from as NodeType;
    const toType = edge.to as NodeType;
    const hasFrom = graph.hasNodeType(fromType);
    const hasTo = graph.hasNodeType(toType);

    if (graph.anyDirectEdge(fromType, toType)) {
      matched++;
      const roleDesc = componentRoles[edge.to] ?? '';
      strengths.push({
        code: `EDGE_${edge.from}_${edge.to}`,
        message: `${nodeLabel(edge.from)} → ${nodeLabel(edge.to)} correctly placed${roleDesc ? ` — ${roleDesc}` : '.'}`,
      });
    } else if (hasFrom && hasTo) {
      // Both nodes exist but direct edge is missing
      const code = `MISSING_EDGE_${edge.from}_${edge.to}`;
      if (!warningMap.has(code)) {
        warningMap.set(code, {
          code,
          message: `${nodeLabel(edge.from)} and ${nodeLabel(edge.to)} are both present but not directly connected — draw an arrow from ${nodeLabel(edge.from)} to ${nodeLabel(edge.to)}.`,
          severity: 'MEDIUM',
        });
      }
    } else {
      // One or both nodes absent — emit per missing type, deduplicated
      if (!hasFrom) {
        const code = `MISSING_NODE_${edge.from}`;
        if (!warningMap.has(code)) {
          warningMap.set(code, {
            code,
            message: `Your design is missing a ${nodeLabel(edge.from)}.`,
            severity: 'MEDIUM',
          });
        }
      }
      if (!hasTo) {
        const code = `MISSING_NODE_${edge.to}`;
        if (!warningMap.has(code)) {
          warningMap.set(code, {
            code,
            message: `Your design is missing a ${nodeLabel(edge.to)}.`,
            severity: 'MEDIUM',
          });
        }
      }
    }
  }

  return {
    matched,
    total: required.length,
    warnings: Array.from(warningMap.values()),
    strengths,
  };
}

// ─── Step 3: Distractor check ─────────────────────────────────────────────────
// Nodes whose type is in distractorNodeTypes don't belong in this design.
// LOW severity — penalised in score but not a structural disaster.

export function checkDistractors(
  graph: ArchitectureGraph,
  distractorNodeTypes: string[],
): EvaluationWarning[] {
  const warnings: EvaluationWarning[] = [];
  const seen = new Set<string>();
  for (const type of distractorNodeTypes) {
    if (!seen.has(type) && graph.hasNodeType(type as NodeType)) {
      seen.add(type);
      warnings.push({
        code: `DISTRACTOR_${type}`,
        message: `${nodeLabel(type)} is not part of this design — removing irrelevant components shows a clearer understanding of the architecture.`,
        severity: 'LOW',
      });
    }
  }
  return warnings;
}

// ─── Step 3b: Spurious edge check ────────────────────────────────────────────
// For every direct edge the user drew between two in-scope components (both in
// availableNodeTypes), if that pair isn't in referenceEdges in either direction,
// it's an unexpected connection — emit a LOW warning.
// Pairs covered by illegalEdges are already flagged at HIGH; skip them here.

export function checkSpuriousEdges(
  graph: ArchitectureGraph,
  referenceEdges: ReferenceEdge[],
  availableNodeTypes: string[],
  illegalEdges: IllegalEdge[],
): EvaluationWarning[] {
  const inScope = new Set(availableNodeTypes);

  // Build a set of all allowed type pairs (both directions — forward + response)
  const allowed = new Set<string>();
  for (const { from, to } of referenceEdges) {
    allowed.add(`${from}|${to}`);
    allowed.add(`${to}|${from}`);
  }

  // Also skip pairs already covered by illegalEdges (those emit HIGH)
  const illegal = new Set<string>();
  for (const { from, to } of illegalEdges) {
    illegal.add(`${from}|${to}`);
  }

  const warned = new Set<string>();
  const warnings: EvaluationWarning[] = [];

  for (const [sourceId, targets] of graph.adjacency) {
    const sourceNode = graph.nodes.get(sourceId);
    if (!sourceNode || !inScope.has(sourceNode.type)) continue;

    for (const targetId of targets) {
      const targetNode = graph.nodes.get(targetId);
      if (!targetNode || !inScope.has(targetNode.type)) continue;

      const pair = `${sourceNode.type}|${targetNode.type}`;
      if (allowed.has(pair) || illegal.has(pair) || warned.has(pair)) continue;

      warned.add(pair);
      warnings.push({
        code: `SPURIOUS_EDGE_${sourceNode.type}_${targetNode.type}`,
        message: `${nodeLabel(sourceNode.type)} → ${nodeLabel(targetNode.type)} is not part of this design — this connection doesn't belong in the architecture.`,
        severity: 'LOW',
      });
    }
  }

  return warnings;
}

// ─── Step 4: Topology checks ──────────────────────────────────────────────────
// Universal structural rules independent of prompt content.

export function checkTopology(
  graph: ArchitectureGraph,
  referenceEdges: ReferenceEdge[],
): EvaluationWarning[] {
  const warnings: EvaluationWarning[] = [];

  if (graph.nodeCount < 2) {
    warnings.push({
      code: 'EMPTY_DIAGRAM',
      message: 'Your diagram has fewer than 2 nodes. Add components to represent your design.',
      severity: 'HIGH',
    });
    return warnings;
  }

  // Client node present but has no outgoing edges (fully reversed diagram)
  if (graph.hasNodeType(NodeType.CLIENT)) {
    const clientNodes = graph.getNodesByType(NodeType.CLIENT);
    const hasOutgoing = clientNodes.some((n) => (graph.adjacency.get(n.id)?.size ?? 0) > 0);
    if (!hasOutgoing) {
      warnings.push({
        code: 'CLIENT_NO_OUTGOING',
        message: 'The client has no outgoing connections — your arrows appear to be reversed.',
        severity: 'HIGH',
      });
    }
  }

  // Isolated nodes (zero edges in either direction)
  const isolated = graph.getIsolatedNodes().filter((n) => n.type !== NodeType.CLIENT);
  for (const node of isolated) {
    warnings.push({
      code: `ISOLATED_NODE_${node.id}`,
      message: `${node.data.label ?? nodeLabel(node.type)} is not connected to anything — connect it into the design or remove it.`,
      severity: 'LOW',
    });
  }

  return warnings;
}
