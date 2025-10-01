/**
 * Fastify-Pro 模块常量定义
 *
 * @description 定义 Fastify-Pro 模块中使用的常量
 * 用于依赖注入、错误码、配置键等
 *
 * ## 最佳实践
 *
 * - ✅ 使用 `as const` 确保类型推断
 * - ✅ 按功能模块分类组织
 * - ✅ 使用 UPPER_SNAKE_CASE 命名规范
 * - ✅ 避免魔法数字和硬编码字符串
 * - ✅ 提供类型安全的常量访问
 *
 * @fileoverview Fastify-Pro 模块常量定义文件
 * @since 1.0.0
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
   * Fastify 实例令牌
   *
   * @description 用于注入 Fastify 实例
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.FASTIFY_INSTANCE)
   * private readonly fastify: FastifyInstance
   * ```
   */
  FASTIFY_INSTANCE: 'FASTIFY_INSTANCE',

  /**
   * Fastify-Pro 适配器令牌
   *
   * @description 用于注入 Fastify-Pro 适配器实例
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.FASTIFY_PRO_ADAPTER)
   * private readonly adapter: EnterpriseFastifyAdapter
   * ```
   */
  FASTIFY_PRO_ADAPTER: 'FASTIFY_PRO_ADAPTER',

  /**
   * Fastify-Pro 配置令牌
   *
   * @description 用于注入 Fastify-Pro 配置对象
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.FASTIFY_PRO_CONFIG)
   * private readonly config: IFastifyProModuleConfig
   * ```
   */
  FASTIFY_PRO_CONFIG: 'FASTIFY_PRO_CONFIG',

  /**
   * 性能监控器令牌
   *
   * @description 用于注入性能监控服务
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.PERFORMANCE_MONITOR)
   * private readonly monitor: PerformanceMonitor
   * ```
   */
  PERFORMANCE_MONITOR: 'PERFORMANCE_MONITOR',

  /**
   * 租户提取中间件令牌
   *
   * @description 用于注入租户提取中间件
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.TENANT_EXTRACTION_MIDDLEWARE)
   * private readonly tenantMiddleware: TenantExtractionMiddleware
   * ```
   */
  TENANT_EXTRACTION_MIDDLEWARE: 'TENANT_EXTRACTION_MIDDLEWARE',

  /**
   * CORS 服务令牌
   *
   * @description 用于注入 CORS 服务
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.CORS_SERVICE)
   * private readonly corsService: CorsService
   * ```
   */
  CORS_SERVICE: 'CORS_SERVICE',
} as const;

// ============================================================================
// 错误代码 (Error Codes)
// ============================================================================

/**
 * 错误代码常量
 *
 * @description 定义 Fastify-Pro 模块的错误代码
 * 遵循统一的错误码命名规范
 */
export const ERROR_CODES = {
  /**
   * 租户 ID 必需
   *
   * @description 请求缺少必需的租户 ID
   */
  TENANT_ID_REQUIRED: 'TENANT_ID_REQUIRED',

  /**
   * 无效的租户格式
   *
   * @description 租户 ID 格式不正确
   */
  INVALID_TENANT_FORMAT: 'INVALID_TENANT_FORMAT',

  /**
   * 租户提取错误
   *
   * @description 从请求中提取租户信息时发生错误
   */
  TENANT_EXTRACTION_ERROR: 'TENANT_EXTRACTION_ERROR',

  /**
   * 适配器初始化失败
   *
   * @description Fastify 适配器初始化失败
   */
  ADAPTER_INIT_ERROR: 'ADAPTER_INIT_ERROR',

  /**
   * 插件注册失败
   *
   * @description Fastify 插件注册失败
   */
  PLUGIN_REGISTER_ERROR: 'PLUGIN_REGISTER_ERROR',

  /**
   * 中间件注册失败
   *
   * @description 中间件注册失败
   */
  MIDDLEWARE_REGISTER_ERROR: 'MIDDLEWARE_REGISTER_ERROR',

  /**
   * 健康检查失败
   *
   * @description 健康检查服务检测到系统异常
   */
  HEALTH_CHECK_FAILED: 'HEALTH_CHECK_FAILED',

  /**
   * 配置验证失败
   *
   * @description Fastify-Pro 配置验证失败
   */
  CONFIG_VALIDATION_ERROR: 'CONFIG_VALIDATION_ERROR',
} as const;

