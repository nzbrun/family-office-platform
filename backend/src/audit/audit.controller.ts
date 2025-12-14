import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('audit-logs')
export class AuditController {
  constructor(
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID' })
  @ApiQuery({ name: 'actorUserId', required: false, description: 'Filter by actor user ID' })
  @ApiQuery({ name: 'action', required: false, enum: ['LOGIN', 'CREATE', 'UPDATE', 'DELETE'] })
  @ApiQuery({ name: 'entity', required: false, description: 'Filter by entity type (e.g., User, Tenant)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            tenantId: '123e4567-e89b-12d3-a456-426614174000',
            actorUserId: '123e4567-e89b-12d3-a456-426614174000',
            actorRole: 'ADMIN',
            action: 'CREATE',
            entity: 'User',
            entityId: '123e4567-e89b-12d3-a456-426614174000',
            metadata: { email: 'user@example.com' },
            requestId: '123e4567-e89b-12d3-a456-426614174000',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - USER role cannot access audit logs' })
  async findAll(
    @Query() query: AuditLogQueryDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Apply tenant scoping
    if (context.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can see all or filter by tenantId
      if (query.tenantId) {
        where.tenantId = query.tenantId;
      }
    } else if (context.role === 'ADMIN') {
      // ADMIN can only see logs from their tenant
      where.tenantId = context.tenantId;
    }

    // Apply filters
    if (query.actorUserId) {
      where.actorUserId = query.actorUserId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.entity) {
      where.entity = query.entity;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Get total count
    const total = await this.prisma.auditLog.count({ where });

    // Get paginated results
    const data = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
