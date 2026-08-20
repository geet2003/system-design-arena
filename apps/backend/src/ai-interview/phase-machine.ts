export type AISessionPhase =
  | 'OPENING'
  | 'HLD_SUBMITTED'
  | 'DEEP_DIVE'
  | 'SCALING'
  | 'CONCLUSION';

export interface PhaseSession {
  phase: AISessionPhase;
  diagramSnapshot: string | null;
  messages: Array<{ role: string; createdAt?: Date }>;
  lastPhaseTransitionAt: Date | null;
}

// Number of candidate turns (user messages) required in a phase before advancing
const TURNS_TO_ADVANCE: Record<AISessionPhase, number> = {
  OPENING: 0,        // advances on diagram submit, not turn count
  HLD_SUBMITTED: 2,
  DEEP_DIVE: 2,
  SCALING: 2,
  CONCLUSION: 0,     // terminal — no further transition
};

const PHASE_ORDER: AISessionPhase[] = [
  'OPENING',
  'HLD_SUBMITTED',
  'DEEP_DIVE',
  'SCALING',
  'CONCLUSION',
];

function nextPhase(phase: AISessionPhase): AISessionPhase {
  const idx = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
}

function countUserTurnsSince(
  messages: Array<{ role: string; createdAt?: Date }>,
  since: Date | null,
): number {
  return messages.filter(
    (m) => m.role === 'user' && (!since || !m.createdAt || m.createdAt > since),
  ).length;
}

/**
 * Determines whether the session should advance to the next phase.
 * Called after each sendMessage() before building the system prompt.
 *
 * Rules:
 * - OPENING → HLD_SUBMITTED: triggered when diagramSnapshot is set (submitDiagram called)
 * - HLD_SUBMITTED → DEEP_DIVE: after 2 user turns in HLD_SUBMITTED
 * - DEEP_DIVE → SCALING: after 2 user turns in DEEP_DIVE
 * - SCALING → CONCLUSION: after 2 user turns in SCALING
 * - CONCLUSION: terminal, never transitions
 */
export function transitionPhase(session: PhaseSession): AISessionPhase {
  const { phase, diagramSnapshot, messages, lastPhaseTransitionAt } = session;

  if (phase === 'CONCLUSION') return 'CONCLUSION';

  if (phase === 'OPENING') {
    // Only advance once the candidate has submitted a diagram
    return diagramSnapshot ? 'HLD_SUBMITTED' : 'OPENING';
  }

  const userTurnsSinceTransition = countUserTurnsSince(messages, lastPhaseTransitionAt);
  const required = TURNS_TO_ADVANCE[phase];

  if (userTurnsSinceTransition >= required) {
    return nextPhase(phase);
  }

  return phase;
}

export const PHASE_PERSONAS: Record<AISessionPhase, string> = {
  OPENING: `## Current Interview Phase: OPENING
Your goal is to get the candidate started. Ask them to walk you through their high-level design.
Do not probe details yet — let them set the stage first.
Once they have described their approach, prompt them to submit their diagram.`,

  HLD_SUBMITTED: `## Current Interview Phase: HLD_SUBMITTED
The candidate has submitted their diagram. Your focus is the high-level design.
- Probe their component choices: why did they pick this technology over alternatives?
- Ask about missing pieces you notice from the diagram.
- Do NOT ask about failure modes or scaling numbers yet — that comes later.
- Ask only ONE question.`,

  DEEP_DIVE: `## Current Interview Phase: DEEP_DIVE
Your focus this phase is failure modes and reliability.
- Ask what happens when individual components go down.
- Probe retry logic, circuit breakers, and fallback strategies.
- Ask about consistency models (strong vs eventual) where relevant.
- Do NOT ask about scaling numbers yet.
- Ask only ONE question.`,

  SCALING: `## Current Interview Phase: SCALING
Your focus this phase is capacity and scaling.
- Ask for back-of-envelope estimates: QPS, storage, bandwidth.
- Probe horizontal vs vertical scaling decisions.
- Ask about bottlenecks and how they would address them.
- Ask only ONE question.`,

  CONCLUSION: `## Current Interview Phase: CONCLUSION
The interview is complete. Provide your structured evaluation now.
Do not ask any more questions.`,
};
