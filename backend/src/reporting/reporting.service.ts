import { Injectable, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/context/tenant.context';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { AssetsQueryDto } from './dto/assets-query.dto';

@Injectable()
export class ReportingService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  async getAssets(query: AssetsQueryDto, context: TenantContext) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Determine effective tenant ID
    let effectiveTenantId: string;
    if (context.role === 'SUPER_ADMIN') {
      effectiveTenantId = query.tenantId || context.tenantId || context.effectiveTenantId || '';
    } else {
      effectiveTenantId = context.tenantId!;
    }

    // Build where clause
    const where: any = {
      tenantId: effectiveTenantId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.currency) {
      where.currency = query.currency;
    }

    if (query.legalEntityId) {
      where.legalEntityId = query.legalEntityId;
    }

    // Get all assets first (we need to check valuations for hasValuation filter)
    const allAssets = await this.prisma.asset.findMany({
      where,
      include: {
        legalEntity: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get latest valuations for all assets
    const assetIds = allAssets.map((asset) => asset.id);
    const allValuations = await this.prisma.valuation.findMany({
      where: {
        assetId: { in: assetIds },
      },
      orderBy: { date: 'desc' },
    });

    // Get latest valuation per asset
    const latestValuationsMap = new Map<string, typeof allValuations[0]>();
    allValuations.forEach((valuation) => {
      if (!latestValuationsMap.has(valuation.assetId)) {
        latestValuationsMap.set(valuation.assetId, valuation);
      }
    });
    const latestValuations = Array.from(latestValuationsMap.values());

    // Create a map of assetId -> latest valuation
    const valuationMap = new Map(
      latestValuations.map((v) => [
        v.assetId,
        {
          date: v.date,
          value: v.value,
          currency: v.currency,
        },
      ]),
    );

    // Add latestValuation to all assets
    let assetsWithValuations = allAssets.map((asset) => ({
      ...asset,
      latestValuation: valuationMap.get(asset.id) || null,
    }));

    // Filter by hasValuation if specified
    if (query.hasValuation !== undefined) {
      assetsWithValuations = assetsWithValuations.filter((asset) =>
        query.hasValuation ? asset.latestValuation !== null : asset.latestValuation === null,
      );
    }

    // Apply pagination after filtering
    const total = assetsWithValuations.length;
    const paginatedAssets = assetsWithValuations.slice(skip, skip + limit);

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.READ,
        'Reporting',
        null,
        {
          endpoint: '/reporting/assets',
          filters: {
            type: query.type,
            currency: query.currency,
            legalEntityId: query.legalEntityId,
            hasValuation: query.hasValuation,
            tenantId: query.tenantId,
          },
        },
      );
    }

    return {
      data: paginatedAssets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSummary(context: TenantContext, tenantIdFilter?: string) {
    // Determine effective tenant ID
    let effectiveTenantId: string;
    if (context.role === 'SUPER_ADMIN') {
      effectiveTenantId = tenantIdFilter || context.tenantId || context.effectiveTenantId || '';
    } else {
      effectiveTenantId = context.tenantId!;
    }

    // Get all assets with their latest valuations
    const assets = await this.prisma.asset.findMany({
      where: {
        tenantId: effectiveTenantId,
      },
      include: {
        legalEntity: true,
      },
    });

    // Get latest valuations for all assets
    const assetIds = assets.map((asset) => asset.id);
    const allValuations = await this.prisma.valuation.findMany({
      where: {
        assetId: { in: assetIds },
      },
      orderBy: { date: 'desc' },
    });

    // Get latest valuation per asset
    const latestValuationsMap = new Map<string, typeof allValuations[0]>();
    allValuations.forEach((valuation) => {
      if (!latestValuationsMap.has(valuation.assetId)) {
        latestValuationsMap.set(valuation.assetId, valuation);
      }
    });
    const latestValuations = Array.from(latestValuationsMap.values());

    // Create a map of assetId -> latest valuation
    const valuationMap = new Map(
      latestValuations.map((v) => [
        v.assetId,
        {
          value: v.value,
          currency: v.currency,
        },
      ]),
    );

    // Calculate totals
    const totalsByCurrency = new Map<string, number>();
    const totalsByAssetType = new Map<string, number>();
    const totalsByLegalEntity = new Map<string, { name: string; total: number }>();
    let assetsWithoutValuationCount = 0;

    assets.forEach((asset) => {
      const valuation = valuationMap.get(asset.id);

      if (valuation) {
        // Add to currency totals
        const currencyTotal = totalsByCurrency.get(valuation.currency) || 0;
        totalsByCurrency.set(valuation.currency, currencyTotal + Number(valuation.value));

        // Add to asset type totals
        const typeTotal = totalsByAssetType.get(asset.type) || 0;
        totalsByAssetType.set(asset.type, typeTotal + Number(valuation.value));

        // Add to legal entity totals (only if asset has legalEntityId)
        if (asset.legalEntityId) {
          const entityKey = asset.legalEntityId;
          const entityData = totalsByLegalEntity.get(entityKey) || {
            name: asset.legalEntity?.name || 'Unknown',
            total: 0,
          };
          entityData.total += Number(valuation.value);
          totalsByLegalEntity.set(entityKey, entityData);
        }
      } else {
        assetsWithoutValuationCount++;
      }
    });

    // Convert maps to arrays
    const totalsByCurrencyArray = Array.from(totalsByCurrency.entries()).map(([currency, total]) => ({
      currency,
      total: total.toString(),
    }));

    const totalsByAssetTypeArray = Array.from(totalsByAssetType.entries()).map(([type, total]) => ({
      type,
      total: total.toString(),
    }));

    const totalsByLegalEntityArray = Array.from(totalsByLegalEntity.entries()).map(([legalEntityId, data]) => ({
      legalEntityId,
      name: data.name,
      total: data.total.toString(),
    }));

    // Record audit log
    if (this.auditService) {
      await this.auditService.recordFromContext(
        context,
        AuditAction.READ,
        'Reporting',
        null,
        {
          endpoint: '/reporting/summary',
          tenantId: effectiveTenantId,
        },
      );
    }

    return {
      totalsByCurrency: totalsByCurrencyArray,
      totalsByAssetType: totalsByAssetTypeArray,
      totalsByLegalEntity: totalsByLegalEntityArray,
      assetsWithoutValuationCount,
      assetsCount: assets.length,
    };
  }
}
