/**
 * 用户领域事件
 * 
 * @description 定义用户相关的所有领域事件
 * 支持事件驱动架构和事件溯源
 * 
 * @since 1.0.0
 */

import { UserId, TenantId } from '@hl8/hybrid-archi';
import { UserRole } from '../user/entities/user.entity';

/**
 * 用户注册事件
 * 
 * @description 用户注册时发布的领域事件
 */
export class UserRegisteredEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: string,
    public readonly username: string,
    public readonly role: UserRole,
    public readonly registeredAt: Date = new Date()
  ) {}
}

/**
 * 用户激活事件
 * 
 * @description 用户激活时发布的领域事件
 */
export class UserActivatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly activatedAt: Date = new Date()
  ) {}
}

/**
 * 用户停用事件
 * 
 * @description 用户停用时发布的领域事件
 */
export class UserDeactivatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly reason?: string,
    public readonly deactivatedAt: Date = new Date()
  ) {}
}

/**
 * 用户暂停事件
 * 
 * @description 用户暂停时发布的领域事件
 */
export class UserSuspendedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly reason: string,
    public readonly suspendedAt: Date = new Date()
  ) {}
}

/**
 * 用户分配到租户事件
 * 
 * @description 用户分配到租户时发布的领域事件
 */
export class UserAssignedToTenantEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly role: UserRole,
    public readonly assignedAt: Date = new Date()
  ) {}
}

/**
 * 用户从租户移除事件
 * 
 * @description 用户从租户移除时发布的领域事件
 */
export class UserRemovedFromTenantEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly removedAt: Date = new Date()
  ) {}
}

/**
 * 用户角色更新事件
 * 
 * @description 用户角色更新时发布的领域事件
 */
export class UserRoleUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly oldRole: UserRole,
    public readonly newRole: UserRole,
    public readonly updatedAt: Date = new Date()
  ) {}
}

/**
 * 用户认证事件
 * 
 * @description 用户认证时发布的领域事件
 */
export class UserAuthenticatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly success: boolean,
    public readonly timestamp: Date = new Date()
  ) {}
}

/**
 * 用户密码更新事件
 * 
 * @description 用户密码更新时发布的领域事件
 */
export class UserPasswordUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly updatedAt: Date = new Date()
  ) {}
}

/**
 * 用户配置更新事件
 * 
 * @description 用户配置更新时发布的领域事件
 */
export class UserProfileUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly updatedAt: Date = new Date()
  ) {}
}
