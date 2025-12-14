import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLegalEntityDto {
  @ApiProperty({
    description: 'Legal entity name',
    example: 'Acme Holdings LLC',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Legal entity type',
    example: 'LLC',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Country code',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty()
  country: string;
}
