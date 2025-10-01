/**
 * 多租户核心类型定义
 *
 * 定义多租户基础设施层的核心类型和接口
 * 这些类型是纯技术性的，不包含业务逻辑
 *
 * @fileoverview 多租户核心类型定义
 * @since 1.0.0
 */

/**
 * 租户上下文接口
 *
 * 表示当前请求的租户上下文信息，包含租户ID、用户ID等基本信息。
 *
 * @description 租户上下文是贯穿整个请求生命周期的核心数据结构。
 * 包含租户标识、用户标识、请求标识等关键信息，支持多租户架构的上下文管理。
 *
 * ## 业务规则
 *
 * ### 租户ID规则
 * - 租户ID是必填字段，用于标识当前请求所属的租户
 * - 租户ID格式必须符合预定义的格式规范
 * - 租户ID在整个请求生命周期内不可变更
 * - 租户ID用于数据隔离和权限控制
 *
 * ### 用户ID规则
 * - 用户ID是可选的，表示当前请求的用户身份
 * - 用户ID与租户ID组合形成唯一的用户身份标识
 * - 用户ID可能为空（如系统内部请求）
 * - 用户ID用于用户级别的权限控制
 *
 * ### 请求ID规则
 * - 请求ID用于追踪和调试，通常是UUID格式
 * - 请求ID在整个请求链路中保持一致
 * - 请求ID用于日志关联和性能分析
 * - 请求ID支持分布式追踪
 *
 * ### 会话ID规则
 * - 会话ID用于标识用户会话，通常是UUID格式
 * - 会话ID在整个会话生命周期内保持一致
 * - 会话ID用于会话管理和安全控制
 * - 会话ID支持会话级别的权限控制
 *
 * ### 元数据规则
 * - 元数据用于存储额外的上下文信息
 * - 元数据内容不参与核心业务逻辑
 * - 元数据可用于审计、监控等辅助功能
 * - 元数据支持自定义扩展
 *
 * ### 时间戳规则
 * - 时间戳记录上下文创建时间
 * - 时间戳采用UTC时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 * - 时间戳用于审计和性能分析
 *
 * @example
 * ```typescript
 * const context: ITenantContext = {
 *   tenantId: 'tenant-123',
 *   userId: 'user-456',
 *   requestId: 'req-789',
 *   sessionId: 'session-abc',
 *   metadata: {
 *     source: 'web',
 *     version: '1.0.0'
 *   },
 *   timestamp: new Date()
 * };
 * ```
 */
export interface ITenantContext {
  /** 租户唯一标识符 */
  tenantId: string;
  /** 用户唯一标识符（可选） */
  userId?: string;
  /** 请求唯一标识符（可选） */
  requestId?: string;
  /** 会话唯一标识符（可选） */
  sessionId?: string;
  /** 额外的元数据（可选） */
  metadata?: Record<string, unknown>;
  /** 上下文创建时间 */
  timestamp: Date;
}

/**
 * 租户信息接口
 *
 * 表示租户的基本信息，用于租户验证和上下文构建
 *
 * @description 租户信息包含租户的基本属性和状态
 * 主要用于租户验证和上下文信息补充
 *
 * @example
 * ```typescript
 * const tenantInfo: ITenantInfo = {
 *   tenantId: 'tenant-123',
 *   name: 'Acme Corp',
 *   status: 'active',
 *   type: 'enterprise',
 *   createdAt: new Date('2024-01-01'),
 *   metadata: {
 *     region: 'us-east-1',
 *     plan: 'premium'
 *   }
 * };
 * ```
 */
