import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.prompt.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        expectedPatterns: true,
      },
      orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
    });
  }

  async findById(id: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        expectedPatterns: true,
        evaluationTemplate: true,
      },
    });
    if (!prompt) throw new NotFoundException(`Prompt ${id} not found`);
    return prompt;
  }
}
