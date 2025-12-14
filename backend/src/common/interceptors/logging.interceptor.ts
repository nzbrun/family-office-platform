import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, ip } = request;
    const requestId = request.headers['x-request-id'] || uuidv4();
    
    // Attach request ID to request object for use in other parts of the app
    request.requestId = requestId;
    
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    this.logger.log({
      requestId,
      method,
      path,
      ip,
      timestamp,
      message: `Incoming request: ${method} ${path}`,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const latency = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log({
            requestId,
            method,
            path,
            statusCode,
            latency: `${latency}ms`,
            timestamp: new Date().toISOString(),
            message: `Request completed: ${method} ${path} - ${statusCode} (${latency}ms)`,
          });
        },
        error: (error) => {
          const latency = Date.now() - startTime;
          const statusCode = error?.status || 500;

          this.logger.error({
            requestId,
            method,
            path,
            statusCode,
            latency: `${latency}ms`,
            error: error?.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            message: `Request failed: ${method} ${path} - ${statusCode} (${latency}ms)`,
          });
        },
      }),
    );
  }
}
