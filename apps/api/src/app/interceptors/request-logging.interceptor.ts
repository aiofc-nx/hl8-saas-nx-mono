/**
 * 请求日志拦截器
 *
 * 提供HTTP请求的详细日志记录功能，包括URL、租户ID、请求时间等信息。
 * 集成多租户支持和结构化日志记录，提供完整的请求追踪能力。
 *
 * @description 此拦截器提供HTTP请求的详细日志记录功能。
 * 记录请求URL、租户ID、请求时间、响应时间、状态码等关键信息。
 * 支持多租户架构，能够识别和记录租户上下文信息。
 *
 * ## 业务规则
 *
 * ### 日志记录规则
 * - 记录所有HTTP请求的详细信息
 * - 包含请求URL、方法、参数等
 * - 记录租户ID和用户上下文
 * - 记录请求处理时间和响应状态
 *
 * ### 多租户支持规则
 * - 从请求头中提取租户ID
 * - 支持多种租户ID传递方式
 * - 记录租户上下文信息
 * - 支持租户隔离的日志记录
 *
 * ### 性能监控规则
 * - 记录请求处理时间
 * - 监控响应时间性能
 * - 记录错误和异常情况
 * - 支持性能指标收集
 *
 * ## 业务逻辑流程
 *
 * 1. **请求拦截**：拦截所有HTTP请求
 * 2. **信息提取**：提取URL、租户ID、请求参数等信息
 * 3. **日志记录**：记录请求开始日志
 * 4. **请求处理**：继续处理请求
 * 5. **响应记录**：记录响应结果和性能指标
 *
 * @example
 * ```typescript
 * // 在应用模块中使用请求日志拦截器
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: RequestLoggingInterceptor,
 *     },
 *   ],
 * })
 * export class AppModule {}
 *
 * // 日志输出示例
 * {
 *   "level": "info",
 *   "time": "2024-01-01T00:00:00.000Z",
 *   "msg": "HTTP Request",
 *   "method": "GET",
 *   "url": "/api/metrics",
 *   "tenantId": "tenant-123",
 *   "requestId": "req-abc123",
 *   "userAgent": "Mozilla/5.0...",
 *   "ip": "127.0.0.1",
 *   "responseTime": 150
 * }
 * ```
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * 请求日志拦截器
 *
 * @description 提供HTTP请求的详细日志记录功能
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  /**
   * 拦截HTTP请求并记录日志
   *
   * @description 拦截所有HTTP请求，记录详细的请求信息
   * @param context - 执行上下文
   * @param next - 下一个处理程序
   * @returns 请求处理结果
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();

    // 过滤掉Chrome开发者工具的自动请求，避免噪音日志
    if (this.shouldSkipLogging(request)) {
      return next.handle();
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // 提取请求信息
    const requestInfo = this.extractRequestInfo(request, requestId);

    // 记录请求开始日志
    this.logger.log('HTTP Request Started', requestInfo);

    return next.handle().pipe(
      tap(() => {
        // 记录成功响应日志
        const responseTime = Date.now() - startTime;
        this.logger.log('HTTP Request Completed', {
          ...requestInfo,
          statusCode: reply.statusCode,
          responseTime,
          success: true,
        });
      }),
      catchError((error) => {
        // 记录错误响应日志
        const responseTime = Date.now() - startTime;
        this.logger.error('HTTP Request Failed', {
          ...requestInfo,
          statusCode: reply.statusCode || 500,
          responseTime,
          error: error.message,
          stack: error.stack,
          success: false,
        });
        throw error;
      })
    );
  }

  /**
   * 提取请求信息
   *
   * @description 从请求对象中提取关键信息
   * @param request - Fastify请求对象
   * @param requestId - 请求ID
   * @returns 请求信息对象
   */
  private extractRequestInfo(request: FastifyRequest, requestId: string) {
    // 提取租户ID
    const tenantId = this.extractTenantId(request);

    // 提取用户代理
    const userAgent = request.headers['user-agent'] || 'Unknown';

    // 提取IP地址
    const ip = this.extractClientIp(request);

    // 提取请求参数
    const query = request.query || {};
    const params = request.params || {};

    return {
      requestId,
      method: request.method,
      url: request.url,
      originalUrl: request.originalUrl || request.url,
      tenantId,
      userAgent,
      ip,
      query,
      params,
      headers: this.sanitizeHeaders(request.headers),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 提取租户ID
   *
   * @description 从请求头中提取租户ID
   * @param request - Fastify请求对象
   * @returns 租户ID或null
   */
  private extractTenantId(request: FastifyRequest): string | null {
    // 从X-Tenant-ID头中提取租户ID
    const tenantId = request.headers['x-tenant-id'] as string;
    if (tenantId) {
      return tenantId;
    }

    // 从Authorization头中提取租户ID（如果JWT包含租户信息）
    const authorization = request.headers.authorization;
    if (authorization && authorization.startsWith('Bearer ')) {
      // 这里可以解析JWT token获取租户ID
      // 实际实现需要根据JWT结构来解析
      return null;
    }

    // 从查询参数中提取租户ID
    const queryTenantId = (request.query as Record<string, unknown>)?.tenantId;
    if (queryTenantId && typeof queryTenantId === 'string') {
      return queryTenantId;
    }

    return null;
  }

  /**
   * 提取客户端IP地址
   *
   * @description 从请求中提取真实的客户端IP地址
   * @param request - Fastify请求对象
   * @returns 客户端IP地址
   */
  private extractClientIp(request: FastifyRequest): string {
    // 从X-Forwarded-For头中提取IP
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    // 从X-Real-IP头中提取IP
    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    // 使用连接IP
    return request.ip || 'Unknown';
  }

  /**
   * 清理请求头
   *
   * @description 移除敏感信息，只保留必要的请求头
   * @param headers - 原始请求头
   * @returns 清理后的请求头
   */
  private sanitizeHeaders(
    headers: Record<string, unknown>
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'content-type',
      'content-length',
      'accept',
      'accept-encoding',
      'accept-language',
      'user-agent',
      'referer',
      'origin',
      'x-tenant-id',
      'x-request-id',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value as string;
      }
    }

    return sanitized;
  }

  /**
   * 判断是否应该跳过日志记录
   *
   * @description 过滤掉不需要记录日志的请求，如Chrome开发者工具的自动请求
   * @param request - Fastify请求对象
   * @returns 是否应该跳过日志记录
   */
  private shouldSkipLogging(request: FastifyRequest): boolean {
    const url = request.url;

    // 过滤Chrome开发者工具的自动请求
    if (url.includes('.well-known/appspecific/com.chrome.devtools.json')) {
      return true;
    }

    // 过滤favicon.ico请求
    if (url.includes('favicon.ico')) {
      return true;
    }

    // 过滤其他常见的浏览器自动请求
    if (url.includes('.well-known/')) {
      return true;
    }

    return false;
  }

  /**
   * 生成请求ID
   *
   * @description 为每个请求生成唯一标识符
   * @returns 请求ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
