/**
 * Logger 模块常量定义
 *
 * @description 定义日志模块中使用的常量
 * 用于依赖注入和模块配置
 *
 * ## 最佳实践
 *
 * - ✅ 使用 `as const` 确保类型推断
 * - ✅ 按功能模块分类组织
 * - ✅ 使用 UPPER_SNAKE_CASE 命名规范
 * - ✅ 避免魔法数字和硬编码字符串
 * - ✅ 提供类型安全的常量访问
 *
 * @fileoverview 日志模块常量定义文件
 */

// ============================================================================
// 依赖注入令牌 (Dependency Injection Tokens)
// ============================================================================

/**
 * 依赖注入令牌常量
 *
 * @description 用于 NestJS 依赖注入系统的令牌集合
 * 使用 as const 确保类型安全和自动补全
 */
export const DI_TOKENS = {
  /**
   * 日志模块参数提供者令牌
   *
   * @description 用于注入日志模块的配置参数
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.MODULE_PARAMS)
   * private readonly loggerParams: LoggerModuleParams
   * ```
   */
  MODULE_PARAMS: 'LOGGER_MODULE_PARAMS',

  /**
   * 日志记录器提供者令牌
   *
   * @description 用于注入 FastifyLogger 实例
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.LOGGER_PROVIDER)
   * private readonly logger: FastifyLogger
   * ```
   */
  LOGGER_PROVIDER: 'LOGGER_PROVIDER',

  /**
   * Fastify 日志中间件提供者令牌
   *
   * @description 用于注入 Fastify 日志中间件实例
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.FASTIFY_LOGGER_MIDDLEWARE)
   * private readonly middleware: PinoLoggerMiddleware
   * ```
   */
  FASTIFY_LOGGER_MIDDLEWARE: 'FASTIFY_LOGGER_MIDDLEWARE',
} as const;

// ============================================================================
// 日志级别常量 (Log Level Constants)
// ============================================================================

/**
 * 日志级别定义
 *
 * @description 定义支持的日志级别
 * 使用 as const 确保类型安全
 */
export const LOG_LEVELS = {
  /**
   * 致命错误级别
   *
   * @description 系统无法继续运行的严重错误
   */
  FATAL: 'fatal',

  /**
   * 错误级别
   *
   * @description 需要立即关注的错误
   */
  ERROR: 'error',

  /**
   * 警告级别
   *
   * @description 潜在的问题或需要注意的情况
   */
  WARN: 'warn',

  /**
   * 信息级别
   *
   * @description 一般性的信息记录
   */
  INFO: 'info',

  /**
   * 调试级别
   *
   * @description 详细的调试信息
   */
  DEBUG: 'debug',

  /**
   * 追踪级别
   *
   * @description 非常详细的追踪信息
   */
  TRACE: 'trace',
} as const;

// ============================================================================
// 配置默认值常量 (Configuration Defaults)
// ============================================================================

/**
 * 日志模块配置默认值
 *
 * @description 定义日志模块的默认配置值
 * 避免在代码中出现魔法数字和硬编码字符串
 */
export const LOGGER_DEFAULTS = {
  /**
   * 默认日志级别
   *
   * @description 生产环境的默认日志级别
   */
  LOG_LEVEL: LOG_LEVELS.INFO,

  /**
   * 是否美化输出
   *
   * @description 开发环境下是否美化 JSON 输出
   */
  PRETTY_PRINT: false,

  /**
   * 是否包含时间戳
   *
   * @description 日志是否包含时间戳
   */
  TIMESTAMP: true,

  /**
   * 最大日志文件大小（MB）
   *
   * @description 日志文件轮转的最大大小
   */
  MAX_FILE_SIZE: 10,

  /**
   * 保留日志文件数量
   *
   * @description 保留的历史日志文件数量
   */
  MAX_FILES: 7,
} as const;

// ============================================================================
// 类型导出 (Type Exports)
// ============================================================================

/**
 * 依赖注入令牌类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];

/**
 * 日志级别类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type LogLevelType = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];
