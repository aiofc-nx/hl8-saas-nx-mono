/**
 * HL8 SAAS平台 NestJS 兼容日志记录器
 *
 * @description 实现 NestJS LoggerService 接口的日志记录器
 * 基于 PinoLogger 构建，提供完整的 NestJS 兼容性
 *
 * @fileoverview NestJS 兼容日志记录器实现文件
 * @since 1.0.0
 */

import { LoggerService } from '@nestjs/common';
import { PinoLogger } from './pino-logger';
import { LoggerConfig } from './types';

/**
 * NestJS 兼容日志记录器类
 *
 * @description 实现 NestJS LoggerService 接口的日志记录器
 * 基于 PinoLogger 构建，提供完整的 NestJS 兼容性
 * 支持所有 NestJS 标准的日志方法和级别
 *
 * ## 主要功能
 *
 * ### NestJS 标准兼容
 * - 完全实现 LoggerService 接口
 * - 支持所有 NestJS 标准方法
 * - 保持与 NestJS 内置日志器的兼容性
 *
 * ### 高性能日志记录
 * - 基于 PinoLogger 的高性能实现
 * - 支持请求上下文绑定
 * - 结构化 JSON 输出
 *
 * ### 级别映射
 * - `log()` → `info` 级别
 * - `error()` → `error` 级别
 * - `warn()` → `warn` 级别
 * - `debug()` → `debug` 级别
 * - `verbose()` → `trace` 级别
 *
 * @example
 * ```typescript
 * const logger = new NestJSLogger({
 *   level: 'info',
 *   destination: { type: 'file', path: './logs/app.log' }
 * });
 *
 * // NestJS 标准用法
 * logger.log('Application started', 'Bootstrap');
 * logger.error('Database connection failed', 'DatabaseService', 'Connection timeout');
 * ```
 */
export class NestJSLogger implements LoggerService {
  /** 内部 PinoLogger 实例 */
  private readonly pinoLogger: PinoLogger;

  /**
   * 创建 NestJS 兼容日志记录器实例
   *
   * @description 初始化日志记录器，设置配置选项
   *
   * @param config - 日志配置选项
   *
   * @example
   * ```typescript
   * const logger = new NestJSLogger({
   *   level: 'info',
   *   destination: { type: 'file', path: './logs/app.log' }
   * });
   * ```
   */
  constructor(config: LoggerConfig = {}) {
    this.pinoLogger = new PinoLogger(config);
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
      this.pinoLogger.info(String(message), { context });
    } else {
      this.pinoLogger.info(String(message));
    }
  }

  /**
   * 记录错误日志（NestJS 标准方法）
   *
   * @description NestJS 标准的 error 方法
   * @param message - 错误消息
   * @param context - 可选的上下文
   * @param trace - 可选的堆栈跟踪
   *
   * @example
   * ```typescript
   * logger.error('Database connection failed', 'DatabaseService', 'Connection timeout');
   * ```
   */
  error(message: unknown, context?: string, trace?: string): void {
    const logData: Record<string, unknown> = { message: String(message) };

    if (context) {
      logData['context'] = context;
    }

    if (trace) {
      logData['trace'] = trace;
    }

    this.pinoLogger.error(String(message), logData);
  }

  /**
   * 记录警告日志（NestJS 标准方法）
   *
   * @description NestJS 标准的 warn 方法
   * @param message - 警告消息
   * @param context - 可选的上下文
   *
   * @example
   * ```typescript
   * logger.warn('Database connection slow', 'DatabaseService');
   * ```
   */
  warn(message: unknown, context?: string): void {
    if (context) {
      this.pinoLogger.warn(String(message), { context });
    } else {
      this.pinoLogger.warn(String(message));
    }
  }

  /**
   * 记录调试日志（NestJS 标准方法）
   *
   * @description NestJS 标准的 debug 方法
   * @param message - 调试消息
   * @param context - 可选的上下文
   *
   * @example
   * ```typescript
   * logger.debug('User authentication successful', 'AuthService');
   * ```
   */
  debug(message: unknown, context?: string): void {
    if (context) {
      this.pinoLogger.debug(String(message), { context });
    } else {
      this.pinoLogger.debug(String(message));
    }
  }

  /**
   * 记录详细日志（NestJS 标准方法）
   *
   * @description NestJS 标准的 verbose 方法，映射到 trace 级别
   * @param message - 详细消息
   * @param context - 可选的上下文
   *
   * @example
   * ```typescript
   * logger.verbose('Detailed operation info', 'UserService');
   * ```
   */
  verbose(message: unknown, context?: string): void {
    if (context) {
      this.pinoLogger.trace(String(message), { context });
    } else {
      this.pinoLogger.trace(String(message));
    }
  }

  /**
   * 获取内部 PinoLogger 实例
   *
   * @description 返回内部的 PinoLogger 实例，用于高级用法
   * @returns {PinoLogger} PinoLogger 实例
   *
   * @example
   * ```typescript
   * const pinoLogger = logger.getPinoLogger();
   * pinoLogger.info('Advanced logging', { custom: 'data' });
   * ```
   */
  getPinoLogger(): PinoLogger {
    return this.pinoLogger;
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
  setLevel(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  ): void {
    this.pinoLogger.setLevel(level);
  }

  /**
   * 获取当前日志级别
   *
   * @description 返回当前设置的日志级别
   * @returns {string} 当前日志级别
   *
   * @example
   * ```typescript
   * const level = logger.getLevel();
   * console.log(`Current log level: ${level}`);
   * ```
   */
  getLevel(): string {
    return this.pinoLogger.getLevel();
  }
}
