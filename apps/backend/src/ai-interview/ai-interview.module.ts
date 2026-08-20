import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AIInterviewController } from './ai-interview.controller';
import { AIInterviewService } from './ai-interview.service';
import { AISessionCleanupService } from './ai-session-cleanup.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [AIInterviewController],
  providers: [AIInterviewService, AISessionCleanupService],
})
export class AIInterviewModule {}
