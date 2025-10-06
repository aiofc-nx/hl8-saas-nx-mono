import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { UserStatus, UserStatusUtils } from '@hl8/hybrid-archi';
import { UserRole, UserRoleUtils } from '@hl8/hybrid-archi';
import { UserProfile } from '../value-objects/user-profile.vo';

/**
 * 用户实体
 *
 * @description 用户是SAAS平台中的基本身份单位
 * 采用充血模型，包含完整的业务逻辑
 *
 * ## 业务规则
 *
 * ### 状态管理规则
 * - 用户注册后状态为 PENDING
 * - 只有 PENDING 状态的用户可以激活
 * - 只有 ACTIVE 状态的用户可以登录
 * - 状态转换必须遵循状态转换矩阵
 *
 * ### 认证规则
 * - 只有 ACTIVE 状态的用户才能进行认证
 * - 密码必须进行哈希处理
 * - 支持密码更新和重置
 *
 * ### 角色管理规则
 * - 用户可以拥有多个角色
 * - 角色权限可以叠加
 * - 管理员角色可以管理下级角色
 *
 * ### 租户分配规则
 * - 用户可以被分配到租户
 * - 用户可以同时属于多个租户
 * - 离开租户后仍然是平台用户
 *
 * @example
 * ```typescript
 * const user = new User(
 *   userId,
 *   'user@example.com',
 *   'username',
 *   'hashedPassword',
 *   userProfile,
 *   UserStatus.PENDING,
 *   [UserRole.REGULAR_USER]
 * );
 * 
 * user.activate(); // 激活用户
 * const isAuthenticated = user.authenticate('password'); // 认证用户
 * user.assignToTenant(tenantId, UserRole.TENANT_ADMIN); // 分配到租户
 * ```
 *
 * @since 1.0.0
 */
