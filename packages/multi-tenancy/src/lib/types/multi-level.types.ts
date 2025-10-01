/**
 * 多层级数据隔离类型定义
 *
 * 定义多层级数据隔离相关的类型和接口
 * 支持租户、组织、部门、用户四个层级的数据隔离
 *
 * @fileoverview 多层级数据隔离类型定义
 * @since 1.0.0
 */

/**
 * 多层级上下文接口
 *
 * 表示当前请求的多层级上下文信息，包含租户、组织、部门、用户等层级信息
 *
 * @description 多层级上下文是多层级数据隔离的核心数据结构
 * 包含完整的层级路径和隔离级别信息
 *
 * ## 业务规则
 *
 * ### 层级关系规则
 * - 租户ID是必填字段，是所有层级的基础
 * - 组织ID是可选的，但必须属于指定租户
 * - 部门ID是可选的，但必须属于指定组织
 * - 用户ID是可选的，但必须属于指定部门
 * - 层级关系必须符合业务逻辑（组织属于租户，部门属于组织，用户属于部门）
 *
 * ### 隔离级别规则
 * - 隔离级别决定数据隔离的粒度
 * - 隔离级别必须与实际的层级信息匹配
 * - 高级别隔离包含低级别隔离（租户级包含组织级，组织级包含部门级等）
 * - 隔离级别影响键生成和权限检查
 *
 * ### 上下文生命周期规则
 * - 多层级上下文与请求生命周期绑定
 * - 上下文变更必须立即生效
 * - 上下文销毁时必须清理所有相关资源
 * - 上下文传递必须是透明的和可靠的
 *
 * @example
 * ```typescript
 * // 租户级上下文
 * const tenantContext: IMultiLevelContext = {
 *   tenantId: 'tenant-123',
 *   isolationLevel: 'tenant',
 *   timestamp: new Date()
 * };
 *
 * // 组织级上下文
 * const orgContext: IMultiLevelContext = {
 *   tenantId: 'tenant-123',
 *   organizationId: 'org-456',
 *   isolationLevel: 'organization',
 *   timestamp: new Date()
 * };
 *
 * // 部门级上下文
 * const deptContext: IMultiLevelContext = {
 *   tenantId: 'tenant-123',
 *   organizationId: 'org-456',
 *   departmentId: 'dept-789',
 *   isolationLevel: 'department',
 *   timestamp: new Date()
 * };
 *
 * // 用户级上下文
 * const userContext: IMultiLevelContext = {
 *   tenantId: 'tenant-123',
 *   organizationId: 'org-456',
 *   departmentId: 'dept-789',
 *   userId: 'user-101',
 *   isolationLevel: 'user',
 *   timestamp: new Date()
 * };
 * ```
 */
