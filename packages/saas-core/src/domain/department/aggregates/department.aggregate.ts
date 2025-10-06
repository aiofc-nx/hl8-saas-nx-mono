import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { Department } from '../entities/department.entity';
import { DepartmentLevel } from '../value-objects/department-level.vo';
import { DepartmentType } from '../value-objects/department-type.vo';
import { DepartmentStatus } from '../value-objects/department-status.vo';
import { DepartmentCreatedEvent } from '../../events/department-events';

/**
 * 部门聚合根
 *
 * @description 部门聚合的管理者，负责协调内部实体操作
 * 实现聚合根的管理职责：管理聚合一致性边界、协调内部实体操作、发布领域事件、验证业务规则
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理聚合一致性边界：确保部门聚合内数据一致性
 * - 协调内部实体操作：通过指令模式协调部门实体
 * - 发布领域事件：管理事件的生命周期
 * - 验证业务规则：确保业务规则的正确执行
 *
 * ### 指令模式实现
 * - 聚合根发出指令 → 实体执行指令 → 返回执行结果
 * - 聚合根不直接操作实体属性，而是调用实体的业务方法
 * - 实体执行具体业务逻辑，聚合根负责协调和事件发布
 *
 * @example
 * ```typescript
 * // 创建部门聚合根
 * const departmentAggregate = DepartmentAggregate.create(
 *   departmentId,
 *   'TECH_DEPT',
 *   '技术部',
 *   '负责技术开发和维护',
 *   DepartmentLevel.LEVEL_1,
 *   tenantId,
 *   organizationId
 * );
 * 
 * // 激活部门（聚合根协调实体）
 * departmentAggregate.activate();
 * 
 * // 获取部门实体
 * const department = departmentAggregate.getDepartment();
 * ```
 *
 * @since 1.0.0
 */
export class DepartmentAggregate extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建部门聚合根实例
   * 聚合根包含部门实体，通过指令模式协调实体操作
   *
   * @param departmentId - 部门ID
   * @param department - 部门实体
   */
  constructor(
    private readonly departmentId: EntityId,
    private readonly department: Department
  ) {
    super(departmentId, { createdBy: 'system' });
  }

  /**
   * 创建部门聚合根
   *
   * @description 工厂方法，创建新的部门聚合根
   * 部门初始状态为激活
   *
   * @param id - 部门ID
   * @param code - 部门代码
   * @param name - 部门名称
   * @param description - 部门描述
   * @param level - 部门层级
   * @param tenantId - 所属租户ID
   * @param organizationId - 所属组织ID
   * @param parentDepartmentId - 父部门ID（可选）
   * @returns 部门聚合根实例
   *
   * @example
   * ```typescript
   * const departmentAggregate = DepartmentAggregate.create(
   *   departmentId,
   *   'TECH_DEPT',
   *   '技术部',
   *   '负责技术开发和维护',
   *   DepartmentLevel.LEVEL_1,
   *   tenantId,
   *   organizationId
   * );
   * ```
   *
   * @since 1.0.0
   */
  public static create(
    id: EntityId,
    code: string,
    name: string,
    description: string,
    level: DepartmentLevel,
    tenantId: EntityId,
    organizationId: EntityId,
    parentDepartmentId?: EntityId
  ): DepartmentAggregate {
    // 1. 创建部门实体
    const department = new Department(
      id,
      code,
      tenantId,
      organizationId,
      name,
      DepartmentType.TECHNICAL, // TODO: 根据业务需求确定部门类型
      DepartmentStatus.PENDING,
      'system', // TODO: 获取正确的管理员ID
      description,
      level
    );

    // 2. 创建聚合根
    const aggregate = new DepartmentAggregate(id, department);
    
    // 3. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new DepartmentCreatedEvent(
      id,
      code,
      name,
      description,
      level,
      tenantId,
      organizationId,
      parentDepartmentId
    ));

    return aggregate;
  }

  /**
   * 更新部门名称
   *
   * @description 聚合根协调内部实体执行名称更新操作
   * 指令模式：聚合根发出指令给实体，实体执行具体业务逻辑
   *
   * @param newName - 新的部门名称
   *
   * @example
   * ```typescript
   * departmentAggregate.updateName('新的部门名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    // 指令模式：聚合根发出指令给实体
    this.department.updateName(newName);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new DepartmentNameUpdatedEvent(this.departmentId, newName, this.department.getTenantId().toString()));
  }

  /**
   * 更新部门描述
   *
   * @description 聚合根协调内部实体执行描述更新操作
   *
   * @param newDescription - 新的描述
   *
   * @example
   * ```typescript
   * departmentAggregate.updateDescription('新的部门描述');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    // 指令模式：聚合根发出指令给实体
    this.department.updateDescription(newDescription);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new DepartmentDescriptionUpdatedEvent(this.departmentId, newDescription, this.department.getTenantId().toString()));
  }

  /**
   * 激活部门
   *
   * @description 聚合根协调内部实体执行部门激活操作
   *
   * @example
   * ```typescript
   * departmentAggregate.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    // 指令模式：聚合根发出指令给实体
    this.department.activate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new DepartmentActivatedEvent(this.departmentId, this.department.getTenantId().toString()));
  }

  /**
   * 停用部门
   *
   * @description 聚合根协调内部实体执行部门停用操作
   *
   * @example
   * ```typescript
   * departmentAggregate.deactivate();
   * ```
   *
   * @since 1.0.0
   */
  public deactivate(): void {
    // 指令模式：聚合根发出指令给实体
    this.department.deactivate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new DepartmentDeactivatedEvent(this.departmentId, this.department.getTenantId().toString()));
  }

  /**
   * 删除部门
   *
   * @description 聚合根协调内部实体执行部门删除操作
   *
   * @example
   * ```typescript
   * departmentAggregate.delete();
   * ```
   *
   * @since 1.0.0
   */
  public delete(): void {
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new DepartmentDeletedEvent(
      this.departmentId,
      this.department.getCode(),
      this.department.getTenantId().toString()
    ));
  }

  /**
   * 获取部门实体
   *
   * @description 聚合根管理内部实体访问
   * 外部只能通过聚合根访问内部实体
   *
   * @returns 部门实体
   *
   * @example
   * ```typescript
   * const department = departmentAggregate.getDepartment();
   * const isActive = department.isActive();
   * ```
   *
   * @since 1.0.0
   */
  public getDepartment(): Department {
    return this.department;
  }

  /**
   * 获取部门ID
   *
   * @description 获取聚合根的标识符
   *
   * @returns 部门ID
   *
   * @since 1.0.0
   */
  public getDepartmentId(): EntityId {
    return this.departmentId;
  }
}

// 导入必要的依赖
import { DepartmentNameUpdatedEvent, DepartmentDescriptionUpdatedEvent, DepartmentActivatedEvent, DepartmentDeactivatedEvent, DepartmentDeletedEvent } from '../../events/department-events';
