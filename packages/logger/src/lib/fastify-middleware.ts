/**
 * HL8 SAAS平台 Fastify 日志中间件
 *
 * @description 为 Fastify 应用提供日志中间件功能
 * 支持请求/响应日志记录、请求上下文绑定、错误处理等功能
 *
 * @fileoverview Fastify 日志中间件实现文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { PinoLogger } from './pino-logger';
import { RequestStore, storage } from './context';
import { LoggerConfig, RequestContext, LogLevel } from './types';

/**
 * Fastify 日志中间件选项
 *
 * @description 定义日志中间件的配置选项
 * 包含日志级别、请求/响应日志开关、排除路径等配置
 *
 * @example
 * ```typescript
 * const options: PinoLoggerMiddlewareOptions = {
 *   enableRequestLogging: true,
 *   enableResponseLogging: true,
 *   excludePaths: ['/health', '/metrics'],
 *   requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
 * };
 * ```
 */
export interface PinoLoggerMiddlewareOptions {
  /** 是否启用请求日志 */
  enableRequestLogging?: boolean;
  /** 是否启用响应日志 */
  enableResponseLogging?: boolean;
  /** 排除的路径列表 */
  excludePaths?: string[];
  /** 请求ID生成器 */
  requestIdGenerator?: (request: FastifyRequest) => string;
  /** 日志级别 */
  logLevel?: LogLevel;
  /** 日志配置 */
  loggerConfig?: LoggerConfig;
}

/**
 * Fastify 日志中间件类
 *
 * @description 为 Fastify 应用提供完整的日志中间件功能
 * 支持请求上下文绑定、自动日志记录、错误处理等功能
 *
 * ## 主要功能
 *
 * ### 请求上下文管理
 * - 自动为每个请求创建唯一的请求ID
 * - 支持用户ID、追踪ID等上下文信息
 * - 使用 AsyncLocalStorage 实现上下文传递
 *
 * ### 自动日志记录
 * - 自动记录请求开始和完成日志
 * - 支持请求/响应日志的开关控制
 * - 支持路径排除功能
 *
 * ### 错误处理
 * - 自动捕获和记录请求处理过程中的错误
 * - 提供详细的错误信息和堆栈跟踪
 * - 支持自定义错误处理逻辑
 *
 * @example
 * ```typescript
 * const middleware = new PinoLoggerMiddleware({
 *   enableRequestLogging: true,
 *   enableResponseLogging: true,
 *   excludePaths: ['/health', '/metrics']
 * });
 *
 * // 注册中间件
 * app.register(middleware.plugin);
 * ```
 */
export class PinoLoggerMiddleware {
  /** 日志记录器实例 */
  private readonly logger: PinoLogger;
  /** 中间件选项 */
  private readonly options: PinoLoggerMiddlewareOptions;

  /**
   * 创建 Fastify 日志中间件实例
   *
   * @description 初始化日志中间件，设置配置选项和日志记录器
   *
   * @param options - 中间件选项
   *
   * @example
   * ```typescript
   * const middleware = new PinoLoggerMiddleware({
   *   enableRequestLogging: true,
   *   enableResponseLogging: true,
   *   excludePaths: ['/health', '/metrics'],
   *   requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
   * });
   * ```
   */
  constructor(options: PinoLoggerMiddlewareOptions = {}) {
    this.options = {
      enableRequestLogging: true,
      enableResponseLogging: true,
      excludePaths: [],
      logLevel: 'info',
      ...options,
    };

    this.logger = new PinoLogger({
      level: this.options.logLevel,
      ...this.options.loggerConfig,
    });
  }

