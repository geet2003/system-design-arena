import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { SessionsService } from './sessions.service';

class CreateSessionDto {
  @IsString()
  promptId!: string;
}

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(user.userId, dto.promptId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.sessionsService.findAllByUser(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessionsService.findOne(user.userId, id);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessionsService.complete(user.userId, id);
  }
}
