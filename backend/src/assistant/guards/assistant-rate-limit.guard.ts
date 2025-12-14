import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import type { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class AssistantRateLimitGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    reflector: Reflector,
    private configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const context = requestProps.context as ExecutionContext;
    const request = context.switchToHttp().getRequest();
    const tenantContext = request.user as TenantContext;

    if (!tenantContext) {
      return true; // Let other guards handle auth
    }

    const ttl = 60000; // 1 minute
    const userLimit = this.configService.get<number>('ASSISTANT_RATE_LIMIT_USER') || 10;
    const tenantLimit = this.configService.get<number>('ASSISTANT_RATE_LIMIT_TENANT') || 20;

    // Create unique key for user
    const userKey = `assistant:user:${tenantContext.userId}`;
    const userRecord = await this.storageService.increment(userKey, ttl, userLimit, 0, 'assistant-user');
    if (userRecord.totalHits > userLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded for user',
          retryAfter: Math.ceil(ttl / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check tenant rate limit (if tenantId exists)
    if (tenantContext.tenantId) {
      const tenantKey = `assistant:tenant:${tenantContext.tenantId}`;
      const tenantRecord = await this.storageService.increment(tenantKey, ttl, tenantLimit, 0, 'assistant-tenant');
      if (tenantRecord.totalHits > tenantLimit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded for tenant',
            retryAfter: Math.ceil(ttl / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }
}
