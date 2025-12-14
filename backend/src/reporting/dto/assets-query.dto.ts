import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AssetsQueryDto {
  @ApiProperty({ required: false, description: 'Filter by asset type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false, description: 'Filter by currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, description: 'Filter by legal entity ID' })
  @IsOptional()
  @IsString()
  legalEntityId?: string;

  @ApiProperty({ required: false, description: 'Filter by whether asset has valuation (true/false)', type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasValuation?: boolean;

  @ApiProperty({ required: false, description: 'Filter by tenant ID (SUPER_ADMIN only)' })
  @IsOptional()
  @IsString()
  tenantId?: string;

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
  @Max(100)
  limit?: number = 20;
}
