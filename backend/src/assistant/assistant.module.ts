import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantRateLimitGuard } from './guards/assistant-rate-limit.guard';
import { ReportingModule } from '../reporting/reporting.module';
import { AssetsModule } from '../assets/assets.module';
import { ValuationsModule } from '../valuations/valuations.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ReportingModule,
    AssetsModule,
    ValuationsModule,
    AuditModule,
    ThrottlerModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantRateLimitGuard,
    {
      provide: 'OPENAI_ADAPTER',
      useValue: undefined, // Can be overridden in tests
    },
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
