/**
 * 用户实体
 * 
 * @description 用户是SAAS平台的使用者，是系统中最基本的身份单位
 * 用户实体管理用户的基本信息、状态、配置和权限
 * 
 * ## 业务规则
 * 
 * ### 用户生命周期
 * - 注册：PENDING -> ACTIVE
 * - 激活：PENDING -> ACTIVE
 * - 停用：ACTIVE -> INACTIVE
 * - 暂停：ACTIVE -> SUSPENDED
 * - 删除：任何状态 -> DELETED
 * 
 * ### 状态转换规则
 * - 只有PENDING状态的用户可以激活
 * - 只有ACTIVE状态的用户可以停用或暂停
 * - 暂停的用户可以重新激活
 * - 删除的用户不可恢复
 * 
 * ### 认证规则
 * - 用户必须提供有效的邮箱和用户名
 * - 密码必须符合安全要求
 * - 支持密码验证和更新
 * 
 * ### 租户关联规则
 * - 用户可以属于多个租户
 * - 用户离开租户后仍然是平台用户
 * - 租户用户具有租户特定的权限
 * 
 * @example
 * ```typescript
 * // 创建用户
 * const user = new User(
 *   userId,
 *   email,
 *   username,
 *   password,
 *   profile,
 *   UserStatus.PENDING,
 *   tenantId
 * );
 * 
 * // 激活用户
 * user.activate();
 * 
 * // 验证密码
 * const isValid = user.authenticate(password);
 * 
 * // 更新密码
 * user.updatePassword(newPassword);
 * ```
 * 
 * @since 1.0.0
 */

import { BaseEntity } from '@hl8/hybrid-archi';
import { UserId, Email, Username, Password } from '@hl8/hybrid-archi';
import { TenantId } from '@hl8/hybrid-archi';
import { USER_STATUS, USER_ROLES } from '../../../constants/business.constants';
import { UserProfile } from '../../value-objects/user-profile.vo';

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * 用户实体类
 * 
 * @description 实现用户的业务逻辑和状态管理
 */
