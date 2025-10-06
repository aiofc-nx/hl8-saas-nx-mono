/**
 * 部门领域事件
 *
 * @description 定义部门相关的领域事件
 * 包括部门创建、更新、状态变更等事件
 *
 * ## 事件设计原则
 *
 * ### 事件命名规范
 * - 使用过去时态：DepartmentCreated, DepartmentUpdated
 * - 事件名称清晰表达业务含义
 * - 事件包含必要的业务数据
 *
 * ### 事件发布时机
 * - 聚合根状态变更时发布
 * - 业务规则验证通过后发布
 * - 事件包含完整的业务上下文
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { DepartmentLevel } from '../department/value-objects/department-level.vo';

/**
 * 部门创建事件
 *
 * @description 当部门被创建时发布的事件
 * 包含部门的基本信息，用于后续的权限初始化和通知
 *
 * @since 1.0.0
 */
export class DepartmentCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly departmentId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string,
    public readonly level: DepartmentLevel,
    tenantId: EntityId,
    public readonly organizationId: EntityId,
    public readonly parentDepartmentId?: EntityId
  ) {
    super(departmentId, 1, tenantId.toString(), 1);
  }

  public get eventType(): string {
    return 'DepartmentCreated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      departmentId: this.departmentId,
      code: this.code,
      name: this.name,
      description: this.description,
      level: this.level,
      organizationId: this.organizationId,
      parentDepartmentId: this.parentDepartmentId
    };
  }
}

/**
 * 部门名称更新事件
 *
 * @description 当部门名称被更新时发布的事件
 * 用于部门变更审计
 *
 * @since 1.0.0
 */
export class DepartmentNameUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly departmentId: EntityId,
    public readonly newName: string,
    tenantId: string
  ) {
    super(departmentId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'DepartmentNameUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      departmentId: this.departmentId,
      newName: this.newName
    };
  }
}

/**
 * 部门描述更新事件
 *
 * @description 当部门描述被更新时发布的事件
 * 用于部门变更审计
 *
 * @since 1.0.0
 */
export class DepartmentDescriptionUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly departmentId: EntityId,
    public readonly newDescription: string,
    tenantId: string
  ) {
    super(departmentId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'DepartmentDescriptionUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      departmentId: this.departmentId,
      newDescription: this.newDescription
    };
  }
}

/**
 * 部门激活事件
 *
 * @description 当部门被激活时发布的事件
 * 用于部门状态变更追踪
 *
 * @since 1.0.0
 */
export class DepartmentActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly departmentId: EntityId,
    tenantId: string
  ) {
    super(departmentId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'DepartmentActivated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      departmentId: this.departmentId
    };
  }
}

/**
 * 部门停用事件
 *
 * @description 当部门被停用时发布的事件
 * 用于部门状态变更追踪
 *
 * @since 1.0.0
 */
export class DepartmentDeactivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly departmentId: EntityId,
    tenantId: string
  ) {
    super(departmentId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'DepartmentDeactivated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      departmentId: this.departmentId
    };
  }
}

/**
 * 部门删除事件
 *
 * @description 当部门被删除时发布的事件
 * 用于部门变更审计
 *
 * @since 1.0.0
 */
export class DepartmentDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly departmentId: EntityId,
    public readonly departmentCode: string,
    tenantId: string
  ) {
    super(departmentId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'DepartmentDeleted';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      departmentId: this.departmentId,
      departmentCode: this.departmentCode
    };
  }
}
