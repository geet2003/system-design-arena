import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { DiagramsService } from './diagrams.service';
import { UpdateDiagramDto } from './dto/update-diagram.dto';

@Controller('diagrams')
@UseGuards(JwtAuthGuard)
export class DiagramsController {
  constructor(private readonly diagramsService: DiagramsService) {}

  @Get(':sessionId')
  findOne(@CurrentUser() user: AuthUser, @Param('sessionId') sessionId: string) {
    return this.diagramsService.findBySessionId(sessionId, user.userId);
  }

  @Patch(':sessionId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateDiagramDto,
  ) {
    return this.diagramsService.update(sessionId, user.userId, dto);
  }
}
