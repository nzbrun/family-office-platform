import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({
    description: 'Asset name',
    example: 'Apple Inc. Stock',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Asset type',
    example: 'EQUITY',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'Legal entity ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;

  @ApiProperty({
    description: 'Additional metadata (JSON)',
    example: { ticker: 'AAPL', exchange: 'NASDAQ' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
