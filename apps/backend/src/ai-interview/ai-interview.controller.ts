import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AIInterviewService } from './ai-interview.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SubmitDiagramDto } from './dto/submit-diagram.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai-interview')
export class AIInterviewController {
  constructor(private readonly service: AIInterviewService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSessionDto,
  ) {
    return this.service.createSession(user.userId, dto.category);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listSessions(user.userId);
  }

  @Get(':id')
  load(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.loadSession(id, user.userId);
  }

  @Post(':id/message')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(id, user.userId, dto.content);
  }

  @Post(':id/diagram')
  submitDiagram(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitDiagramDto,
  ) {
    return this.service.submitDiagram(id, user.userId, dto.nodes, dto.edges);
  }

  @Post(':id/conclude')
  conclude(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.concludeSession(id, user.userId);
  }
}
