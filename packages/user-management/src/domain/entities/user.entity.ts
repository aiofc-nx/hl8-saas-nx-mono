/**
 * 用户实体
 *
 * 用户实体，包含用户的核心业务逻辑和状态管理。
 *
 * @description 用户实体是用户聚合的核心，包含用户的业务逻辑和状态管理。
 * 遵循DDD充血模型设计，业务逻辑在实体内实现。
 * 不直接处理事件发布，由聚合根负责事件管理。
 *
 * ## 业务规则
 *
 * ### 用户生命周期规则
 * - 用户创建时状态为Pending
 * - 用户注册后状态变为Active
 * - 用户可以被禁用或删除
 * - 用户状态变更需要验证前置条件
 *
 * ### 认证规则
 * - 只有Active状态的用户才能认证
 * - 密码验证使用安全的比较算法
 * - 认证失败不泄露用户信息
 * - 支持密码重置功能
 *
 * ### 数据完整性规则
 * - 用户邮箱在租户内必须唯一
 * - 用户名在租户内必须唯一
 * - 用户信息变更会记录时间戳
 * - 支持用户信息的版本控制
 *
 * @example
 * ```typescript
 * // 创建用户实体
 * const user = new User(
 *   UserId.generate(),
 *   Email.create("user@example.com"),
 *   Username.create("john_doe"),
 *   Password.create("SecurePassword123!"),
 *   UserProfile.create({
 *     firstName: "John",
 *     lastName: "Doe"
 *   }),
 *   UserStatus.Pending,
 *   TenantId.create("tenant-123")
 * );
 *
 * // 注册用户
 * user.register(
 *   Email.create("user@example.com"),
 *   Username.create("john_doe"),
 *   Password.create("SecurePassword123!")
 * );
 *
 * // 认证用户
 * const isValid = user.authenticate(Password.create("SecurePassword123!"));
 * ```
 *
 * @since 1.0.0
 */

import { BaseEntity } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../value-objects/user-profile.vo';
import { UserStatus } from '@hl8/hybrid-archi';
// 临时使用string类型，后续可以创建TenantId值对象
type TenantId = string;

/**
 * 用户实体
 *
 * @description 用户实体，包含用户的核心业务逻辑和状态管理
 */