export class User extends BaseEntity {
  constructor(
    id: UserId,
    private _email: Email,
    private _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _role: UserRole,
    private _tenantId?: TenantId
  ) {
    super(id.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 注册用户
   * 
   * @description 设置用户的基本信息并激活用户
   * 
   * @param email 用户邮箱
   * @param username 用户名
   * @param password 密码
   * @param profile 用户配置
   * @since 1.0.0
   */
  public register(email: Email, username: Username, password: Password, profile: UserProfile): void {
    this.validateRegistration();
    this._email = email;
    this._username = username;
    this._password = password;
    this._profile = profile;
    this._status = USER_STATUS.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 激活用户
   * 
   * @description 将用户状态从PENDING改为ACTIVE
   * 只有PENDING状态的用户可以激活
   * 
   * @throws {UserNotPendingException} 当用户状态不是PENDING时
   * @since 1.0.0
   */
  public activate(): void {
    this.validateActivation();
    this._status = USER_STATUS.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 停用用户
   * 
   * @description 将用户状态从ACTIVE改为INACTIVE
   * 只有ACTIVE状态的用户可以停用
   * 
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  public deactivate(): void {
    this.validateDeactivation();
    this._status = USER_STATUS.INACTIVE;
    this.updateTimestamp();
  }

  /**
   * 暂停用户
   * 
   * @description 将用户状态从ACTIVE改为SUSPENDED
   * 只有ACTIVE状态的用户可以暂停
   * 
   * @param reason 暂停原因
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    this.validateSuspension();
    this._status = USER_STATUS.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * 认证用户
   * 
   * @description 验证用户提供的密码是否正确
   * 
   * @param password 要验证的密码
   * @returns true如果密码正确，否则false
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  public authenticate(password: Password): boolean {
    this.validateAuthentication();
    const isValid = this._password.verify(password.getHashedValue());
    if (isValid) {
      this.updateTimestamp();
    }
    return isValid;
  }

  /**
   * 更新密码
   * 
   * @description 更新用户密码
   * 
   * @param newPassword 新密码
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  public updatePassword(newPassword: Password): void {
    this.validatePasswordUpdate();
    this._password = newPassword;
    this.updateTimestamp();
  }

  /**
   * 更新用户配置
   * 
   * @description 更新用户的配置信息
   * 
   * @param profile 新的用户配置
   * @since 1.0.0
   */
  public updateProfile(profile: UserProfile): void {
    this._profile = profile;
    this.updateTimestamp();
  }

  /**
   * 分配到租户
   * 
   * @description 将用户分配到指定租户
   * 
   * @param tenantId 租户ID
   * @since 1.0.0
   */
  public assignToTenant(tenantId: TenantId): void {
    this._tenantId = tenantId;
    this.updateTimestamp();
  }

  /**
   * 从租户移除
   * 
   * @description 将用户从当前租户移除
   * 
   * @since 1.0.0
   */
  public removeFromTenant(): void {
    this._tenantId = undefined;
    this.updateTimestamp();
  }

  /**
   * 更新用户角色
   * 
   * @description 更新用户的角色
   * 
   * @param role 新角色
   * @since 1.0.0
   */
  public updateRole(role: UserRole): void {
    this._role = role;
    this.updateTimestamp();
  }

  /**
   * 检查用户是否活跃
   * 
   * @returns true如果用户状态是ACTIVE，否则false
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._status === USER_STATUS.ACTIVE;
  }

  /**
   * 检查用户是否属于指定租户
   * 
   * @param tenantId 租户ID
   * @returns true如果用户属于该租户，否则false
   * @since 1.0.0
   */
  public belongsToTenant(tenantId: TenantId): boolean {
    return this._tenantId?.equals(tenantId) || false;
  }

  /**
   * 检查用户是否有指定角色
   * 
   * @param role 角色
   * @returns true如果用户具有该角色，否则false
   * @since 1.0.0
   */
  public hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  /**
   * 验证注册操作
   * 
   * @description 验证用户是否可以注册
   * 
   * @throws {UserAlreadyActiveException} 当用户已经激活时
   * @since 1.0.0
   */
  private validateRegistration(): void {
    if (this._status === USER_STATUS.ACTIVE) {
      throw new UserAlreadyActiveException('User is already active');
    }
  }

  /**
   * 验证激活操作
   * 
   * @description 验证用户是否可以激活
   * 
   * @throws {UserNotPendingException} 当用户状态不是PENDING时
   * @since 1.0.0
   */
  private validateActivation(): void {
    if (this._status !== USER_STATUS.PENDING) {
      throw new UserNotPendingException(`Cannot activate user with status: ${this._status}`);
    }
  }

  /**
   * 验证停用操作
   * 
   * @description 验证用户是否可以停用
   * 
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  private validateDeactivation(): void {
    if (this._status !== USER_STATUS.ACTIVE) {
      throw new UserNotActiveException(`Cannot deactivate user with status: ${this._status}`);
    }
  }

  /**
   * 验证暂停操作
   * 
   * @description 验证用户是否可以暂停
   * 
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  private validateSuspension(): void {
    if (this._status !== USER_STATUS.ACTIVE) {
      throw new UserNotActiveException(`Cannot suspend user with status: ${this._status}`);
    }
  }

  /**
   * 验证认证操作
   * 
   * @description 验证用户是否可以认证
   * 
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  private validateAuthentication(): void {
    if (this._status !== USER_STATUS.ACTIVE) {
      throw new UserNotActiveException(`Cannot authenticate user with status: ${this._status}`);
    }
  }

  /**
   * 验证密码更新操作
   * 
   * @description 验证用户是否可以更新密码
   * 
   * @throws {UserNotActiveException} 当用户状态不是ACTIVE时
   * @since 1.0.0
   */
  private validatePasswordUpdate(): void {
    if (this._status !== USER_STATUS.ACTIVE) {
      throw new UserNotActiveException(`Cannot update password for user with status: ${this._status}`);
    }
  }

  // Getters
  public get email(): Email { return this._email; }
  public get username(): Username { return this._username; }
  public get password(): Password { return this._password; }
  public get profile(): UserProfile { return this._profile; }
  public get status(): UserStatus { return this._status; }
  public get role(): UserRole { return this._role; }
  public get tenantId(): TenantId | undefined { return this._tenantId; }
}

/**
 * 用户状态异常类
 * 
 * @description 用户状态相关的异常
 */
export class UserNotPendingException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotPendingException';
  }
}

export class UserNotActiveException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotActiveException';
  }
}

export class UserAlreadyActiveException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserAlreadyActiveException';
  }
}