export interface ITenantInfo {
  /** 租户唯一标识符 */
  tenantId: string;
  /** 租户名称 */
  name: string;
  /** 租户状态 */
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  /** 租户类型 */
  type: 'enterprise' | 'community' | 'team' | 'personal';
  /** 租户创建时间 */
  createdAt: Date;
  /** 租户更新时间 */
  updatedAt?: Date;
  /** 租户元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 租户操作接口
 *
 * 表示租户相关的操作信息，用于审计和安全检查
 *
 * @description 租户操作记录包含操作的详细信息
 * 用于审计日志、安全检查和操作追踪
 *
 * @example
 * ```typescript
 * const action: ITenantAction = {
 *   action: 'tenant.create',
 *   tenantId: 'tenant-123',
 *   userId: 'user-456',
 *   resource: 'tenant',
 *   resourceId: 'tenant-123',
 *   metadata: {
 *     ip: '192.168.1.1',
 *     userAgent: 'Mozilla/5.0...'
 *   },
 *   timestamp: new Date()
 * };
 * ```
 */
export interface ITenantAction {
  /** 操作类型 */
  action: string;
  /** 租户ID */
  tenantId: string;
  /** 用户ID */
  userId?: string;
  /** 资源类型 */
  resource: string;
  /** 资源ID */
  resourceId: string;
  /** 操作元数据 */
  metadata?: Record<string, unknown>;
  /** 操作时间 */
  timestamp: Date;
}

/**
 * 租户验证结果接口
 *
 * 表示租户验证的结果，包含验证状态和相关信息
 *
 * @description 租户验证结果用于中间件和守卫
 * 提供验证状态和错误信息
 *
 * @example
 * ```typescript
 * const result: ITenantValidationResult = {
 *   valid: true,
 *   tenantId: 'tenant-123',
 *   tenantInfo: tenantInfo,
 *   error: null
 * };
 * ```
 */
export interface ITenantValidationResult {
  /** 验证是否成功 */
  valid: boolean;
  /** 租户ID */
  tenantId: string;
  /** 租户信息（验证成功时提供） */
  tenantInfo?: ITenantInfo;
  /** 错误信息（验证失败时提供） */
  error?: string;
}

/**
 * 租户权限接口
 *
 * 表示租户级别的权限信息
 *
 * @description 租户权限用于访问控制和权限检查
 * 包含权限类型和权限范围
 *
 * @example
 * ```typescript
 * const permission: ITenantPermission = {
 *   permission: 'tenant.read',
 *   tenantId: 'tenant-123',
 *   userId: 'user-456',
 *   granted: true,
 *   expiresAt: new Date('2024-12-31')
 * };
 * ```
 */
export interface ITenantPermission {
  /** 权限标识 */
  permission: string;
  /** 租户ID */
  tenantId: string;
  /** 用户ID */
  userId?: string;
  /** 是否授予权限 */
  granted: boolean;
  /** 权限过期时间（可选） */
  expiresAt?: Date;
  /** 权限元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 租户隔离配置接口
 *
 * 表示租户隔离的配置选项
 *
 * @description 租户隔离配置用于控制数据隔离策略
 * 包含隔离级别、键前缀等配置
 *
 * @example
 * ```typescript
 * const config: ITenantIsolationConfig = {
 *   strategy: 'key-prefix',
 *   keyPrefix: 'tenant:',
 *   namespace: 'tenant-namespace',
 *   enableIsolation: true
 * };
 * ```
 */
export interface ITenantIsolationConfig {
  /** 隔离策略 */
  strategy: 'key-prefix' | 'namespace' | 'database' | 'schema';
  /** 键前缀 */
  keyPrefix?: string;
  /** 命名空间 */
  namespace?: string;
  /** 是否启用隔离 */
  enableIsolation: boolean;
  /** 隔离级别 */
  level: 'strict' | 'relaxed' | 'disabled';
}

/**
 * 租户上下文配置接口
 *
 * 表示租户上下文管理的配置选项
 *
 * @description 租户上下文配置用于控制上下文的行为
 * 包含超时时间、存储方式等配置
 *
 * @example
 * ```typescript
 * const config: ITenantContextConfig = {
 *   enableAutoInjection: true,
 *   contextTimeout: 30000,
 *   enableAuditLog: true,
 *   contextStorage: 'memory'
 * };
 * ```
 */
export interface ITenantContextConfig {
  /** 是否启用自动注入 */
  enableAutoInjection: boolean;
  /** 上下文超时时间（毫秒） */
  contextTimeout: number;
  /** 是否启用审计日志 */
  enableAuditLog: boolean;
  /** 上下文存储方式 */
  contextStorage: 'memory' | 'redis' | 'database';
  /** 是否启用跨租户访问 */
  allowCrossTenantAccess: boolean;
}

/**
 * 租户中间件配置接口
 *
 * 表示租户中间件的配置选项
 *
 * @description 租户中间件配置用于控制中间件的行为
 * 包含租户ID提取方式、验证超时等配置
 *
 * @example
 * ```typescript
 * const config: ITenantMiddlewareConfig = {
 *   enableTenantMiddleware: true,
 *   tenantHeader: 'X-Tenant-ID',
 *   tenantQueryParam: 'tenant',
 *   tenantSubdomain: true,
 *   validationTimeout: 5000
 * };
 * ```
 */
export interface ITenantMiddlewareConfig {
  /** 是否启用租户中间件 */
  enableTenantMiddleware: boolean;
  /** 租户ID请求头名称 */
  tenantHeader: string;
  /** 租户ID查询参数名称 */
  tenantQueryParam: string;
  /** 是否支持子域名提取 */
  tenantSubdomain: boolean;
  /** 验证超时时间（毫秒） */
  validationTimeout: number;
  /** 是否启用严格验证 */
  strictValidation: boolean;
}

/**
 * 租户安全配置接口
 *
 * 表示租户安全相关的配置选项
 *
 * @description 租户安全配置用于控制安全策略
 * 包含失败尝试次数、锁定时间等配置
 *
 * @example
 * ```typescript
 * const config: ITenantSecurityConfig = {
 *   enableSecurityCheck: true,
 *   maxFailedAttempts: 5,
 *   lockoutDuration: 300000,
 *   enableAuditLog: true
 * };
 * ```
 */
export interface ITenantSecurityConfig {
  /** 是否启用安全检查 */
  enableSecurityCheck: boolean;
  /** 最大失败尝试次数 */
  maxFailedAttempts: number;
  /** 锁定持续时间（毫秒） */
  lockoutDuration: number;
  /** 是否启用审计日志 */
  enableAuditLog: boolean;
  /** 是否启用IP白名单 */
  enableIpWhitelist: boolean;
  /** IP白名单 */
  ipWhitelist?: string[];
}

/**
 * 多租户模块配置接口
 *
 * 表示多租户模块的整体配置
 *
 * @description 多租户模块配置整合了所有子配置
 * 用于模块初始化和配置管理
 *
 * @example
 * ```typescript
 * const config: IMultiTenancyModuleOptions = {
 *   context: {
 *     enableAutoInjection: true,
 *     contextTimeout: 30000,
 *     enableAuditLog: true,
 *     contextStorage: 'memory',
 *     allowCrossTenantAccess: false
 *   },
 *   isolation: {
 *     strategy: 'key-prefix',
 *     keyPrefix: 'tenant:',
 *     namespace: 'tenant-namespace',
 *     enableIsolation: true,
 *     level: 'strict'
 *   },
 *   middleware: {
 *     enableTenantMiddleware: true,
 *     tenantHeader: 'X-Tenant-ID',
 *     tenantQueryParam: 'tenant',
 *     tenantSubdomain: true,
 *     validationTimeout: 5000,
 *     strictValidation: true
 *   },
 *   security: {
 *     enableSecurityCheck: true,
 *     maxFailedAttempts: 5,
 *     lockoutDuration: 300000,
 *     enableAuditLog: true,
 *     enableIpWhitelist: false
 *   }
 * };
 * ```
 */
export interface IMultiTenancyModuleOptions {
  /** 租户上下文配置 */
  context: ITenantContextConfig;
  /** 租户隔离配置 */
  isolation: ITenantIsolationConfig;
  /** 租户中间件配置 */
  middleware: ITenantMiddlewareConfig;
  /** 租户安全配置 */
  security: ITenantSecurityConfig;
  /** 多层级隔离配置（可选） */
  multiLevel?: IMultiLevelIsolationConfig;
}

// 重新导出多层级类型
export * from './multi-level.types';

// 重新导入IMultiLevelIsolationConfig用于类型定义
import { IMultiLevelIsolationConfig } from './multi-level.types';
