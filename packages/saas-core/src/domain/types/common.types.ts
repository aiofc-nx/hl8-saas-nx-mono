/**
 * 通用类型定义
 *
 * @description 定义领域层通用的类型
 * 提供类型安全的通用数据结构
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { OrganizationType } from '../organization/value-objects/organization-type.vo';
import { TenantType } from '@hl8/hybrid-archi';
import { PermissionScope } from '../authorization/value-objects/permission.vo';

/**
 * 用户偏好设置类型
 *
 * @description 定义用户偏好设置的具体类型
 * 支持常见的用户偏好配置项
 *
 * @since 1.0.0
 */
export interface UserPreferences {
  /** 语言设置 */
  language?: string;
  /** 时区设置 */
  timezone?: string;
  /** 主题设置 */
  theme?: 'light' | 'dark' | 'auto';
  /** 通知设置 */
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  /** 隐私设置 */
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
    showEmail?: boolean;
    showPhone?: boolean;
  };
  /** 其他自定义设置 */
  [key: string]: string | number | boolean | Record<string, unknown> | undefined;
}

/**
 * 租户配置类型
 *
 * @description 定义租户配置的具体类型
 * 支持租户的各种配置选项
 *
 * @since 1.0.0
 */
export interface TenantConfiguration {
  /** 品牌配置 */
  branding?: {
    logo?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  };
  /** 功能配置 */
  features?: {
    sso?: {
      enabled?: boolean;
      provider?: string;
      apiKey?: string;
    };
    analytics?: {
      enabled?: boolean;
      provider?: string;
      apiKey?: string;
    };
  };
  /** 其他自定义设置 */
  [key: string]: string | number | boolean | Record<string, unknown> | undefined;
}

/**
 * 资源使用情况类型
 *
 * @description 定义资源使用情况的数据结构
 *
 * @since 1.0.0
 */
export interface ResourceUsage {
  /** 用户数量 */
  userCount: number;
  /** 组织数量 */
  organizationCount: number;
  /** 部门数量 */
  departmentCount: number;
  /** 存储使用量（MB） */
  storageUsed: number;
  /** 今日API调用次数 */
  apiCallsToday: number;
  /** 本月API调用次数 */
  apiCallsThisMonth: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 资源限制类型
 *
 * @description 定义资源限制的数据结构
 *
 * @since 1.0.0
 */
export interface ResourceLimits {
  /** 最大用户数 */
  maxUsers: number;
  /** 最大组织数 */
  maxOrganizations: number;
  /** 最大部门数 */
  maxDepartments: number;
  /** 最大存储空间（MB） */
  maxStorage: number;
  /** 最大API调用次数（每日） */
  maxApiCallsPerDay: number;
  /** 最大API调用次数（每月） */
  maxApiCallsPerMonth: number;
  /** 是否启用限制 */
  limitsEnabled: boolean;
}

/**
 * 权限检查结果类型
 *
 * @description 定义权限检查的结果数据结构
 *
 * @since 1.0.0
 */
export interface PermissionCheckResult {
  /** 是否拥有权限 */
  hasPermission: boolean;
  /** 权限名称 */
  permissionName: string;
  /** 资源类型 */
  resourceType: string;
  /** 操作类型 */
  actionType: string;
  /** 权限范围 */
  scope: PermissionScope;
  /** 检查时间 */
  checkedAt: Date;
  /** 检查原因 */
  reason?: string;
}

/**
 * 角色分配信息类型
 *
 * @description 定义角色分配的信息数据结构
 *
 * @since 1.0.0
 */
export interface RoleAssignment {
  /** 用户ID */
  userId: EntityId;
  /** 角色ID */
  roleId: EntityId;
  /** 角色代码 */
  roleCode: string;
  /** 角色名称 */
  roleName: string;
  /** 分配时间 */
  assignedAt: Date;
  /** 分配者 */
  assignedBy: string;
  /** 过期时间 */
  expiresAt?: Date;
  /** 是否激活 */
  isActive: boolean;
}

/**
 * 组织管理信息类型
 *
 * @description 定义组织管理的信息数据结构
 *
 * @since 1.0.0
 */
export interface OrganizationManagement {
  /** 组织ID */
  organizationId: EntityId;
  /** 组织名称 */
  organizationName: string;
  /** 组织类型 */
  organizationType: OrganizationType;
  /** 管理员ID */
  adminId: string;
  /** 管理的部门ID列表 */
  managedDepartmentIds: EntityId[];
  /** 管理的用户ID列表 */
  managedUserIds: EntityId[];
  /** 管理权限列表 */
  managementPermissions: string[];
}

/**
 * 租户统计信息类型
 *
 * @description 定义租户统计的信息数据结构
 *
 * @since 1.0.0
 */
export interface TenantStatistics {
  /** 租户ID */
  tenantId: EntityId;
  /** 租户类型 */
  tenantType: TenantType;
  /** 用户统计 */
  userStats: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    disabled: number;
  };
  /** 组织统计 */
  organizationStats: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  /** 部门统计 */
  departmentStats: {
    total: number;
    level1: number;
    level2: number;
    level3: number;
  };
  /** 资源使用统计 */
  resourceStats: {
    storageUsed: number;
    storageLimit: number;
    apiCallsToday: number;
    apiCallsLimit: number;
  };
  /** 最后统计时间 */
  lastCalculated: Date;
}

/**
 * 业务规则验证结果类型
 *
 * @description 定义业务规则验证的结果数据结构
 *
 * @since 1.0.0
 */
export interface BusinessRuleValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings: string[];
  /** 验证时间 */
  validatedAt: Date;
  /** 验证规则列表 */
  validatedRules: string[];
}

/**
 * 领域事件上下文类型
 *
 * @description 定义领域事件的上下文数据结构
 *
 * @since 1.0.0
 */
export interface DomainEventContext {
  /** 事件ID */
  eventId: string;
  /** 聚合根ID */
  aggregateId: EntityId;
  /** 事件版本 */
  version: number;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 事件类型 */
  eventType: string;
  /** 事件时间 */
  occurredAt: Date;
  /** 事件数据 */
  eventData: Record<string, unknown>;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 聚合根快照类型
 *
 * @description 定义聚合根快照的数据结构
 *
 * @since 1.0.0
 */
export interface AggregateSnapshot<T> {
  /** 聚合根ID */
  aggregateId: EntityId;
  /** 快照版本 */
  version: number;
  /** 快照数据 */
  data: T;
  /** 快照类型 */
  snapshotType: string;
  /** 创建时间 */
  createdAt: Date;
  /** 创建者 */
  createdBy: string;
}

/**
 * 查询选项类型
 *
 * @description 定义查询选项的数据结构
 *
 * @since 1.0.0
 */
export interface QueryOptions {
  /** 页码（从1开始） */
  page?: number;
  /** 每页大小 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 过滤条件 */
  filters?: Record<string, unknown>;
  /** 包含字段 */
  includes?: string[];
  /** 排除字段 */
  excludes?: string[];
}

/**
 * 分页结果类型
 *
 * @description 定义分页结果的数据结构
 *
 * @since 1.0.0
 */
export interface PaginatedResult<T> {
  /** 数据项 */
  items: T[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页大小 */
  limit: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrevious: boolean;
}

/**
 * 验证结果类型
 *
 * @description 定义验证结果的数据结构
 *
 * @since 1.0.0
 */
export interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings?: string[];
  /** 验证时间 */
  validatedAt?: Date;
}
