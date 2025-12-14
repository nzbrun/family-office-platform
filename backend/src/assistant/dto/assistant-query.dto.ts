import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssistantQueryDto {
  @ApiProperty({
    description: 'User message to the assistant',
    example: '¿Cuánto vale el portfolio?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
