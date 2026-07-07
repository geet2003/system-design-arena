import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateDiagramDto } from './dto/update-diagram.dto';

const DIAGRAM_SELECT = {
  id: true,
  sessionId: true,
  nodes: true,
  edges: true,
  version: true,
  updatedAt: true,
} as const;

@Injectable()
export class DiagramsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySessionId(sessionId: string, userId: string) {
    const diagram = await this.prisma.diagram.findUnique({
      where: { sessionId },
      select: {
        ...DIAGRAM_SELECT,
        session: { select: { userId: true } },
      },
    });

    if (!diagram) throw new NotFoundException(`Diagram for session ${sessionId} not found`);
    if (diagram.session.userId !== userId) throw new ForbiddenException();

    const { session: _session, ...rest } = diagram;
    return rest;
  }

  async update(sessionId: string, userId: string, dto: UpdateDiagramDto) {
    const diagram = await this.prisma.diagram.findUnique({
      where: { sessionId },
      select: { session: { select: { userId: true } } },
    });

    if (!diagram) throw new NotFoundException(`Diagram for session ${sessionId} not found`);
    if (diagram.session.userId !== userId) throw new ForbiddenException();

    return this.prisma.diagram.update({
      where: { sessionId },
      data: {
        ...(dto.nodes !== undefined && { nodes: dto.nodes as Prisma.InputJsonValue }),
        ...(dto.edges !== undefined && { edges: dto.edges as Prisma.InputJsonValue }),
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      select: DIAGRAM_SELECT,
    });
  }
}
