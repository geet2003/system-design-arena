import { GoogleGenerativeAI } from '@google/generative-ai';

export interface RubricDimensionResult {
  score: number;
  evidence: string[];
  missed: string[];
}

export interface RubricScores {
  scalability: number;
  reliability: number;
  correctness: number;
  depth: number;
  overall: number;
  evidence: string[];
  missed: string[];
}

export interface RubricSession {
  question: string;
  diagramSnapshot: string | null;
  messages: Array<{ role: string; content: string }>;
}

type RubricDimension = 'scalability' | 'reliability' | 'correctness' | 'depth';

const DIMENSION_FOCUS: Record<RubricDimension, string> = {
  scalability: `Evaluate the candidate's SCALABILITY thinking.
Look for: horizontal scaling strategies, caching layers, sharding/partitioning, load balancing,
CDN usage, async processing to offload synchronous paths, back-of-envelope awareness.`,

  reliability: `Evaluate the candidate's RELIABILITY thinking.
Look for: failure mode identification, retry logic, circuit breakers, fallback strategies,
redundancy, replication, health checks, graceful degradation.`,

  correctness: `Evaluate the candidate's CORRECTNESS — whether the right components were chosen for the problem.
Look for: appropriate data stores for the use case, correct data flows, no architectural anti-patterns,
components that actually solve the stated problem, correct producer/consumer relationships.`,

  depth: `Evaluate the candidate's DEPTH of knowledge.
Look for: trade-off awareness (e.g. SQL vs NoSQL, fan-out on write vs read),
technology rationale (why Kafka vs RabbitMQ), awareness of alternatives,
mention of CAP theorem implications, nuanced understanding beyond surface-level answers.`,
};

const WEIGHTS: Record<RubricDimension, number> = {
  scalability: 0.25,
  reliability: 0.25,
  correctness: 0.30,
  depth: 0.20,
};

// Cap conversation sent to rubric evaluator — same reason as prompt-builder: avoid token bloat.
const RUBRIC_CONVERSATION_WINDOW = 14; // last 14 messages is plenty for scoring

function buildRubricPrompt(session: RubricSession): string {
  const recentMessages = session.messages.slice(-RUBRIC_CONVERSATION_WINDOW);
  const conversationText = recentMessages
    .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
    .join('\n\n');

  return `You are evaluating a system design interview candidate across four dimensions.

## The Question
${session.question}

## Candidate's Final Diagram
${session.diagramSnapshot ?? '(No diagram submitted)'}

## Interview Conversation (most recent portion)
${conversationText}

## Dimension Guides
${Object.entries(DIMENSION_FOCUS).map(([dim, focus]) => `### ${dim.toUpperCase()}\n${focus}`).join('\n\n')}

## Your Task
Score the candidate on all four dimensions at once. Return ONLY valid JSON — no markdown, no text outside the JSON:
{
  "scalability":  { "score": <0-100>, "strengths": [<string>, ...], "gaps": [<string>, ...] },
  "reliability":  { "score": <0-100>, "strengths": [<string>, ...], "gaps": [<string>, ...] },
  "correctness":  { "score": <0-100>, "strengths": [<string>, ...], "gaps": [<string>, ...] },
  "depth":        { "score": <0-100>, "strengths": [<string>, ...], "gaps": [<string>, ...] }
}

Rules for each dimension:
- "strengths": things the candidate explicitly said or drew that show good thinking. ONLY include genuinely positive observations. If the candidate did nothing well in this dimension, return an empty array []. Do NOT put negative or neutral observations here.
- "gaps": important things the candidate missed or got wrong. Be specific. 1–4 items.`;
}

function parseCombinedRubricResponse(raw: string): Record<RubricDimension, RubricDimensionResult> {
  const fallback = (dim: string): RubricDimensionResult => ({
    score: 0,
    evidence: [],
    missed: [`Failed to evaluate ${dim}`],
  });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      scalability: fallback('scalability'),
      reliability: fallback('reliability'),
      correctness: fallback('correctness'),
      depth: fallback('depth'),
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, { score: number; strengths: string[]; gaps: string[] }>;
    const dims: RubricDimension[] = ['scalability', 'reliability', 'correctness', 'depth'];
    return Object.fromEntries(
      dims.map((dim) => {
        const d = parsed[dim];
        if (!d || typeof d.score !== 'number') return [dim, fallback(dim)];
        return [dim, {
          score: Math.max(0, Math.min(100, Math.round(d.score))),
          evidence: Array.isArray(d.strengths) ? d.strengths : [],
          missed: Array.isArray(d.gaps) ? d.gaps : [],
        }];
      }),
    ) as Record<RubricDimension, RubricDimensionResult>;
  } catch {
    return {
      scalability: fallback('scalability'),
      reliability: fallback('reliability'),
      correctness: fallback('correctness'),
      depth: fallback('depth'),
    };
  }
}

export async function runRubricEvaluation(
  session: RubricSession,
  apiKey: string,
): Promise<RubricScores> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = buildRubricPrompt(session);
  let raw: string;
  try {
    const response = await model.generateContent(prompt);
    raw = response.response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
      throw new Error('Evaluation unavailable — rate limit reached. Please try again shortly.');
    }
    throw new Error('Evaluation unavailable — please try again.');
  }
  const results = parseCombinedRubricResponse(raw);

  const { scalability, reliability, correctness, depth } = results;

  const overall = Math.round(
    scalability.score * WEIGHTS.scalability +
    reliability.score * WEIGHTS.reliability +
    correctness.score * WEIGHTS.correctness +
    depth.score * WEIGHTS.depth,
  );

  return {
    scalability: scalability.score,
    reliability: reliability.score,
    correctness: correctness.score,
    depth: depth.score,
    overall,
    evidence: [...scalability.evidence, ...reliability.evidence, ...correctness.evidence, ...depth.evidence],
    missed: [...scalability.missed, ...reliability.missed, ...correctness.missed, ...depth.missed],
  };
}
