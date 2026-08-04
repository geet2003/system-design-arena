import type { EvaluationWarning } from '@sds/shared-types';

/**
 * Scoring model — 70 + 30
 *
 *  70 pts  edge score  — (matchedEdges / totalRequiredEdges) × 70
 *  30 pts  topology bonus — awarded only when zero HIGH or MEDIUM violations exist
 *
 * Deductions applied after the base score:
 *  −15 per illegal edge (HIGH warning, code starts with ILLEGAL_EDGE_)
 *  −5  per distractor node (LOW warning, code starts with DISTRACTOR_)
 *  −3  per other LOW warning (isolated nodes, etc.)
 *
 * MEDIUM warnings (missing edge / missing node) are already accounted for in
 * the edge score and are NOT double-penalised here.
 *
 * Result is clamped to [0, 100].
 */
export function computeScore(
  matchedEdges: number,
  totalEdges: number,
  warnings: EvaluationWarning[],
): number {
  const edgeScore = totalEdges > 0 ? (matchedEdges / totalEdges) * 70 : 0;

  const hasViolation = warnings.some(
    (w) => w.severity === 'HIGH' || w.severity === 'MEDIUM',
  );
  const topologyBonus = hasViolation ? 0 : 30;

  let deductions = 0;
  for (const w of warnings) {
    if (w.code.startsWith('ILLEGAL_EDGE_')) {
      deductions += 15;
    } else if (w.code.startsWith('DISTRACTOR_')) {
      deductions += 5;
    } else if (w.severity === 'LOW') {
      deductions += 3;
    }
  }

  return Math.round(Math.max(0, Math.min(100, edgeScore + topologyBonus - deductions)));
}
