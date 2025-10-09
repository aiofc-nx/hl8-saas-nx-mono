/**
 * 部门闭包表实体
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';

export class DepartmentClosure extends BaseEntity {
  constructor(
    id: EntityId,
    private _ancestor: EntityId,
    private _descendant: EntityId,
    private _depth: number,
    auditInfo: IPartialAuditInfo,
  ) {
    super(id, auditInfo);
  }

  public static create(
    ancestor: EntityId,
    descendant: EntityId,
    depth: number,
    auditInfo: IPartialAuditInfo,
  ): DepartmentClosure {
    return new DepartmentClosure(
      EntityId.generate(),
      ancestor,
      descendant,
      depth,
      auditInfo,
    );
  }

  public getAncestor(): EntityId {
    return this._ancestor;
  }

  public getDescendant(): EntityId {
    return this._descendant;
  }

  public getDepth(): number {
    return this._depth;
  }
}

