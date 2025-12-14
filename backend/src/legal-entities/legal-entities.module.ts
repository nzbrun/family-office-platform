import { Module } from '@nestjs/common';
import { LegalEntitiesController } from './legal-entities.controller';
import { LegalEntitiesService } from './legal-entities.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [LegalEntitiesController],
  providers: [LegalEntitiesService],
  exports: [LegalEntitiesService],
})
export class LegalEntitiesModule {}
