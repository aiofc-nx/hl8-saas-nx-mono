/**
 * 数据库模块常量定义
 *
 * @description 定义数据库模块中使用的常量
 * 用于依赖注入、配置管理、错误码定义等
 *
 * ## 最佳实践
 *
 * - ✅ 使用 `as const` 确保类型推断
 * - ✅ 按功能模块分类组织
 * - ✅ 使用 UPPER_SNAKE_CASE 命名规范
 * - ✅ 避免魔法数字和硬编码字符串
 * - ✅ 提供类型安全的常量访问
 *
 * @fileoverview 数据库模块常量定义文件
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
 *
 * ## 使用场景
 *
 * - 模块配置提供者
 * - 服务注入
 * - 管理器注入
 *
 * @example
 * ```typescript
 * @Inject(DI_TOKENS.MODULE_OPTIONS)
 * private readonly options: DatabaseModuleOptions
 * ```
 */
export const DI_TOKENS = {
  /**
   * 数据库模块配置选项令牌
   *
   * @description 用于注入数据库模块的配置参数
   */
  MODULE_OPTIONS: 'DATABASE_MODULE_OPTIONS',

  /**
   * 连接管理器提供者令牌
   *
   * @description 用于注入连接管理器实例
   */
  CONNECTION_MANAGER: 'CONNECTION_MANAGER',

  /**
   * 事务管理器提供者令牌
   *
   * @description 用于注入事务管理器实例
   */
  TRANSACTION_MANAGER: 'TRANSACTION_MANAGER',

  /**
   * 迁移服务提供者令牌
   *
   * @description 用于注入数据库迁移服务实例
   */
  MIGRATION_SERVICE: 'MIGRATION_SERVICE',

  /**
   * 数据库监控服务令牌
   *
   * @description 用于注入数据库监控服务实例
   */
  DATABASE_MONITOR: 'DATABASE_MONITOR',
} as const;

// ============================================================================
// 数据库类型常量 (Database Type Constants)
// ============================================================================

/**
 * 数据库类型定义
 *
 * @description 支持的数据库类型
 * 平台支持 PostgreSQL 和 MongoDB 两种数据库
 */
export const DATABASE_TYPES = {
  /**
   * PostgreSQL 关系型数据库
   *
   * @description 用于存储结构化的业务数据
   */
  POSTGRESQL: 'postgresql',

  /**
   * MongoDB 文档数据库
   *
   * @description 用于存储非结构化的文档数据
   */
  MONGODB: 'mongodb',
} as const;

// ============================================================================
// 隔离策略常量 (Isolation Strategy Constants)
// ============================================================================

/**
 * 租户隔离策略
 *
 * @description 定义多租户数据隔离的策略类型
 * 支持数据库级、Schema级、表级三种隔离策略
 */
export const ISOLATION_STRATEGIES = {
  /**
   * 数据库级隔离
   *
   * @description 每个租户使用独立的数据库
   * 提供最强的数据隔离性，但资源消耗较大
   */
  DATABASE: 'database',

  /**
   * Schema级隔离
   *
   * @description 租户共享数据库，但使用独立的Schema
   * 平衡了隔离性和资源消耗
   */
  SCHEMA: 'schema',

  /**
   * 表级隔离
   *
   * @description 租户共享数据库和Schema，通过租户ID字段隔离
   * 资源消耗最小，但隔离性相对较弱
   */
  TABLE: 'table',
} as const;

// ============================================================================
// 事务隔离级别 (Transaction Isolation Levels)
// ============================================================================

/**
 * 事务隔离级别
 *
 * @description 定义数据库事务的隔离级别
 */
export const ISOLATION_LEVELS = {
  /**
   * 读未提交
   *
   * @description 最低的隔离级别，可能读取到未提交的数据
   */
  READ_UNCOMMITTED: 'READ_UNCOMMITTED',

  /**
   * 读已提交
   *
   * @description 只能读取已提交的数据，防止脏读
   */
  READ_COMMITTED: 'READ_COMMITTED',

  /**
   * 可重复读
   *
   * @description 同一事务中多次读取同一数据结果一致
   */
  REPEATABLE_READ: 'REPEATABLE_READ',

  /**
   * 串行化
   *
   * @description 最高的隔离级别，完全串行化执行
   */
  SERIALIZABLE: 'SERIALIZABLE',
} as const;

// ============================================================================
// 连接状态常量 (Connection Status Constants)
// ============================================================================

/**
 * 连接状态定义
 *
 * @description 定义数据库连接的状态
 */
export const CONNECTION_STATUS = {
  /**
   * 已连接状态
   */
  CONNECTED: 'connected',

  /**
   * 断开连接状态
   */
  DISCONNECTED: 'disconnected',

  /**
   * 连接中状态
   */
  CONNECTING: 'connecting',

  /**
   * 错误状态
   */
  ERROR: 'error',
} as const;

// ============================================================================
// 错误代码 (Error Codes)
// ============================================================================

/**
 * 数据库错误代码
 *
 * @description 定义数据库操作的错误代码
 * 用于统一错误处理和错误追踪
 */
