/**
 * 组织成员实体
 *
 * @class OrganizationMember  
 * @since 1.0.0
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';

export class OrganizationMember extends BaseEntity {
  constructor(
    id: EntityId,
    private _organizationId: EntityId,
    private _userId: EntityId,
    private _position: string | null,
    private _joinedAt: Date,
    private _leftAt: Date | null,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  public static create(
    id: EntityId,
    organizationId: EntityId,
    userId: EntityId,
    auditInfo: IPartialAuditInfo,
  ): OrganizationMember {
    return new OrganizationMember(
      id,
      organizationId,
      userId,
      null,
      new Date(),
      null,
      auditInfo,
    );
  }

  public getOrganizationId(): EntityId {
    return this._organizationId;
  }

  public getUserId(): EntityId {
    return this._userId;
  }

  public setPosition(position: string, updatedBy?: string): void {
    this._position = position;
    this.updateTimestamp();
  }

  public leave(updatedBy?: string): void {
    this._leftAt = new Date();
    this.updateTimestamp();
  }
}

