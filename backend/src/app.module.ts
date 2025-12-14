import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { LegalEntitiesModule } from './legal-entities/legal-entities.module';
import { AssetsModule } from './assets/assets.module';
import { ValuationsModule } from './valuations/valuations.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    HealthModule,
    AuditModule,
    LegalEntitiesModule,
    AssetsModule,
    ValuationsModule,
    ReportingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
