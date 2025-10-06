/**
 * 授权领域事件
 *
 * @description 定义权限与角色相关的领域事件
 * 包括角色创建、权限变更、角色状态变更等事件
 *
 * ## 事件设计原则
 *
 * ### 事件命名规范
 * - 使用过去时态：RoleCreated, PermissionAdded
 * - 事件名称清晰表达业务含义
 * - 事件包含必要的业务数据
 *
 * ### 事件发布时机
 * - 聚合根状态变更时发布
 * - 业务规则验证通过后发布
 * - 事件包含完整的业务上下文
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { Permission, PermissionScope } from '../authorization/value-objects/permission.vo';

/**
 * 角色创建事件
 *
 * @description 当角色被创建时发布的事件
 * 包含角色的基本信息，用于后续的权限初始化
 *
 * @since 1.0.0
 */
export class RoleCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string,
    public readonly isSystemRole: boolean,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RoleCreated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString(),
      code: this.code,
      name: this.name,
      description: this.description,
      isSystemRole: this.isSystemRole
    };
  }
}

/**
 * 角色权限添加事件
 *
 * @description 当角色添加权限时发布的事件
 * 用于权限审计和权限变更追踪
 *
 * @since 1.0.0
 */
export class RolePermissionAddedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly permission: Permission,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RolePermissionAdded';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString(),
      permission: this.permission.getAllPermissionInfo()
    };
  }
}

/**
 * 角色权限移除事件
 *
 * @description 当角色移除权限时发布的事件
 * 用于权限审计和权限变更追踪
 *
 * @since 1.0.0
 */
export class RolePermissionRemovedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly permissionName: string,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RolePermissionRemoved';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString(),
      permissionName: this.permissionName
    };
  }
}

/**
 * 角色父角色添加事件
 *
 * @description 当角色添加父角色时发布的事件
 * 用于权限继承关系追踪
 *
 * @since 1.0.0
 */
export class RoleParentAddedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly parentRoleId: string,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RoleParentAdded';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString(),
      parentRoleId: this.parentRoleId
    };
  }
}

/**
 * 角色父角色移除事件
 *
 * @description 当角色移除父角色时发布的事件
 * 用于权限继承关系追踪
 *
 * @since 1.0.0
 */
export class RoleParentRemovedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly parentRoleId: string,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RoleParentRemoved';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString(),
      parentRoleId: this.parentRoleId
    };
  }
}

/**
 * 角色名称更新事件
 *
 * @description 当角色名称被更新时发布的事件
 * 用于角色变更审计
 *
 * @since 1.0.0
 */
export class RoleNameUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly newName: string,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RoleNameUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString(),
      newName: this.newName
    };
  }
}

/**
 * 角色描述更新事件
 *
 * @description 当角色描述被更新时发布的事件
 * 用于角色变更审计
 *
 * @since 1.0.0
 */
export class RoleDescriptionUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly newDescription: string,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RoleDescriptionUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString(),
      newDescription: this.newDescription
    };
  }
}

/**
 * 角色激活事件
 *
 * @description 当角色被激活时发布的事件
 * 用于角色状态变更追踪
 *
 * @since 1.0.0
 */
export class RoleActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RoleActivated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString()
    };
  }
}

/**
 * 角色停用事件
 *
 * @description 当角色被停用时发布的事件
 * 用于角色状态变更追踪
 *
 * @since 1.0.0
 */
export class RoleDeactivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    tenantId: string
  ) {
    super(roleId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'RoleDeactivated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      roleId: this.roleId.toString()
    };
  }
}

/**
 * 用户角色分配事件
 *
 * @description 当用户被分配角色时发布的事件
 * 用于用户权限变更追踪
 *
 * @since 1.0.0
 */
export class UserRoleAssignedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly roleId: EntityId,
    public readonly assignedBy: EntityId,
    tenantId: string,
    public readonly expiresAt?: Date
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRoleAssigned';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      roleId: this.roleId.toString(),
      assignedBy: this.assignedBy.toString(),
      expiresAt: this.expiresAt?.toISOString()
    };
  }
}

/**
 * 用户角色移除事件
 *
 * @description 当用户角色被移除时发布的事件
 * 用于用户权限变更追踪
 *
 * @since 1.0.0
 */
export class UserRoleRemovedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly roleId: EntityId,
    public readonly removedBy: EntityId,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRoleRemoved';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      roleId: this.roleId.toString(),
      removedBy: this.removedBy.toString()
    };
  }
}

/**
 * 权限验证事件
 *
 * @description 当权限验证发生时发布的事件
 * 用于权限审计和安全监控
 *
 * @since 1.0.0
 */
export class PermissionCheckedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly permissionName: string,
    tenantId: string,
    public readonly granted: boolean,
    public readonly resourceId?: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'PermissionChecked';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      permissionName: this.permissionName,
      resourceId: this.resourceId,
      granted: this.granted
    };
  }
}

/**
 * 权限创建事件
 *
 * @description 当权限被创建时发布的事件
 * 包含权限的基本信息
 *
 * @since 1.0.0
 */
export class PermissionCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly permissionId: EntityId,
    public readonly name: string,
    public readonly description: string,
    public readonly resourceType: string,
    public readonly actionType: string,
    public readonly scope: PermissionScope,
    public readonly level: number,
    public readonly isSystemPermission: boolean,
    tenantId: string
  ) {
    super(permissionId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'PermissionCreated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      permissionId: this.permissionId.toString(),
      name: this.name,
      description: this.description,
      resourceType: this.resourceType,
      actionType: this.actionType,
      scope: this.scope,
      level: this.level,
      isSystemPermission: this.isSystemPermission
    };
  }
}

/**
 * 权限更新事件
 *
 * @description 当权限被更新时发布的事件
 * 用于权限变更审计
 *
 * @since 1.0.0
 */
export class PermissionUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly permissionId: EntityId,
    public readonly field: string,
    public readonly newValue: string,
    tenantId: string
  ) {
    super(permissionId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'PermissionUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      permissionId: this.permissionId.toString(),
      field: this.field,
      newValue: this.newValue
    };
  }
}

/**
 * 权限删除事件
 *
 * @description 当权限被删除时发布的事件
 * 用于权限变更审计
 *
 * @since 1.0.0
 */
export class PermissionDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly permissionId: EntityId,
    public readonly permissionName: string,
    tenantId: string
  ) {
    super(permissionId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'PermissionDeleted';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      permissionId: this.permissionId.toString(),
      permissionName: this.permissionName
    };
  }
}
