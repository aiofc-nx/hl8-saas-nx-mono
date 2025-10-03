/**
 * 请求/响应拦截器中间件
 *
 * 提供统一的请求/响应处理、日志记录、审计跟踪等企业级功能。
 *
 * @description 此中间件提供统一的请求/响应处理功能。
 * 包括请求日志记录、响应格式化、审计跟踪、错误处理等企业级功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 请求拦截规则
 * - 记录请求开始时间和唯一请求ID
 * - 提取租户ID、用户ID等上下文信息
 * - 记录请求头、方法、URL等关键信息
 * - 支持自定义请求处理逻辑
 *
 * ### 响应拦截规则
 * - 记录响应时间、状态码、响应大小
 * - 统一响应格式和错误处理
 * - 记录审计日志和操作轨迹
 * - 支持自定义响应处理逻辑
 *
 * ### 日志记录规则
 * - 结构化日志记录
 * - 支持不同日志级别
 * - 包含请求上下文信息
 * - 支持日志采样和过滤
 *
 * @example
 * ```typescript
 * // 配置拦截器中间件
 * const interceptor = new RequestInterceptorMiddleware({
 *   enableLogging: true,
 *   enableAudit: true,
 *   logLevel: 'info',
 *   requestIdHeader: 'X-Request-ID',
 *   tenantHeader: 'X-Tenant-ID',
 *   userIdHeader: 'X-User-ID'
 * });
 *
 * // 注册拦截器中间件
 * fastify.register(interceptor);
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

/**
 * 拦截器配置接口
 */
export interface IRequestInterceptorConfig {
  /** 是否启用日志记录 */
  enableLogging?: boolean;

  /** 是否启用审计跟踪 */
  enableAudit?: boolean;

  /** 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /** 请求ID头部名称 */
  requestIdHeader?: string;

  /** 租户ID头部名称 */
  tenantHeader?: string;

  /** 用户ID头部名称 */
  userIdHeader?: string;

  /** 是否记录请求体 */
  logRequestBody?: boolean;

  /** 是否记录响应体 */
  logResponseBody?: boolean;

  /** 请求体最大记录大小 */
  maxBodyLogSize?: number;

  /** 是否启用性能监控 */
  enablePerformanceTracking?: boolean;

  /** 自定义请求处理器 */
  onRequest?: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => Promise<void> | void;

  /** 自定义响应处理器 */
  onResponse?: (
    request: FastifyRequest,
    reply: FastifyReply,
    payload: unknown
  ) => Promise<unknown> | unknown;

  /** 自定义错误处理器 */
  onError?: (
    request: FastifyRequest,
    reply: FastifyReply,
    error: Error
  ) => Promise<void> | void;
}

/**
 * 请求上下文接口
 */
export interface IRequestContext {
  /** 请求ID */
  requestId: string;

  /** 租户ID */
  tenantId?: string;

  /** 用户ID */
  userId?: string;

  /** 开始时间 */
  startTime: number;

  /** 请求方法 */
  method: string;

  /** 请求URL */
  url: string;

  /** 客户端IP */
  clientIP: string;

  /** 用户代理 */
  userAgent?: string;
}

/**
 * 请求拦截器中间件类
 *
 * @description 提供统一的请求/响应处理功能
 */
export class RequestInterceptorMiddleware {
  private readonly config: IRequestInterceptorConfig & {
    enableLogging: boolean;
    enableAudit: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    requestIdHeader: string;
    tenantHeader: string;
    userIdHeader: string;
    logRequestBody: boolean;
    logResponseBody: boolean;
    maxBodyLogSize: number;
    enablePerformanceTracking: boolean;
  };

  constructor(config: IRequestInterceptorConfig = {}) {
    this.config = {
      enableLogging: true,
      enableAudit: true,
      logLevel: 'info',
      requestIdHeader: 'X-Request-ID',
      tenantHeader: 'X-Tenant-ID',
      userIdHeader: 'X-User-ID',
      logRequestBody: false,
      logResponseBody: false,
      maxBodyLogSize: 1024,
      enablePerformanceTracking: true,
      ...config,
    };
  }

  /**
   * 注册拦截器中间件
   *
   * @description 将拦截器中间件注册到Fastify实例
   */
  register(fastify: FastifyInstance): void {
    // 请求拦截器
    fastify.addHook(
      'onRequest',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const context = this.createRequestContext(request);

        // 设置请求上下文
        (request as unknown as { __requestContext: IRequestContext }).__requestContext = context;

        // 设置请求ID到响应头
        reply.header(this.config.requestIdHeader, context.requestId);

        // 记录请求日志
        if (this.config.enableLogging) {
          this.logRequest(request, context);
        }

        // 执行自定义请求处理器
        if (this.config.onRequest) {
          await this.config.onRequest(request, reply);
        }
      }
    );

