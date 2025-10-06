/**
 * 事件数据类型定义
 *
 * @description 定义所有领域事件的数据类型
 * 提供类型安全的事件数据结构
 *
 * ## 类型设计原则
 *
 * ### 类型安全
 * - 使用具体的类型定义替代unknown
 * - 确保事件数据的类型一致性
 * - 提供编译时类型检查
 *
 * ### 可扩展性
 * - 支持事件数据的版本演进
 * - 提供向后兼容的类型定义
 * - 支持可选字段和默认值
 *
 * @since 1.0.0
 */

import { UserRole } from '@hl8/hybrid-archi';
import { UserProfile } from '../../user/value-objects/user-profile.vo';
import { TenantType } from '@hl8/hybrid-archi';
import { TenantConfig } from '../../tenant/value-objects/tenant-config.vo';
import { ResourceLimits } from '../../tenant/value-objects/resource-limits.vo';
import { PermissionScope } from '../../authorization/value-objects/permission.vo';

/**
 * 基础事件数据接口
 *
 * @description 所有事件数据的基础接口
 * 提供通用的字段定义
 */
export interface BaseEventData {
  /** 事件发生时间戳 */
  timestamp?: string;
  /** 事件版本号 */
  version?: number;
}

/**
 * 用户注册事件数据
 */
export interface UserRegisteredEventData extends BaseEventData {
  userId: string;
  email: string;
  username: string;
}

/**
 * 用户激活事件数据
 */
export interface UserActivatedEventData extends BaseEventData {
  userId: string;
}

/**
 * 用户暂停事件数据
 */
export interface UserSuspendedEventData extends BaseEventData {
  userId: string;
  reason: string;
}

/**
 * 用户禁用事件数据
 */
export interface UserDisabledEventData extends BaseEventData {
  userId: string;
  reason: string;
}

/**
 * 用户锁定事件数据
 */
export interface UserLockedEventData extends BaseEventData {
  userId: string;
  reason: string;
}

/**
 * 用户解锁事件数据
 */
export interface UserUnlockedEventData extends BaseEventData {
  userId: string;
}

/**
 * 用户认证事件数据
 */
export interface UserAuthenticatedEventData extends BaseEventData {
  userId: string;
}

/**
 * 用户密码更新事件数据
 */
export interface UserPasswordUpdatedEventData extends BaseEventData {
  userId: string;
}

/**
 * 用户分配到租户事件数据
 */
