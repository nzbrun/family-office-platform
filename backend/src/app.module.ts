import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';
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
import { AssistantModule } from './assistant/assistant.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: config.get<number>('ASSISTANT_RATE_LIMIT_USER') || 10,
          },
        ],
      }),
    }),
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
    AssistantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
