/**
 * 用户聚合根
 *
 * @description 用户聚合根，管理用户的完整生命周期和认证信息
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理用户实体的生命周期
 * - 协调用户档案和凭证
 * - 处理认证和授权
 * - 发布用户领域事件
 *
 * ### 一致性边界
 * - 用户实体（User）
 * - 用户档案（UserProfile）
 * - 用户凭证（UserCredentials）
 *
 * @class UserAggregate
 * @since 1.0.0
 */

import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { Username, Email, PhoneNumber } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { UserCredentials } from '../entities/user-credentials.entity';

export class UserAggregate extends TenantAwareAggregateRoot {
  constructor(
    id: EntityId,
    private _user: User,
    private _profile: UserProfile,
    private _credentials: UserCredentials,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  public static create(
    id: EntityId,
    username: Username,
    email: Email,
    phoneNumber: PhoneNumber | null,
    passwordHash: string,
    passwordSalt: string,
    auditInfo: IPartialAuditInfo,
  ): UserAggregate {
    const user = User.create(id, username, email, phoneNumber, auditInfo);
    const profile = UserProfile.create(EntityId.generate(), id, auditInfo);
    const credentials = UserCredentials.create(
      EntityId.generate(),
      id,
      passwordHash,
      passwordSalt,
      auditInfo,
    );

    return new UserAggregate(id, user, profile, credentials, auditInfo);
  }

  public getUser(): User {
    return this._user;
  }

  public getProfile(): UserProfile {
    return this._profile;
  }

  public getCredentials(): UserCredentials {
    return this._credentials;
  }

  public verifyEmail(updatedBy: string): void {
    this.ensureTenantContext();
    this._user.verifyEmail(updatedBy);
    this.logTenantOperation('用户邮箱已验证', { userId: this.id.toString() });
  }

  public authenticate(passwordHash: string): boolean {
    return this._credentials.getPasswordHash() === passwordHash;
  }

  public recordLogin(): void {
    this._user.recordLogin();
    this._credentials.resetFailedAttempts();
  }

  public recordFailedLogin(): void {
    this._credentials.recordFailedLogin();
    
    if (this._credentials.isLocked()) {
      this._user.lock('登录失败次数过多', 'system');
    }
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      user: this._user.toObject(),
      profile: this._profile.toObject(),
      version: this.version,
    };
  }
}

