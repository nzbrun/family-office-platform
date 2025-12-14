import { Injectable, ForbiddenException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantContext } from '../common/context/tenant.context';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  async create(createTenantDto: CreateTenantDto, context: TenantContext) {
    // Only SUPER_ADMIN can create tenants
    if (context.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can create tenants');
    }

    const tenant = await this.prisma.tenant.create({
      data: createTenantDto,
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.CREATE,
        'Tenant',
        tenant.id,
        { name: tenant.name, slug: tenant.slug },
      );
    }

    return tenant;
  }

  async findAll(context: TenantContext) {
    // Only SUPER_ADMIN can list all tenants
    if (context.role !== 'SUPER_ADMIN') {
      return [];
    }

    return this.prisma.tenant.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string, context: TenantContext) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // ADMIN/USER can only access their own tenant
    if (context.role !== 'SUPER_ADMIN' && tenant.id !== context.tenantId) {
      throw new ForbiddenException('Cannot access tenant from another organization');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto, context: TenantContext) {
    // Only SUPER_ADMIN can update tenants
    if (context.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can update tenants');
    }

    // Verify tenant exists
    const tenant = await this.findOne(id, context);

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });

    // Record audit log
    if (this.auditService) {
      const changes: Record<string, any> = {};
      if (updateTenantDto.name && updateTenantDto.name !== tenant.name) {
        changes.name = { from: tenant.name, to: updateTenantDto.name };
      }
      if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
        changes.slug = { from: tenant.slug, to: updateTenantDto.slug };
      }

      await this.auditService.recordFromContext(
        context,
        AuditAction.UPDATE,
        'Tenant',
        updatedTenant.id,
        { name: updatedTenant.name, changes: Object.keys(changes).length > 0 ? changes : undefined },
      );
    }

    return updatedTenant;
  }

  async remove(id: string, context: TenantContext) {
    // Only SUPER_ADMIN can delete tenants
    if (context.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can delete tenants');
    }

    // Verify tenant exists
    const tenant = await this.findOne(id, context);

    const deletedTenant = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.DELETE,
        'Tenant',
        deletedTenant.id,
        { name: tenant.name },
      );
    }

    return deletedTenant;
  }
}
