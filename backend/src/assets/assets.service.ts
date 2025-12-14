import { Injectable, ForbiddenException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { TenantContext } from '../common/context/tenant.context';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  async create(createAssetDto: CreateAssetDto, context: TenantContext) {
    // Verify legalEntityId belongs to the same tenant if provided
    if (createAssetDto.legalEntityId) {
      const legalEntity = await this.prisma.legalEntity.findUnique({
        where: { id: createAssetDto.legalEntityId },
      });

      if (!legalEntity || legalEntity.tenantId !== context.tenantId) {
        throw new ForbiddenException('Legal entity not found or belongs to another tenant');
      }
    }

    const asset = await this.prisma.asset.create({
      data: {
        ...createAssetDto,
        tenantId: context.tenantId!,
      },
      include: { legalEntity: true },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.CREATE,
        'Asset',
        asset.id,
        { name: asset.name, type: asset.type },
      );
    }

    return asset;
  }

  async findAll(context: TenantContext, legalEntityId?: string) {
    const where: any = {
      tenantId: context.tenantId!,
    };

    if (legalEntityId) {
      where.legalEntityId = legalEntityId;
    }

    return this.prisma.asset.findMany({
      where,
      include: { legalEntity: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, context: TenantContext) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: { legalEntity: true, valuations: { orderBy: { date: 'desc' }, take: 10 } },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Verify tenant access
    if (asset.tenantId !== context.tenantId) {
      throw new ForbiddenException('Cannot access asset from another tenant');
    }

    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, context: TenantContext) {
    const asset = await this.findOne(id, context);

    // Verify legalEntityId if provided
    if (updateAssetDto.legalEntityId && updateAssetDto.legalEntityId !== asset.legalEntityId) {
      const legalEntity = await this.prisma.legalEntity.findUnique({
        where: { id: updateAssetDto.legalEntityId },
      });

      if (!legalEntity || legalEntity.tenantId !== context.tenantId) {
        throw new ForbiddenException('Legal entity not found or belongs to another tenant');
      }
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: updateAssetDto,
      include: { legalEntity: true },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.UPDATE,
        'Asset',
        updated.id,
        { name: updated.name },
      );
    }

    return updated;
  }

  async remove(id: string, context: TenantContext) {
    const asset = await this.findOne(id, context);

    const deleted = await this.prisma.asset.delete({
      where: { id },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.DELETE,
        'Asset',
        deleted.id,
        { name: asset.name },
      );
    }

    return deleted;
  }
}
