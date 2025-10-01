/**
 * Multi-Tenancy 模块常量定义
 *
 * @description 定义多租户模块中使用的常量
 * 用于依赖注入、配置键、租户隔离策略等
 *
 * ## 最佳实践
 *
 * - ✅ 使用 `as const` 确保类型推断
 * - ✅ 按功能模块分类组织
 * - ✅ 使用 UPPER_SNAKE_CASE 命名规范
 * - ✅ 避免魔法数字和硬编码字符串
 * - ✅ 提供类型安全的常量访问
 *
 * ## 使用场景
 *
 * ### 依赖注入令牌
 * - 用于 NestJS 依赖注入系统
 * - 标识模块配置和服务提供者
 *
 * ### 租户隔离策略
 * - 定义租户隔离级别
 * - 配置租户上下文管理
 *
 * @example
 * ```typescript
 * // 使用依赖注入令牌
 * @Inject(DI_TOKENS.MODULE_OPTIONS)
 * private readonly options: IMultiTenancyModuleOptions
 *
 * // 使用隔离策略常量
 * const strategy = ISOLATION_STRATEGIES.KEY_PREFIX;
 * ```
 *
 * @fileoverview 多租户模块常量定义文件
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
   * 多租户模块配置选项令牌
   *
   * @description 用于注入多租户模块的配置参数
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.MODULE_OPTIONS)
   * private readonly options: IMultiTenancyModuleOptions
   * ```
   */
  MODULE_OPTIONS: 'MULTI_TENANCY_MODULE_OPTIONS',

  /**
   * 多层级模块配置选项令牌
   *
   * @description 用于注入多层级隔离模块的配置参数
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.MULTI_LEVEL_MODULE_OPTIONS)
   * private readonly options: IMultiLevelIsolationConfig
   * ```
   */
  MULTI_LEVEL_MODULE_OPTIONS: 'MULTI_LEVEL_MODULE_OPTIONS',

  /**
   * 多租户配置服务选项令牌
   *
   * @description 用于注入配置服务的选项参数
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.CONFIG_OPTIONS)
   * private readonly options: ConfigServiceOptions
   * ```
   */
  CONFIG_OPTIONS: 'MULTI_TENANCY_CONFIG_OPTIONS',
} as const;

// ============================================================================
// 租户隔离策略常量 (Tenant Isolation Strategies)
// ============================================================================

/**
 * 租户隔离策略类型
 *
 * @description 定义支持的租户隔离策略类型
 * 使用 as const 确保类型安全
 */
export const ISOLATION_STRATEGIES = {
  /**
   * 键前缀隔离策略
   *
   * @description 通过为每个租户的键添加前缀实现隔离
   * 适用于共享数据库的场景
   */
  KEY_PREFIX: 'key-prefix',

  /**
   * 命名空间隔离策略
   *
   * @description 通过命名空间实现租户隔离
   * 适用于需要逻辑分组的场景
   */
  NAMESPACE: 'namespace',

  /**
   * 数据库隔离策略
   *
   * @description 每个租户使用独立的数据库
   * 适用于高安全性要求的场景
   */
  DATABASE: 'database',

  /**
   * Schema 隔离策略
   *
   * @description 每个租户使用独立的数据库 Schema
   * 适用于 PostgreSQL 等支持 Schema 的数据库
   */
  SCHEMA: 'schema',
} as const;

/**
 * 租户隔离级别
 *
 * @description 定义租户隔离的严格程度
 * 使用 as const 确保类型安全
 */
export const ISOLATION_LEVELS = {
  /**
   * 严格隔离
   *
   * @description 完全隔离租户数据，不允许跨租户访问
   * 推荐用于生产环境
   */
  STRICT: 'strict',

  /**
   * 宽松隔离
   *
   * @description 允许特定情况下的跨租户访问
   * 适用于开发和测试环境
   */
  RELAXED: 'relaxed',

  /**
   * 禁用隔离
   *
   * @description 不进行租户隔离检查
   * 仅用于调试和测试
   */
  DISABLED: 'disabled',
} as const;

// ============================================================================
// 租户状态常量 (Tenant Status Constants)
// ============================================================================

/**
 * 租户状态类型
 *
 * @description 定义租户的状态类型
 * 使用 as const 确保类型安全
 */
