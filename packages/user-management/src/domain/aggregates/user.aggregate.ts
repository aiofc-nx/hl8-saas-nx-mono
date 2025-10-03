/**
 * 用户聚合根
 *
 * 用户聚合根，负责事件管理和聚合协调，不包含具体业务逻辑。
 *
 * @description 用户聚合根是用户聚合的协调者，负责事件管理和聚合边界控制。
 * 不包含具体业务逻辑，业务逻辑在用户实体中实现。
 * 遵循DDD聚合根设计原则，专注于事件发布和聚合协调。
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理聚合边界和一致性
 * - 发布领域事件
 * - 协调聚合内实体
 * - 维护聚合完整性
 *
 * ### 事件管理规则
 * - 业务操作完成后发布相应事件
 * - 事件包含完整的上下文信息
 * - 事件发布是原子操作
 * - 支持事件版本控制
 *
 * ### 聚合协调规则
 * - 确保聚合内数据一致性
 * - 控制聚合边界
 * - 管理聚合生命周期
 * - 协调跨聚合操作
 *
 * @example
 * ```typescript
 * // 创建用户聚合根
 * const userAggregate = UserAggregate.create(
 *   UserId.generate(),
 *   Email.create("user@example.com"),
 *   Username.create("john_doe"),
 *   Password.create("SecurePassword123!"),
 *   UserProfile.create({ firstName: "John", lastName: "Doe" }),
 *   UserStatus.Pending
 * );
 *
 * // 注册用户（发布事件）
 * userAggregate.registerUser(
 *   Email.create("user@example.com"),
 *   Username.create("john_doe"),
 *   Password.create("SecurePassword123!")
 * );
 *
 * // 获取未提交的事件
 * const events = userAggregate.uncommittedEvents;
 * ```
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../value-objects/user-profile.vo';
import { UserStatus } from '@hl8/hybrid-archi';
import { User } from '../entities/user.entity';
// 临时使用string类型，后续可以创建TenantId值对象
type TenantId = string;
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserAuthenticatedEvent } from '../events/user-authenticated.event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UserAssignedToTenantEvent } from '../events/user-assigned-to-tenant.event';
import { UserPasswordUpdatedEvent } from '../events/user-password-updated.event';
import { UserDisabledEvent } from '../events/user-disabled.event';
import { UserEnabledEvent } from '../events/user-enabled.event';
import { UserDeletedEvent } from '../events/user-deleted.event';
import { DomainEvent } from '@hl8/hybrid-archi';

/**
 * 用户聚合根
 *
 * @description 用户聚合根，负责事件管理和聚合协调
 */
