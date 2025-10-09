/**
 * 角色实体（简化版本）
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { RoleLevel } from '../value-objects/role-level.vo';
import { RoleName } from '../value-objects/role-name.vo';
import { RoleStatus } from '../value-objects/role-status.enum';

export class Role extends BaseEntity {
  constructor(
    id: EntityId,
    private _code: string,
    private _name: RoleName,
    private _level: RoleLevel,
    private _status: RoleStatus,
    private _isSystem: boolean,
    auditInfo: IPartialAuditInfo,
  ) {
    super(id, auditInfo);
  }

  public static create(
    id: EntityId,
    code: string,
    name: RoleName,
    level: RoleLevel,
    auditInfo: IPartialAuditInfo,
  ): Role {
    return new Role(id, code, name, level, RoleStatus.ACTIVE, false, auditInfo);
  }

  public getCode(): string {
    return this._code;
  }

  public getName(): RoleName {
    return this._name;
  }

  public getLevel(): RoleLevel {
    return this._level;
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      code: this._code,
      name: this._name.value,
      level: this._level.value,
      status: this._status,
    };
  }
}

