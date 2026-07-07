import { NodeType } from '@sds/shared-types';
import type { EvaluationWarning, EvaluationStrength } from '@sds/shared-types';
import type { ArchitectureGraph } from '../graph';
import type { EvaluationTemplate } from '../rules';

/**
 * Count how many of the prompt's expected directed connection pairs are satisfied.
 * A pair [A, B] is evaluated only when both node types are present in the diagram.
 * If one type is absent the pair is skipped (not penalised).
 */
export function countCorrectConnections(
  graph: ArchitectureGraph,
  template: EvaluationTemplate,
): { correct: number; possible: number } {
  let correct = 0;
  let possible = 0;

  for (const [from, to] of (template.expectedConnections ?? [])) {
    const fromType = from as NodeType;
    const toType = to as NodeType;
    if (!graph.hasNodeType(fromType) || !graph.hasNodeType(toType)) continue;
    possible++;
    if (graph.canReach(fromType, toType)) correct++;
  }

  return { correct, possible };
}

/**
 * Score = earned points from correct components + correct connections + clean topology bonus
 *         minus deductions for violations.
 *
 * Budget:
 *   40 pts — correct components (each expected component present earns a share)
 *   40 pts — correct connections (each expected directed pair wired correctly earns a share)
 *   20 pts — clean topology bonus (no HIGH or MEDIUM warnings)
 *  -20 per HIGH warning, -8 per MEDIUM, -3 per LOW
 */
export function computeScore(
  warnings: EvaluationWarning[],
  strengths: EvaluationStrength[],
  expectedPatternCount: number,
  graph: ArchitectureGraph,
  template: EvaluationTemplate,
): number {
  // Component points: 40pts split equally across expected components
  const componentPoints = expectedPatternCount > 0
    ? (strengths.length / expectedPatternCount) * 40
    : 0;

  // Connection points: 40pts split equally across applicable expected connections
  const { correct, possible } = countCorrectConnections(graph, template);
  const connectionPoints = possible > 0 ? (correct / possible) * 40 : 0;

  let score = componentPoints + connectionPoints;

  // Deductions for violations — skip MISSING_* and MISSING_CONNECTION_* warnings,
  // those are already reflected in the component/connection points ratio.
  const violationWarnings = warnings.filter(
    (w) => !w.code.startsWith('MISSING_'),
  );

  for (const w of violationWarnings) {
    switch (w.severity) {
      case 'HIGH':   score -= 20; break;
      case 'MEDIUM': score -= 8;  break;
      case 'LOW':    score -= 3;  break;
    }
  }

  // Clean topology bonus — only blocked by actual violations, not missing components
  const hasSerious = violationWarnings.some((w) => w.severity === 'HIGH' || w.severity === 'MEDIUM');
  if (!hasSerious) score += 20;

  return Math.round(Math.max(0, Math.min(100, score)));
}