export class UserAggregate extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建用户聚合根实例
   * @param id - 用户ID
   * @param user - 用户实体
   */
  constructor(private readonly userId: UserId, private readonly user: User) {
    super(userId.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 创建用户聚合根
   *
   * @description 创建新的用户聚合根实例
   * @param id - 用户ID
   * @param email - 用户邮箱
   * @param username - 用户名
   * @param password - 用户密码
   * @param profile - 用户配置文件
   * @param status - 用户状态
   * @param tenantId - 租户ID
   * @returns 用户聚合根实例
   */
  public static create(
    id: UserId,
    email: Email,
    username: Username,
    password: Password,
    profile: UserProfile,
    status: UserStatus,
    tenantId?: TenantId
  ): UserAggregate {
    const user = new User(
      id,
      email,
      username,
      password,
      profile,
      status,
      tenantId
    );
    return new UserAggregate(id, user);
  }

  /**
   * 注册用户
   *
   * @description 注册新用户，发布用户注册事件
   * @param email - 用户邮箱
   * @param username - 用户名
   * @param password - 用户密码
   */
  public registerUser(
    email: Email,
    username: Username,
    password: Password
  ): void {
    this.user.register(email, username, password);
    this.addDomainEvent(
      new UserRegisteredEvent(this.userId, email, this.user.tenantId)
    );
  }

  /**
   * 认证用户
   *
   * @description 认证用户，发布用户认证事件
   * @param password - 用户密码
   * @returns 认证是否成功
   */
  public authenticateUser(password: Password): boolean {
    const isValid = this.user.authenticate(password);

    if (isValid) {
      this.addDomainEvent(new UserAuthenticatedEvent(this.userId));
    }

    return isValid;
  }

  /**
   * 更新用户配置文件
   *
   * @description 更新用户配置文件，发布配置文件更新事件
   * @param profile - 新的用户配置文件
   */
  public updateUserProfile(profile: UserProfile): void {
    this.user.updateProfile(profile);
    this.addDomainEvent(new UserProfileUpdatedEvent(this.userId, profile));
  }

  /**
   * 分配用户到租户
   *
   * @description 分配用户到租户，发布租户分配事件
   * @param tenantId - 租户ID
   */
  public assignUserToTenant(tenantId: TenantId): void {
    this.user.assignToTenant(tenantId);
    this.addDomainEvent(new UserAssignedToTenantEvent(this.userId, tenantId));
  }

  /**
   * 更新用户密码
   *
   * @description 更新用户密码，发布密码更新事件
   * @param newPassword - 新密码
   */
  public updateUserPassword(newPassword: Password): void {
    this.user.updatePassword(newPassword);
    this.addDomainEvent(new UserPasswordUpdatedEvent(this.userId));
  }

  /**
   * 禁用用户
   *
   * @description 禁用用户，发布用户禁用事件
   */
  public disableUser(): void {
    this.user.disable();
    this.addDomainEvent(new UserDisabledEvent(this.userId));
  }

  /**
   * 启用用户
   *
   * @description 启用用户，发布用户启用事件
   */
  public enableUser(): void {
    this.user.enable();
    this.addDomainEvent(new UserEnabledEvent(this.userId));
  }

  /**
   * 删除用户
   *
   * @description 删除用户，发布用户删除事件
   */
  public deleteUser(): void {
    this.user.delete();
    this.addDomainEvent(new UserDeletedEvent(this.userId));
  }

  // ========== 聚合查询方法 ==========

  /**
   * 获取用户实体
   *
   * @description 获取聚合内的用户实体
   * @returns 用户实体
   */
  public getUser(): User {
    return this.user;
  }

  /**
   * 检查用户是否可以登录
   *
   * @description 检查用户是否满足登录条件
   * @returns 是否可以登录
   */
  public canUserLogin(): boolean {
    return this.user.canLogin();
  }

  /**
   * 检查用户是否可以更新信息
   *
   * @description 检查用户是否满足更新条件
   * @returns 是否可以更新
   */
  public canUserUpdate(): boolean {
    return this.user.canUpdate();
  }

  /**
   * 检查用户是否已激活
   *
   * @description 检查用户是否已激活
   * @returns 是否已激活
   */
  public isUserActive(): boolean {
    return this.user.isActive();
  }

  /**
   * 检查用户是否待激活
   *
   * @description 检查用户是否待激活
   * @returns 是否待激活
   */
  public isUserPending(): boolean {
    return this.user.isPending();
  }

  /**
   * 检查用户是否已禁用
   *
   * @description 检查用户是否已禁用
   * @returns 是否已禁用
   */
  public isUserDisabled(): boolean {
    return this.user.isDisabled();
  }

  /**
   * 检查用户是否已删除
   *
   * @description 检查用户是否已删除
   * @returns 是否已删除
   */
  public isUserDeleted(): boolean {
    return this.user.isDeleted;
  }

  // ========== 聚合属性访问 ==========

  public get email(): Email {
    return this.user.email;
  }

  public get username(): Username {
    return this.user.username;
  }

  public get profile(): UserProfile {
    return this.user.profile;
  }

  public get status(): UserStatus {
    return this.user.status;
  }

  public override get tenantId(): string {
    return this.user.tenantId || '';
  }

  // ========== 事件溯源支持方法 ==========

  /**
   * 从事件重建聚合
   *
   * @description 从事件流重建用户聚合根状态
   * @param userId - 用户ID
   * @param events - 事件列表
   * @returns 重建的用户聚合根
   */
  public static fromEvents(userId: UserId, events: any[]): UserAggregate {
    // TODO: 实现从事件重建聚合的逻辑
    // 这里需要根据事件类型逐步重建用户状态

    // 临时实现：创建一个默认的用户聚合根
    // 实际实现中，应该根据事件流重建完整的用户状态
    const user = new User(
      userId,
      Email.create('temp@example.com'), // 临时值
      Username.create('temp_user'), // 临时值
      Password.create('temp_password'), // 临时值
      UserProfile.create({
        firstName: 'Temp',
        lastName: 'User',
      }),
      UserStatus.Pending
    );

    const aggregate = new UserAggregate(userId, user);

    // 应用所有事件到聚合根
    events.forEach((event) => {
      aggregate.applyEvent(event);
    });

    return aggregate;
  }

  /**
   * 应用事件到聚合
   *
   * @description 将历史事件应用到聚合根，用于重建状态
   * @param event - 要应用的事件
   * @private
   */
  protected override applyEvent(event: any): void {
    // TODO: 实现事件应用逻辑
    // 根据事件类型更新聚合状态，但不触发新事件
    switch (event.eventType) {
      case 'UserRegistered':
        // 应用用户注册事件
        break;
      case 'UserProfileUpdated':
        // 应用用户配置文件更新事件
        break;
      case 'UserAssignedToTenant':
        // 应用用户分配租户事件
        break;
      case 'UserDisabled':
        // 应用用户禁用事件
        break;
      case 'UserEnabled':
        // 应用用户启用事件
        break;
      case 'UserDeleted':
        // 应用用户删除事件
        break;
      default:
        console.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  /**
   * 获取聚合版本
   *
   * @description 获取聚合的当前版本号
   * @returns 版本号
   */
  public override getVersion(): number {
    return this.version;
  }

  /**
   * 获取聚合ID
   *
   * @description 获取聚合的唯一标识符
   * @returns 聚合ID
   */
  public getAggregateId(): string {
    return this.id.toString();
  }
}
