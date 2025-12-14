import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssistantService } from './assistant.service';
import { AssistantQueryDto } from './dto/assistant-query.dto';
import { AssistantResponseDto } from './dto/assistant-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextDecorator } from '../common/decorators/tenant-context.decorator';
import type { TenantContext } from '../common/context/tenant.context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('assistant')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('query')
  @ApiOperation({
    summary: 'Query the AI assistant about portfolio data',
    description: 'Ask questions about your portfolio. The assistant can access reporting, assets, valuations, and audit logs (based on your role).',
  })
  @ApiResponse({
    status: 200,
    description: 'Assistant response',
    type: AssistantResponseDto,
    schema: {
      example: {
        answer: 'El portfolio tiene un valor total de $500,000 USD distribuido en 15 activos. Los principales tipos son EQUITY ($300,000) y BOND ($200,000).',
        actionsTaken: ['reporting_summary'],
        citations: ['Used 1 tool(s): reporting_summary'],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid message or tool execution error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 501,
    description: 'OpenAI API key not configured',
    schema: {
      example: {
        statusCode: 501,
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
        error: 'Not Implemented',
      },
    },
  })
  async query(
    @Body() queryDto: AssistantQueryDto,
    @TenantContextDecorator() context: TenantContext,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.query(queryDto.message, context);
  }
}
