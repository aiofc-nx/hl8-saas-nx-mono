/**
 * HL8 SAAS平台日志模块类型定义
 *
 * 定义日志模块中使用的所有类型和接口，包含日志级别、配置选项、请求上下文等类型定义。
 * 提供完整的类型安全保障，支持 TypeScript 的严格类型检查和智能提示。
 * 遵循 Clean Architecture 的类型设计原则，确保类型的一致性和可维护性。
 *
 * @description 此文件定义了日志模块的完整类型体系。
 * 包含日志级别、配置选项、请求上下文、日志条目等核心类型定义。
 * 支持类型安全的日志配置和使用，提供完整的 TypeScript 类型支持。
 *
 * ## 业务规则
 *
 * ### 类型安全规则
 * - 所有类型定义都经过严格的类型检查
 * - 支持 TypeScript 的严格模式和类型推断
 * - 提供完整的类型提示和自动补全
 * - 类型定义与运行时行为完全一致
 *
 * ### 接口设计规则
 * - 接口设计遵循单一职责原则
 * - 支持接口扩展和组合，提高复用性
 * - 提供可选属性和默认值，增强灵活性
 * - 接口命名清晰明确，易于理解和使用
 *
 * ### 配置类型规则
 * - 配置类型支持嵌套和组合配置
 * - 提供完整的配置验证和类型检查
 * - 支持默认配置和可选配置项
 * - 配置类型与业务需求完全匹配
 *
 * ## 业务逻辑流程
 *
 * 1. **类型定义**：定义核心业务类型和接口
 * 2. **配置类型**：定义配置选项和验证规则
 * 3. **上下文类型**：定义请求上下文和元数据类型
 * 4. **日志类型**：定义日志条目和方法类型
 * 5. **模块类型**：定义模块配置和参数类型
 * 6. **类型导出**：导出所有类型供其他模块使用
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
  /** 是否启用美化打印 */
  prettyPrint?: boolean;
  /** 时间格式转换 */
  translateTime?: string;
  /** 忽略的字段 */
  ignore?: string;
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
 * 定义日志器的基本接口，包含所有日志级别的方法和配置选项。
 * 提供统一的日志记录接口，支持不同日志级别的记录和上下文管理。
 *
 * @description 此接口定义了日志器的标准方法签名。
 * 包含 trace、debug、info、warn、error、fatal 等日志级别方法。
 * 支持 NestJS 标准的 log 和 verbose 方法，以及上下文管理功能。
 *
 * ## 业务规则
 *
 * ### 日志级别规则
 * - 支持六个标准日志级别：trace、debug、info、warn、error、fatal
 * - 日志级别从低到高排序，高级别日志包含低级别日志
 * - 支持动态设置和获取当前日志级别
 * - 日志级别影响日志输出和性能表现
 *
 * ### 方法签名规则
 * - 所有日志方法支持字符串消息和额外参数
 * - 支持对象消息和结构化数据记录
 * - 方法参数类型安全，支持 TypeScript 类型检查
 * - 日志方法执行速度快，避免阻塞主线程
 *
 * ### 上下文管理规则
 * - 支持设置和获取请求上下文信息
 * - 上下文信息自动附加到所有日志记录中
 * - 支持嵌套上下文和上下文继承
 * - 上下文管理线程安全，支持异步操作
 *
 * ## 业务逻辑流程
 *
 * 1. **日志记录**：根据级别调用相应的日志方法
 * 2. **参数处理**：处理消息字符串和额外参数
 * 3. **上下文附加**：自动附加当前请求上下文信息
 * 4. **格式化输出**：根据配置格式化日志输出
 * 5. **异步写入**：异步写入日志到目标输出
 *
 * @example
 * ```typescript
 * import { LoggerInterface, PinoLogger } from '@hl8/logger';
 *
 * const logger: LoggerInterface = new PinoLogger({
 *   level: 'info',
 *   destination: { type: 'console' }
 * });
 *
 * // 记录不同级别的日志
 * logger.trace('Detailed trace information');
 * logger.debug('Debug information for development');
 * logger.info('Application started successfully');
 * logger.warn('Configuration warning', { config: 'deprecated' });
 * logger.error('Database connection failed', { error: 'timeout' });
 * logger.fatal('Critical system error', { error: 'out of memory' });
 *
 * // NestJS 标准方法
 * logger.log('Standard log message', 'UserService');
 * logger.verbose('Verbose log message', 'DatabaseService');
 *
 * // 上下文管理
 * logger.setContext({ requestId: 'req-123', userId: 'user-456' });
 * const context = logger.getContext();
 *
 * // 级别管理
 * logger.setLevel('debug');
 * const currentLevel = logger.getLevel();
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
  useFactory: (
    ...args: unknown[]
  ) => LoggerModuleParams | Promise<LoggerModuleParams>;
  /** 额外的提供者 */
  providers?: unknown[];
}
