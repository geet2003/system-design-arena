import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { DiagramsModule } from './diagrams/diagrams.module';
import { PromptsModule } from './prompts/prompts.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AIInterviewModule } from './ai-interview/ai-interview.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute window (ms)
        limit: 100,  // general API: 100 req/min
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    DiagramsModule,
    PromptsModule,
    EvaluationModule,
    AIInterviewModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
