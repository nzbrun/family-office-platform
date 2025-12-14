import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantContext } from '../common/context/tenant.context';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto, context: TenantContext) {
    // Only SUPER_ADMIN can create tenants
    if (context.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can create tenants');
    }

    return this.prisma.tenant.create({
      data: createTenantDto,
    });
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
    await this.findOne(id, context);

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string, context: TenantContext) {
    // Only SUPER_ADMIN can delete tenants
    if (context.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can delete tenants');
    }

    // Verify tenant exists
    await this.findOne(id, context);

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
