import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException, Inject, Optional } from '@nestjs/common';
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

    // Validate currency matches asset currency
    if (createValuationDto.currency !== asset.currency) {
      throw new BadRequestException(
        `Valuation currency (${createValuationDto.currency}) must match asset currency (${asset.currency})`,
      );
    }

    const valuationDate = new Date(createValuationDto.date);

    try {
      const valuation = await this.prisma.valuation.create({
        data: {
          ...createValuationDto,
          date: valuationDate,
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
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002' && error.meta?.target?.includes('tenantId_assetId_date')) {
        throw new ConflictException(
          'A valuation already exists for this asset on the specified date',
        );
      }
      throw error;
    }
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

    // Get asset (either from update or existing)
    const assetId = updateValuationDto.assetId || valuation.assetId;
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.tenantId !== context.tenantId) {
      throw new ForbiddenException('Asset not found or belongs to another tenant');
    }

    // Validate currency matches asset currency if currency is being updated
    if (updateValuationDto.currency && updateValuationDto.currency !== asset.currency) {
      throw new BadRequestException(
        `Valuation currency (${updateValuationDto.currency}) must match asset currency (${asset.currency})`,
      );
    }

    const data: any = { ...updateValuationDto };
    if (updateValuationDto.date) {
      data.date = new Date(updateValuationDto.date);
    }

    try {
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
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002' && error.meta?.target?.includes('tenantId_assetId_date')) {
        throw new ConflictException(
          'A valuation already exists for this asset on the specified date',
        );
      }
      throw error;
    }
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
