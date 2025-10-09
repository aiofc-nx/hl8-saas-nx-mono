/**
 * 权限实体（简化版本）
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { PermissionAction } from '../value-objects/permission-action.vo';
import { PermissionStatus } from '../value-objects/permission-status.enum';

export class Permission extends BaseEntity {
  constructor(
    id: EntityId,
    private _code: string,
    private _name: string,
    private _resource: string,
    private _action: PermissionAction,
    private _category: string,
    private _status: PermissionStatus,
    auditInfo: IPartialAuditInfo,
  ) {
    super(id, auditInfo);
  }

  public static create(
    id: EntityId,
    code: string,
    name: string,
    resource: string,
    action: PermissionAction,
    category: string,
    auditInfo: IPartialAuditInfo,
  ): Permission {
    return new Permission(
      id,
      code,
      name,
      resource,
      action,
      category,
      PermissionStatus.ACTIVE,
      auditInfo,
    );
  }

  public getCode(): string {
    return this._code;
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      code: this._code,
      name: this._name,
      resource: this._resource,
      action: this._action.value,
      category: this._category,
    };
  }
}