export const ERROR_CODES = {
  /**
   * 数据库连接失败
   */
  CONNECTION_FAILED: 'DB_CONNECTION_FAILED',

  /**
   * 查询执行失败
   */
  QUERY_FAILED: 'DB_QUERY_FAILED',

  /**
   * 事务执行失败
   */
  TRANSACTION_FAILED: 'DB_TRANSACTION_FAILED',

  /**
   * 数据库迁移失败
   */
  MIGRATION_FAILED: 'DB_MIGRATION_FAILED',

  /**
   * 租户未找到
   */
  TENANT_NOT_FOUND: 'DB_TENANT_NOT_FOUND',

  /**
   * 租户数据库创建失败
   */
  TENANT_DB_CREATE_FAILED: 'DB_TENANT_DB_CREATE_FAILED',

  /**
   * 租户数据库删除失败
   */
  TENANT_DB_DELETE_FAILED: 'DB_TENANT_DB_DELETE_FAILED',

  /**
   * 配置无效
   */
  INVALID_CONFIG: 'DB_INVALID_CONFIG',

  /**
   * 连接池耗尽
   */
  POOL_EXHAUSTED: 'DB_POOL_EXHAUSTED',

  /**
   * 超时错误
   */
  TIMEOUT: 'DB_TIMEOUT',
} as const;

// ============================================================================
// 装饰器元数据键 (Decorator Metadata Keys)
// ============================================================================

/**
 * 装饰器元数据键常量
 *
 * @description 用于装饰器存储和读取元数据
 */
export const DECORATOR_METADATA = {
  /**
   * 事务装饰器元数据键
   */
  TRANSACTIONAL: 'database:transactional',

  /**
   * 租户事务装饰器元数据键
   */
  TENANT_TRANSACTIONAL: 'database:tenant-transactional',

  /**
   * 数据库选择器元数据键
   */
  DATABASE_SELECTOR: 'database:selector',
} as const;

// ============================================================================
// 默认配置值 (Configuration Defaults)
// ============================================================================

/**
 * 数据库模块默认配置
 *
 * @description 定义数据库模块的默认配置值
 * 避免在代码中出现魔法数字和硬编码字符串
 */
export const DATABASE_DEFAULTS = {
  /**
   * PostgreSQL 默认端口
   */
  POSTGRES_PORT: 5432,

  /**
   * MongoDB 默认端口
   */
  MONGODB_PORT: 27017,

  /**
   * 默认连接池最小连接数
   */
  POOL_MIN: 5,

  /**
   * 默认连接池最大连接数
   */
  POOL_MAX: 20,

  /**
   * 默认空闲超时时间（毫秒）
   */
  IDLE_TIMEOUT: 30000,

  /**
   * 默认连接超时时间（毫秒）
   */
  CONNECTION_TIMEOUT: 10000,

  /**
   * 默认查询超时时间（毫秒）
   */
  QUERY_TIMEOUT: 30000,

  /**
   * 默认事务超时时间（毫秒）
   */
  TRANSACTION_TIMEOUT: 60000,

  /**
   * 租户数据库前缀
   */
  TENANT_DB_PREFIX: 'hl8_tenant_',

  /**
   * 最大租户数量
   */
  MAX_TENANTS: 1000,

  /**
   * 租户连接限制
   */
  TENANT_CONNECTION_LIMIT: 5,

  /**
   * 慢查询阈值（毫秒）
   */
  SLOW_QUERY_THRESHOLD: 1000,
} as const;

// ============================================================================
// 迁移状态常量 (Migration Status Constants)
// ============================================================================

/**
 * 迁移状态定义
 *
 * @description 定义数据库迁移的状态
 */
export const MIGRATION_STATUS = {
  /**
   * 待执行状态
   */
  PENDING: 'pending',

  /**
   * 执行中状态
   */
  RUNNING: 'running',

  /**
   * 已完成状态
   */
  COMPLETED: 'completed',

  /**
   * 失败状态
   */
  FAILED: 'failed',

  /**
   * 已回滚状态
   */
  ROLLED_BACK: 'rolled_back',
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
 * 数据库类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type DatabaseType = (typeof DATABASE_TYPES)[keyof typeof DATABASE_TYPES];

/**
 * 隔离策略类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type IsolationStrategyType =
  (typeof ISOLATION_STRATEGIES)[keyof typeof ISOLATION_STRATEGIES];

/**
 * 事务隔离级别类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type IsolationLevelType =
  (typeof ISOLATION_LEVELS)[keyof typeof ISOLATION_LEVELS];

/**
 * 连接状态类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type ConnectionStatusType =
  (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

/**
 * 错误代码类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type ErrorCodeType = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 装饰器元数据键类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type DecoratorMetadataType =
  (typeof DECORATOR_METADATA)[keyof typeof DECORATOR_METADATA];

/**
 * 迁移状态类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type MigrationStatusType =
  (typeof MIGRATION_STATUS)[keyof typeof MIGRATION_STATUS];
