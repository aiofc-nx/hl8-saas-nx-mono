/**
 * HL8 SAAS平台混合架构常量定义
 *
 * 集中管理领域层和应用层的所有常量，包括错误码、操作类型、状态枚举等。
 * 遵循Clean Architecture的常量管理原则，提供类型安全和统一的常量访问。
 *
 * @description 此文件是混合架构的核心常量定义文件，包含所有业务相关的常量。
 * 支持类型安全的常量使用，避免硬编码，提供统一的常量管理。
 *
 * ## 业务规则
 *
 * ### 常量命名规则
 * - 使用UPPER_SNAKE_CASE命名风格
 * - 常量名应具有描述性和业务含义
 * - 避免使用魔法数字和硬编码字符串
 * - 常量名应反映其用途和上下文
 *
 * ### 常量分类规则
 * - 按业务领域和功能模块分类
 * - 使用命名空间组织相关常量
 * - 提供清晰的常量层次结构
 * - 支持常量的扩展和修改
 *
 * ### 类型安全规则
 * - 使用const assertions确保类型安全
 * - 提供完整的TypeScript类型支持
 * - 支持常量的类型检查和智能提示
 * - 避免运行时类型错误
 *
 * @example
 * ```typescript
 * import {
 *   ENTITY_OPERATIONS,
 *   ERROR_CODES,
 *   SAGA_STATUSES
 * } from './constants';
 *
 * // 使用实体操作常量
 * const operation = ENTITY_OPERATIONS.CREATE;
 *
 * // 使用错误码常量
 * throw new Error(ERROR_CODES.ENTITY.VALIDATION_ERROR);
 *
 * // 使用Saga状态常量
 * if (sagaStatus === SAGA_STATUSES.RUNNING) {
 *   // 处理运行中的Saga
 * }
 * ```
 *
 * @since 1.0.0
 */

// ==================== 实体操作常量 ====================

/**
 * 实体操作类型常量
 */
export const ENTITY_OPERATIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',
} as const;

/**
 * 实体操作来源常量
 */
export const ENTITY_OPERATION_SOURCES = {
  WEB: 'WEB',
  API: 'API',
  CLI: 'CLI',
  SYSTEM: 'SYSTEM',
} as const;

// ==================== 错误码常量 ====================

/**
 * 实体相关错误码
 */
export const ENTITY_ERROR_CODES = {
  VALIDATION_ERROR: 'INVALID_ENTITY_ID',
  TENANT_VALIDATION_ERROR: 'INVALID_TENANT_ID',
  CONCURRENCY_ERROR: 'CONCURRENCY_ERROR',
  NOT_FOUND: 'ENTITY_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_ERROR',
  ALREADY_DELETED: 'ENTITY_ALREADY_DELETED',
  NOT_DELETED: 'ENTITY_NOT_DELETED',
} as const;

/**
 * 用例相关错误码
 */
export const USE_CASE_ERROR_CODES = {
  VALIDATION_ERROR: 'USE_CASE_VALIDATION_ERROR',
  EXECUTION_ERROR: 'USE_CASE_EXECUTION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_DENIED_ERROR',
} as const;

/**
 * 租户相关错误码
 */
export const TENANT_ERROR_CODES = {
  CONTEXT_NOT_FOUND: 'TENANT_CONTEXT_NOT_FOUND',
  ID_NOT_FOUND: 'TENANT_ID_NOT_FOUND',
  INACTIVE: 'TENANT_INACTIVE',
} as const;

// ==================== Saga状态常量 ====================

/**
 * Saga执行状态常量
 */
export const SAGA_STATUSES = {
  NOT_STARTED: 'NOT_STARTED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  COMPENSATING: 'COMPENSATING',
  COMPENSATED: 'COMPENSATED',
  TIMEOUT: 'TIMEOUT',
} as const;

// ==================== 元数据键常量 ====================

/**
 * 装饰器元数据键常量
 */
