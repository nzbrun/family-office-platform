import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ValuationsService } from './valuations.service';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { UpdateValuationDto } from './dto/update-valuation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('valuations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('valuations')
export class ValuationsController {
  constructor(private readonly valuationsService: ValuationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new valuation' })
  @ApiResponse({
    status: 201,
    description: 'Valuation created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        date: '2024-01-01T00:00:00.000Z',
        value: '150000.50',
        currency: 'USD',
        source: 'MANUAL',
        notes: 'Based on market price',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or currency mismatch',
    schema: {
      example: {
        statusCode: 400,
        message: 'Valuation currency (EUR) must match asset currency (USD)',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Asset not found or belongs to another tenant' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Valuation already exists for this asset on the specified date',
    schema: {
      example: {
        statusCode: 409,
        message: 'A valuation already exists for this asset on the specified date',
        error: 'Conflict',
      },
    },
  })
  create(
    @Body() createValuationDto: CreateValuationDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.valuationsService.create(createValuationDto, context);
  }

  @Get()
  @ApiOperation({ summary: 'Get all valuations' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Filter by asset ID' })
  @ApiResponse({
    status: 200,
    description: 'List of valuations',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @TenantContextDecorator() context: TenantContext,
    @Query('assetId') assetId?: string,
  ) {
    return this.valuationsService.findAll(context, assetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get valuation by ID' })
  @ApiParam({ name: 'id', description: 'Valuation ID' })
  @ApiResponse({
    status: 200,
    description: 'Valuation found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access valuation from another tenant' })
  @ApiResponse({ status: 404, description: 'Valuation not found' })
  findOne(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.valuationsService.findOne(id, context);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update valuation' })
  @ApiParam({ name: 'id', description: 'Valuation ID' })
  @ApiResponse({
    status: 200,
    description: 'Valuation updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or currency mismatch',
    schema: {
      example: {
        statusCode: 400,
        message: 'Valuation currency (EUR) must match asset currency (USD)',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Valuation not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Valuation already exists for this asset on the specified date',
  })
  update(
    @Param('id') id: string,
    @Body() updateValuationDto: UpdateValuationDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.valuationsService.update(id, updateValuationDto, context);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete valuation' })
  @ApiParam({ name: 'id', description: 'Valuation ID' })
  @ApiResponse({
    status: 200,
    description: 'Valuation deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Valuation not found' })
  remove(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.valuationsService.remove(id, context);
  }
}