export class User extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建用户实体实例
   * 所有属性都是私有的，通过方法访问和修改
   *
   * @param id - 用户ID
   * @param _email - 邮箱地址（唯一标识）
   * @param _username - 用户名（唯一标识）
   * @param _password - 密码（已哈希）
   * @param _profile - 用户档案
   * @param _status - 用户状态
   * @param _roles - 用户角色列表
   * @param _tenantId - 所属租户ID（可选）
   */
  constructor(
    id: EntityId,
    private readonly _email: string,
    private readonly _username: string,
    private _password: string,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _roles: UserRole[],
    private _tenantId?: EntityId
  ) {
    super(id, { createdBy: 'system' });
  }

  /**
   * 激活用户
   *
   * @description 将用户状态从 PENDING 转换为 ACTIVE
   * 只有待激活状态的用户才能激活
   *
   * @throws {UserNotPendingException} 当用户不是待激活状态时抛出异常
   *
   * @example
   * ```typescript
   * user.activate(); // 激活用户
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    if (this._status !== UserStatus.PENDING) {
      throw new UserExceptions.UserStatusException(
        '只有待激活状态的用户才能激活',
        this._status,
        'activate',
        this.id.toString()
      );
    }

    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 暂停用户
   *
   * @description 将用户状态从 ACTIVE 转换为 SUSPENDED
   * 只有活跃状态的用户才能暂停
   *
   * @param reason - 暂停原因
   * @throws {UserNotActiveException} 当用户不是活跃状态时抛出异常
   *
   * @example
   * ```typescript
   * user.suspend('违反使用条款'); // 暂停用户
   * ```
   *
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    if (this._status !== UserStatus.ACTIVE) {
      throw new UserExceptions.UserStatusException(
        '只有活跃状态的用户才能暂停',
        this._status,
        'suspend',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new UserExceptions.UserValidationException(
        '暂停原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = UserStatus.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * 禁用用户
   *
   * @description 将用户状态转换为 DISABLED
   * 只有特定状态的用户才能禁用
   *
   * @param reason - 禁用原因
   * @throws {InvalidUserStatusException} 当用户状态不允许禁用时抛出异常
   *
   * @example
   * ```typescript
   * user.disable('账户违规'); // 禁用用户
   * ```
   *
   * @since 1.0.0
   */
  public disable(reason: string): void {
    if (!UserStatusUtils.canTransitionTo(this._status, UserStatus.DISABLED)) {
      throw new UserExceptions.UserStatusException(
        `用户状态 ${this._status} 不能转换为 DISABLED`,
        this._status,
        'disable',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new UserExceptions.UserValidationException(
        '禁用原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = UserStatus.DISABLED;
    this.updateTimestamp();
  }

  /**
   * 锁定用户
   *
   * @description 将用户状态转换为 LOCKED
   * 通常由于安全原因（如密码错误次数过多）
   *
   * @param reason - 锁定原因
   * @throws {InvalidUserStatusException} 当用户状态不允许锁定时抛出异常
   *
   * @example
   * ```typescript
   * user.lock('密码错误次数过多'); // 锁定用户
   * ```
   *
   * @since 1.0.0
   */
  public lock(reason: string): void {
    if (!UserStatusUtils.canTransitionTo(this._status, UserStatus.LOCKED)) {
      throw new UserExceptions.UserStatusException(
        `用户状态 ${this._status} 不能转换为 LOCKED`,
        this._status,
        'lock',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new UserExceptions.UserValidationException(
        '锁定原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = UserStatus.LOCKED;
    this.updateTimestamp();
  }

  /**
   * 解锁用户
   *
   * @description 将用户状态从 LOCKED 转换为 ACTIVE
   * 只有锁定状态的用户才能解锁
   *
   * @throws {UserNotLockedException} 当用户不是锁定状态时抛出异常
   *
   * @example
   * ```typescript
   * user.unlock(); // 解锁用户
   * ```
   *
   * @since 1.0.0
   */
  public unlock(): void {
    if (this._status !== UserStatus.LOCKED) {
      throw new UserExceptions.UserStatusException(
        '只有锁定状态的用户才能解锁',
        this._status,
        'unlock',
        this.id.toString()
      );
    }

    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 认证用户
   *
   * @description 验证用户密码是否正确
   * 只有活跃状态的用户才能进行认证
   *
   * @param password - 明文密码
   * @returns 认证是否成功
   * @throws {UserNotActiveException} 当用户不是活跃状态时抛出异常
   *
   * @example
   * ```typescript
   * const isAuthenticated = user.authenticate('password'); // true
   * ```
   *
   * @since 1.0.0
   */
  public authenticate(password: string): boolean {
    if (!UserStatusUtils.canLogin(this._status)) {
      throw new UserExceptions.UserStatusException(
        '只有活跃状态的用户才能登录',
        this._status,
        'authenticate',
        this.id.toString()
      );
    }

    // 实际项目中应该使用哈希比较
    // 这里简化处理，实际应该使用 bcrypt 等库
    return this._password === this.hashPassword(password);
  }

  /**
   * 更新密码
   *
   * @description 更新用户密码
   * 需要验证旧密码
   *
   * @param oldPassword - 旧密码
   * @param newPassword - 新密码
   * @throws {InvalidPasswordException} 当旧密码不正确时抛出异常
   * @throws {WeakPasswordException} 当新密码强度不够时抛出异常
   *
   * @example
   * ```typescript
   * user.updatePassword('oldPassword', 'newPassword');
   * ```
   *
   * @since 1.0.0
   */
  public updatePassword(oldPassword: string, newPassword: string): void {
    if (!this.authenticate(oldPassword)) {
      throw new UserExceptions.UserValidationException(
        '原密码不正确',
        'oldPassword',
        oldPassword,
        this.id.toString()
      );
    }

    if (!this.isPasswordStrong(newPassword)) {
      throw new UserExceptions.UserValidationException(
        '新密码强度不够',
        'newPassword',
        newPassword,
        this.id.toString()
      );
    }

    this._password = this.hashPassword(newPassword);
    this.updateTimestamp();
  }

  /**
   * 重置密码
   *
   * @description 重置用户密码（管理员操作）
   * 不需要验证旧密码
   *
   * @param newPassword - 新密码
   * @throws {WeakPasswordException} 当新密码强度不够时抛出异常
   *
   * @example
   * ```typescript
   * user.resetPassword('newPassword');
   * ```
   *
   * @since 1.0.0
   */
  public resetPassword(newPassword: string): void {
    if (!this.isPasswordStrong(newPassword)) {
      throw new UserExceptions.UserValidationException(
        '新密码强度不够',
        'newPassword',
        newPassword,
        this.id.toString()
      );
    }

    this._password = this.hashPassword(newPassword);
    this.updateTimestamp();
  }

  /**
   * 分配到租户
   *
   * @description 将用户分配到指定租户
   * 用户可以同时属于多个租户
   *
   * @param tenantId - 租户ID
   * @param role - 在租户中的角色
   * @throws {UserNotActiveException} 当用户不是活跃状态时抛出异常
   *
   * @example
   * ```typescript
   * user.assignToTenant(tenantId, UserRole.TENANT_ADMIN);
   * ```
   *
   * @since 1.0.0
   */
  public assignToTenant(tenantId: EntityId, role: UserRole): void {
    if (!UserStatusUtils.isAvailable(this._status)) {
      throw new UserExceptions.UserStatusException(
        '只有可用状态的用户才能分配到租户',
        this._status,
        'assignToTenant',
        this.id.toString()
      );
    }

    this._tenantId = tenantId;
    
    // 添加角色（如果不存在）
    if (!this._roles.includes(role)) {
      this._roles.push(role);
    }
    
    this.updateTimestamp();
  }

  /**
   * 从租户移除
   *
   * @description 将用户从租户中移除
   * 用户离开租户后仍然是平台用户
   *
   * @param tenantId - 租户ID
   *
   * @example
   * ```typescript
   * user.removeFromTenant(tenantId);
   * ```
   *
   * @since 1.0.0
   */
  public removeFromTenant(tenantId: EntityId): void {
    if (this._tenantId && this._tenantId.equals(tenantId)) {
      this._tenantId = undefined;
      this.updateTimestamp();
    }
  }

  /**
   * 添加角色
   *
   * @description 为用户添加新角色
   * 如果角色已存在则不重复添加
   *
   * @param role - 要添加的角色
   *
   * @example
   * ```typescript
   * user.addRole(UserRole.DEPARTMENT_ADMIN);
   * ```
   *
   * @since 1.0.0
   */
  public addRole(role: UserRole): void {
    if (!this._roles.includes(role)) {
      this._roles.push(role);
      this.updateTimestamp();
    }
  }

  /**
   * 移除角色
   *
   * @description 移除用户的指定角色
   * 如果角色不存在则无操作
   *
   * @param role - 要移除的角色
   *
   * @example
   * ```typescript
   * user.removeRole(UserRole.DEPARTMENT_ADMIN);
   * ```
   *
   * @since 1.0.0
   */
  public removeRole(role: UserRole): void {
    const index = this._roles.indexOf(role);
    if (index > -1) {
      this._roles.splice(index, 1);
      this.updateTimestamp();
    }
  }

  /**
   * 更新档案
   *
   * @description 更新用户的档案信息
   *
   * @param newProfile - 新的档案信息
   *
   * @example
   * ```typescript
   * user.updateProfile(newUserProfile);
   * ```
   *
   * @since 1.0.0
   */
  public updateProfile(newProfile: UserProfile): void {
    this._profile = newProfile;
    this.updateTimestamp();
  }

  /**
   * 检查是否拥有指定角色
   *
   * @description 检查用户是否拥有指定角色
   *
   * @param role - 角色
   * @returns 是否拥有该角色
   *
   * @example
   * ```typescript
   * const hasRole = user.hasRole(UserRole.TENANT_ADMIN); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasRole(role: UserRole): boolean {
    return this._roles.includes(role);
  }

  /**
   * 检查是否拥有指定权限
   *
   * @description 检查用户是否拥有指定权限
   * 基于用户的所有角色进行权限检查
   *
   * @param permission - 权限名称
   * @returns 是否拥有该权限
   *
   * @example
   * ```typescript
   * const hasPermission = user.hasPermission('manage_users'); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasPermission(permission: string): boolean {
    return this._roles.some(role => UserRoleUtils.hasPermission(role, permission));
  }

  /**
   * 检查是否可以管理指定用户
   *
   * @description 检查当前用户是否可以管理指定用户
   * 基于角色层级进行判断
   *
   * @param targetUser - 目标用户
   * @returns 是否可以管理
   *
   * @example
   * ```typescript
   * const canManage = user.canManage(targetUser); // true
   * ```
   *
   * @since 1.0.0
   */
  public canManage(targetUser: User): boolean {
    // 用户不能管理自己
    if (this.id.equals(targetUser.id)) {
      return false;
    }

    // 检查是否有管理权限
    return this._roles.some(role => 
      targetUser._roles.some(targetRole => UserRoleUtils.canManage(role, targetRole))
    );
  }

  /**
   * 检查用户是否活跃
   *
   * @description 检查用户是否处于活跃状态
   *
   * @returns 是否活跃
   *
   * @example
   * ```typescript
   * const isActive = user.isActive(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  /**
   * 检查用户是否可用
   *
   * @description 检查用户是否可用（非禁用和删除状态）
   *
   * @returns 是否可用
   *
   * @example
   * ```typescript
   * const isAvailable = user.isAvailable(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isAvailable(): boolean {
    return UserStatusUtils.isAvailable(this._status);
  }

  /**
   * 检查用户是否可以登录
   *
   * @description 检查用户状态是否允许登录
   *
   * @returns 是否可以登录
   *
   * @example
   * ```typescript
   * const canLogin = user.canLogin(); // true
   * ```
   *
   * @since 1.0.0
   */
  public canLogin(): boolean {
    return UserStatusUtils.canLogin(this._status);
  }

  /**
   * 检查密码强度
   *
   * @description 验证密码是否符合强度要求
   *
   * @param password - 密码
   * @returns 密码是否足够强
   *
   * @since 1.0.0
   */
  private isPasswordStrong(password: string): boolean {
    // 密码强度验证规则
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
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
  private hashPassword(password: string): string {
    // 实际项目中应该使用 bcrypt 等安全库
    // 这里简化处理，仅用于演示
    return `hashed_${password}`;
  }

  // Getter 方法
  public getEmail(): string { return this._email; }
  public getUsername(): string { return this._username; }
  public getStatus(): UserStatus { return this._status; }
  public getRoles(): UserRole[] { return [...this._roles]; }
  public getProfile(): UserProfile { return this._profile; }
  public getTenantId(): EntityId | undefined { return this._tenantId; }
}

// 导入新的异常类
import { UserExceptions } from '../../exceptions';