export interface UserAssignedToTenantEventData extends BaseEventData {
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * 用户从租户移除事件数据
 */
export interface UserRemovedFromTenantEventData extends BaseEventData {
  userId: string;
  tenantId: string;
}

/**
 * 用户角色添加事件数据
 */
export interface UserRoleAddedEventData extends BaseEventData {
  userId: string;
  role: UserRole;
}

/**
 * 用户角色移除事件数据
 */
export interface UserRoleRemovedEventData extends BaseEventData {
  userId: string;
  roleId: string;
  removedBy: string;
}

/**
 * 用户档案更新事件数据
 */
export interface UserProfileUpdatedEventData extends BaseEventData {
  userId: string;
  newProfile: UserProfile;
}

/**
 * 用户删除事件数据
 */
export interface UserDeletedEventData extends BaseEventData {
  userId: string;
  reason: string;
}

/**
 * 租户创建事件数据
 */
export interface TenantCreatedEventData extends BaseEventData {
  tenantId: string;
  code: string;
  name: string;
  type: TenantType;
  adminId: string;
}

/**
 * 租户激活事件数据
 */
export interface TenantActivatedEventData extends BaseEventData {
  tenantId: string;
}

/**
 * 租户暂停事件数据
 */
export interface TenantSuspendedEventData extends BaseEventData {
  tenantId: string;
  reason: string;
}

/**
 * 租户禁用事件数据
 */
export interface TenantDisabledEventData extends BaseEventData {
  tenantId: string;
  reason: string;
}

/**
 * 租户升级事件数据
 */
export interface TenantUpgradedEventData extends BaseEventData {
  tenantId: string;
  fromType: TenantType;
  toType: TenantType;
}

/**
 * 租户名称更新事件数据
 */
export interface TenantNameUpdatedEventData extends BaseEventData {
  tenantId: string;
  newName: string;
}

/**
 * 租户管理员更新事件数据
 */
export interface TenantAdminUpdatedEventData extends BaseEventData {
  tenantId: string;
  newAdminId: string;
}

/**
 * 租户配置更新事件数据
 */
export interface TenantConfigUpdatedEventData extends BaseEventData {
  tenantId: string;
  newConfig: TenantConfig;
}

/**
 * 租户资源限制更新事件数据
 */
export interface TenantResourceLimitsUpdatedEventData extends BaseEventData {
  tenantId: string;
  newResourceLimits: ResourceLimits;
}

/**
 * 租户删除事件数据
 */
export interface TenantDeletedEventData extends BaseEventData {
  tenantId: string;
  reason: string;
}

/**
 * 角色创建事件数据
 */
export interface RoleCreatedEventData extends BaseEventData {
  roleId: string;
  code: string;
  name: string;
  description: string;
  isSystemRole: boolean;
}

/**
 * 角色权限添加事件数据
 */
export interface RolePermissionAddedEventData extends BaseEventData {
  roleId: string;
  permission: {
    name: string;
    description: string;
    resourceType: string;
    actionType: string;
    scope: PermissionScope;
    level: number;
    isSystemPermission: boolean;
  };
}

/**
 * 角色权限移除事件数据
 */
export interface RolePermissionRemovedEventData extends BaseEventData {
  roleId: string;
  permissionName: string;
}

/**
 * 角色父角色添加事件数据
 */
export interface RoleParentAddedEventData extends BaseEventData {
  roleId: string;
  parentRoleId: string;
}

/**
 * 角色父角色移除事件数据
 */
export interface RoleParentRemovedEventData extends BaseEventData {
  roleId: string;
  parentRoleId: string;
}

/**
 * 角色名称更新事件数据
 */
export interface RoleNameUpdatedEventData extends BaseEventData {
  roleId: string;
  newName: string;
}

/**
 * 角色描述更新事件数据
 */
export interface RoleDescriptionUpdatedEventData extends BaseEventData {
  roleId: string;
  newDescription: string;
}

/**
 * 角色激活事件数据
 */
export interface RoleActivatedEventData extends BaseEventData {
  roleId: string;
}

/**
 * 角色停用事件数据
 */
export interface RoleDeactivatedEventData extends BaseEventData {
  roleId: string;
}

/**
 * 用户角色分配事件数据
 */
export interface UserRoleAssignedEventData extends BaseEventData {
  userId: string;
  roleId: string;
  assignedBy: string;
  expiresAt?: string;
}

/**
 * 用户角色移除事件数据
 */
export interface UserRoleRemovedEventData extends BaseEventData {
  userId: string;
  roleId: string;
  removedBy: string;
}

/**
 * 权限验证事件数据
 */
export interface PermissionCheckedEventData extends BaseEventData {
  userId: string;
  permissionName: string;
  resourceId?: string;
  granted: boolean;
}

/**
 * 权限创建事件数据
 */
export interface PermissionCreatedEventData extends BaseEventData {
  permissionId: string;
  name: string;
  description: string;
  resourceType: string;
  actionType: string;
  scope: PermissionScope;
  level: number;
  isSystemPermission: boolean;
}

/**
 * 权限更新事件数据
 */
export interface PermissionUpdatedEventData extends BaseEventData {
  permissionId: string;
  field: string;
  newValue: string;
}

/**
 * 权限删除事件数据
 */
export interface PermissionDeletedEventData extends BaseEventData {
  permissionId: string;
  permissionName: string;
}

/**
 * 部门创建事件数据
 */
export interface DepartmentCreatedEventData extends BaseEventData {
  departmentId: string;
  name: string;
  code: string;
  description: string;
  parentId?: string;
  organizationId: string;
}

/**
 * 部门更新事件数据
 */
export interface DepartmentUpdatedEventData extends BaseEventData {
  departmentId: string;
  field: string;
  newValue: string;
}

/**
 * 部门删除事件数据
 */
export interface DepartmentDeletedEventData extends BaseEventData {
  departmentId: string;
  name: string;
}

/**
 * 部门激活事件数据
 */
export interface DepartmentActivatedEventData extends BaseEventData {
  departmentId: string;
}

/**
 * 部门停用事件数据
 */
export interface DepartmentDeactivatedEventData extends BaseEventData {
  departmentId: string;
}

/**
 * 部门层级调整事件数据
 */
export interface DepartmentHierarchyUpdatedEventData extends BaseEventData {
  departmentId: string;
  oldParentId?: string;
  newParentId?: string;
}

/**
 * 事件数据联合类型
 *
 * @description 所有事件数据的联合类型
 * 用于类型守卫和类型推断
 */
export type EventData = 
  | UserRegisteredEventData
  | UserActivatedEventData
  | UserSuspendedEventData
  | UserDisabledEventData
  | UserLockedEventData
  | UserUnlockedEventData
  | UserAuthenticatedEventData
  | UserPasswordUpdatedEventData
  | UserAssignedToTenantEventData
  | UserRemovedFromTenantEventData
  | UserRoleAddedEventData
  | UserRoleRemovedEventData
  | UserProfileUpdatedEventData
  | UserDeletedEventData
  | TenantCreatedEventData
  | TenantActivatedEventData
  | TenantSuspendedEventData
  | TenantDisabledEventData
  | TenantUpgradedEventData
  | TenantNameUpdatedEventData
  | TenantAdminUpdatedEventData
  | TenantConfigUpdatedEventData
  | TenantResourceLimitsUpdatedEventData
  | TenantDeletedEventData
  | RoleCreatedEventData
  | RolePermissionAddedEventData
  | RolePermissionRemovedEventData
  | RoleParentAddedEventData
  | RoleParentRemovedEventData
  | RoleNameUpdatedEventData
  | RoleDescriptionUpdatedEventData
  | RoleActivatedEventData
  | RoleDeactivatedEventData
  | UserRoleAssignedEventData
  | UserRoleRemovedEventData
  | PermissionCheckedEventData
  | PermissionCreatedEventData
  | PermissionUpdatedEventData
  | PermissionDeletedEventData
  | DepartmentCreatedEventData
  | DepartmentUpdatedEventData
  | DepartmentDeletedEventData
  | DepartmentActivatedEventData
  | DepartmentDeactivatedEventData
  | DepartmentHierarchyUpdatedEventData;