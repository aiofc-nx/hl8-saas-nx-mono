/**
 * HL8 SAAS平台日志模块类型定义
 *
 * @description 定义日志模块中使用的所有类型和接口
 * 包含日志级别、配置选项、请求上下文等类型定义
 *
 * @fileoverview 日志模块类型定义文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import { FastifyRequest } from 'fastify';

/**
 * 请求元数据类型
 *
 * @description 定义请求元数据的结构
 * 包含操作类型、IP地址、用户代理等元数据信息
 *
 * @example
 * ```typescript
 * const metadata: RequestMetadata = {
 *   operation: 'user-login',
 *   ip: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * };
 * ```
 */
export interface RequestMetadata {
  /** 操作类型 */
  operation?: string;
  /** IP地址 */
  ip?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 会话ID */
  sessionId?: string;
  /** 自定义元数据 */
  [key: string]: unknown;
}

/**
 * 日志级别类型
 *
 * @description 定义支持的日志级别，从低到高排序
 * 支持 trace、debug、info、warn、error、fatal 六个级别
 *
 * @example
 * ```typescript
 * const level: LogLevel = 'info';
 * ```
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 日志格式化选项
 *
 * @description 定义日志输出的格式化选项
 * 支持自定义时间格式、颜色输出、缩进等选项
 *
 * @example
 * ```typescript
 * const format: LogFormat = {
 *   timestamp: true,
 *   colorize: true,
 *   levelFirst: true
 * };
 * ```
 */
export interface LogFormat {
  /** 是否显示时间戳 */
  timestamp?: boolean;
  /** 是否使用颜色输出 */
  colorize?: boolean;
  /** 是否将级别放在最前面 */
  levelFirst?: boolean;
  /** 自定义时间格式 */
  timeFormat?: string;
  /** 是否显示进程ID */
  pid?: boolean;
  /** 是否显示主机名 */
  hostname?: boolean;
}

/**
 * 日志配置选项
 *
 * @description 定义日志模块的完整配置选项
 * 包含日志级别、输出目标、格式化选项等配置
 *
 * @example
 * ```typescript
 * const config: LoggerConfig = {
 *   level: 'info',
 *   format: { timestamp: true, colorize: true },
 *   destination: { type: 'file', path: './logs/app.log' }
 * };
 * ```
 */
export interface LoggerConfig {
  /** 日志级别 */
  level?: LogLevel;
  /** 日志格式化选项 */
  format?: LogFormat;
  /** 日志输出目标 */
  destination?: LogDestination;
  /** 是否启用请求日志 */
  enableRequestLogging?: boolean;
  /** 是否启用响应日志 */
  enableResponseLogging?: boolean;
  /** 请求日志排除路径 */
  excludePaths?: string[];
  /** 自定义请求ID生成器 */
  requestIdGenerator?: (req: FastifyRequest) => string;
}

/**
 * 日志输出目标类型
 *
 * @description 定义日志输出的目标类型
 * 支持控制台、文件、流等多种输出方式
 *
 * @example
 * ```typescript
 * const dest: LogDestination = { type: 'file', path: './logs/app.log' };
 * ```
 */
export interface LogDestination {
  /** 输出类型 */
  type: 'console' | 'file' | 'stream';
  /** 文件路径（当 type 为 'file' 时） */
  path?: string;
  /** 输出流（当 type 为 'stream' 时） */
  stream?: NodeJS.WritableStream;
  /** 是否追加到文件 */
  append?: boolean;
  /** 文件轮转配置 */
  rotation?: LogRotation;
}

/**
 * 日志轮转配置
 *
 * @description 定义日志文件的轮转配置
 * 支持按大小、时间等条件进行日志轮转
 *
 * @example
 * ```typescript
 * const rotation: LogRotation = {
 *   maxSize: '10MB',
 *   maxFiles: 5,
 *   datePattern: 'YYYY-MM-DD'
 * };
 * ```
 */
export interface LogRotation {
  /** 最大文件大小 */
  maxSize?: string;
  /** 最大文件数量 */
  maxFiles?: number;
  /** 日期模式 */
  datePattern?: string;
  /** 是否压缩旧文件 */
  compress?: boolean;
}

