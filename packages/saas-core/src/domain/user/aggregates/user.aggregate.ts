import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { User } from '../entities/user.entity';
import { UserStatus } from '@hl8/hybrid-archi';
import { UserRole } from '@hl8/hybrid-archi';
import { UserProfile } from '../value-objects/user-profile.vo';
import { UserRegisteredEvent } from '../../events/user-events';
import { TenantContextException } from '../../exceptions/tenant-context.exception';

/**
 * 用户聚合根
 *
 * @description 用户聚合的管理者，负责协调内部实体操作
 * 实现聚合根的管理职责：管理聚合一致性边界、协调内部实体操作、发布领域事件、验证业务规则
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理聚合一致性边界：确保用户聚合内数据一致性
 * - 协调内部实体操作：通过指令模式协调用户实体
 * - 发布领域事件：管理事件的生命周期
 * - 验证业务规则：确保业务规则的正确执行
 *
 * ### 指令模式实现
 * - 聚合根发出指令 → 实体执行指令 → 返回执行结果
 * - 聚合根不直接操作实体属性，而是调用实体的业务方法
 * - 实体执行具体业务逻辑，聚合根负责协调和事件发布
 *
 * @example
 * ```typescript
 * // 创建用户聚合根
 * const userAggregate = UserAggregate.create(
 *   userId,
 *   'user@example.com',
 *   'username',
 *   'password',
 *   userProfile
 * );
 * 
 * // 激活用户（聚合根协调实体）
 * userAggregate.activate();
 * 
 * // 获取用户实体
 * const user = userAggregate.getUser();
 * ```
 *
 * @since 1.0.0
 */