  /**
   * 生成请求ID
   *
   * @description 为请求生成唯一的标识符
   * @param request - Fastify 请求对象
   * @returns {string} 请求ID
   *
   * @private
   */
  private generateRequestId(request: FastifyRequest): string {
    if (this.options.requestIdGenerator) {
      return this.options.requestIdGenerator(request);
    }

    // 尝试从请求头获取请求ID
    const requestId = request.headers['x-request-id'] as string;
    if (requestId) {
      return requestId;
    }

    // 生成新的请求ID
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查路径是否应该被排除
   *
   * @description 检查请求路径是否在排除列表中
   * @param path - 请求路径
   * @returns {boolean} 是否应该被排除
   *
   * @private
   */
  private shouldExcludePath(path: string): boolean {
    if (!this.options.excludePaths || this.options.excludePaths.length === 0) {
      return false;
    }

    return this.options.excludePaths.some(excludePath => {
      if (excludePath.endsWith('*')) {
        return path.startsWith(excludePath.slice(0, -1));
      }
      return path === excludePath;
    });
  }

  /**
   * 创建请求上下文
   *
   * @description 为请求创建上下文信息
   * @param request - Fastify 请求对象
   * @returns {RequestContext} 请求上下文
   *
   * @private
   */
  private createRequestContext(request: FastifyRequest): RequestContext {
    const requestId = this.generateRequestId(request);
    
    return {
      requestId,
      userId: request.headers['x-user-id'] as string,
      traceId: request.headers['x-trace-id'] as string,
      sessionId: request.headers['x-session-id'] as string,
      metadata: {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 请求开始处理
   *
   * @description 处理请求开始时的日志记录
   * @param request - Fastify 请求对象
   * @param reply - Fastify 响应对象
   * @param context - 请求上下文
   *
   * @private
   */
  private handleRequestStart(
    request: FastifyRequest,
    reply: FastifyReply,
    context: RequestContext
  ): void {
    if (!this.options.enableRequestLogging) {
      return;
    }

    // 记录请求开始日志
    this.logger.logRequestStart(request, context);

    // 设置请求开始时间
    (request as { startTime?: number }).startTime = Date.now();
  }

  /**
   * 请求完成处理
   *
   * @description 处理请求完成时的日志记录
   * @param request - Fastify 请求对象
   * @param reply - Fastify 响应对象
   * @param context - 请求上下文
   *
   * @private
   */
  private handleRequestComplete(
    request: FastifyRequest,
    reply: FastifyReply,
    context: RequestContext
  ): void {
    if (!this.options.enableResponseLogging) {
      return;
    }

    const startTime = (request as { startTime?: number }).startTime;
    const duration = startTime ? Date.now() - startTime : 0;

    // 记录请求完成日志
    this.logger.logRequestComplete(request, reply, context, duration);
  }

  /**
   * 请求错误处理
   *
   * @description 处理请求处理过程中的错误
   * @param request - Fastify 请求对象
   * @param reply - Fastify 响应对象
   * @param error - 错误对象
   * @param context - 请求上下文
   *
   * @private
   */
  private handleRequestError(
    request: FastifyRequest,
    reply: FastifyReply,
    error: Error,
    context: RequestContext
  ): void {
    // 记录请求错误日志
    this.logger.logRequestError(request, error, context);
  }

  /**
   * 创建 Fastify 插件
   *
   * @description 创建 Fastify 插件函数，用于注册到 Fastify 实例
   * @returns {Function} Fastify 插件函数
   *
   * @example
   * ```typescript
   * const middleware = new PinoLoggerMiddleware(options);
   * app.register(middleware.plugin);
   * ```
   */
  get plugin() {
    return async (fastify: FastifyInstance) => {
      // 注册请求钩子
      fastify.addHook('onRequest', async (request, reply) => {
        // 检查是否应该排除此路径
        if (this.shouldExcludePath(request.url)) {
          return;
        }

        // 创建请求上下文
        const context = this.createRequestContext(request);
        
        // 创建请求存储
        const store = new RequestStore(request, reply, context, this.options.logLevel);
        
        // 运行在请求上下文中
        storage.run(store, () => {
          this.handleRequestStart(request, reply, context);
        });
      });

      // 注册响应钩子
      fastify.addHook('onSend', async (request, reply, payload) => {
        const store = storage.getStore();
        if (!store) {
          return payload;
        }

        const context = store.getContext();
        this.handleRequestComplete(request, reply, context);
        
        return payload;
      });

      // 注册错误钩子
      fastify.addHook('onError', async (request, reply, error) => {
        const store = storage.getStore();
        if (!store) {
          return;
        }

        const context = store.getContext();
        this.handleRequestError(request, reply, error, context);
      });

      // 注册日志记录器到 Fastify 实例
      fastify.decorate('logger', this.logger);
    };
  }

  /**
   * 获取日志记录器实例
   *
   * @description 返回日志记录器实例，用于手动记录日志
   * @returns {PinoLogger} 日志记录器实例
   *
   * @example
   * ```typescript
   * const middleware = new PinoLoggerMiddleware(options);
   * const logger = middleware.getLogger();
   * logger.info('Application started');
   * ```
   */
  getLogger(): PinoLogger {
    return this.logger;
  }

  /**
   * 更新中间件选项
   *
   * @description 动态更新中间件配置选项
   * @param options - 新的配置选项
   *
   * @example
   * ```typescript
   * middleware.updateOptions({
   *   enableRequestLogging: false,
   *   logLevel: 'debug'
   * });
   * ```
   */
  updateOptions(options: Partial<PinoLoggerMiddlewareOptions>): void {
    Object.assign(this.options, options);
    
    if (options.logLevel) {
      this.logger.setLevel(options.logLevel);
    }
  }
}

/**
 * 创建 Fastify 日志中间件
 *
 * @description 便捷函数，用于创建 Fastify 日志中间件实例
 * @param options - 中间件选项
 * @returns {PinoLoggerMiddleware} 日志中间件实例
 *
 * @example
 * ```typescript
 * const middleware = createPinoLoggerMiddleware({
 *   enableRequestLogging: true,
 *   enableResponseLogging: true,
 *   excludePaths: ['/health', '/metrics']
 * });
 * ```
 */
export function createPinoLoggerMiddleware(
  options: PinoLoggerMiddlewareOptions = {}
): PinoLoggerMiddleware {
  return new PinoLoggerMiddleware(options);
}

/**
 * 快速注册 Fastify 日志中间件
 *
 * @description 便捷函数，用于快速注册日志中间件到 Fastify 实例
 * @param fastify - Fastify 实例
 * @param options - 中间件选项
 * @returns {Promise<void>} 注册完成
 *
 * @example
 * ```typescript
 * await registerPinoLogger(app, {
 *   enableRequestLogging: true,
 *   enableResponseLogging: true
 * });
 * ```
 */
export async function registerPinoLogger(
  fastify: FastifyInstance,
  options: PinoLoggerMiddlewareOptions = {}
): Promise<void> {
  const middleware = createPinoLoggerMiddleware(options);
  await fastify.register(middleware.plugin);
}
