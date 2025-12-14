import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { TenantContext } from './tenant.context';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextProvider {
  constructor(private request: Request) {}

  getContext(): TenantContext {
    const user = (this.request as any).user;
    if (!user) {
      throw new Error('User not found in request. Ensure JwtAuthGuard is applied.');
    }

    const tenantId = user.tenantId || null;
    const role = user.role;
    
    // SUPER_ADMIN can use X-Tenant-Id header for scoping
    let effectiveTenantId = tenantId;
    if (role === 'SUPER_ADMIN') {
      const headerTenantId = this.request.headers['x-tenant-id'] as string;
      if (headerTenantId) {
        effectiveTenantId = headerTenantId;
      }
    }

    return {
      userId: user.userId,
      tenantId,
      role,
      effectiveTenantId,
    };
  }
}
