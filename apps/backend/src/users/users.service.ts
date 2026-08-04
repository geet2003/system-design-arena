import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string, passwordHash: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
    return this.prisma.user.create({ data: { email, passwordHash } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOrCreateByGoogle(googleId: string, email: string): Promise<{ id: string; email: string }> {
    // 1. Existing Google-linked account
    const byGoogleId = await this.prisma.user.findUnique({ where: { googleId } });
    if (byGoogleId) return byGoogleId;

    // 2. Existing email/password account — link Google to it
    const byEmail = await this.prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      return this.prisma.user.update({ where: { id: byEmail.id }, data: { googleId } });
    }

    // 3. Brand-new user
    return this.prisma.user.create({ data: { email, googleId } });
  }
}