export const METADATA_KEYS = {
  // 领域层元数据键
  DOMAIN_EVENT: Symbol('domainEvent'),
  AGGREGATE: Symbol('aggregate'),

  // 应用层元数据键
  USE_CASE: Symbol('useCase'),
  COMMAND_HANDLER: Symbol('commandHandler'),
  QUERY_HANDLER: Symbol('queryHandler'),
  EVENT_PROJECTOR: Symbol('eventProjector'),
  COMMAND: Symbol('command'),
  QUERY: Symbol('query'),

  // 基础设施层元数据键
  COMMAND_ENDPOINT: Symbol('commandEndpoint'),
  QUERY_ENDPOINT: Symbol('queryEndpoint'),
  MAPPER: Symbol('mapper'),
  PERFORMANCE_MONITOR: Symbol('performanceMonitor'),
  REQUIRE_PERMISSIONS: Symbol('requirePermissions'),
  CACHEABLE: Symbol('cacheable'),
  AUDIT_LOG: Symbol('auditLog'),
} as const;

// ==================== 模块常量 ====================

/**
 * Fastify模块常量
 */
export const FASTIFY_CONSTANTS = {
  MODULE_OPTIONS: 'FASTIFY_MODULE_OPTIONS',
  ADAPTER: 'FASTIFY_ADAPTER',
} as const;

/**
 * 性能监控常量
 */
export const PERFORMANCE_CONSTANTS = {
  METADATA_KEY: 'performance_monitor_metadata',
} as const;

// ==================== 环境常量 ====================

/**
 * 环境相关常量
 */
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

/**
 * 默认环境配置
 */
export const DEFAULT_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

// ==================== 业务规则常量 ====================

/**
 * 业务规则相关常量
 */
export const BUSINESS_RULES = {
  // 实体ID验证
  ENTITY_ID_MIN_LENGTH: 1,
  ENTITY_ID_MAX_LENGTH: 255,

  // 租户ID验证
  TENANT_ID_MIN_LENGTH: 1,
  TENANT_ID_MAX_LENGTH: 100,

  // 权限码验证
  PERMISSION_CODE_MIN_LENGTH: 1,
  PERMISSION_CODE_MAX_LENGTH: 100,

  // 业务规则码验证
  BUSINESS_RULE_CODE_MIN_LENGTH: 1,
  BUSINESS_RULE_CODE_MAX_LENGTH: 100,
} as const;

// ==================== 缓存常量 ====================

/**
 * 缓存相关常量
 */
export const CACHE_CONSTANTS = {
  DEFAULT_TTL: 300, // 5分钟
  DEFAULT_MAX_ITEMS: 1000,
  DEFAULT_CLEANUP_INTERVAL: 60000, // 1分钟
} as const;

// ==================== 日志常量 ====================

/**
 * 日志相关常量
 */
export const LOG_CONSTANTS = {
  DEFAULT_LEVEL: 'info',
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_FILES: 5,
} as const;

// ==================== 类型定义 ====================

/**
 * 实体操作类型
 */
export type EntityOperation =
  (typeof ENTITY_OPERATIONS)[keyof typeof ENTITY_OPERATIONS];

/**
 * 实体操作来源类型
 */
export type EntityOperationSource =
  (typeof ENTITY_OPERATION_SOURCES)[keyof typeof ENTITY_OPERATION_SOURCES];

/**
 * Saga状态类型
 */
export type SagaStatus = (typeof SAGA_STATUSES)[keyof typeof SAGA_STATUSES];

/**
 * 环境类型
 */
export type Environment = (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];

// ==================== 工具函数 ====================

/**
 * 检查是否为有效的实体操作
 */
export function isValidEntityOperation(
  operation: string
): operation is EntityOperation {
  return Object.values(ENTITY_OPERATIONS).includes(
    operation as EntityOperation
  );
}

/**
 * 检查是否为有效的Saga状态
 */
export function isValidSagaStatus(status: string): status is SagaStatus {
  return Object.values(SAGA_STATUSES).includes(status as SagaStatus);
}

/**
 * 检查是否为有效的环境
 */
export function isValidEnvironment(env: string): env is Environment {
  return Object.values(ENVIRONMENT).includes(env as Environment);
}

/**
 * 获取默认实体操作
 */
export function getDefaultEntityOperation(): EntityOperation {
  return ENTITY_OPERATIONS.CREATE;
}

/**
 * 获取默认环境
 */
export function getDefaultEnvironment(): Environment {
  return DEFAULT_ENVIRONMENT;
}
