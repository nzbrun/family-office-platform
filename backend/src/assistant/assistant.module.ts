import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ReportingModule } from '../reporting/reporting.module';
import { AssetsModule } from '../assets/assets.module';
import { ValuationsModule } from '../valuations/valuations.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ReportingModule,
    AssetsModule,
    ValuationsModule,
    AuditModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    {
      provide: 'OPENAI_ADAPTER',
      useValue: undefined, // Can be overridden in tests
    },
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