// ============================================================================
// HTTP 头部名称 (HTTP Header Names)
// ============================================================================

/**
 * HTTP 头部名称常量
 *
 * @description 定义标准的 HTTP 头部名称
 */
export const HTTP_HEADERS = {
  /**
   * 租户 ID 头部
   *
   * @description 用于传递租户 ID 的 HTTP 头部
   */
  TENANT_ID: 'X-Tenant-ID',

  /**
   * 用户 ID 头部
   *
   * @description 用于传递用户 ID 的 HTTP 头部
   */
  USER_ID: 'X-User-ID',

  /**
   * 请求 ID 头部
   *
   * @description 用于请求追踪的头部
   */
  REQUEST_ID: 'X-Request-ID',

  /**
   * 追踪 ID 头部
   *
   * @description 用于分布式追踪的头部
   */
  TRACE_ID: 'X-Trace-ID',

  /**
   * API 版本头部
   *
   * @description 用于 API 版本控制的头部
   */
  API_VERSION: 'X-API-Version',

  /**
   * 客户端版本头部
   *
   * @description 用于客户端版本信息的头部
   */
  CLIENT_VERSION: 'X-Client-Version',
} as const;

// ============================================================================
// 默认配置值 (Default Configuration Values)
// ============================================================================

/**
 * Fastify-Pro 默认配置
 *
 * @description 定义 Fastify-Pro 模块的默认配置值
 * 避免在代码中出现魔法数字和硬编码字符串
 */
export const FASTIFY_PRO_DEFAULTS = {
  /**
   * 默认端口号
   *
   * @description Fastify 服务器的默认监听端口
   */
  PORT: 3000,

  /**
   * 默认主机地址
   *
   * @description Fastify 服务器的默认绑定地址
   */
  HOST: '0.0.0.0',

  /**
   * 日志级别
   *
   * @description 默认日志级别
   */
  LOG_LEVEL: 'info',

  /**
   * 请求体大小限制（字节）
   *
   * @description 请求体的最大大小
   */
  BODY_LIMIT: 1048576, // 1MB

  /**
   * 请求超时时间（毫秒）
   *
   * @description 请求处理的超时时间
   */
  REQUEST_TIMEOUT: 30000, // 30秒

  /**
   * Keep-Alive 超时（毫秒）
   *
   * @description HTTP Keep-Alive 连接的超时时间
   */
  KEEP_ALIVE_TIMEOUT: 5000, // 5秒

  /**
   * 信任代理
   *
   * @description 是否信任代理服务器
   */
  TRUST_PROXY: false,

  /**
   * 启用 CORS
   *
   * @description 是否默认启用 CORS
   */
  ENABLE_CORS: true,

  /**
   * 启用压缩
   *
   * @description 是否启用响应压缩
   */
  ENABLE_COMPRESSION: true,

  /**
   * 启用性能监控
   *
   * @description 是否启用性能监控功能
   */
  ENABLE_PERFORMANCE_MONITORING: false,

  /**
   * 启用租户提取
   *
   * @description 是否启用租户提取中间件
   */
  ENABLE_TENANT_EXTRACTION: true,
} as const;

// ============================================================================
// 插件名称 (Plugin Names)
// ============================================================================

/**
 * 插件名称常量
 *
 * @description 定义 Fastify 插件的标准名称
 */
export const PLUGIN_NAMES = {
  /**
   * 核心插件
   */
  CORE: 'fastify-core-plugin',

  /**
   * CORS 插件
   */
  CORS: 'fastify-cors-plugin',

  /**
   * 压缩插件
   */
  COMPRESSION: 'fastify-compression-plugin',

  /**
   * 速率限制插件
   */
  RATE_LIMIT: 'fastify-rate-limit-plugin',

  /**
   * 健康检查插件
   */
  HEALTH_CHECK: 'fastify-health-check-plugin',
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
 * 错误代码类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type ErrorCodeType = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * HTTP 头部名称类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type HttpHeaderType = (typeof HTTP_HEADERS)[keyof typeof HTTP_HEADERS];

/**
 * 插件名称类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type PluginNameType = (typeof PLUGIN_NAMES)[keyof typeof PLUGIN_NAMES];
