/**
 * HL8 SAAS平台 Pino 日志记录器
 *
 * @description 基于 Pino 的高性能日志记录器，专为 Fastify 平台设计
 * 支持请求上下文绑定、结构化日志输出、异步日志记录等功能
 *
 * @fileoverview Pino 日志记录器实现文件
 * @since 1.0.0
 */

const pino = require('pino');
const pinoPretty = require('pino-pretty');
import { FastifyRequest, FastifyReply } from 'fastify';
import { Logger as PinoLoggerType, LoggerOptions } from 'pino';
import {
  LoggerInterface,
  LogLevel,
  RequestContext,
  LoggerConfig,
} from './types';
import { storage } from './context';

/**
 * Pino 日志记录器类
 *
 * @description 基于 Pino 的高性能日志记录器
 * 支持请求上下文绑定、结构化日志输出、异步日志记录等功能
 * 专为 Fastify 平台优化，提供最佳性能和易用性
 *
 * ## 主要功能
 *
 * ### 高性能日志记录
 * - 基于 Pino 日志库，性能优异
 * - 支持异步日志记录，进一步提升性能
 * - 结构化 JSON 输出，便于日志分析
 *
 * ### 请求上下文绑定
 * - 自动绑定请求上下文到日志
 * - 支持请求ID、用户ID、追踪ID等上下文信息
 * - 使用 AsyncLocalStorage 实现上下文传递
 *
 * ### 灵活的配置选项
 * - 支持多种日志级别
 * - 可配置输出目标和格式化选项
 * - 支持日志轮转和压缩
 *
 * @example
 * ```typescript
 * const logger = new PinoLogger({
 *   level: 'info',
 *   destination: { type: 'file', path: './logs/app.log' }
 * });
 *
 * logger.info('Application started');
 * logger.error('Database connection failed', { error: err });
 * ```
 */
export class PinoLogger implements LoggerInterface {
  /** Pino 日志器实例 */
  private readonly pino: PinoLoggerType;
  /** 当前日志级别 */
  private _level: LogLevel;
  /** 日志配置 */
  private readonly config: LoggerConfig;

  /**
   * 创建 Pino 日志记录器实例
   *
   * @description 初始化日志记录器，设置配置选项和输出目标
   *
   * @param config - 日志配置选项
   *
   * @example
   * ```typescript
   * const logger = new PinoLogger({
   *   level: 'info',
   *   destination: { type: 'file', path: './logs/app.log' },
   *   format: { timestamp: true, colorize: true }
   * });
   * ```
   */
  constructor(config: LoggerConfig = {}) {
    this.config = config;
    this._level = config.level || 'info';

    // 创建 Pino 实例
    this.pino = this.createPinoInstance();
  }

  /**
   * 创建 Pino 实例
   *
   * @description 根据配置创建 Pino 日志器实例
   * @returns {pino.Logger} Pino 日志器实例
   *
   * @private
   */
  private createPinoInstance(): PinoLoggerType {
    const pinoConfig: LoggerOptions & Record<string, unknown> = {
      level: this._level,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (object: Record<string, unknown>) => {
          // 添加请求上下文信息
          const store = storage.getStore();
          if (store) {
            const context = store.getContext();
            return {
              ...object,
              requestId: context.requestId,
              userId: context.userId,
              traceId: context.traceId,
              ...context.metadata,
            };
          }
          return object;
        },
      },
    };

    // 应用格式化配置
    if (this.config.format) {
      if (this.config.format.timestamp !== undefined) {
        pinoConfig.timestamp = this.config.format.timestamp
          ? pino.stdTimeFunctions.isoTime
          : false;
      }

      if (this.config.format.translateTime) {
        pinoConfig['translateTime'] = this.config.format.translateTime;
      }

      if (this.config.format.ignore) {
        pinoConfig['ignore'] = this.config.format.ignore;
      }
    }

    // 准备 pino-pretty 选项
    const shouldUsePretty =
      this.config.format?.prettyPrint || this.config.format?.colorize;
    const prettyOptions: Record<string, unknown> = {
      // 强制启用多行格式
      singleLine: false,
      crlf: false,
      hideObject: false,
      messageFormat: '{msg}',
    };

    if (shouldUsePretty && this.config.format) {
      if (this.config.format.translateTime) {
        prettyOptions['translateTime'] = this.config.format.translateTime;
      }

      if (this.config.format.ignore) {
        prettyOptions['ignore'] = this.config.format.ignore;
      }

      if (this.config.format.colorize) {
        prettyOptions['colorize'] = this.config.format.colorize;
      }
    }

