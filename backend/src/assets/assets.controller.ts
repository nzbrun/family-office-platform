import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('assets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({
    status: 201,
    description: 'Asset created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Apple Inc. Stock',
        type: 'EQUITY',
        currency: 'USD',
        legalEntityId: null,
        metadata: { ticker: 'AAPL', exchange: 'NASDAQ' },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createAssetDto: CreateAssetDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.assetsService.create(createAssetDto, context);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiQuery({ name: 'legalEntityId', required: false, description: 'Filter by legal entity ID' })
  @ApiResponse({
    status: 200,
    description: 'List of assets',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @TenantContextDecorator() context: TenantContext,
    @Query('legalEntityId') legalEntityId?: string,
  ) {
    return this.assetsService.findAll(context, legalEntityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access asset from another tenant' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  findOne(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.assetsService.findOne(id, context);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.assetsService.update(id, updateAssetDto, context);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete asset' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  remove(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.assetsService.remove(id, context);
  }
}