export interface IMultiLevelContext {
  /** 租户唯一标识符（必填） */
  tenantId: string;
  /** 组织唯一标识符（可选） */
  organizationId?: string;
  /** 部门唯一标识符（可选） */
  departmentId?: string;
  /** 用户唯一标识符（可选） */
  userId?: string;
  /** 隔离级别 */
  isolationLevel: 'tenant' | 'organization' | 'department' | 'user';
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
 * 层级路径接口
 *
 * 表示用户的完整层级路径，包含所有层级的ID和权限信息
 *
 * @description 层级路径用于确定用户在整个层级结构中的位置
 * 包含完整的层级信息和相应的权限列表
 *
 * @example
 * ```typescript
 * const hierarchyPath: IHierarchyPath = {
 *   tenantId: 'tenant-123',
 *   organizationId: 'org-456',
 *   departmentId: 'dept-789',
 *   userId: 'user-101',
 *   path: ['tenant-123', 'org-456', 'dept-789', 'user-101'],
 *   permissions: ['tenant:read', 'organization:write', 'department:admin', 'user:read']
 * };
 * ```
 */
export interface IHierarchyPath {
  /** 租户ID */
  tenantId: string;
  /** 组织ID */
  organizationId?: string;
  /** 部门ID */
  departmentId?: string;
  /** 用户ID */
  userId?: string;
  /** 层级路径数组 */
  path: string[];
  /** 权限列表 */
  permissions: string[];
  /** 路径创建时间 */
  timestamp?: Date;
}

/**
 * 多层级权限接口
 *
 * 表示多层级权限信息，包含不同层级的权限控制
 *
 * @description 多层级权限用于实现细粒度的权限控制
 * 支持不同层级的不同权限级别
 *
 * @example
 * ```typescript
 * const permission: IMultiLevelPermission = {
 *   tenantId: 'tenant-123',
 *   organizationId: 'org-456',
 *   departmentId: 'dept-789',
 *   userId: 'user-101',
 *   permissions: ['read', 'write', 'admin'],
 *   accessLevel: 'department',
 *   grantedBy: 'user-999',
 *   grantedAt: new Date()
 * };
 * ```
 */
export interface IMultiLevelPermission {
  /** 租户ID */
  tenantId: string;
  /** 组织ID */
  organizationId?: string;
  /** 部门ID */
  departmentId?: string;
  /** 用户ID */
  userId?: string;
  /** 权限列表 */
  permissions: string[];
  /** 访问级别 */
  accessLevel: 'tenant' | 'organization' | 'department' | 'user';
  /** 权限授予者 */
  grantedBy?: string;
  /** 权限授予时间 */
  grantedAt?: Date;
  /** 权限过期时间（可选） */
  expiresAt?: Date;
  /** 权限元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 多层级隔离配置接口
 *
 * 表示多层级隔离的配置选项
 *
 * @description 多层级隔离配置用于控制不同层级的隔离行为
 * 包含隔离策略、键前缀、命名空间等配置
 *
 * @example
 * ```typescript
 * const config: IMultiLevelIsolationConfig = {
 *   enableMultiLevelIsolation: true,
 *   defaultIsolationLevel: 'tenant',
 *   keyPrefix: 'multi:',
 *   namespacePrefix: 'ml_',
 *   levels: {
 *     tenant: {
 *       strategy: 'key-prefix',
 *       keyPrefix: 'tenant:',
 *       enableIsolation: true
 *     },
 *     organization: {
 *       strategy: 'key-prefix',
 *       keyPrefix: 'org:',
 *       enableIsolation: true
 *     },
 *     department: {
 *       strategy: 'namespace',
 *       namespace: 'dept',
 *       enableIsolation: true
 *     },
 *     user: {
 *       strategy: 'database',
 *       database: 'user_db',
 *       enableIsolation: false
 *     }
 *   }
 * };
 * ```
 */
export interface IMultiLevelIsolationConfig {
  /** 是否启用多层级隔离 */
  enableMultiLevelIsolation: boolean;
  /** 默认隔离级别 */
  defaultIsolationLevel: 'tenant' | 'organization' | 'department' | 'user';
  /** 键前缀 */
  keyPrefix?: string;
  /** 命名空间前缀 */
  namespacePrefix?: string;
  /** 各级别配置 */
  levels: {
    tenant: ILevelIsolationConfig;
    organization: ILevelIsolationConfig;
    department: ILevelIsolationConfig;
    user: ILevelIsolationConfig;
  };
  /** 是否启用层级验证 */
  enableHierarchyValidation: boolean;
  /** 是否启用权限检查 */
  enablePermissionCheck: boolean;
}

/**
 * 级别隔离配置接口
 *
 * 表示单个级别的隔离配置
 *
 * @description 每个隔离级别都有独立的配置选项
 * 支持不同的隔离策略和参数
 *
 * @example
 * ```typescript
 * const levelConfig: ILevelIsolationConfig = {
 *   strategy: 'key-prefix',
 *   keyPrefix: 'tenant:',
 *   namespace: 'tenant_ns',
 *   enableIsolation: true,
 *   keySeparator: ':',
 *   maxKeyLength: 256
 * };
 * ```
 */
export interface ILevelIsolationConfig {
  /** 隔离策略 */
  strategy: 'key-prefix' | 'namespace' | 'database' | 'schema';
  /** 键前缀 */
  keyPrefix?: string;
  /** 命名空间 */
  namespace?: string;
  /** 数据库名 */
  database?: string;
  /** 模式名 */
  schema?: string;
  /** 是否启用隔离 */
  enableIsolation: boolean;
  /** 键分隔符 */
  keySeparator?: string;
  /** 最大键长度 */
  maxKeyLength?: number;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存生存时间（毫秒） */
  cacheTtl?: number;
}

/**
 * 多层级操作接口
 *
 * 表示多层级相关的操作信息，用于审计和监控
 *
 * @description 多层级操作记录包含操作的详细信息和层级上下文
 * 用于审计日志、安全检查和操作追踪
 *
 * @example
 * ```typescript
 * const action: IMultiLevelAction = {
 *   action: 'data.read',
 *   context: {
 *     tenantId: 'tenant-123',
 *     organizationId: 'org-456',
 *     isolationLevel: 'organization'
 *   },
 *   userId: 'user-101',
 *   resource: 'document',
 *   resourceId: 'doc-789',
 *   metadata: {
 *     ip: '192.168.1.1',
 *     userAgent: 'Mozilla/5.0...'
 *   },
 *   timestamp: new Date()
 * };
 * ```
 */
export interface IMultiLevelAction {
  /** 操作类型 */
  action: string;
  /** 多层级上下文 */
  context: IMultiLevelContext;
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
 * 多层级验证结果接口
 *
 * 表示多层级验证的结果，包含验证状态和相关信息
 *
 * @description 多层级验证结果用于中间件和守卫
 * 提供验证状态、层级信息和错误信息
 *
 * @example
 * ```typescript
 * const result: IMultiLevelValidationResult = {
 *   valid: true,
 *   context: {
 *     tenantId: 'tenant-123',
 *     organizationId: 'org-456',
 *     isolationLevel: 'organization'
 *   },
 *   hierarchyPath: hierarchyPath,
 *   permissions: ['read', 'write'],
 *   error: null
 * };
 * ```
 */
export interface IMultiLevelValidationResult {
  /** 验证是否成功 */
  valid: boolean;
  /** 多层级上下文 */
  context: IMultiLevelContext;
  /** 层级路径（验证成功时提供） */
  hierarchyPath?: IHierarchyPath;
  /** 权限列表（验证成功时提供） */
  permissions?: string[];
  /** 错误信息（验证失败时提供） */
  error?: string;
  /** 验证时间 */
  timestamp: Date;
}

/**
 * 多层级统计接口
 *
 * 表示多层级隔离的统计信息
 *
 * @description 多层级统计用于监控和性能分析
 * 包含不同层级的操作统计和性能指标
 *
 * @example
 * ```typescript
 * const stats: IMultiLevelStats = {
 *   tenant: {
 *     operations: 1000,
 *     averageLatency: 50,
 *     errorRate: 0.01
 *   },
 *   organization: {
 *     operations: 800,
 *     averageLatency: 45,
 *     errorRate: 0.005
 *   },
 *   department: {
 *     operations: 600,
 *     averageLatency: 40,
 *     errorRate: 0.002
 *   },
 *   user: {
 *     operations: 400,
 *     averageLatency: 35,
 *     errorRate: 0.001
 *   },
 *   timestamp: new Date()
 * };
 * ```
 */
export interface IMultiLevelStats {
  /** 租户级统计 */
  tenant: ILevelStats;
  /** 组织级统计 */
  organization: ILevelStats;
  /** 部门级统计 */
  department: ILevelStats;
  /** 用户级统计 */
  user: ILevelStats;
  /** 统计时间 */
  timestamp: Date;
}

/**
 * 级别统计接口
 *
 * 表示单个级别的统计信息
 *
 * @description 每个隔离级别都有独立的统计信息
 * 包含操作次数、延迟、错误率等指标
 *
 * @example
 * ```typescript
 * const levelStats: ILevelStats = {
 *   operations: 1000,
 *   successfulOperations: 990,
 *   failedOperations: 10,
 *   averageLatency: 50,
 *   maxLatency: 200,
 *   minLatency: 10,
 *   errorRate: 0.01,
 *   cacheHits: 800,
 *   cacheMisses: 200,
 *   cacheHitRate: 0.8
 * };
 * ```
 */
export interface ILevelStats {
  /** 总操作次数 */
  operations: number;
  /** 成功操作次数 */
  successfulOperations: number;
  /** 失败操作次数 */
  failedOperations: number;
  /** 平均延迟（毫秒） */
  averageLatency: number;
  /** 最大延迟（毫秒） */
  maxLatency: number;
  /** 最小延迟（毫秒） */
  minLatency: number;
  /** 错误率 */
  errorRate: number;
  /** 缓存命中次数 */
  cacheHits?: number;
  /** 缓存未命中次数 */
  cacheMisses?: number;
  /** 缓存命中率 */
  cacheHitRate?: number;
}
