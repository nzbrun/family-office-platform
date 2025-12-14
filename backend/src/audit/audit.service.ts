import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Role } from '@prisma/client';
import type { Request } from 'express';
import type { TenantContext } from '../common/context/tenant.context';

export interface AuditEvent {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  tenantId?: string | null;
  actorUserId: string;
  actorRole: Role;
  requestId?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: Request,
  ) {}

  async record(event: AuditEvent): Promise<void> {
    try {
      const requestId = (this.request as any).requestId || event.requestId;

      await this.prisma.auditLog.create({
        data: {
          tenantId: event.tenantId,
          actorUserId: event.actorUserId,
          actorRole: event.actorRole,
          action: event.action,
          entity: event.entity,
          entityId: event.entityId,
          metadata: event.metadata || undefined,
          requestId: requestId || null,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit should not break the main flow
      console.error('Failed to record audit log:', error);
    }
  }

  async recordFromContext(
    context: TenantContext,
    action: AuditAction,
    entity: string,
    entityId?: string | null,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.record({
      action,
      entity,
      entityId,
      metadata,
      tenantId: context.tenantId,
      actorUserId: context.userId,
      actorRole: context.role as Role,
    });
  }
}
