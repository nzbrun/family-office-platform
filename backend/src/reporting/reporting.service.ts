import { Injectable, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/context/tenant.context';
import { AuditService } from '../audit/audit.service';
import { AuditAction, Prisma } from '@prisma/client';
import { AssetsQueryDto } from './dto/assets-query.dto';

@Injectable()
export class ReportingService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(AuditService) private auditService?: AuditService,
  ) {}

  /**
   * Efficiently get latest valuation per asset using SQL ROW_NUMBER()
   * This avoids loading all valuations in memory by using a window function
   * Returns only the most recent valuation per asset
   */
  private async getLatestValuationsByAssetIds(assetIds: string[]): Promise<Map<string, { date: Date; value: any; currency: string }>> {
    if (assetIds.length === 0) {
      return new Map();
    }

    // Use a subquery with ROW_NUMBER() to get only the latest valuation per asset
    // This is more efficient than loading all valuations and filtering in memory
    // assetIds come from the database, so they're safe to use in the query
    const placeholders = assetIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT id, "assetId", date, value, currency
      FROM (
        SELECT 
          id, "assetId", date, value, currency,
          ROW_NUMBER() OVER (PARTITION BY "assetId" ORDER BY date DESC) as rn
        FROM valuations
        WHERE "assetId" IN (${placeholders})
      ) ranked
      WHERE rn = 1
    `;

    const latestValuations = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      assetId: string;
      date: Date;
      value: any;
      currency: string;
    }>>(query, ...assetIds);

    const valuationMap = new Map<string, { date: Date; value: any; currency: string }>();
    latestValuations.forEach((v) => {
      valuationMap.set(v.assetId, {
        date: v.date,
        value: v.value, // Prisma Decimal, will be converted to string in JSON
        currency: v.currency,
      });
    });

    return valuationMap;
  }

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

    // Get latest valuations efficiently using SQL ROW_NUMBER() (avoids loading all valuations)
    const assetIds = allAssets.map((asset) => asset.id);
    const valuationMap = await this.getLatestValuationsByAssetIds(assetIds);

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

    // Get all assets
    const assets = await this.prisma.asset.findMany({
      where: {
        tenantId: effectiveTenantId,
      },
      include: {
        legalEntity: true,
      },
    });

    // Get latest valuations efficiently using SQL ROW_NUMBER() (avoids loading all valuations)
    const assetIds = assets.map((asset) => asset.id);
    const latestValuationsMap = await this.getLatestValuationsByAssetIds(assetIds);

    // Calculate totals
    const totalsByCurrency = new Map<string, number>();
    const totalsByAssetType = new Map<string, number>();
    const totalsByLegalEntity = new Map<string, { name: string; total: number }>();
    let assetsWithoutValuationCount = 0;

    assets.forEach((asset) => {
      const latestValuation = latestValuationsMap.get(asset.id);
      const valuation = latestValuation ? {
        value: latestValuation.value,
        currency: latestValuation.currency,
      } : null;

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
