import { Injectable, ForbiddenException, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { UpdateValuationDto } from './dto/update-valuation.dto';
import { TenantContext } from '../common/context/tenant.context';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class ValuationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  async create(createValuationDto: CreateValuationDto, context: TenantContext) {
    // Verify asset belongs to the same tenant
    const asset = await this.prisma.asset.findUnique({
      where: { id: createValuationDto.assetId },
    });

    if (!asset || asset.tenantId !== context.tenantId) {
      throw new ForbiddenException('Asset not found or belongs to another tenant');
    }

    const valuation = await this.prisma.valuation.create({
      data: {
        ...createValuationDto,
        date: new Date(createValuationDto.date),
        value: createValuationDto.value,
        tenantId: context.tenantId!,
      },
      include: { asset: true },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.CREATE,
        'Valuation',
        valuation.id,
        { assetId: valuation.assetId, value: valuation.value.toString(), currency: valuation.currency },
      );
    }

    return valuation;
  }

  async findAll(context: TenantContext, assetId?: string) {
    const where: any = {
      tenantId: context.tenantId!,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    return this.prisma.valuation.findMany({
      where,
      include: { asset: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, context: TenantContext) {
    const valuation = await this.prisma.valuation.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!valuation) {
      throw new NotFoundException('Valuation not found');
    }

    // Verify tenant access
    if (valuation.tenantId !== context.tenantId) {
      throw new ForbiddenException('Cannot access valuation from another tenant');
    }

    return valuation;
  }

  async update(id: string, updateValuationDto: UpdateValuationDto, context: TenantContext) {
    const valuation = await this.findOne(id, context);

    // Verify asset if changed
    if (updateValuationDto.assetId && updateValuationDto.assetId !== valuation.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: updateValuationDto.assetId },
      });

      if (!asset || asset.tenantId !== context.tenantId) {
        throw new ForbiddenException('Asset not found or belongs to another tenant');
      }
    }

    const data: any = { ...updateValuationDto };
    if (updateValuationDto.date) {
      data.date = new Date(updateValuationDto.date);
    }

    const updated = await this.prisma.valuation.update({
      where: { id },
      data,
      include: { asset: true },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.UPDATE,
        'Valuation',
        updated.id,
        { assetId: updated.assetId, value: updated.value.toString() },
      );
    }

    return updated;
  }

  async remove(id: string, context: TenantContext) {
    const valuation = await this.findOne(id, context);

    const deleted = await this.prisma.valuation.delete({
      where: { id },
    });

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.DELETE,
        'Valuation',
        deleted.id,
        { assetId: valuation.assetId },
      );
    }

    return deleted;
  }
}
