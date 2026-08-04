import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EvaluationEngine } from './engine';
import type { EvaluationTemplate } from './rules';
import type { DiagramNode, DiagramEdge } from '@sds/shared-types';

@Injectable()
export class EvaluationService {
  private readonly engine = new EvaluationEngine();

  constructor(private readonly prisma: PrismaService) {}

  async evaluate(sessionId: string, userId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: { diagram: true, prompt: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const nodes = (session.diagram?.nodes ?? []) as unknown as DiagramNode[];
    const edges = (session.diagram?.edges ?? []) as unknown as DiagramEdge[];
    const template = session.prompt.evaluationTemplate as unknown as EvaluationTemplate;

    const { warnings, strengths, score } = this.engine.run(nodes, edges, template);

    return this.prisma.evaluationResult.create({
      data: {
        sessionId,
        warnings: warnings as object[],
        strengths: strengths as object[],
        score,
      },
    });
  }
}
