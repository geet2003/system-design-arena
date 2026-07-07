import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, promptId: string) {
    // Verify prompt exists and is active
    const prompt = await this.prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true, isActive: true },
    });
    if (!prompt || !prompt.isActive) {
      throw new NotFoundException(`Prompt ${promptId} not found`);
    }

    return this.prisma.interviewSession.create({
      data: {
        userId,
        promptId,
        diagram: { create: {} },
      },
      select: {
        id: true,
        status: true,
        currentStage: true,
        createdAt: true,
        prompt: {
          select: { id: true, title: true, difficulty: true },
        },
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.interviewSession.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        currentStage: true,
        createdAt: true,
        updatedAt: true,
        prompt: {
          select: { id: true, title: true, difficulty: true },
        },
        evaluations: {
          select: { score: true, generatedAt: true },
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        currentStage: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        prompt: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            description: true,
            expectedPatterns: true,
            evaluationTemplate: true,
          },
        },
        diagram: {
          select: { id: true, nodes: true, edges: true, version: true, updatedAt: true },
        },
        evaluations: {
          select: {
            id: true,
            score: true,
            warnings: true,
            strengths: true,
            generatedAt: true,
          },
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
    if (session.userId !== userId) throw new ForbiddenException();

    return session;
  }

  async complete(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        status: true,
        evaluations: {
          select: { id: true, score: true, warnings: true, strengths: true, generatedAt: true },
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
        prompt: {
          select: { id: true, title: true, difficulty: true },
        },
      },
    });

    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
    if (session.userId !== userId) throw new ForbiddenException();
    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Session is already completed');
    }

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    return {
      sessionId,
      prompt: session.prompt,
      evaluation: session.evaluations[0] ?? null,
    };
  }
}
