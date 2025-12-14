import { ApiProperty } from '@nestjs/swagger';

export class AssistantResponseDto {
  @ApiProperty({
    description: 'Assistant response text',
    example: 'El portfolio tiene un valor total de $500,000 USD distribuido en...',
  })
  answer: string;

  @ApiProperty({
    description: 'List of tools/actions taken by the assistant',
    example: ['reporting_summary', 'reporting_assets'],
    type: [String],
  })
  actionsTaken: string[];

  @ApiProperty({
    description: 'Citations or references used in the response',
    example: ['Asset: Apple Inc. Stock', 'Valuation: 2024-01-01'],
    type: [String],
  })
  citations: string[];
}
