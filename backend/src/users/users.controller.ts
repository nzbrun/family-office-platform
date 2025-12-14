import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'USER',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot create users in another tenant' })
  create(
    @Body() createUserDto: CreateUserDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.usersService.create(createUserDto, context);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID (SUPER_ADMIN only)' })
  @ApiHeader({ name: 'X-Tenant-Id', required: false, description: 'Tenant ID for scoping (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          role: 'USER',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - USER role cannot list users' })
  findAll(
    @TenantContextDecorator() context: TenantContext,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.usersService.findAll(context, tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findMe(@TenantContextDecorator() context: TenantContext) {
    return this.usersService.findMe(context);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'USER',
        tenant: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation',
          slug: 'acme-corp',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access user from another tenant' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.usersService.findOne(id, context);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot update user from another tenant' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.usersService.update(id, updateUserDto, context);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete user from another tenant' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(
    @Param('id') id: string,
    @TenantContextDecorator() context: TenantContext,
  ) {
    return this.usersService.remove(id, context);
  }
}
