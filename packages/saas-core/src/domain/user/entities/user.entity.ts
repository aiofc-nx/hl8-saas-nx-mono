/**
 * 用户实体
 *
 * @description 用户核心实体，包含用户的基本信息和认证状态
 *
 * ## 业务规则
 *
 * ### 用户标识
 * - 用户名：全局唯一，3-50字符
 * - 邮箱：全局唯一，邮箱格式
 * - 手机号：可选，手机号格式
 *
 * ### 用户状态
 * - PENDING: 待激活（注册后，邮箱未验证）
 * - ACTIVE: 活跃（邮箱已验证，可正常使用）
 * - DISABLED: 禁用（管理员禁用）
 * - LOCKED: 锁定（登录失败次数过多）
 * - EXPIRED: 过期（长期未登录）
 * - DELETED: 已删除（软删除）
 *
 * ### 验证规则
 * - 注册后状态为 PENDING
 * - 邮箱验证后状态变为 ACTIVE
 * - 登录失败5次后状态变为 LOCKED
 *
 * @example
 * ```typescript
 * const user = User.create(
 *   EntityId.generate(),
 *   Username.create('johndoe'),
 *   Email.create('john@example.com'),
 *   { createdBy: 'system' }
 * );
 *
 * // 验证邮箱
 * user.verifyEmail('admin-123');
 *
 * // 记录登录
 * user.recordLogin();
 * ```
 *
 * @class User
 * @since 1.0.0
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { Username, Email, PhoneNumber, UserStatus } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { USER_STATUS_TRANSITIONS } from '../../../constants/user.constants';

/**
 * 用户实体
 *
 * @class User
 * @extends {BaseEntity}
 */