export class User extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建用户实体实例
   * @param id - 用户ID
   * @param email - 用户邮箱
   * @param username - 用户名
   * @param password - 用户密码
   * @param profile - 用户配置文件
   * @param status - 用户状态
   * @param tenantId - 租户ID
   */
  constructor(
    id: UserId,
    private _email: Email,
    private _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _tenantId?: TenantId
  ) {
    super(id.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 注册用户
   *
   * @description 注册新用户，将状态从Pending变为Active
   * @param email - 用户邮箱
   * @param username - 用户名
   * @param password - 用户密码
   */
  public register(email: Email, username: Username, password: Password): void {
    this.validateRegistration();

    this._email = email;
    this._username = username;
    this._password = password;
    this._status = UserStatus.Active;

    this.updateTimestamp();
  }

  /**
   * 认证用户
   *
   * @description 验证用户密码是否正确
   * @param password - 用户密码
   * @returns 认证是否成功
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
   * 更新用户配置文件
   *
   * @description 更新用户的个人信息
   * @param profile - 新的用户配置文件
   */
  public updateProfile(profile: UserProfile): void {
    this.validateUpdate();

    this._profile = profile;
    this.updateTimestamp();
  }

  /**
   * 分配用户到租户
   *
   * @description 将用户分配到指定租户
   * @param tenantId - 租户ID
   */
  public assignToTenant(tenantId: TenantId): void {
    this.validateTenantAssignment();

    this._tenantId = tenantId;
    this.updateTimestamp();
  }

  /**
   * 更新密码
   *
   * @description 更新用户密码
   * @param newPassword - 新密码
   */
  public updatePassword(newPassword: Password): void {
    this.validateUpdate();

    this._password = newPassword;
    this.updateTimestamp();
  }

  /**
   * 禁用用户
   *
   * @description 禁用用户账户
   */
  public disable(): void {
    this.validateDisable();

    this._status = UserStatus.Disabled;
    this.updateTimestamp();
  }

  /**
   * 启用用户
   *
   * @description 启用用户账户
   */
  public enable(): void {
    this.validateEnable();

    this._status = UserStatus.Active;
    this.updateTimestamp();
  }

  /**
   * 删除用户
   *
   * @description 删除用户账户（软删除）
   */
  public delete(): void {
    this.validateDelete();

    this._status = UserStatus.Deleted;
    this.updateTimestamp();
  }

  // ========== 业务查询方法 ==========

  /**
   * 检查用户是否可以登录
   *
   * @description 检查用户是否满足登录条件
   * @returns 是否可以登录
   */
  public canLogin(): boolean {
    return this._status === UserStatus.Active;
  }

  /**
   * 检查用户是否可以更新信息
   *
   * @description 检查用户是否满足更新条件
   * @returns 是否可以更新
   */
  public canUpdate(): boolean {
    return this._status !== UserStatus.Deleted;
  }

  /**
   * 检查用户是否已激活
   *
   * @description 检查用户是否已激活
   * @returns 是否已激活
   */
  public isActive(): boolean {
    return this._status === UserStatus.Active;
  }

  /**
   * 检查用户是否待激活
   *
   * @description 检查用户是否待激活
   * @returns 是否待激活
   */
  public isPending(): boolean {
    return this._status === UserStatus.Pending;
  }

  /**
   * 检查用户是否已禁用
   *
   * @description 检查用户是否已禁用
   * @returns 是否已禁用
   */
  public isDisabled(): boolean {
    return this._status === UserStatus.Disabled;
  }

  /**
   * 检查用户是否已删除
   *
   * @description 检查用户是否已删除
   * @returns 是否已删除
   */
  public override get isDeleted(): boolean {
    return this._status === UserStatus.Deleted;
  }

  // ========== 验证方法 ==========

  /**
   * 验证注册操作
   *
   * @description 验证用户注册的前置条件
   * @private
   */
  private validateRegistration(): void {
    if (this._status !== UserStatus.Pending) {
      throw new UserAlreadyRegisteredException();
    }
  }

  /**
   * 验证认证操作
   *
   * @description 验证用户认证的前置条件
   * @private
   */
  private validateAuthentication(): void {
    if (this._status !== UserStatus.Active) {
      throw new UserNotActiveException();
    }
  }

  /**
   * 验证更新操作
   *
   * @description 验证用户更新的前置条件
   * @private
   */
  private validateUpdate(): void {
    if (this._status === UserStatus.Deleted) {
      throw new UserDeletedException();
    }
  }

  /**
   * 验证租户分配操作
   *
   * @description 验证租户分配的前置条件
   * @private
   */
  private validateTenantAssignment(): void {
    if (this._status === UserStatus.Deleted) {
      throw new UserDeletedException();
    }
  }

  /**
   * 验证禁用操作
   *
   * @description 验证用户禁用的前置条件
   * @private
   */
  private validateDisable(): void {
    if (this._status === UserStatus.Disabled) {
      throw new UserAlreadyDisabledException();
    }
    if (this._status === UserStatus.Deleted) {
      throw new UserDeletedException();
    }
  }

  /**
   * 验证启用操作
   *
   * @description 验证用户启用的前置条件
   * @private
   */
  private validateEnable(): void {
    if (this._status !== UserStatus.Disabled) {
      throw new UserNotDisabledException();
    }
  }

  /**
   * 验证删除操作
   *
   * @description 验证用户删除的前置条件
   * @private
   */
  private validateDelete(): void {
    if (this._status === UserStatus.Deleted) {
      throw new UserAlreadyDeletedException();
    }
  }

  // ========== Getters ==========

  public get email(): Email {
    return this._email;
  }

  public get username(): Username {
    return this._username;
  }

  public get profile(): UserProfile {
    return this._profile;
  }

  public get status(): UserStatus {
    return this._status;
  }

  public override get tenantId(): string {
    return this._tenantId || '';
  }
}

/**
 * 用户已注册异常
 *
 * @description 当用户已经注册时抛出
 */
export class UserAlreadyRegisteredException extends Error {
  constructor() {
    super('User is already registered');
    this.name = 'UserAlreadyRegisteredException';
  }
}

/**
 * 用户未激活异常
 *
 * @description 当用户未激活时抛出
 */
export class UserNotActiveException extends Error {
  constructor() {
    super('User is not active');
    this.name = 'UserNotActiveException';
  }
}

/**
 * 用户已禁用异常
 *
 * @description 当用户已经禁用时抛出
 */
export class UserAlreadyDisabledException extends Error {
  constructor() {
    super('User is already disabled');
    this.name = 'UserAlreadyDisabledException';
  }
}

/**
 * 用户未禁用异常
 *
 * @description 当用户未禁用时抛出
 */
export class UserNotDisabledException extends Error {
  constructor() {
    super('User is not disabled');
    this.name = 'UserNotDisabledException';
  }
}

/**
 * 用户已删除异常
 *
 * @description 当用户已经删除时抛出
 */
export class UserDeletedException extends Error {
  constructor() {
    super('User is deleted');
    this.name = 'UserDeletedException';
  }
}

/**
 * 用户已删除异常
 *
 * @description 当用户已经删除时抛出
 */
export class UserAlreadyDeletedException extends Error {
  constructor() {
    super('User is already deleted');
    this.name = 'UserAlreadyDeletedException';
  }
}