/**
 * 请求上下文信息
 *
 * @description 定义请求上下文中的信息
 * 包含请求ID、用户信息、追踪信息等
 *
 * @example
 * ```typescript
 * const context: RequestContext = {
 *   requestId: 'req-123',
 *   userId: 'user-456',
 *   traceId: 'trace-789'
 * };
 * ```
 */
export interface RequestContext {
  /** 请求唯一标识 */
  requestId: string;
  /** 用户ID */
  userId?: string;
  /** 追踪ID */
  traceId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 自定义上下文数据 */
  metadata?: RequestMetadata;
}

/**
 * 日志条目接口
 *
 * @description 定义日志条目的结构
 * 包含时间戳、级别、消息、上下文等信息
 *
 * @example
 * ```typescript
 * const entry: LogEntry = {
 *   timestamp: new Date(),
 *   level: 'info',
 *   message: 'User logged in',
 *   context: { userId: 'user-123' }
 * };
 * ```
 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: Date;
  /** 日志级别 */
  level: LogLevel;
  /** 日志消息 */
  message: string;
  /** 上下文信息 */
  context?: RequestContext;
  /** 错误对象 */
  error?: Error;
  /** 额外数据 */
  data?: Record<string, unknown>;
}

/**
 * 日志方法类型
 *
 * @description 定义日志方法的类型签名
 * 支持字符串消息和对象消息两种格式
 *
 * @example
 * ```typescript
 * const logMethod: LogMethod = (message, ...args) => {
 *   console.log(message, ...args);
 * };
 * ```
 */
export type LogMethod = (message: string, ...args: unknown[]) => void;

/**
 * 日志器接口
 *
 * @description 定义日志器的基本接口
 * 包含所有日志级别的方法和配置选项
 *
 * @example
 * ```typescript
 * const logger: LoggerInterface = new FastifyLogger();
 * logger.info('Application started');
 * ```
 */
export interface LoggerInterface {
  /** 追踪级别日志 */
  trace(message: string, ...args: unknown[]): void;
  /** 调试级别日志 */
  debug(message: string, ...args: unknown[]): void;
  /** 信息级别日志 */
  info(message: string, ...args: unknown[]): void;
  /** 警告级别日志 */
  warn(message: string, ...args: unknown[]): void;
  /** 错误级别日志 */
  error(message: string, ...args: unknown[]): void;
  /** 致命级别日志 */
  fatal(message: string, ...args: unknown[]): void;
  /** 记录日志（NestJS 标准方法） */
  log(message: unknown, context?: string): void;
  /** 记录详细日志（NestJS 标准方法） */
  verbose(message: unknown, context?: string): void;
  /** 设置日志级别 */
  setLevel(level: LogLevel): void;
  /** 获取当前日志级别 */
  getLevel(): LogLevel;
  /** 设置上下文 */
  setContext(context: RequestContext): void;
  /** 获取当前上下文 */
  getContext(): RequestContext | undefined;
}

/**
 * 模块配置参数
 *
 * @description 定义日志模块的配置参数
 * 支持同步和异步配置方式
 *
 * @example
 * ```typescript
 * const params: LoggerModuleParams = {
 *   level: 'info',
 *   enableRequestLogging: true,
 *   destination: { type: 'file', path: './logs/app.log' }
 * };
 * ```
 */
export interface LoggerModuleParams {
  /** 日志配置 */
  config?: LoggerConfig;
  /** 是否全局模块 */
  global?: boolean;
  /** 是否启用请求日志 */
  enableRequestLogging?: boolean;
  /** 是否启用响应日志 */
  enableResponseLogging?: boolean;
}

/**
 * 异步模块配置参数
 *
 * @description 定义日志模块的异步配置参数
 * 支持依赖注入和工厂函数配置
 *
 * @example
 * ```typescript
 * const asyncParams: LoggerModuleAsyncParams = {
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     level: config.get('LOG_LEVEL'),
 *     destination: { type: 'file', path: config.get('LOG_PATH') }
 *   })
 * };
 * ```
 */
export interface LoggerModuleAsyncParams {
  /** 导入的模块 */
  imports?: unknown[];
  /** 注入的依赖 */
  inject?: unknown[];
  /** 工厂函数 */
  useFactory: (...args: unknown[]) => LoggerModuleParams | Promise<LoggerModuleParams>;
  /** 额外的提供者 */
  providers?: unknown[];
}
