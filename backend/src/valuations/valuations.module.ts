import { Module } from '@nestjs/common';
import { ValuationsController } from './valuations.controller';
import { ValuationsService } from './valuations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ValuationsController],
  providers: [ValuationsService],
  exports: [ValuationsService],
})
export class ValuationsModule {}
