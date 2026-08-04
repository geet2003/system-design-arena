import type { DiagramNode, DiagramEdge, EvaluationWarning, EvaluationStrength, EvaluationTemplate } from '@sds/shared-types';
import { ArchitectureGraph } from '../graph';
import {
  checkIllegalEdges,
  scoreReferenceEdges,
  checkDistractors,
  checkSpuriousEdges,
  checkTopology,
} from '../rules';
import { computeScore } from '../scorers';

export interface EvaluationRunResult {
  warnings: EvaluationWarning[];
  strengths: EvaluationStrength[];
  score: number;
}

export class EvaluationEngine {
  run(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    template: EvaluationTemplate,
  ): EvaluationRunResult {
    const graph = new ArchitectureGraph(nodes, edges);

    // ── 1. Illegal edges ─────────────────────────────────────────────────────
    const illegalWarnings = checkIllegalEdges(graph, template.illegalEdges ?? []);

    // ── 2. Reference edge scoring ────────────────────────────────────────────
    // anyDirectEdge check — strict single hop, correct direction
    const { matched, total, warnings: edgeWarnings, strengths } = scoreReferenceEdges(
      graph,
      template.referenceEdges ?? [],
      template.componentRoles ?? {},
    );

    // ── 3. Distractor check ──────────────────────────────────────────────────
    const distractorWarnings = checkDistractors(graph, template.distractorNodeTypes ?? []);

    // ── 3b. Spurious edge check ──────────────────────────────────────────────
    const spuriousWarnings = checkSpuriousEdges(
      graph,
      template.referenceEdges ?? [],
      template.availableNodeTypes ?? [],
      template.illegalEdges ?? [],
    );

    // ── 4. Topology checks ───────────────────────────────────────────────────
    const topologyWarnings = checkTopology(graph, template.referenceEdges ?? []);

    // ── 5. Merge & deduplicate (highest severity wins per code) ──────────────
    const warningMap = new Map<string, EvaluationWarning>();
    for (const w of [
      ...illegalWarnings,
      ...edgeWarnings,
      ...distractorWarnings,
      ...spuriousWarnings,
      ...topologyWarnings,
    ]) {
      const existing = warningMap.get(w.code);
      if (!existing || severityRank(w.severity) > severityRank(existing.severity)) {
        warningMap.set(w.code, w);
      }
    }
    const warnings = Array.from(warningMap.values());

    // ── 6. Score ─────────────────────────────────────────────────────────────
    const score = computeScore(matched, total, warnings);

    return { warnings, strengths, score };
  }
}

function severityRank(s: 'LOW' | 'MEDIUM' | 'HIGH'): number {
  return s === 'HIGH' ? 2 : s === 'MEDIUM' ? 1 : 0;
}