export class User extends BaseEntity {
  /**
   * 构造函数
   *
   * @param {EntityId} id - 用户ID
   * @param {Username} username - 用户名
   * @param {Email} email - 邮箱
   * @param {PhoneNumber} [phoneNumber] - 手机号
   * @param {UserStatus} status - 用户状态
   * @param {boolean} emailVerified - 邮箱已验证
   * @param {boolean} phoneVerified - 手机已验证
   * @param {Date} [lastLoginAt] - 最后登录时间
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @param {PinoLogger} [logger] - 日志记录器
   */
  constructor(
    id: EntityId,
    private _username: Username,
    private _email: Email,
    private _phoneNumber: PhoneNumber | null,
    private _status: UserStatus,
    private _emailVerified: boolean,
    private _phoneVerified: boolean,
    private _lastLoginAt: Date | null,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  /**
   * 创建用户实体
   *
   * @description 工厂方法，创建新的用户实体
   *
   * @static
   * @param {EntityId} id - 用户ID
   * @param {Username} username - 用户名
   * @param {Email} email - 邮箱
   * @param {PhoneNumber} [phoneNumber] - 手机号
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @returns {User} 用户实体
   */
  public static create(
    id: EntityId,
    username: Username,
    email: Email,
    phoneNumber: PhoneNumber | null,
    auditInfo: IPartialAuditInfo,
  ): User {
    // 新用户默认为待激活状态
    return new User(
      id,
      username,
      email,
      phoneNumber,
      UserStatus.PENDING,
      false,
      false,
      null,
      auditInfo,
    );
  }

  // ============================================================================
  // Getters
  // ============================================================================

  public getUsername(): Username {
    return this._username;
  }

  public getEmail(): Email {
    return this._email;
  }

  public getPhoneNumber(): PhoneNumber | null {
    return this._phoneNumber;
  }

  public getStatus(): UserStatus {
    return this._status;
  }

  public isEmailVerified(): boolean {
    return this._emailVerified;
  }

  public isPhoneVerified(): boolean {
    return this._phoneVerified;
  }

  public getLastLoginAt(): Date | null {
    return this._lastLoginAt;
  }

  // ============================================================================
  // 业务方法
  // ============================================================================

  /**
   * 验证邮箱
   *
   * @param {string} [updatedBy] - 更新人ID
   */
  public verifyEmail(updatedBy?: string): void {
    this._emailVerified = true;
    
    // 如果状态是 PENDING，自动激活为 ACTIVE
    if (this._status === UserStatus.PENDING) {
      this._status = UserStatus.ACTIVE;
    }
    
    this.updateTimestamp();
  }

  /**
   * 验证手机号
   *
   * @param {string} [updatedBy] - 更新人ID
   */
  public verifyPhone(updatedBy?: string): void {
    this._phoneVerified = true;
    this.updateTimestamp();
  }

  /**
   * 禁用用户
   *
   * @param {string} reason - 禁用原因
   * @param {string} [updatedBy] - 更新人ID
   */
  public disable(reason: string, updatedBy?: string): void {
    this.validateStatusTransition(UserStatus.DISABLED);
    this._status = UserStatus.DISABLED;
    this.updateTimestamp();
    
    this.logger.warn(`用户已禁用 - userId: ${this.id.toString()}, reason: ${reason}`);
  }

  /**
   * 启用用户
   *
   * @param {string} [updatedBy] - 更新人ID
   */
  public enable(updatedBy?: string): void {
    if (this._status !== UserStatus.DISABLED) {
      throw new Error('只有禁用状态的用户可以启用');
    }
    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 锁定用户
   *
   * @param {string} reason - 锁定原因
   * @param {string} [updatedBy] - 更新人ID
   */
  public lock(reason: string, updatedBy?: string): void {
    this.validateStatusTransition(UserStatus.LOCKED);
    this._status = UserStatus.LOCKED;
    this.updateTimestamp();
  }

  /**
   * 解锁用户
   *
   * @param {string} [updatedBy] - 更新人ID
   */
  public unlock(updatedBy?: string): void {
    if (this._status !== UserStatus.LOCKED) {
      throw new Error('只有锁定状态的用户可以解锁');
    }
    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 记录登录
   */
  public recordLogin(): void {
    this._lastLoginAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 更新邮箱
   *
   * @param {Email} email - 新邮箱
   * @param {string} [updatedBy] - 更新人ID
   */
  public updateEmail(email: Email, updatedBy?: string): void {
    this._email = email;
    this._emailVerified = false; // 更换邮箱后需要重新验证
    this.updateTimestamp();
  }

  /**
   * 更新手机号
   *
   * @param {PhoneNumber} phoneNumber - 新手机号
   * @param {string} [updatedBy] - 更新人ID
   */
  public updatePhoneNumber(phoneNumber: PhoneNumber, updatedBy?: string): void {
    this._phoneNumber = phoneNumber;
    this._phoneVerified = false; // 更换手机号后需要重新验证
    this.updateTimestamp();
  }

  // ============================================================================
  // 查询方法
  // ============================================================================

  public isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  public isPending(): boolean {
    return this._status === UserStatus.PENDING;
  }

  public isDisabled(): boolean {
    return this._status === UserStatus.DISABLED;
  }

  public isLocked(): boolean {
    return this._status === UserStatus.LOCKED;
  }

  // ============================================================================
  // 验证方法
  // ============================================================================

  private validateStatusTransition(targetStatus: UserStatus): void {
    const allowedTransitions = USER_STATUS_TRANSITIONS[this._status];
    if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
      throw new Error(
        `不允许从 ${this._status} 状态转换到 ${targetStatus} 状态`,
      );
    }
  }

  /**
   * 转换为纯对象
   */
  public toObject(): object {
    return {
      id: this.id.toString(),
      username: this._username.value,
      email: this._email.value,
      phoneNumber: this._phoneNumber?.value,
      status: this._status,
      emailVerified: this._emailVerified,
      phoneVerified: this._phoneVerified,
      lastLoginAt: this._lastLoginAt?.toISOString(),
      tenantId: this.tenantId.toString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

