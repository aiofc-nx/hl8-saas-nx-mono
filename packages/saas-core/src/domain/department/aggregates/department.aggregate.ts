/**
 * 部门聚合根（简化版本）
 */

import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { Department } from '../entities/department.entity';
import { DepartmentClosure } from '../entities/department-closure.entity';

export class DepartmentAggregate extends TenantAwareAggregateRoot {
  private _closurePaths: DepartmentClosure[] = [];

  constructor(
    id: EntityId,
    private _department: Department,
    auditInfo: IPartialAuditInfo,
  ) {
    super(id, auditInfo);
  }

  public static createRoot(
    id: EntityId,
    organizationId: EntityId,
    code: string,
    name: string,
    auditInfo: IPartialAuditInfo,
  ): DepartmentAggregate {
    const department = Department.createRoot(id, organizationId, code, name, auditInfo);
    return new DepartmentAggregate(id, department, auditInfo);
  }

  public getDepartment(): Department {
    return this._department;
  }

  public getClosurePaths(): DepartmentClosure[] {
    return [...this._closurePaths];
  }

  public toObject(): object {
    return {
      id: this.id.toString(),
      department: this._department.toObject(),
    };
  }
}

