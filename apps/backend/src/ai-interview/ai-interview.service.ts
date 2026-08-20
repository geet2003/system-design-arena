import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';
import { PrismaService } from '../database/prisma.service';
import { transitionPhase } from './phase-machine';
import { buildSystemPrompt, PromptSession } from './prompt-builder';
import {
  computeDiagramDiff,
  serializeDiagram,
  diffBadgeSummary,
  DiagramSnapshot,
} from './diagram-diff';
import { runRubricEvaluation, RubricSession } from './rubric-evaluator';
import { FreeNodeDto, FreeEdgeDto } from './dto/submit-diagram.dto';

// Loaded once at module init — path.join(__dirname) resolves correctly in both dev and prod
const QUESTION_BANK: Record<string, string[]> =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(path.join(__dirname, 'data', 'question-bank.json')) as Record<string, string[]>;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

@Injectable()
export class AIInterviewService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('gemini.apiKey') ?? '';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  // ─── Create Session ───────────────────────────────────────────────────────

  async createSession(userId: string, category: string) {
    const questions = QUESTION_BANK[category];
    if (!questions?.length) {
      throw new NotFoundException(`Unknown category: ${category}`);
    }

    const question = pickRandom(questions);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.aISession.create({
      data: { userId, question, category, expiresAt },
    });

    // Generate opening message
    const openingPrompt = buildSystemPrompt({
      question,
      phase: 'OPENING',
      diagramSnapshot: null,
      previousDiagramSnapshot: null,
      lastDiff: null,
      messages: [],
    });

    let openingContent: string;
    try {
      openingContent = await this.callGemini(openingPrompt);
    } catch {
      openingContent = `Welcome. Let's design ${question.replace('Design ', '')}. Please walk me through your high-level approach and submit an initial architecture diagram when you're ready.`;
    }

    const message = await this.prisma.aIMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: openingContent },
    });

    return { session, messages: [message] };
  }

  // ─── List Sessions ────────────────────────────────────────────────────────

  async listSessions(userId: string) {
    return this.prisma.aISession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        question: true,
        category: true,
        phase: true,
        status: true,
        rubricScores: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  // ─── Load Session ─────────────────────────────────────────────────────────

  async loadSession(sessionId: string, userId: string) {
    const session = await this.prisma.aISession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    return session;
  }

  // ─── Send Message ─────────────────────────────────────────────────────────

  async sendMessage(sessionId: string, userId: string, content: string) {
    try {
    const session = await this.prisma.aISession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    // Save user message
    await this.prisma.aIMessage.create({
      data: { sessionId, role: 'user', content },
    });

    const allMessages = [
      ...session.messages.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })),
      { role: 'user', content, createdAt: new Date() },
    ];

    // Phase transition
    const newPhase = transitionPhase({
      phase: session.phase as any,
      diagramSnapshot: session.diagramSnapshot,
      messages: allMessages,
      lastPhaseTransitionAt: session.lastPhaseTransitionAt,
    });

    const phaseChanged = newPhase !== session.phase;

    // If advancing to CONCLUSION, run rubric evaluation
    let rubricScores = session.rubricScores;
    if (newPhase === 'CONCLUSION' && session.phase !== 'CONCLUSION') {
      const rubricSession: RubricSession = {
        question: session.question,
        diagramSnapshot: session.diagramSnapshot,
        messages: allMessages,
      };
      rubricScores = await runRubricEvaluation(rubricSession, this.apiKey) as any;
    }

    // Update session phase + rubric
    const updates: Record<string, unknown> = {};
    if (phaseChanged) {
      updates.phase = newPhase;
      updates.lastPhaseTransitionAt = new Date();
    }
    if (rubricScores !== session.rubricScores) {
      updates.rubricScores = rubricScores;
      updates.status = 'COMPLETED';
      updates.previousDiagramSnapshot = null;
    }
    if (Object.keys(updates).length > 0) {
      await this.prisma.aISession.update({ where: { id: sessionId }, data: updates });
    }

    // Build system prompt and call Gemini
    const promptSession: PromptSession = {
      question: session.question,
      phase: newPhase,
      diagramSnapshot: session.diagramSnapshot,
      previousDiagramSnapshot: session.previousDiagramSnapshot,
      lastDiff: null,
      messages: allMessages,
    };

    const systemPrompt = buildSystemPrompt(promptSession);
    const reply = await this.callGemini(systemPrompt);

    const assistantMessage = await this.prisma.aIMessage.create({
      data: { sessionId, role: 'assistant', content: reply },
    });

    // Session is now complete — rubric is stored, messages no longer needed.
    // Delete them to avoid retaining chat history that serves no further purpose.
    if (newPhase === 'CONCLUSION') {
      await this.prisma.aIMessage.deleteMany({ where: { sessionId } });
    }

    return {
      message: assistantMessage,
      phase: newPhase,
      rubricScores: newPhase === 'CONCLUSION' ? rubricScores : undefined,
    };
    } catch (err: unknown) {
      // Re-throw NestJS HTTP exceptions as-is (NotFoundException, ForbiddenException, etc.)
      // so the global exception filter handles them correctly.
      if (err instanceof Error && 'getStatus' in err) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(msg);
    }
  }

  // ─── Submit Diagram ───────────────────────────────────────────────────────

  async submitDiagram(
    sessionId: string,
    userId: string,
    nodes: FreeNodeDto[],
    edges: FreeEdgeDto[],
  ) {
    const session = await this.prisma.aISession.findUnique({ where: { id: sessionId } });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    // Build snapshot
    const nodeLabels = nodes.map((n) => n.label);
    const edgeLabels = edges.map((e) => {
      const src = nodes.find((n) => n.id === e.source)?.label ?? e.source;
      const tgt = nodes.find((n) => n.id === e.target)?.label ?? e.target;
      return `${src} -> ${tgt}`;
    });

    const currentSnapshot: DiagramSnapshot = { nodes: nodeLabels, edges: edgeLabels };

    // Parse previous snapshot for diff
    let prevSnapshot: DiagramSnapshot | null = null;
    if (session.diagramSnapshot) {
      prevSnapshot = parseStoredSnapshot(session.diagramSnapshot);
    }

    const diff = computeDiagramDiff(prevSnapshot, currentSnapshot);
    const serialized = serializeDiagram(currentSnapshot);
    const badge = diffBadgeSummary(diff);

    // Shift snapshots
    await this.prisma.aISession.update({
      where: { id: sessionId },
      data: {
        previousDiagramSnapshot: session.diagramSnapshot,
        diagramSnapshot: serialized,
        // If still in OPENING, transition to HLD_SUBMITTED and reset phase timer
        phase: session.phase === 'OPENING' ? 'HLD_SUBMITTED' : session.phase,
        lastPhaseTransitionAt: session.phase === 'OPENING' ? new Date() : session.lastPhaseTransitionAt,
      },
    });

    return { badge, diff };
  }

  // ─── Force Conclude ───────────────────────────────────────────────────────

  async concludeSession(sessionId: string, userId: string) {
    const session = await this.prisma.aISession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    const allMessages = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const rubricSession: RubricSession = {
      question: session.question,
      diagramSnapshot: session.diagramSnapshot,
      messages: allMessages,
    };

    let rubricScores: Awaited<ReturnType<typeof runRubricEvaluation>>;
    try {
      rubricScores = await runRubricEvaluation(rubricSession, this.apiKey);
    } catch {
      // Evaluation failure should not block session conclusion.
      // Use zeroed fallback scores so the session always completes.
      rubricScores = {
        scalability: 0, reliability: 0, correctness: 0, depth: 0, overall: 0,
        evidence: [], missed: ['Evaluation could not be completed — please review your session manually.'],
      };
    }

    await this.prisma.aISession.update({
      where: { id: sessionId },
      data: {
        phase: 'CONCLUSION',
        status: 'COMPLETED',
        rubricScores: rubricScores as any,
        previousDiagramSnapshot: null,
      },
    });

    // Rubric is stored — messages served their purpose, delete them.
    await this.prisma.aIMessage.deleteMany({ where: { sessionId } });

    return { rubricScores };
  }

  // ─── Gemini Helper ────────────────────────────────────────────────────────

  private async callGemini(systemPrompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    try {
      const response = await model.generateContent(systemPrompt);
      return response.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
        throw new Error('The AI interviewer is busy right now — please wait a moment and try again.');
      }
      if (msg.includes('503') || msg.toLowerCase().includes('service unavailable') || msg.toLowerCase().includes('high demand')) {
        throw new Error('The AI interviewer is temporarily unavailable due to high demand — please try again in a few seconds.');
      }
      // All other Gemini errors: never expose raw API messages (they contain URLs, model names, etc.)
      throw new Error('The AI interviewer encountered an issue — please try again.');
    }
  }
}

// ─── Snapshot Parser ────────────────────────────────────────────────────────

function parseStoredSnapshot(text: string): DiagramSnapshot {
  const lines = text.split('\n');
  let nodes: string[] = [];
  const edges: string[] = [];
  let inConnections = false;

  for (const line of lines) {
    if (line.startsWith('Nodes: ')) {
      nodes = line
        .slice('Nodes: '.length)
        .split(', ')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (line.startsWith('Connections:')) {
      inConnections = true;
    } else if (inConnections && line.startsWith('- ')) {
      edges.push(line.slice(2).trim());
    }
  }

  return { nodes, edges };
}
