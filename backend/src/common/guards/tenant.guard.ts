import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let JwtAuthGuard handle authentication
    }

    const role = user.role as Role;
    const tenantId = user.tenantId;

    // SUPER_ADMIN can access everything
    if (role === Role.SUPER_ADMIN) {
      return true;
    }

    // ADMIN and USER must have a tenantId
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required for this operation');
    }

    // Check if trying to access another tenant's data
    const requestedTenantId = this.getTenantIdFromRequest(request);

    if (requestedTenantId && requestedTenantId !== tenantId) {
      throw new ForbiddenException(
        'Access denied: Cannot access resources from another tenant',
      );
    }

    return true;
  }

  private getTenantIdFromRequest(request: any): string | null {
    // Check query params
    if (request.query?.tenantId) {
      return request.query.tenantId;
    }

    // Check route params (e.g., /tenants/:id)
    if (request.params?.id && request.route?.path?.includes('/tenants')) {
      return request.params.id;
    }

    // Check body (for tenantId in create/update operations)
    if (request.body?.tenantId) {
      return request.body.tenantId;
    }

    return null;
  }
}
