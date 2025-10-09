/**
 * 部门实体（简化版本）
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { DepartmentLevel } from '../value-objects/department-level.vo';
import { DepartmentPath } from '../value-objects/department-path.vo';
import { DepartmentStatus } from '../value-objects/department-status.enum';

export class Department extends BaseEntity {
  constructor(
    id: EntityId,
    private _organizationId: EntityId,
    private _parentId: EntityId | null,
    private _code: string,
    private _name: string,
    private _fullName: string,
    private _level: DepartmentLevel,
    private _path: DepartmentPath,
    private _status: DepartmentStatus,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  public static createRoot(
    id: EntityId,
    organizationId: EntityId,
    code: string,
    name: string,
    auditInfo: IPartialAuditInfo,
  ): Department {
    return new Department(
      id,
      organizationId,
      null,
      code,
      name,
      name,
      DepartmentLevel.root(),
      DepartmentPath.root(id.toString()),
      DepartmentStatus.ACTIVE,
      auditInfo,
    );
  }

  public getName(): string {
    return this._name;
  }

  public getLevel(): DepartmentLevel {
    return this._level;
  }

  public getPath(): DepartmentPath {
    return this._path;
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      organizationId: this._organizationId.toString(),
      parentId: this._parentId?.toString(),
      code: this._code,
      name: this._name,
      fullName: this._fullName,
      level: this._level.level,
      path: this._path.value,
      status: this._status,
    };
  }
}

