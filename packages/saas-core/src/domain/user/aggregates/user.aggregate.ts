/**
 * 用户聚合根
 * 
 * @description 用户聚合根管理用户实体的生命周期和一致性边界
 * 负责协调用户相关的业务操作，发布领域事件，确保聚合内数据的一致性
 * 
 * ## 业务规则
 * 
 * ### 聚合边界
 * - 用户聚合包含用户实体及其相关的配置和权限
 * - 确保用户数据的完整性和一致性
 * - 管理用户的生命周期状态转换
 * 
 * ### 事件发布
 * - 用户注册时发布UserRegisteredEvent
 * - 用户激活时发布UserActivatedEvent
 * - 用户停用时发布UserDeactivatedEvent
 * - 用户暂停时发布UserSuspendedEvent
 * - 用户分配到租户时发布UserAssignedToTenantEvent
 * - 用户角色更新时发布UserRoleUpdatedEvent
 * 
 * ### 业务操作
 * - 注册用户：设置基本信息并激活用户
 * - 激活用户：验证状态转换的合法性
 * - 停用用户：将用户状态设为非活跃
 * - 暂停用户：记录暂停原因
 * - 认证用户：验证用户凭据
 * - 更新密码：更新用户密码
 * - 分配租户：将用户分配到租户
 * 
 * @example
 * ```typescript
 * // 注册用户
 * const userAggregate = UserAggregate.register(
 *   userId,
 *   email,
 *   username,
 *   password,
 *   profile,
 *   role
 * );
 * 
 * // 激活用户
 * userAggregate.activate();
 * 
 * // 认证用户
 * const isValid = userAggregate.authenticate(password);
 * 
 * // 分配到租户
 * userAggregate.assignToTenant(tenantId);
 * ```
 * 
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '@hl8/hybrid-archi';
import { UserId, Email, Username, Password } from '@hl8/hybrid-archi';
import { TenantId } from '@hl8/hybrid-archi';
import { User, UserStatus, UserRole } from '../entities/user.entity';
import { UserProfile } from '../../value-objects/user-profile.vo';
import { USER_STATUS, USER_ROLES } from '../../../constants/business.constants';
import { 
  UserRegisteredEvent, 
  UserActivatedEvent, 
  UserDeactivatedEvent,
  UserSuspendedEvent,
  UserAssignedToTenantEvent,
  UserRemovedFromTenantEvent,
  UserRoleUpdatedEvent,
  UserAuthenticatedEvent,
  UserPasswordUpdatedEvent,
  UserProfileUpdatedEvent 
} from '../../events/user-events';


/**
 * 用户聚合根类
 * 
 * @description 管理用户实体和发布领域事件
 */
export class UserAggregate extends BaseAggregateRoot {
  constructor(
    private readonly userId: UserId,
    private readonly user: User
  ) {
    super(userId.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 注册用户
   * 
   * @description 创建新用户并发布注册事件
   * 
   * @param id 用户ID
   * @param email 用户邮箱
   * @param username 用户名
   * @param password 密码
   * @param profile 用户配置
   * @param role 用户角色
   * @returns 用户聚合根实例
   * @since 1.0.0
   */
  public static register(
    id: UserId,
    email: Email,
    username: Username,
    password: Password,
    profile: UserProfile,
    role: UserRole = USER_ROLES.REGULAR_USER
  ): UserAggregate {
    const user = new User(
      id,
      email,
      username,
      password,
      profile,
      USER_STATUS.PENDING,
      role
    );

    const aggregate = new UserAggregate(id, user);

    // 发布用户注册事件
    aggregate.addDomainEvent(new UserRegisteredEvent(
      id,
      email.value,
      username.value,
      role
    ));

    return aggregate;
  }

  /**
   * 激活用户
   * 
   * @description 激活用户并发布激活事件
   * 
   * @since 1.0.0
   */
  public activate(): void {
    this.user.activate();
    this.addDomainEvent(new UserActivatedEvent(this.userId));
  }

  /**
   * 停用用户
   * 
   * @description 停用用户并发布停用事件
   * 
   * @param reason 停用原因
   * @since 1.0.0
   */
  public deactivate(reason?: string): void {
    this.user.deactivate();
    this.addDomainEvent(new UserDeactivatedEvent(this.userId, reason));
  }

  /**
   * 暂停用户
   * 
   * @description 暂停用户并发布暂停事件
   * 
   * @param reason 暂停原因
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    this.user.suspend(reason);
    this.addDomainEvent(new UserSuspendedEvent(this.userId, reason));
  }

  /**
   * 认证用户
   * 
   * @description 认证用户并发布认证事件
   * 
   * @param password 密码
   * @returns true如果认证成功，否则false
   * @since 1.0.0
   */
  public authenticate(password: Password): boolean {
    const success = this.user.authenticate(password);
    this.addDomainEvent(new UserAuthenticatedEvent(
      this.userId,
      success,
      new Date()
    ));
    return success;
  }

  /**
   * 更新密码
   * 
   * @description 更新用户密码
   * 
   * @param newPassword 新密码
   * @since 1.0.0
   */
  public updatePassword(newPassword: Password): void {
    this.user.updatePassword(newPassword);
    // 可以发布密码更新事件
  }

  /**
   * 更新用户配置
   * 
   * @description 更新用户配置信息
   * 
   * @param profile 新的用户配置
   * @since 1.0.0
   */
  public updateProfile(profile: UserProfile): void {
    this.user.updateProfile(profile);
    // 可以发布配置更新事件
  }

  /**
   * 分配用户到租户
   * 
   * @description 将用户分配到指定租户并发布分配事件
   * 
   * @param tenantId 租户ID
   * @param role 在租户中的角色
   * @since 1.0.0
   */
  public assignToTenant(tenantId: TenantId, role?: UserRole): void {
    const oldTenantId = this.user.tenantId;
    this.user.assignToTenant(tenantId);
    
    if (role) {
      this.user.updateRole(role);
    }

    this.addDomainEvent(new UserAssignedToTenantEvent(
      this.userId,
      tenantId,
      role || this.user.role
    ));
  }

  /**
   * 从租户移除用户
   * 
   * @description 将用户从当前租户移除并发布移除事件
   * 
   * @since 1.0.0
   */
  public removeFromTenant(): void {
    const tenantId = this.user.tenantId;
    if (tenantId) {
      this.user.removeFromTenant();
      this.addDomainEvent(new UserRemovedFromTenantEvent(this.userId, tenantId));
    }
  }

  /**
   * 更新用户角色
   * 
   * @description 更新用户角色并发布角色更新事件
   * 
   * @param role 新角色
   * @since 1.0.0
   */
  public updateRole(role: UserRole): void {
    const oldRole = this.user.role;
    this.user.updateRole(role);
    this.addDomainEvent(new UserRoleUpdatedEvent(this.userId, oldRole, role));
  }

  /**
   * 获取用户实体
   * 
   * @description 获取聚合根管理的用户实体
   * 
   * @returns 用户实体实例
   * @since 1.0.0
   */
  public getUser(): User {
    return this.user;
  }

  /**
   * 获取用户ID
   * 
   * @description 获取用户的ID
   * 
   * @returns 用户ID
   * @since 1.0.0
   */
  public getUserId(): UserId {
    return this.userId;
  }

  /**
   * 检查用户是否活跃
   * 
   * @returns true如果用户活跃，否则false
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this.user.isActive();
  }

  /**
   * 检查用户是否属于指定租户
   * 
   * @param tenantId 租户ID
   * @returns true如果用户属于该租户，否则false
   * @since 1.0.0
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this.user.belongsToTenant(tenantId);
  }
}
