/**
 * 组织实体
 *
 * @class Organization
 * @since 1.0.0
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { OrganizationStatus } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { OrganizationType } from '../value-objects/organization-type.vo';

export class Organization extends BaseEntity {
  constructor(
    id: EntityId,
    private _code: string,
    private _name: string,
    private _type: OrganizationType,
    private _status: OrganizationStatus,
    private _description: string | null,
    private _isDefault: boolean,
    private _displayOrder: number,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  public static create(
    id: EntityId,
    code: string,
    name: string,
    type: OrganizationType,
    auditInfo: IPartialAuditInfo,
  ): Organization {
    return new Organization(
      id,
      code,
      name,
      type,
      OrganizationStatus.ACTIVE,
      null,
      false,
      0,
      auditInfo,
    );
  }

  public getCode(): string {
    return this._code;
  }

  public getName(): string {
    return this._name;
  }

  public getType(): OrganizationType {
    return this._type;
  }

  public getStatus(): OrganizationStatus {
    return this._status;
  }

  public updateName(name: string, updatedBy?: string): void {
    this._name = name;
    this.updateTimestamp(updatedBy);
  }

  public activate(updatedBy?: string): void {
    this._status = OrganizationStatus.ACTIVE;
    this.updateTimestamp(updatedBy);
  }

  public deactivate(updatedBy?: string): void {
    this._status = OrganizationStatus.INACTIVE;
    this.updateTimestamp(updatedBy);
  }

  public isActive(): boolean {
    return this._status === OrganizationStatus.ACTIVE;
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      code: this._code,
      name: this._name,
      type: this._type.value,
      status: this._status,
      description: this._description,
      isDefault: this._isDefault,
      displayOrder: this._displayOrder,
    };
  }
}

