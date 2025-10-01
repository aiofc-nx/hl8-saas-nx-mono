/**
 * Common 模块常量定义
 *
 * @description 定义通用模块中使用的常量
 * 用于依赖注入、装饰器元数据和异常处理
 *
 * ## 最佳实践
 *
 * - ✅ 使用 `as const` 确保类型推断
 * - ✅ 按功能模块分类组织
 * - ✅ 使用 UPPER_SNAKE_CASE 命名规范
 * - ✅ 避免魔法数字和硬编码字符串
 * - ✅ 提供类型安全的常量访问
 *
 * @fileoverview 通用模块常量定义文件
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
   * 异常消息提供者令牌
   *
   * @description 用于注入异常消息提供者实例
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.EXCEPTION_MESSAGE_PROVIDER)
   * private readonly messageProvider: ExceptionMessageProvider
   * ```
   */
  EXCEPTION_MESSAGE_PROVIDER: 'EXCEPTION_MESSAGE_PROVIDER',

  /**
   * 异常配置提供者令牌
   *
   * @description 用于注入异常模块的配置选项
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.EXCEPTION_CONFIG)
   * private readonly config: ExceptionConfig
   * ```
   */
  EXCEPTION_CONFIG: 'EXCEPTION_CONFIG',

  /**
   * 日志记录器提供者令牌
   *
   * @description 用于注入日志记录器实例
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.LOGGER_PROVIDER)
   * private readonly logger: PinoLogger
   * ```
   */
  LOGGER_PROVIDER: 'LOGGER_PROVIDER',
} as const;

// ============================================================================
// 装饰器元数据键 (Decorator Metadata Keys)
// ============================================================================

/**
 * 装饰器元数据键常量
 *
 * @description 用于装饰器元数据存储的键名集合
 * 使用 as const 确保类型安全
 */
export const DECORATOR_METADATA = {
  /**
   * 公开方法元数据键
   *
   * @description 标记方法为公开访问，无需身份验证
   *
   * @example
   * ```typescript
   * SetMetadata(DECORATOR_METADATA.PUBLIC_METHOD, true)
   * ```
   */
  PUBLIC_METHOD: 'public:method',

  /**
   * 角色元数据键
   *
   * @description 标记方法或类所需的角色权限
   *
   * @example
   * ```typescript
   * SetMetadata(DECORATOR_METADATA.ROLES, ['admin', 'user'])
   * ```
   */
  ROLES: 'roles',

  /**
   * 权限元数据键
   *
   * @description 标记方法或类所需的权限
   *
   * @example
   * ```typescript
   * SetMetadata(DECORATOR_METADATA.PERMISSIONS, ['user:read', 'user:write'])
   * ```
   */
  PERMISSIONS: 'permissions',
} as const;

// ============================================================================
// 异常错误码 (Exception Error Codes)
// ============================================================================

/**
 * 异常错误码常量
 *
 * @description 定义标准的异常错误码
 * 遵循统一的错误码命名规范
 */
export const ERROR_CODES = {
  /**
   * 内部服务器错误
   *
   * @description HTTP 500 - 服务器内部错误
   */
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  /**
   * 资源未找到错误
   *
   * @description HTTP 404 - 请求的资源不存在
   */
  NOT_FOUND: 'NOT_FOUND',

  /**
   * 请求参数错误
   *
   * @description HTTP 400 - 客户端请求参数错误
   */
  BAD_REQUEST: 'BAD_REQUEST',

  /**
   * 未授权错误
   *
   * @description HTTP 401 - 用户未授权访问
   */
  UNAUTHORIZED: 'UNAUTHORIZED',

  /**
   * 禁止访问错误
   *
   * @description HTTP 403 - 用户无权限访问资源
   */
  FORBIDDEN: 'FORBIDDEN',

  /**
   * 冲突错误
   *
   * @description HTTP 409 - 资源状态冲突
   */
  CONFLICT: 'CONFLICT',

  /**
   * 请求超时错误
   *
   * @description HTTP 408 - 请求处理超时
   */
  TIMEOUT: 'TIMEOUT',

  /**
   * 不支持的媒体类型
   *
   * @description HTTP 415 - 不支持的请求内容类型
   */
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',

  /**
   * 请求实体过大
   *
   * @description HTTP 413 - 请求体过大
   */
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',

  /**
   * 服务不可用
   *
   * @description HTTP 503 - 服务暂时不可用
   */
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// ============================================================================
// HTTP 状态码 (HTTP Status Codes)
// ============================================================================

/**
 * HTTP 状态码常量
 *
 * @description 定义常用的 HTTP 状态码
 */
export const HTTP_STATUS = {
  /**
   * 成功响应
   */
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  /**
   * 客户端错误
   */
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  /**
   * 服务器错误
   */
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
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
 * 装饰器元数据键类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type DecoratorMetadataType =
  (typeof DECORATOR_METADATA)[keyof typeof DECORATOR_METADATA];

/**
 * 错误码类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type ErrorCodeType = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * HTTP 状态码类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type HttpStatusType = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
