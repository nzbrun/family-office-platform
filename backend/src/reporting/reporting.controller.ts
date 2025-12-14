import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { AssetsQueryDto } from './dto/assets-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('reporting')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('assets')
  @ApiOperation({ summary: 'Get assets with latest valuations for reporting' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by asset type' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' })
  @ApiQuery({ name: 'legalEntityId', required: false, description: 'Filter by legal entity ID' })
  @ApiQuery({ name: 'hasValuation', required: false, type: Boolean, description: 'Filter by whether asset has valuation' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID (SUPER_ADMIN only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiHeader({ name: 'X-Tenant-Id', required: false, description: 'Tenant ID for scoping (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Assets with latest valuations',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Apple Inc. Stock',
            type: 'EQUITY',
            currency: 'USD',
            legalEntityId: '123e4567-e89b-12d3-a456-426614174000',
            latestValuation: {
              date: '2024-01-01T00:00:00.000Z',
              value: '150000.50',
              currency: 'USD',
            },
            legalEntity: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Acme Holdings LLC',
              type: 'LLC',
              country: 'US',
            },
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
  getAssets(
    @Query() query: AssetsQueryDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.reportingService.getAssets(query, context);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary report with totals by currency, type, and legal entity' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID (SUPER_ADMIN only)' })
  @ApiHeader({ name: 'X-Tenant-Id', required: false, description: 'Tenant ID for scoping (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'Summary report',
    schema: {
      example: {
        totalsByCurrency: [
          { currency: 'USD', total: '500000.00' },
          { currency: 'EUR', total: '200000.00' },
        ],
        totalsByAssetType: [
          { type: 'EQUITY', total: '400000.00' },
          { type: 'BOND', total: '300000.00' },
        ],
        totalsByLegalEntity: [
          {
            legalEntityId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Acme Holdings LLC',
            total: '250000.00',
          },
        ],
        assetsWithoutValuationCount: 5,
        assetsCount: 25,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSummary(
    @TenantContextDecorator() context: TenantContext,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.reportingService.getSummary(context, tenantId);
  }
}
