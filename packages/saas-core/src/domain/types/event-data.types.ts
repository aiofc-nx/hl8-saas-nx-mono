/**
 * 事件数据类型定义
 *
 * @description 定义领域事件的数据类型
 * 提供类型安全的事件数据结构
 *
 * @since 1.0.0
 */

import { OrganizationType } from '../organization/value-objects/organization-type.vo';
import { UserRole } from '@hl8/hybrid-archi';
import { TenantType } from '@hl8/hybrid-archi';
import { PermissionScope } from '../authorization/value-objects/permission.vo';

/**
 * 组织创建事件数据
 *
 * @description 组织创建事件的数据结构
 *
 * @since 1.0.0
 */
export interface OrganizationCreatedEventData {
  organizationId: string;
  code: string;
  name: string;
  description: string;
  type: OrganizationType;
  tenantId: string;
  [key: string]: unknown;
}

/**
 * 组织名称更新事件数据
 *
 * @description 组织名称更新事件的数据结构
 *
 * @since 1.0.0
 */
export interface OrganizationNameUpdatedEventData {
  organizationId: string;
  newName: string;
  [key: string]: unknown;
}

/**
 * 组织描述更新事件数据
 *
 * @description 组织描述更新事件的数据结构
 *
 * @since 1.0.0
 */
export interface OrganizationDescriptionUpdatedEventData {
  organizationId: string;
  newDescription: string;
  [key: string]: unknown;
}

/**
 * 组织激活事件数据
 *
 * @description 组织激活事件的数据结构
 *
 * @since 1.0.0
 */
export interface OrganizationActivatedEventData {
  organizationId: string;
  [key: string]: unknown;
}

/**
 * 组织停用事件数据
 *
 * @description 组织停用事件的数据结构
 *
 * @since 1.0.0
 */
export interface OrganizationDeactivatedEventData {
  organizationId: string;
  reason: string;
  [key: string]: unknown;
}

/**
 * 组织删除事件数据
 *
 * @description 组织删除事件的数据结构
 *
 * @since 1.0.0
 */
export interface OrganizationDeletedEventData {
  organizationId: string;
  organizationCode: string;
  [key: string]: unknown;
}

/**
 * 用户注册事件数据
 *
 * @description 用户注册事件的数据结构
 *
 * @since 1.0.0
 */
export interface UserRegisteredEventData {
  userId: string;
  email: string;
  username: string;
  tenantId?: string;
  [key: string]: unknown;
}

/**
 * 用户激活事件数据
 *
 * @description 用户激活事件的数据结构
 *
 * @since 1.0.0
 */
export interface UserActivatedEventData {
  userId: string;
  activatedBy: string;
  [key: string]: unknown;
}

/**
 * 用户认证事件数据
 *
 * @description 用户认证事件的数据结构
 *
 * @since 1.0.0
 */
export interface UserAuthenticatedEventData {
  userId: string;
  email: string;
  tenantId?: string;
  loginMethod: 'password' | 'sso' | 'oauth';
  [key: string]: unknown;
}

/**
 * 用户分配事件数据
 *
 * @description 用户分配到租户事件的数据结构
 *
 * @since 1.0.0
 */
export interface UserAssignedToTenantEventData {
  userId: string;
  tenantId: string;
  assignedBy: string;
  role: UserRole;
  [key: string]: unknown;
}

/**
 * 租户创建事件数据
 *
 * @description 租户创建事件的数据结构
 *
 * @since 1.0.0
 */
export interface TenantCreatedEventData {
  tenantId: string;
  code: string;
  name: string;
  type: TenantType;
  createdBy: string;
  [key: string]: unknown;
}

/**
 * 租户激活事件数据
 *
 * @description 租户激活事件的数据结构
 *
 * @since 1.0.0
 */
export interface TenantActivatedEventData {
  tenantId: string;
  activatedBy: string;
  [key: string]: unknown;
}

/**
 * 租户暂停事件数据
 *
 * @description 租户暂停事件的数据结构
 *
 * @since 1.0.0
 */
export interface TenantSuspendedEventData {
  tenantId: string;
  reason: string;
  suspendedBy: string;
  [key: string]: unknown;
}

/**
 * 租户升级事件数据
 *
 * @description 租户升级事件的数据结构
 *
 * @since 1.0.0
 */
export interface TenantUpgradedEventData {
  tenantId: string;
  fromType: TenantType;
  toType: TenantType;
  upgradedBy: string;
  [key: string]: unknown;
}

/**
 * 权限创建事件数据
 *
 * @description 权限创建事件的数据结构
 *
 * @since 1.0.0
 */
export interface PermissionCreatedEventData {
  permissionId: string;
  name: string;
  description: string;
  resourceType: string;
  actionType: string;
  scope: PermissionScope;
  level: number;
  isSystemPermission: boolean;
  [key: string]: unknown;
}

/**
 * 权限更新事件数据
 *
 * @description 权限更新事件的数据结构
 *
 * @since 1.0.0
 */
export interface PermissionUpdatedEventData {
  permissionId: string;
  name: string;
  updatedFields: string[];
  updatedBy: string;
  [key: string]: unknown;
}

/**
 * 权限删除事件数据
 *
 * @description 权限删除事件的数据结构
 *
 * @since 1.0.0
 */
export interface PermissionDeletedEventData {
  permissionId: string;
  name: string;
  deletedBy: string;
  [key: string]: unknown;
}

/**
 * 角色创建事件数据
 *
 * @description 角色创建事件的数据结构
 *
 * @since 1.0.0
 */
export interface RoleCreatedEventData {
  roleId: string;
  code: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  [key: string]: unknown;
}

/**
 * 角色权限添加事件数据
 *
 * @description 角色权限添加事件的数据结构
 *
 * @since 1.0.0
 */
export interface RolePermissionAddedEventData {
  roleId: string;
  permissionId: string;
  permissionName: string;
  addedBy: string;
  [key: string]: unknown;
}

/**
 * 角色权限移除事件数据
 *
 * @description 角色权限移除事件的数据结构
 *
 * @since 1.0.0
 */
export interface RolePermissionRemovedEventData {
  roleId: string;
  permissionId: string;
  permissionName: string;
  removedBy: string;
  [key: string]: unknown;
}

/**
 * 用户角色分配事件数据
 *
 * @description 用户角色分配事件的数据结构
 *
 * @since 1.0.0
 */
export interface UserRoleAssignedEventData {
  userId: string;
  roleId: string;
  roleCode: string;
  assignedBy: string;
  expiresAt?: Date;
  [key: string]: unknown;
}

/**
 * 用户角色移除事件数据
 *
 * @description 用户角色移除事件的数据结构
 *
 * @since 1.0.0
 */
export interface UserRoleRemovedEventData {
  userId: string;
  roleId: string;
  roleCode: string;
  removedBy: string;
  [key: string]: unknown;
}

/**
 * 权限验证事件数据
 *
 * @description 权限验证事件的数据结构
 *
 * @since 1.0.0
 */
export interface PermissionCheckedEventData {
  userId: string;
  permissionName: string;
  resourceType: string;
  actionType: string;
  result: boolean;
  checkedAt: Date;
  [key: string]: unknown;
}