export const TENANT_STATUS = {
  /**
   * 活跃状态
   *
   * @description 租户正常运行，可以访问所有功能
   */
  ACTIVE: 'active',

  /**
   * 非活跃状态
   *
   * @description 租户暂停使用，无法访问系统
   */
  INACTIVE: 'inactive',

  /**
   * 暂停状态
   *
   * @description 租户被暂时停用，可能是因为欠费或违规
   */
  SUSPENDED: 'suspended',

  /**
   * 待激活状态
   *
   * @description 租户已创建但尚未激活
   */
  PENDING: 'pending',
} as const;

/**
 * 租户类型常量
 *
 * @description 定义租户的业务类型
 * 使用 as const 确保类型安全
 */
export const TENANT_TYPES = {
  /**
   * 企业租户
   *
   * @description 公司、集团等商业组织
   */
  ENTERPRISE: 'enterprise',

  /**
   * 社群租户
   *
   * @description 社区、协会、俱乐部等社会组织
   */
  COMMUNITY: 'community',

  /**
   * 团队租户
   *
   * @description 项目团队、工作组等临时性组织
   */
  TEAM: 'team',

  /**
   * 个人租户
   *
   * @description 个人用户创建的独立空间
   */
  PERSONAL: 'personal',
} as const;

// ============================================================================
// 上下文存储策略常量 (Context Storage Strategies)
// ============================================================================

/**
 * 上下文存储策略
 *
 * @description 定义租户上下文的存储方式
 * 使用 as const 确保类型安全
 */
export const CONTEXT_STORAGE = {
  /**
   * 内存存储
   *
   * @description 使用内存存储上下文（默认）
   * 性能最高，但不支持跨进程共享
   */
  MEMORY: 'memory',

  /**
   * Redis 存储
   *
   * @description 使用 Redis 存储上下文
   * 支持跨进程共享，适用于分布式系统
   */
  REDIS: 'redis',

  /**
   * 数据库存储
   *
   * @description 使用数据库存储上下文
   * 持久化存储，适用于需要审计的场景
   */
  DATABASE: 'database',
} as const;

// ============================================================================
// 配置默认值常量 (Configuration Defaults)
// ============================================================================

/**
 * 多租户模块配置默认值
 *
 * @description 定义多租户模块的默认配置值
 * 避免在代码中出现魔法数字和硬编码字符串
 */
export const MULTI_TENANCY_DEFAULTS = {
  /**
   * 默认租户 Header 名称
   *
   * @description HTTP 请求头中租户 ID 的字段名
   */
  TENANT_HEADER: 'X-Tenant-ID',

  /**
   * 默认租户查询参数名称
   *
   * @description URL 查询参数中租户 ID 的字段名
   */
  TENANT_QUERY_PARAM: 'tenant',

  /**
   * 默认键前缀
   *
   * @description 租户数据的默认键前缀
   */
  KEY_PREFIX: 'tenant',

  /**
   * 上下文超时时间（毫秒）
   *
   * @description 租户上下文的默认超时时间
   */
  CONTEXT_TIMEOUT: 30000,

  /**
   * 验证超时时间（毫秒）
   *
   * @description 租户验证的默认超时时间
   */
  VALIDATION_TIMEOUT: 5000,

  /**
   * 最大失败尝试次数
   *
   * @description 租户验证失败的最大尝试次数
   */
  MAX_FAILED_ATTEMPTS: 5,

  /**
   * 锁定持续时间（毫秒）
   *
   * @description 租户锁定的默认持续时间
   */
  LOCKOUT_DURATION: 300000, // 5 分钟
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
 * 隔离策略类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type IsolationStrategyType =
  (typeof ISOLATION_STRATEGIES)[keyof typeof ISOLATION_STRATEGIES];

/**
 * 隔离级别类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type IsolationLevelType =
  (typeof ISOLATION_LEVELS)[keyof typeof ISOLATION_LEVELS];

/**
 * 租户状态类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type TenantStatusType =
  (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

/**
 * 租户类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type TenantTypeType = (typeof TENANT_TYPES)[keyof typeof TENANT_TYPES];

/**
 * 上下文存储策略类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type ContextStorageType =
  (typeof CONTEXT_STORAGE)[keyof typeof CONTEXT_STORAGE];
