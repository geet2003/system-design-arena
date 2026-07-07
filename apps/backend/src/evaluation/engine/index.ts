import { NodeType } from '@sds/shared-types';
import type { DiagramNode, DiagramEdge, EvaluationWarning, EvaluationStrength } from '@sds/shared-types';
import { ArchitectureGraph } from '../graph';
import {
  runAntiPatternRules,
  runTopologyRules,
  detectStrengths,
  type EvaluationTemplate,
} from '../rules';
import { computeScore } from '../scorers';

export interface EvaluationRunResult {
  warnings: EvaluationWarning[];
  strengths: EvaluationStrength[];
  score: number;
}

const NODE_TYPE_LABELS: Partial<Record<NodeType, string>> = {
  [NodeType.CACHE]: 'Cache layer',
  [NodeType.LOAD_BALANCER]: 'Load balancer',
  [NodeType.CDN]: 'CDN',
  [NodeType.QUEUE]: 'Async queue',
  [NodeType.API_GATEWAY]: 'API Gateway',
  [NodeType.OBJECT_STORAGE]: 'Object storage',
  [NodeType.DATABASE]: 'Database',
  [NodeType.SERVICE]: 'Service layer',
  [NodeType.AUTH_SERVICE]: 'Auth service',
  [NodeType.SEARCH_SERVICE]: 'Search service',
};

export class EvaluationEngine {
  run(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    template: EvaluationTemplate,
    expectedPatterns: string[],
  ): EvaluationRunResult {
    const graph = new ArchitectureGraph(nodes, edges);

    // Topology rules — now prompt-aware (receives template)
    const topologyWarnings = runTopologyRules(graph, template);
    const isEmptyDiagram = topologyWarnings.some((w) => w.code === 'EMPTY_DIAGRAM');

    // Presence-based antiPattern checks
    const antiPatternWarnings = isEmptyDiagram
      ? []
      : runAntiPatternRules(graph, template, expectedPatterns);

    // Missing expected components
    const missingComponentWarnings: EvaluationWarning[] = isEmptyDiagram
      ? []
      : expectedPatterns
          .filter((p) => !graph.hasNodeType(p as NodeType))
          .map((p) => ({
            code: `MISSING_${p}`,
            message: `Your design is missing a ${NODE_TYPE_LABELS[p as NodeType] ?? p.replace(/_/g, ' ')} — add one to complete the architecture.`,
            severity: 'LOW' as const,
          }));

    // Missing expected connections (both types present but not wired correctly)
    const missingConnectionWarnings: EvaluationWarning[] = isEmptyDiagram
      ? []
      : (template.expectedConnections ?? [])
          .filter(([from, to]) => {
            const fromType = from as NodeType;
            const toType = to as NodeType;
            if (!graph.hasNodeType(fromType) || !graph.hasNodeType(toType)) return false;
            return !graph.canReach(fromType, toType);
          })
          .map(([from, to]) => ({
            code: `MISSING_CONNECTION_${from}_${to}`,
            message: `${(NODE_TYPE_LABELS[from as NodeType] ?? from.replace(/_/g, ' '))} should connect to ${(NODE_TYPE_LABELS[to as NodeType] ?? to.replace(/_/g, ' '))} — add an arrow between them.`,
            severity: 'MEDIUM' as const,
          }));

    // Deduplicate all warnings, keeping highest severity per code
    const warningMap = new Map<string, EvaluationWarning>();
    for (const w of [
      ...topologyWarnings,
      ...antiPatternWarnings,
      ...missingComponentWarnings,
      ...missingConnectionWarnings,
    ]) {
      const existing = warningMap.get(w.code);
      if (!existing || severityRank(w.severity) > severityRank(existing.severity)) {
        warningMap.set(w.code, w);
      }
    }
    const warnings = Array.from(warningMap.values());

    const strengths = isEmptyDiagram ? [] : detectStrengths(graph, expectedPatterns);

    const score = computeScore(warnings, strengths, expectedPatterns.length, graph, template);

    return { warnings, strengths, score };
  }
}

function severityRank(s: 'LOW' | 'MEDIUM' | 'HIGH'): number {
  return s === 'HIGH' ? 2 : s === 'MEDIUM' ? 1 : 0;
}
