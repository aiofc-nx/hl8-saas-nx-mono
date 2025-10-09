/**
 * 用户档案实体
 *
 * @description 用户的详细个人信息
 *
 * @class UserProfile
 * @since 1.0.0
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { Gender } from '../value-objects/gender.enum';

export class UserProfile extends BaseEntity {
  constructor(
    id: EntityId,
    private _userId: EntityId,
    private _fullName: string | null,
    private _nickname: string | null,
    private _avatar: string | null,
    private _gender: Gender | null,
    private _birthday: Date | null,
    private _bio: string | null,
    private _timezone: string,
    private _language: string,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  public static create(
    id: EntityId,
    userId: EntityId,
    auditInfo: IPartialAuditInfo,
  ): UserProfile {
    return new UserProfile(
      id,
      userId,
      null,
      null,
      null,
      null,
      null,
      null,
      'Asia/Shanghai',
      'zh-CN',
      auditInfo,
    );
  }

  public getUserId(): EntityId {
    return this._userId;
  }

  public getFullName(): string | null {
    return this._fullName;
  }

  public updateFullName(fullName: string, updatedBy?: string): void {
    this._fullName = fullName;
    this.updateTimestamp();
  }

  public updateNickname(nickname: string, updatedBy?: string): void {
    this._nickname = nickname;
    this.updateTimestamp();
  }

  public updateAvatar(avatar: string, updatedBy?: string): void {
    this._avatar = avatar;
    this.updateTimestamp();
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      userId: this._userId.toString(),
      fullName: this._fullName,
      nickname: this._nickname,
      avatar: this._avatar,
      gender: this._gender,
      birthday: this._birthday?.toISOString(),
      bio: this._bio,
      timezone: this._timezone,
      language: this._language,
    };
  }
}

