import { EntityId, BaseDomainEvent } from '@hl8/hybrid-archi';
import { UserRole } from '@hl8/hybrid-archi';
import { UserProfile } from '../user/value-objects/user-profile.vo';

/**
 * 用户注册事件
 *
 * @description 当用户注册时发布的领域事件
 * 包含用户的基本信息和注册上下文
 *
 * @since 1.0.0
 */
export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly email: string,
    public readonly username: string,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRegistered';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      email: this.email,
      username: this.username
    };
  }
}

/**
 * 用户激活事件
 *
 * @description 当用户被激活时发布的领域事件
 * 表示用户从待激活状态转换为活跃状态
 *
 * @since 1.0.0
 */
export class UserActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserActivated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString()
    };
  }
}

/**
 * 用户暂停事件
 *
 * @description 当用户被暂停时发布的领域事件
 * 包含暂停原因和时间戳
 *
 * @since 1.0.0
 */
export class UserSuspendedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserSuspended';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      reason: this.reason
    };
  }
}

/**
 * 用户禁用事件
 *
 * @description 当用户被禁用时发布的领域事件
 * 包含禁用原因和时间戳
 *
 * @since 1.0.0
 */
export class UserDisabledEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserDisabled';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      reason: this.reason
    };
  }
}

/**
 * 用户锁定事件
 *
 * @description 当用户被锁定时发布的领域事件
 * 包含锁定原因和时间戳
 *
 * @since 1.0.0
 */
export class UserLockedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserLocked';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      reason: this.reason
    };
  }
}

/**
 * 用户解锁事件
 *
 * @description 当用户被解锁时发布的领域事件
 * 包含解锁时间戳
 *
 * @since 1.0.0
 */
export class UserUnlockedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserUnlocked';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString()
    };
  }
}

/**
 * 用户认证事件
 *
 * @description 当用户成功认证时发布的领域事件
 * 包含认证时间戳
 *
 * @since 1.0.0
 */
export class UserAuthenticatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserAuthenticated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString()
    };
  }
}

/**
 * 用户密码更新事件
 *
 * @description 当用户密码被更新时发布的领域事件
 * 包含更新时间戳
 *
 * @since 1.0.0
 */
export class UserPasswordUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserPasswordUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString()
    };
  }
}

/**
 * 用户分配到租户事件
 *
 * @description 当用户被分配到租户时发布的领域事件
 * 包含租户ID、角色和分配时间
 *
 * @since 1.0.0
 */
export class UserAssignedToTenantEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly assignedTenantId: EntityId,
    public readonly role: UserRole,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserAssignedToTenant';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      tenantId: this.assignedTenantId.toString(),
      role: this.role
    };
  }
}

/**
 * 用户从租户移除事件
 *
 * @description 当用户从租户中移除时发布的领域事件
 * 包含租户ID和移除时间
 *
 * @since 1.0.0
 */
export class UserRemovedFromTenantEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly removedTenantId: EntityId,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRemovedFromTenant';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      tenantId: this.removedTenantId.toString()
    };
  }
}

/**
 * 用户角色添加事件
 *
 * @description 当用户被添加角色时发布的领域事件
 * 包含角色信息和添加时间
 *
 * @since 1.0.0
 */
export class UserRoleAddedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly role: UserRole,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRoleAdded';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      role: this.role
    };
  }
}

// UserRoleRemovedEvent 已在 authorization-events.ts 中定义

/**
 * 用户档案更新事件
 *
 * @description 当用户档案被更新时发布的领域事件
 * 包含新的档案信息和更新时间
 *
 * @since 1.0.0
 */
export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly newProfile: UserProfile,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserProfileUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      newProfile: this.newProfile
    };
  }
}

/**
 * 用户删除事件
 *
 * @description 当用户被删除时发布的领域事件
 * 包含删除原因和时间戳
 *
 * @since 1.0.0
 */
export class UserDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(userId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserDeleted';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId.toString(),
      reason: this.reason
    };
  }
}