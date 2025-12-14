import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiHeader } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('tenants')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new tenant (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only SUPER_ADMIN can create tenants' })
  @ApiResponse({ status: 409, description: 'Tenant slug already exists' })
  create(
    @Body() createTenantDto: CreateTenantDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.tenantsService.create(createTenantDto, context);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all tenants (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'List of active tenants',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation',
          slug: 'acme-corp',
          isActive: true,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only SUPER_ADMIN can list tenants' })
  findAll(@TenantContextDecorator() context: TenantContext) {
    return this.tenantsService.findAll(context);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Tenant found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access tenant from another organization' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.tenantsService.findOne(id, context);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update tenant (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Tenant ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only SUPER_ADMIN can update tenants' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.tenantsService.update(id, updateTenantDto, context);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete tenant (soft delete, SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Tenant ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Tenant deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only SUPER_ADMIN can delete tenants' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  remove(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.tenantsService.remove(id, context);
  }
}
