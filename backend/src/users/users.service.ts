import { Injectable, ForbiddenException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TenantContext } from '../common/context/tenant.context';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, context: TenantContext) {
    // ADMIN can only create users in their own tenant
    if (context.role === 'ADMIN' && createUserDto.tenantId !== context.tenantId) {
      throw new ForbiddenException('Cannot create users in another tenant');
    }

    // Use effectiveTenantId for SUPER_ADMIN, otherwise use tenantId from DTO
    const tenantId = context.role === 'SUPER_ADMIN' 
      ? (context.effectiveTenantId || createUserDto.tenantId)
      : context.tenantId!;

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        tenantId,
        password: hashedPassword,
      },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.CREATE,
        'User',
        user.id,
        { email: user.email, role: user.role },
      );
    }

    return user;
  }

  async findAll(context: TenantContext, tenantIdFilter?: string) {
    let effectiveTenantId: string | null = null;

    if (context.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN can filter by tenantId (query param or header)
      effectiveTenantId = tenantIdFilter || context.effectiveTenantId;
    } else if (context.role === 'ADMIN') {
      // ADMIN can only see users in their tenant
      effectiveTenantId = context.tenantId!;
    } else {
      // USER cannot list users
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        ...(effectiveTenantId && { tenantId: effectiveTenantId }),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        tenantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, context: TenantContext) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ADMIN/USER can only access users in their tenant
    if (context.role !== 'SUPER_ADMIN' && user.tenantId !== context.tenantId) {
      throw new ForbiddenException('Cannot access user from another tenant');
    }

    return user;
  }

  async findMe(context: TenantContext) {
    return this.prisma.user.findUnique({
      where: { id: context.userId },
      include: { tenant: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });
  }

  // Internal method for auth (no tenant context required)
  async findOneInternal(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });
  }

  // Internal method for auth (no tenant context required)
  async createInternal(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, context: TenantContext) {
    const user = await this.findOne(id, context);

    // ADMIN cannot change tenantId
    if (context.role === 'ADMIN' && updateUserDto.tenantId && updateUserDto.tenantId !== user.tenantId) {
      throw new ForbiddenException('Cannot change user tenant');
    }

    const data: any = { ...updateUserDto };
    
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    // Record audit log
    if (this.auditService) {
      const changes: Record<string, any> = {};
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        changes.email = { from: user.email, to: updateUserDto.email };
      }
      if (updateUserDto.firstName && updateUserDto.firstName !== user.firstName) {
        changes.firstName = { from: user.firstName, to: updateUserDto.firstName };
      }
      if (updateUserDto.role && updateUserDto.role !== user.role) {
        changes.role = { from: user.role, to: updateUserDto.role };
      }

      await this.auditService.recordFromContext(
        context,
        AuditAction.UPDATE,
        'User',
        updatedUser.id,
        { email: updatedUser.email, changes: Object.keys(changes).length > 0 ? changes : undefined },
      );
    }

    return updatedUser;
  }

  async remove(id: string, context: TenantContext) {
    // Verify user exists and is accessible
    const user = await this.findOne(id, context);

    const deletedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.DELETE,
        'User',
        deletedUser.id,
        { email: user.email },
      );
    }

    return deletedUser;
  }
}
