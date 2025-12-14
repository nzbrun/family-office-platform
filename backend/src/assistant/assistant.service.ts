import { Injectable, Inject, Optional, NotImplementedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ReportingService } from '../reporting/reporting.service';
import { AssetsService } from '../assets/assets.service';
import { ValuationsService } from '../valuations/valuations.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/context/tenant.context';
import { AuditAction } from '@prisma/client';
import type { OpenAIAdapter } from './openai-adapter.interface';

interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

@Injectable()
export class AssistantService {
  private openaiAdapter: OpenAIAdapter | null = null;
  private readonly maxToolCalls = 3;
  private readonly maxItemsInResponse = 50;

  constructor(
    private configService: ConfigService,
    private reportingService: ReportingService,
    private assetsService: AssetsService,
    private valuationsService: ValuationsService,
    private auditService: AuditService,
    private prisma: PrismaService,
    @Optional() @Inject('OPENAI_ADAPTER') private customAdapter?: OpenAIAdapter,
  ) {
    // Use custom adapter for testing, or create OpenAI client
    if (customAdapter) {
      this.openaiAdapter = customAdapter;
    } else {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (apiKey) {
        const openai = new OpenAI({ apiKey });
        this.openaiAdapter = {
          chat: {
            completions: {
              create: (params: any) => openai.chat.completions.create(params),
            },
          },
        };
      }
    }
  }

