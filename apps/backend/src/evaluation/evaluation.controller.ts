import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { EvaluationService } from './evaluation.service';

@Controller('evaluation')
@UseGuards(JwtAuthGuard)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post(':sessionId')
  evaluate(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.evaluationService.evaluate(sessionId, user.userId);
  }
}
