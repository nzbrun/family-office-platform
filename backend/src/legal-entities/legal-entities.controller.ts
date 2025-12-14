import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LegalEntitiesService } from './legal-entities.service';
import { CreateLegalEntityDto } from './dto/create-legal-entity.dto';
import { UpdateLegalEntityDto } from './dto/update-legal-entity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('legal-entities')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('legal-entities')
export class LegalEntitiesController {
  constructor(private readonly legalEntitiesService: LegalEntitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new legal entity' })
  @ApiResponse({
    status: 201,
    description: 'Legal entity created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Holdings LLC',
        type: 'LLC',
        country: 'US',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createLegalEntityDto: CreateLegalEntityDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.legalEntitiesService.create(createLegalEntityDto, context);
  }

  @Get()
  @ApiOperation({ summary: 'Get all legal entities' })
  @ApiResponse({
    status: 200,
    description: 'List of legal entities',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@TenantContextDecorator() context: TenantContext) {
    return this.legalEntitiesService.findAll(context);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get legal entity by ID' })
  @ApiParam({ name: 'id', description: 'Legal entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Legal entity found',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access legal entity from another tenant' })
  @ApiResponse({ status: 404, description: 'Legal entity not found' })
  findOne(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.legalEntitiesService.findOne(id, context);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update legal entity' })
  @ApiParam({ name: 'id', description: 'Legal entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Legal entity updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Legal entity not found' })
  update(
    @Param('id') id: string,
    @Body() updateLegalEntityDto: UpdateLegalEntityDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.legalEntitiesService.update(id, updateLegalEntityDto, context);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete legal entity' })
  @ApiParam({ name: 'id', description: 'Legal entity ID' })
  @ApiResponse({
    status: 200,
    description: 'Legal entity deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Legal entity not found' })
  remove(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.legalEntitiesService.remove(id, context);
  }
}