  async query(message: string, context: TenantContext): Promise<{
    answer: string;
    actionsTaken: string[];
    citations: string[];
  }> {
    if (!this.openaiAdapter) {
      throw new NotImplementedException(
        'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
      );
    }

    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const actionsTaken: string[] = [];
    const citations: string[] = [];
    let toolCallsCount = 0;

    const systemPrompt = `You are a read-only investment portfolio assistant. Your role is to help users understand their portfolio data.

STRICT RULES:
1. NEVER modify, create, update, or delete any data
2. NEVER ignore RBAC (Role-Based Access Control) or tenant isolation
3. ONLY use the tools provided to you
4. If you need information that's not available through tools, ask the user for clarification
5. Always respect tenant boundaries - you can only access data from the user's tenant
6. For audit_logs tool: Only SUPER_ADMIN and ADMIN roles can use it. USER role cannot access audit logs.
7. Limit your responses to the most relevant information
8. If a tool returns many items, summarize the key points instead of listing everything

Available tools:
- reporting_summary: Get portfolio summary with totals by currency, asset type, and legal entity
- reporting_assets: Get assets with latest valuations (supports filters: type, currency, legalEntityId, hasValuation)
- asset_get: Get a specific asset by ID with its details
- valuations_list: Get valuations for an asset (supports filters: assetId, startDate, endDate, limit)
- audit_logs: Get audit logs (only for SUPER_ADMIN/ADMIN, supports filters: tenantId, actorUserId, action, entity, startDate, endDate)

User context:
- Role: ${context.role}
- Tenant ID: ${context.tenantId || 'N/A'}

Always provide helpful, accurate responses based on the data available through tools.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    let finalAnswer = '';
    let currentToolCalls: ToolCall[] = [];

    // Execute conversation with tool calling (max 3 iterations)
    for (let iteration = 0; iteration < this.maxToolCalls; iteration++) {
      const response = await this.openaiAdapter.chat.completions.create({
        model,
        messages,
        tools: this.getToolsDefinition(context),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage = response.choices[0].message;

      messages.push(assistantMessage);

      if (assistantMessage.content && !assistantMessage.tool_calls) {
        finalAnswer = assistantMessage.content;
        break;
      }

      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        if (assistantMessage.content) {
          finalAnswer = assistantMessage.content;
        }
        break;
      }

      // Process tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCallsCount >= this.maxToolCalls) {
          break;
        }

        // Handle both function and custom tool calls
        const toolName = 'function' in toolCall ? toolCall.function.name : toolCall.type;
        const toolArgs = 'function' in toolCall 
          ? JSON.parse(toolCall.function.arguments || '{}')
          : {};

        actionsTaken.push(toolName);
        currentToolCalls.push({
          id: toolCall.id,
          name: toolName,
          arguments: toolArgs,
        });

        try {
          const toolResult = await this.executeTool(toolName, toolArgs, context);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(this.limitResponseSize(toolResult)),
          });
          toolCallsCount++;
        } catch (error: any) {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message || 'Tool execution failed' }),
          });
        }
      }

      // If no more tool calls, break
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        break;
      }
    }

    // Extract citations from tool results
    if (currentToolCalls.length > 0) {
      citations.push(`Used ${currentToolCalls.length} tool(s): ${currentToolCalls.map(t => t.name).join(', ')}`);
    }

    // Ensure we have an answer
    if (!finalAnswer) {
      finalAnswer = 'No pude procesar tu consulta. Por favor, intenta reformular tu pregunta.';
    }

    // Record audit log
    await this.auditService.recordFromContext(
      context,
      AuditAction.READ,
      'AssistantQuery',
      null,
      {
        message: message.substring(0, 200), // Truncate message
        toolCalls: currentToolCalls.map(t => t.name),
        filters: currentToolCalls.map(t => t.arguments),
        responseSize: finalAnswer.length,
      },
    );

    return {
      answer: finalAnswer,
      actionsTaken,
      citations,
    };
  }

  private getToolsDefinition(context: TenantContext): OpenAI.Chat.Completions.ChatCompletionTool[] {
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'reporting_summary',
          description: 'Get portfolio summary with totals by currency, asset type, and legal entity',
          parameters: {
            type: 'object',
            properties: {
              tenantId: {
                type: 'string',
                description: 'Tenant ID (SUPER_ADMIN only, optional)',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'reporting_assets',
          description: 'Get assets with latest valuations. Supports filtering by type, currency, legalEntityId, and hasValuation',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Filter by asset type' },
              currency: { type: 'string', description: 'Filter by currency' },
              legalEntityId: { type: 'string', description: 'Filter by legal entity ID' },
              hasValuation: { type: 'boolean', description: 'Filter by whether asset has valuation' },
              tenantId: { type: 'string', description: 'Tenant ID (SUPER_ADMIN only, optional)' },
              page: { type: 'number', description: 'Page number (default: 1)' },
              limit: { type: 'number', description: 'Items per page (default: 20, max: 50)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'asset_get',
          description: 'Get a specific asset by ID with its details and latest valuation',
          parameters: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Asset ID',
              },
            },
            required: ['id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'valuations_list',
          description: 'Get valuations for an asset. Supports filtering by date range and limiting results',
          parameters: {
            type: 'object',
            properties: {
              assetId: {
                type: 'string',
                description: 'Asset ID',
              },
              startDate: {
                type: 'string',
                description: 'Start date (ISO 8601, optional)',
              },
              endDate: {
                type: 'string',
                description: 'End date (ISO 8601, optional)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 50, max: 50)',
              },
            },
            required: ['assetId'],
          },
        },
      },
    ];

    // Only add audit_logs tool for SUPER_ADMIN and ADMIN
    if (context.role === 'SUPER_ADMIN' || context.role === 'ADMIN') {
      tools.push({
        type: 'function',
        function: {
          name: 'audit_logs',
          description: 'Get audit logs. Supports filtering by tenantId, actorUserId, action, entity, and date range',
          parameters: {
            type: 'object',
            properties: {
              tenantId: { type: 'string', description: 'Filter by tenant ID (SUPER_ADMIN only)' },
              actorUserId: { type: 'string', description: 'Filter by actor user ID' },
              action: { type: 'string', description: 'Filter by action (LOGIN, CREATE, UPDATE, DELETE, READ)' },
              entity: { type: 'string', description: 'Filter by entity type' },
              startDate: { type: 'string', description: 'Start date (ISO 8601)' },
              endDate: { type: 'string', description: 'End date (ISO 8601)' },
              page: { type: 'number', description: 'Page number (default: 1)' },
              limit: { type: 'number', description: 'Items per page (default: 20, max: 50)' },
            },
          },
        },
      });
    }

    return tools;
  }

  private async executeTool(
    toolName: string,
    args: any,
    context: TenantContext,
  ): Promise<any> {
    // Reject unknown tools
    const allowedTools = ['reporting_summary', 'reporting_assets', 'asset_get', 'valuations_list', 'audit_logs'];
    if (!allowedTools.includes(toolName)) {
      throw new BadRequestException(`Unknown tool: ${toolName}`);
    }

    // Check RBAC for audit_logs
    if (toolName === 'audit_logs' && context.role !== 'SUPER_ADMIN' && context.role !== 'ADMIN') {
      throw new BadRequestException('audit_logs tool is only available for SUPER_ADMIN and ADMIN roles');
    }

    switch (toolName) {
      case 'reporting_summary':
        return await this.reportingService.getSummary(context, args.tenantId);

      case 'reporting_assets':
        const assetsQuery = {
          type: args.type,
          currency: args.currency,
          legalEntityId: args.legalEntityId,
          hasValuation: args.hasValuation,
          tenantId: args.tenantId,
          page: args.page || 1,
          limit: Math.min(args.limit || 20, this.maxItemsInResponse),
        };
        return await this.reportingService.getAssets(assetsQuery, context);

      case 'asset_get':
        if (!args.id) {
          throw new BadRequestException('asset_get requires id parameter');
        }
        return await this.assetsService.findOne(args.id, context);

      case 'valuations_list':
        if (!args.assetId) {
          throw new BadRequestException('valuations_list requires assetId parameter');
        }
        const valuations = await this.valuationsService.findAll(context, args.assetId);
        // Apply date filters and limit
        let filtered = valuations;
        if (args.startDate) {
          filtered = filtered.filter((v) => v.date >= new Date(args.startDate));
        }
        if (args.endDate) {
          filtered = filtered.filter((v) => v.date <= new Date(args.endDate));
        }
        const valuationsLimit = Math.min(args.limit || 50, this.maxItemsInResponse);
        return filtered.slice(0, valuationsLimit);

      case 'audit_logs':
        const auditQuery = {
          tenantId: args.tenantId,
          actorUserId: args.actorUserId,
          action: args.action,
          entity: args.entity,
          startDate: args.startDate,
          endDate: args.endDate,
          page: args.page || 1,
          limit: Math.min(args.limit || 20, this.maxItemsInResponse),
        };
        // Use Prisma directly to query audit logs (similar to AuditController)
        const auditPage = auditQuery.page || 1;
        const auditLimit = Math.min(auditQuery.limit || 20, this.maxItemsInResponse);
        const auditSkip = (auditPage - 1) * auditLimit;

        const where: any = {};
        if (context.role === 'SUPER_ADMIN') {
          if (auditQuery.tenantId) {
            where.tenantId = auditQuery.tenantId;
          }
        } else if (context.role === 'ADMIN') {
          where.tenantId = context.tenantId;
        }

        if (auditQuery.actorUserId) {
          where.actorUserId = auditQuery.actorUserId;
        }
        if (auditQuery.action) {
          where.action = auditQuery.action;
        }
        if (auditQuery.entity) {
          where.entity = auditQuery.entity;
        }
        if (auditQuery.startDate || auditQuery.endDate) {
          where.createdAt = {};
          if (auditQuery.startDate) {
            where.createdAt.gte = new Date(auditQuery.startDate);
          }
          if (auditQuery.endDate) {
            where.createdAt.lte = new Date(auditQuery.endDate);
          }
        }

        const total = await this.prisma.auditLog.count({ where });
        const data = await this.prisma.auditLog.findMany({
          where,
          skip: auditSkip,
          take: auditLimit,
          orderBy: { createdAt: 'desc' },
        });

        return {
          data: data.slice(0, this.maxItemsInResponse),
          pagination: {
            page: auditPage,
            limit: auditLimit,
            total,
            totalPages: Math.ceil(total / auditLimit),
          },
        };

      default:
        throw new BadRequestException(`Tool ${toolName} not implemented`);
    }
  }

  private limitResponseSize(data: any): any {
    // Limit arrays to maxItemsInResponse
    if (Array.isArray(data)) {
      return data.slice(0, this.maxItemsInResponse);
    }

    // Limit nested arrays in objects
    if (data && typeof data === 'object') {
      const limited: any = { ...data };
      if (limited.data && Array.isArray(limited.data)) {
        limited.data = limited.data.slice(0, this.maxItemsInResponse);
      }
      return limited;
    }

    return data;
  }
}