export class UserAggregate extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建用户聚合根实例
   * 聚合根包含用户实体，通过指令模式协调实体操作
   *
   * @param userId - 用户ID
   * @param user - 用户实体
   */
  constructor(
    private readonly userId: EntityId,
    private readonly user: User
  ) {
    super(userId, { createdBy: 'system' });
  }

  /**
   * 获取当前租户ID
   *
   * @description 获取用户当前所属的租户ID
   * 如果用户不属于任何租户，抛出异常
   *
   * @returns 当前租户ID
   * @throws {TenantContextException} 当用户未分配到任何租户时抛出异常
   */
  public getCurrentTenantId(): string {
    const tenantId = this.user.getTenantId();
    if (!tenantId) {
      throw TenantContextException.userNotAssignedToTenant(this.userId.toString());
    }
    return tenantId.toString();
  }

  /**
   * 验证租户上下文
   *
   * @description 验证用户是否有有效的租户上下文
   * 在需要租户上下文的操作中调用此方法
   *
   * @throws {TenantContextException} 当缺少租户上下文时抛出异常
   */
  protected validateTenantContext(): void {
    const tenantId = this.user.getTenantId();
    if (!tenantId) {
      throw TenantContextException.missingTenantContext('用户操作');
    }
  }

  /**
   * 创建用户聚合根
   *
   * @description 工厂方法，创建新的用户聚合根
   * 用户初始状态为 PENDING，角色为 REGULAR_USER
   *
   * @param id - 用户ID
   * @param email - 邮箱地址
   * @param username - 用户名
   * @param password - 密码
   * @param profile - 用户档案
   * @returns 用户聚合根实例
   *
   * @example
   * ```typescript
   * const userAggregate = UserAggregate.create(
   *   userId,
   *   'user@example.com',
   *   'username',
   *   'password',
   *   userProfile
   * );
   * ```
   *
   * @since 1.0.0
   */
  public static create(
    id: EntityId,
    email: string,
    username: string,
    password: string,
    profile: UserProfile
  ): UserAggregate {
    // 1. 创建用户实体
    const user = new User(
      id,
      email,
      username,
      this.hashPassword(password),
      profile,
      UserStatus.PENDING,
      [UserRole.REGULAR_USER] // 默认角色
    );

    // 2. 创建聚合根
    const aggregate = new UserAggregate(id, user);
    
    // 3. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new UserRegisteredEvent(
      id,
      email,
      username,
      '' // tenantId (用户注册时还没有租户)
    ));

    return aggregate;
  }

  /**
   * 激活用户
   *
   * @description 聚合根协调内部实体执行激活操作
   * 指令模式：聚合根发出指令给实体，实体执行具体业务逻辑
   *
   * @example
   * ```typescript
   * userAggregate.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.activate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserActivatedEvent(
      this.userId,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 暂停用户
   *
   * @description 聚合根协调内部实体执行暂停操作
   *
   * @param reason - 暂停原因
   *
   * @example
   * ```typescript
   * userAggregate.suspend('违反使用条款');
   * ```
   *
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.suspend(reason);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserSuspendedEvent(
      this.userId,
      reason,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 禁用用户
   *
   * @description 聚合根协调内部实体执行禁用操作
   *
   * @param reason - 禁用原因
   *
   * @example
   * ```typescript
   * userAggregate.disable('账户违规');
   * ```
   *
   * @since 1.0.0
   */
  public disable(reason: string): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.disable(reason);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserDisabledEvent(
      this.userId,
      reason,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 锁定用户
   *
   * @description 聚合根协调内部实体执行锁定操作
   *
   * @param reason - 锁定原因
   *
   * @example
   * ```typescript
   * userAggregate.lock('密码错误次数过多');
   * ```
   *
   * @since 1.0.0
   */
  public lock(reason: string): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.lock(reason);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserLockedEvent(
      this.userId,
      reason,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 解锁用户
   *
   * @description 聚合根协调内部实体执行解锁操作
   *
   * @example
   * ```typescript
   * userAggregate.unlock();
   * ```
   *
   * @since 1.0.0
   */
  public unlock(): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.unlock();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserUnlockedEvent(
      this.userId,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 认证用户
   *
   * @description 聚合根协调内部实体执行认证操作
   *
   * @param password - 密码
   * @returns 认证是否成功
   *
   * @example
   * ```typescript
   * const isAuthenticated = userAggregate.authenticate('password');
   * ```
   *
   * @since 1.0.0
   */
  public authenticate(password: string): boolean {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    const isAuthenticated = this.user.authenticate(password);
    
    if (isAuthenticated) {
      // 发布领域事件（聚合根职责）
      this.addDomainEvent(new UserAuthenticatedEvent(
        this.userId,
        this.getCurrentTenantId()
      ));
    }
    
    return isAuthenticated;
  }

  /**
   * 更新密码
   *
   * @description 聚合根协调内部实体执行密码更新操作
   *
   * @param oldPassword - 旧密码
   * @param newPassword - 新密码
   *
   * @example
   * ```typescript
   * userAggregate.updatePassword('oldPassword', 'newPassword');
   * ```
   *
   * @since 1.0.0
   */
  public updatePassword(oldPassword: string, newPassword: string): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.updatePassword(oldPassword, newPassword);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserPasswordUpdatedEvent(
      this.userId,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 重置密码
   *
   * @description 聚合根协调内部实体执行密码重置操作
   *
   * @param newPassword - 新密码
   *
   * @example
   * ```typescript
   * userAggregate.resetPassword('newPassword');
   * ```
   *
   * @since 1.0.0
   */
  public resetPassword(newPassword: string): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.resetPassword(newPassword);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserPasswordUpdatedEvent(
      this.userId,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 分配到租户
   *
   * @description 聚合根协调内部实体执行租户分配操作
   *
   * @param tenantId - 租户ID
   * @param role - 在租户中的角色
   *
   * @example
   * ```typescript
   * userAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);
   * ```
   *
   * @since 1.0.0
   */
  public assignToTenant(tenantId: EntityId, role: UserRole): void {
    // 指令模式：聚合根发出指令给实体
    this.user.assignToTenant(tenantId, role);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserAssignedToTenantEvent(
      this.userId,
      tenantId,
      role,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 从租户移除
   *
   * @description 聚合根协调内部实体执行租户移除操作
   *
   * @param tenantId - 租户ID
   *
   * @example
   * ```typescript
   * userAggregate.removeFromTenant(tenantId);
   * ```
   *
   * @since 1.0.0
   */
  public removeFromTenant(tenantId: EntityId): void {
    // 指令模式：聚合根发出指令给实体
    this.user.removeFromTenant(tenantId);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserRemovedFromTenantEvent(
      this.userId,
      tenantId,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 添加角色
   *
   * @description 聚合根协调内部实体执行角色添加操作
   *
   * @param role - 要添加的角色
   *
   * @example
   * ```typescript
   * userAggregate.addRole(UserRole.DEPARTMENT_ADMIN);
   * ```
   *
   * @since 1.0.0
   */
  public addRole(role: UserRole): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.addRole(role);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserRoleAddedEvent(
      this.userId,
      role,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 移除角色
   *
   * @description 聚合根协调内部实体执行角色移除操作
   *
   * @param role - 要移除的角色
   *
   * @example
   * ```typescript
   * userAggregate.removeRole(UserRole.DEPARTMENT_ADMIN);
   * ```
   *
   * @since 1.0.0
   */
  public removeRole(role: UserRole): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.removeRole(role);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserRoleRemovedEvent(
      this.userId,
      EntityId.generate(), // roleId (临时生成，实际应该从role中获取)
      this.userId, // removedBy (假设是用户自己移除)
      this.getCurrentTenantId()
    ));
  }

  /**
   * 更新档案
   *
   * @description 聚合根协调内部实体执行档案更新操作
   *
   * @param newProfile - 新的档案信息
   *
   * @example
   * ```typescript
   * userAggregate.updateProfile(newUserProfile);
   * ```
   *
   * @since 1.0.0
   */
  public updateProfile(newProfile: UserProfile): void {
    // 验证租户上下文
    this.validateTenantContext();
    
    // 指令模式：聚合根发出指令给实体
    this.user.updateProfile(newProfile);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserProfileUpdatedEvent(
      this.userId,
      newProfile,
      this.getCurrentTenantId()
    ));
  }

  /**
   * 获取用户实体
   *
   * @description 聚合根管理内部实体访问
   * 外部只能通过聚合根访问内部实体
   *
   * @returns 用户实体
   *
   * @example
   * ```typescript
   * const user = userAggregate.getUser();
   * const canLogin = user.canLogin();
   * ```
   *
   * @since 1.0.0
   */
  public getUser(): User {
    return this.user;
  }

  /**
   * 获取用户ID
   *
   * @description 获取聚合根的标识符
   *
   * @returns 用户ID
   *
   * @since 1.0.0
   */
  public getUserId(): EntityId {
    return this.userId;
  }

  /**
   * 哈希密码
   *
   * @description 对密码进行哈希处理
   * 实际项目中应该使用 bcrypt 等安全库
   *
   * @param password - 明文密码
   * @returns 哈希后的密码
   *
   * @since 1.0.0
   */
  private static hashPassword(password: string): string {
    // 实际项目中应该使用 bcrypt 等安全库
    // 这里简化处理，仅用于演示
    return `hashed_${password}`;
  }
}

// 导入必要的依赖
import { UserActivatedEvent, UserSuspendedEvent, UserDisabledEvent, UserLockedEvent, UserUnlockedEvent, UserAuthenticatedEvent, UserPasswordUpdatedEvent, UserAssignedToTenantEvent, UserRemovedFromTenantEvent, UserRoleAddedEvent, UserProfileUpdatedEvent } from '../../events/user-events';
import { UserRoleRemovedEvent } from '../../events/authorization-events';