import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';
import { TenantContextProvider } from '../context/tenant.context.provider';

export const TenantContextDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    const provider = new TenantContextProvider(request);
    return provider.getContext();
  },
);