    // 响应拦截器
    fastify.addHook(
      'onSend',
      async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
        const context = (request as unknown as { __requestContext: IRequestContext }).__requestContext;

        if (context) {
          // 记录响应日志
          if (this.config.enableLogging) {
            this.logResponse(request, reply, context);
          }

          // 执行自定义响应处理器
          if (this.config.onResponse) {
            return await this.config.onResponse(request, reply, payload);
          }
        }

        return payload;
      }
    );

    // 错误拦截器
    fastify.addHook(
      'onError',
      async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
        const context = (request as unknown as { __requestContext: IRequestContext }).__requestContext;

        // 记录错误日志
        if (this.config.enableLogging) {
          this.logError(request, reply, error, context);
        }

        // 执行自定义错误处理器
        if (this.config.onError) {
          await this.config.onError(request, reply, error);
        }
      }
    );
  }

  /**
   * 创建请求上下文
   *
   * @description 从请求中提取上下文信息
   */
  public createRequestContext(request: FastifyRequest): IRequestContext {
    const requestId = this.getOrCreateRequestId(request);
    const tenantId = this.extractHeader(request, this.config.tenantHeader);
    const userId = this.extractHeader(request, this.config.userIdHeader);
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] as string;

    return {
      requestId,
      tenantId,
      userId,
      startTime: Date.now(),
      method: request.method,
      url: request.url,
      clientIP,
      userAgent,
    };
  }

  /**
   * 获取或创建请求ID
   *
   * @description 从请求头获取或生成新的请求ID
   */
  private getOrCreateRequestId(request: FastifyRequest): string {
    const existingId = request.headers[
      this.config.requestIdHeader.toLowerCase()
    ] as string;
    return existingId || randomUUID();
  }

  /**
   * 提取请求头值
   *
   * @description 从请求头中提取指定值
   */
  private extractHeader(
    request: FastifyRequest,
    headerName: string
  ): string | undefined {
    const value = request.headers[headerName.toLowerCase()] as string;
    return value || undefined;
  }

  /**
   * 获取客户端IP
   *
   * @description 获取客户端真实IP地址
   */
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    const remoteAddress = request.socket.remoteAddress;

    if (forwarded) {
      return Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0].trim();
    }

    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    return remoteAddress || 'unknown';
  }

  /**
   * 记录请求日志
   *
   * @description 记录请求开始日志
   */
  private logRequest(request: FastifyRequest, context: IRequestContext): void {
    const logData = {
      type: 'request',
      requestId: context.requestId,
      method: context.method,
      url: context.url,
      clientIP: context.clientIP,
      userAgent: context.userAgent,
      tenantId: context.tenantId,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    };

    if (this.config.logRequestBody && request.body) {
      const body = this.truncateBody(request.body, this.config.maxBodyLogSize);
      (logData as unknown as { body: unknown }).body = body;
    }

    this.log(this.config.logLevel, 'Request started', logData);
  }

  /**
   * 记录响应日志
   *
   * @description 记录请求完成日志
   */
  private logResponse(
    request: FastifyRequest,
    reply: FastifyReply,
    context: IRequestContext
  ): void {
    const duration = Date.now() - context.startTime;
    const statusCode = reply.statusCode;
    const responseSize = this.getResponseSize(reply);

    const logData = {
      type: 'response',
      requestId: context.requestId,
      method: context.method,
      url: context.url,
      statusCode,
      duration,
      responseSize,
      tenantId: context.tenantId,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    };

    if (this.config.logResponseBody && (reply as unknown as { payload: unknown }).payload) {
      const body = this.truncateBody(
        (reply as unknown as { payload: unknown }).payload,
        this.config.maxBodyLogSize
      );
      (logData as unknown as { body: unknown }).body = body;
    }

    this.log(this.config.logLevel, 'Request completed', logData);
  }

  /**
   * 记录错误日志
   *
   * @description 记录请求错误日志
   */
  public logError(
    request: FastifyRequest,
    reply: FastifyReply,
    error: Error,
    context: IRequestContext
  ): void {
    const duration = Date.now() - context.startTime;
    const statusCode = reply.statusCode;

    const logData = {
      type: 'error',
      requestId: context.requestId,
      method: context.method,
      url: context.url,
      statusCode,
      duration,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      tenantId: context.tenantId,
      userId: context.userId,
      timestamp: new Date().toISOString(),
    };

    this.log('error', 'Request failed', logData);
  }

  /**
   * 获取响应大小
   *
   * @description 获取响应体大小
   */
  private getResponseSize(reply: FastifyReply): number {
    const contentLength = reply.getHeader('content-length') as string;
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  /**
   * 截断请求体
   *
   * @description 截断过大的请求体用于日志记录
   */
  private truncateBody(body: unknown, maxSize: number): unknown {
    if (typeof body === 'string') {
      return body.length > maxSize ? body.substring(0, maxSize) + '...' : body;
    }

    if (typeof body === 'object') {
      const jsonStr = JSON.stringify(body);
      return jsonStr.length > maxSize
        ? jsonStr.substring(0, maxSize) + '...'
        : body;
    }

    return body;
  }

  /**
   * 记录日志
   *
   * @description 根据配置记录结构化日志
   */
  private log(level: string, message: string, data: unknown): void {
    const logEntry = {
      level,
      message,
      ...(typeof data === 'object' && data !== null ? data : {}),
    };

    // 这里可以集成到具体的日志系统
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * 创建请求拦截器中间件
 *
 * @description 创建请求拦截器中间件的便捷函数
 */
export function createRequestInterceptorMiddleware(
  config: IRequestInterceptorConfig
): RequestInterceptorMiddleware {
  return new RequestInterceptorMiddleware(config);
}

/**
 * 请求拦截器装饰器
 *
 * @description 用于装饰器模式的请求拦截器
 */
export function RequestInterceptor(config: IRequestInterceptorConfig) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const interceptor = new RequestInterceptorMiddleware(config);

    descriptor.value = async function (
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      const context = interceptor.createRequestContext(request);
      (request as unknown as { __requestContext: IRequestContext }).__requestContext = context;

      try {
        const result = await originalMethod.call(this, request, reply);
        return result;
      } catch (error) {
        interceptor.logError(request, reply, error as Error, context);
        throw error;
      }
    };
  };
}
