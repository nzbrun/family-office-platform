import { Injectable, ForbiddenException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { UpdateLegalEntityDto } from './dto/update-legal-entity.dto';
import { TenantContext } from '../common/context/tenant.context';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class LegalEntitiesService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  async create(createLegalEntityDto: CreateLegalEntityDto, context: TenantContext) {
    const legalEntity = await this.prisma.legalEntity.create({
      data: {
        ...createLegalEntityDto,
        tenantId: context.tenantId!,
      },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.CREATE,
        'LegalEntity',
        legalEntity.id,
        { name: legalEntity.name, type: legalEntity.type },
      );
    }

    return legalEntity;
  }

  async findAll(context: TenantContext) {
    return this.prisma.legalEntity.findMany({
      where: {
        tenantId: context.tenantId!,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, context: TenantContext) {
    const legalEntity = await this.prisma.legalEntity.findUnique({
      where: { id },
      include: { assets: true },
    });

    if (!legalEntity) {
      throw new NotFoundException('Legal entity not found');
    }

    // Verify tenant access
    if (legalEntity.tenantId !== context.tenantId) {
      throw new ForbiddenException('Cannot access legal entity from another tenant');
    }

    return legalEntity;
  }

  async update(id: string, updateLegalEntityDto: UpdateLegalEntityDto, context: TenantContext) {
    const legalEntity = await this.findOne(id, context);

    const updated = await this.prisma.legalEntity.update({
      where: { id },
      data: updateLegalEntityDto,
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.UPDATE,
        'LegalEntity',
        updated.id,
        { name: updated.name },
      );
    }

    return updated;
  }

  async remove(id: string, context: TenantContext) {
    const legalEntity = await this.findOne(id, context);

    const deleted = await this.prisma.legalEntity.delete({
      where: { id },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.DELETE,
        'LegalEntity',
        deleted.id,
        { name: legalEntity.name },
      );
    }

    return deleted;
  }
}
