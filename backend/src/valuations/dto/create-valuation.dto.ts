import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateValuationDto {
  @ApiProperty({
    description: 'Asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({
    description: 'Valuation date (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Valuation value',
    example: 150000.50,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'Valuation source',
    example: 'MANUAL',
  })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Based on market price as of valuation date',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
