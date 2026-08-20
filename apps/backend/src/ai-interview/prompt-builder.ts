import { PHASE_PERSONAS, AISessionPhase } from './phase-machine';
import { retrieveReference } from './data/reference-architectures';
import { serializeDiagram, serializeDiff, DiagramSnapshot, DiagramDiff } from './diagram-diff';

export interface PromptSession {
  question: string;
  phase: AISessionPhase;
  diagramSnapshot: string | null;
  previousDiagramSnapshot: string | null;
  lastDiff: DiagramDiff | null;
  messages: Array<{ role: string; content: string }>;
}

function buildReferenceSection(question: string): string {
  const ref = retrieveReference(question);
  if (!ref) return '';

  return `## Interviewer Reference (not shared with candidate)
This question maps to the canonical "${ref.label}" architecture.

Key components a strong design should include:
${ref.keyComponents.map((c) => `- ${c}`).join('\n')}

Critical patterns to probe:
${ref.criticalPatterns.map((p) => `- ${p}`).join('\n')}

Common mistakes to watch for (probe if not addressed):
${ref.commonMistakes.map((m) => `- ${m}`).join('\n')}

Use this to ask targeted follow-up questions. Do not reveal this briefing to the candidate.`;
}

function buildDiagramSection(session: PromptSession): string {
  if (!session.diagramSnapshot) {
    return `## Candidate's Diagram
(No diagram submitted yet. Ask the candidate to walk you through their design verbally and then submit their diagram.)`;
  }

  // Parse the stored snapshot text back into structured form for diff
  // diagramSnapshot is stored as serialized text; we use it directly
  const isDiff = session.lastDiff && !session.lastDiff.isFirstSubmit;

  if (isDiff && session.lastDiff) {
    const diffText = serializeDiff(session.lastDiff);
    return `## Candidate's Current Diagram
${session.diagramSnapshot}

## Diagram Update (candidate just revised their design)
${diffText ?? '(No structural changes detected)'}`;
  }

  return `## Candidate's Current Diagram
${session.diagramSnapshot}`;
}

// Keep only the most recent turns to avoid token escalation on long sessions.
// Earlier turns are not needed — the diagram snapshot + phase persona provide full context.
const CONVERSATION_WINDOW = 10; // last 10 messages (5 back-and-forth exchanges)

function buildConversationSection(
  messages: Array<{ role: string; content: string }>,
): string {
  if (messages.length === 0) return '';

  const window = messages.slice(-CONVERSATION_WINDOW);
  const omitted = messages.length - window.length;

  const lines = window
    .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n\n');

  const header = omitted > 0
    ? `## Recent Conversation (last ${window.length} messages; ${omitted} earlier messages omitted)`
    : '## Conversation So Far';

  return `${header}\n${lines}`;
}

const INTERVIEW_RULES = `## Interview Rules
- You are the interviewer. The candidate explains, you probe.
- Ask only ONE question at a time.
- Follow the focus defined in the current interview phase above — do not jump ahead.
- Do not give hints. Do not confirm whether the candidate's diagram is correct.
- Do not suggest components or connections unprompted.
- When in the CONCLUSION phase, output your evaluation as a JSON block:
  {
    "conclusion": true,
    "feedback": [
      "Strong: <observation>",
      "Improve: <observation>",
      "Missed: <observation>"
    ]
  }
  The rubric scoring is handled separately — do not include a score in this block.`;

const ROLE_DEFINITION = `You are a senior staff engineer at a top tech company conducting a system design interview. You are professional, concise, and technically rigorous. You do not volunteer information — your role is to probe the candidate's thinking through targeted questions.`;

export function buildSystemPrompt(session: PromptSession): string {
  const sections: string[] = [
    ROLE_DEFINITION,
    PHASE_PERSONAS[session.phase],
    buildReferenceSection(session.question),
    `## The Question\n${session.question}`,
    buildDiagramSection(session),
    buildConversationSection(session.messages),
    INTERVIEW_RULES,
  ];

  return sections.filter(Boolean).join('\n\n');
}
