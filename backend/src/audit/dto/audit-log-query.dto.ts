import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class AuditLogQueryDto {
  @ApiProperty({ required: false, description: 'Filter by tenant ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ required: false, description: 'Filter by actor user ID' })
  @IsOptional()
  @IsString()
  actorUserId?: string;

  @ApiProperty({ required: false, enum: AuditAction, description: 'Filter by action' })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiProperty({ required: false, description: 'Filter by entity type (e.g., User, Tenant)' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({ required: false, description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