    // 配置输出目标
    if (this.config.destination) {
      switch (this.config.destination.type) {
        case 'file':
          if (shouldUsePretty) {
            return pino(
              pinoConfig,
              pino.multistream([
                { stream: pinoPretty(prettyOptions) },
                {
                  stream: pino.destination({
                    dest: this.config.destination.path || './logs/app.log',
                    append: this.config.destination.append !== false,
                  }),
                },
              ])
            );
          } else {
            return pino(
              pinoConfig,
              pino.destination({
                dest: this.config.destination.path || './logs/app.log',
                append: this.config.destination.append !== false,
              })
            );
          }
        case 'stream':
          if (shouldUsePretty) {
            return pino(
              pinoConfig,
              pino.multistream([
                { stream: pinoPretty(prettyOptions) },
                { stream: this.config.destination.stream },
              ])
            );
          } else {
            return pino(pinoConfig, this.config.destination.stream);
          }
        case 'console':
        default:
          if (shouldUsePretty) {
            return pino(pinoConfig, pinoPretty(prettyOptions));
          } else {
            return pino(pinoConfig);
          }
      }
    }

    // 没有配置 destination 时，默认输出到控制台（美化格式）
    // 强制启用 pretty 模式，确保日志美化显示
    return pino(pinoConfig, pinoPretty(prettyOptions));
  }

  /**
   * 记录追踪级别日志
   *
   * @description 记录最详细的日志信息，通常用于调试
   * @param message - 日志消息
   * @param args - 额外的参数
   *
   * @example
   * ```typescript
   * logger.trace('Processing request', { userId: 'user-123' });
   * ```
   */
  trace(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pino.trace(message);
    } else if (args.length === 1) {
      this.pino.trace(args[0], message);
    } else {
      this.pino.trace(args[0], message, ...args.slice(1));
    }
  }

  /**
   * 记录调试级别日志
   *
   * @description 记录调试信息，用于开发和测试环境
   * @param message - 日志消息
   * @param args - 额外的参数
   *
   * @example
   * ```typescript
   * logger.debug('User authentication successful', { userId: 'user-123' });
   * ```
   */
  debug(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pino.debug(message);
    } else if (args.length === 1) {
      this.pino.debug(args[0], message);
    } else {
      this.pino.debug(args[0], message, ...args.slice(1));
    }
  }

  /**
   * 记录信息级别日志
   *
   * @description 记录一般信息，用于记录应用程序的正常运行状态
   * @param message - 日志消息
   * @param args - 额外的参数
   *
   * @example
   * ```typescript
   * logger.info('User logged in successfully', { userId: 'user-123' });
   * ```
   */
  info(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pino.info(message);
    } else if (args.length === 1) {
      this.pino.info(args[0], message);
    } else {
      this.pino.info(args[0], message, ...args.slice(1));
    }
  }

  /**
   * 记录日志（NestJS 标准方法）
   *
   * @description NestJS 标准的 log 方法，映射到 info 级别
   * @param message - 日志消息
   * @param context - 可选的上下文
   *
   * @example
   * ```typescript
   * logger.log('Application started', 'Bootstrap');
   * ```
   */
  log(message: unknown, context?: string): void {
    if (context) {
      this.pino.info({ context }, String(message));
    } else {
      this.pino.info(message);
    }
  }

  /**
   * 记录详细日志（NestJS 标准方法）
   *
   * @description NestJS 标准的 verbose 方法，映射到 trace 级别
   * @param message - 日志消息
   * @param context - 可选的上下文
   *
   * @example
   * ```typescript
   * logger.verbose('Detailed operation info', 'UserService');
   * ```
   */
  verbose(message: unknown, context?: string): void {
    if (context) {
      this.pino.trace({ context }, String(message));
    } else {
      this.pino.trace(message);
    }
  }

  /**
   * 记录警告级别日志
   *
   * @description 记录警告信息，表示可能的问题但不影响应用程序运行
   * @param message - 日志消息
   * @param args - 额外的参数
   *
   * @example
   * ```typescript
   * logger.warn('Database connection slow', { duration: 5000 });
   * ```
   */
  warn(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pino.warn(message);
    } else if (args.length === 1) {
      this.pino.warn(args[0], message);
    } else {
      this.pino.warn(args[0], message, ...args.slice(1));
    }
  }

  /**
   * 记录错误级别日志
   *
   * @description 记录错误信息，表示应用程序遇到了错误
   * @param message - 日志消息
   * @param args - 额外的参数
   *
   * @example
   * ```typescript
   * logger.error('Database connection failed', { error: err });
   * ```
   */
  error(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pino.error(message);
    } else if (args.length === 1) {
      this.pino.error(args[0], message);
    } else {
      this.pino.error(args[0], message, ...args.slice(1));
    }
  }

  /**
   * 记录致命级别日志
   *
   * @description 记录致命错误信息，表示应用程序无法继续运行
   * @param message - 日志消息
   * @param args - 额外的参数
   *
   * @example
   * ```typescript
   * logger.fatal('Application crashed', { error: err });
   * ```
   */
  fatal(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pino.fatal(message);
    } else if (args.length === 1) {
      this.pino.fatal(args[0], message);
    } else {
      this.pino.fatal(args[0], message, ...args.slice(1));
    }
  }

  /**
   * 设置日志级别
   *
   * @description 动态设置日志记录级别
   * @param level - 新的日志级别
   *
   * @example
   * ```typescript
   * logger.setLevel('debug');
   * ```
   */
  setLevel(level: LogLevel): void {
    this._level = level;
    this.pino.level = level;
  }

  /**
   * 获取当前日志级别
   *
   * @description 返回当前设置的日志级别
   * @returns {LogLevel} 当前日志级别
   *
   * @example
   * ```typescript
   * const level = logger.getLevel();
   * console.log(`Current log level: ${level}`);
   * ```
   */
  getLevel(): LogLevel {
    return this._level;
  }

  /**
   * 设置请求上下文
   *
   * @description 设置当前请求的上下文信息
   * @param context - 请求上下文信息
   *
   * @example
   * ```typescript
   * logger.setContext({
   *   requestId: 'req-123',
   *   userId: 'user-456',
   *   traceId: 'trace-789'
   * });
   * ```
   */
  setContext(context: RequestContext): void {
    const store = storage.getStore();
    if (store) {
      store.setContext(context);
    }
  }

  /**
   * 获取当前请求上下文
   *
   * @description 返回当前请求的上下文信息
   * @returns {RequestContext | undefined} 当前请求上下文，如果不在请求作用域内则返回 undefined
   *
   * @example
   * ```typescript
   * const context = logger.getContext();
   * if (context) {
   *   console.log(`Request ID: ${context.requestId}`);
   * }
   * ```
   */
  getContext(): RequestContext | undefined {
    const store = storage.getStore();
    return store?.getContext();
  }

  /**
   * 创建子日志器
   *
   * @description 创建带有额外绑定信息的子日志器
   * @param bindings - 绑定信息
   * @returns {FastifyLogger} 子日志器实例
   *
   * @example
   * ```typescript
   * const childLogger = logger.child({ userId: 'user-123' });
   * childLogger.info('User action performed');
   * ```
   */
  child(bindings: Record<string, unknown>): PinoLogger {
    const childPino = this.pino.child(bindings);
    const childLogger = new PinoLogger(this.config);
    // 替换内部的 Pino 实例
    (childLogger as unknown as { pino: PinoLoggerType }).pino = childPino;
    return childLogger;
  }

  /**
   * 创建请求日志器
   *
   * @description 为特定请求创建日志器实例
   * @param request - Fastify 请求对象
   * @param reply - Fastify 响应对象
   * @param context - 请求上下文
   * @returns {FastifyLogger} 请求日志器实例
   *
   * @example
   * ```typescript
   * const requestLogger = logger.createRequestLogger(request, reply, {
   *   requestId: 'req-123',
   *   userId: 'user-456'
   * });
   * ```
   */
  createRequestLogger(
    request: FastifyRequest,
    reply: FastifyReply,
    context: RequestContext
  ): PinoLogger {
    const requestLogger = this.child({
      requestId: context.requestId,
      userId: context.userId,
      traceId: context.traceId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    return requestLogger;
  }

  /**
   * 记录请求开始日志
   *
   * @description 记录请求开始的信息
   * @param request - Fastify 请求对象
   * @param context - 请求上下文
   *
   * @example
   * ```typescript
   * logger.logRequestStart(request, {
   *   requestId: 'req-123',
   *   userId: 'user-456'
   * });
   * ```
   */
  logRequestStart(request: FastifyRequest, context: RequestContext): void {
    this.info('Request started', {
      method: request.method,
      url: request.url,
      requestId: context.requestId,
      userId: context.userId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });
  }

  /**
   * 记录请求完成日志
   *
   * @description 记录请求完成的信息
   * @param request - Fastify 请求对象
   * @param reply - Fastify 响应对象
   * @param context - 请求上下文
   * @param duration - 请求处理时间（毫秒）
   *
   * @example
   * ```typescript
   * logger.logRequestComplete(request, reply, {
   *   requestId: 'req-123',
   *   userId: 'user-456'
   * }, 150);
   * ```
   */
  logRequestComplete(
    request: FastifyRequest,
    reply: FastifyReply,
    context: RequestContext,
    duration: number
  ): void {
    this.info('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      requestId: context.requestId,
      userId: context.userId,
      duration,
    });
  }

  /**
   * 记录请求错误日志
   *
   * @description 记录请求处理过程中的错误
   * @param request - Fastify 请求对象
   * @param error - 错误对象
   * @param context - 请求上下文
   *
   * @example
   * ```typescript
   * logger.logRequestError(request, error, {
   *   requestId: 'req-123',
   *   userId: 'user-456'
   * });
   * ```
   */
  logRequestError(
    request: FastifyRequest,
    error: Error,
    context: RequestContext
  ): void {
    this.error('Request error', {
      method: request.method,
      url: request.url,
      requestId: context.requestId,
      userId: context.userId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }

  /**
   * 测量方法执行时间
   *
   * @description 测量异步方法的执行时间并记录性能日志
   * @param operation - 操作名称
   * @param fn - 要执行的异步函数
   * @returns {Promise<T>} 函数执行结果
   */
  async measureTime<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Operation completed: ${operation}`, { duration, operation });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Operation failed: ${operation}`, {
        duration,
        operation,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 记录错误信息
   *
   * @description 记录错误信息，包括错误堆栈
   * @param message - 错误消息
   * @param error - 错误对象
   */
  logError(message: string, error: Error): void {
    this.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
}
