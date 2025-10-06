import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { Role } from '../entities/role.entity';
import { Permission } from '../value-objects/permission.vo';
import { RoleCreatedEvent } from '../../events/authorization-events';

/**
 * 角色聚合根
 *
 * @description 角色聚合的管理者，负责协调内部实体操作
 * 实现聚合根的管理职责：管理聚合一致性边界、协调内部实体操作、发布领域事件、验证业务规则
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理聚合一致性边界：确保角色聚合内数据一致性
 * - 协调内部实体操作：通过指令模式协调角色实体
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
 * // 创建角色聚合根
 * const roleAggregate = RoleAggregate.create(
 *   roleId,
 *   'TENANT_ADMIN',
 *   '租户管理员',
 *   '管理租户内的所有资源',
 *   [permission1, permission2]
 * );
 * 
 * // 添加权限（聚合根协调实体）
 * roleAggregate.addPermission(newPermission);
 * 
 * // 获取角色实体
 * const role = roleAggregate.getRole();
 * ```
 *
 * @since 1.0.0
 */
export class RoleAggregate extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建角色聚合根实例
   * 聚合根包含角色实体，通过指令模式协调实体操作
   *
   * @param roleId - 角色ID
   * @param role - 角色实体
   */
  constructor(
    private readonly roleId: EntityId,
    private readonly role: Role
  ) {
    super(roleId, { createdBy: 'system' });
  }

  /**
   * 创建角色聚合根
   *
   * @description 工厂方法，创建新的角色聚合根
   * 角色初始状态为激活，非系统角色
   *
   * @param id - 角色ID
   * @param code - 角色代码
   * @param name - 角色名称
   * @param description - 角色描述
   * @param permissions - 权限列表
   * @param isSystemRole - 是否为系统角色
   * @returns 角色聚合根实例
   *
   * @example
   * ```typescript
   * const roleAggregate = RoleAggregate.create(
   *   roleId,
   *   'TENANT_ADMIN',
   *   '租户管理员',
   *   '管理租户内的所有资源',
   *   [permission1, permission2],
   *   false
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
    permissions: Permission[],
    isSystemRole = false
  ): RoleAggregate {
    // 1. 创建角色实体
    const role = new Role(
      id,
      code,
      name,
      description,
      permissions,
      [], // 初始没有父角色
      isSystemRole,
      true // 初始状态为激活
    );

    // 2. 创建聚合根
    const aggregate = new RoleAggregate(id, role);
    
    // 3. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new RoleCreatedEvent(
      id,
      code,
      name,
      description,
      isSystemRole,
      'default' // TODO: 获取正确的租户ID
    ));

    return aggregate;
  }

  /**
   * 添加权限
   *
   * @description 聚合根协调内部实体执行权限添加操作
   * 指令模式：聚合根发出指令给实体，实体执行具体业务逻辑
   *
   * @param permission - 要添加的权限
   *
   * @example
   * ```typescript
   * roleAggregate.addPermission(newPermission);
   * ```
   *
   * @since 1.0.0
   */
  public addPermission(permission: Permission): void {
    // 指令模式：聚合根发出指令给实体
    this.role.addPermission(permission);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RolePermissionAddedEvent(this.roleId, permission, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 移除权限
   *
   * @description 聚合根协调内部实体执行权限移除操作
   *
   * @param permissionName - 权限名称
   *
   * @example
   * ```typescript
   * roleAggregate.removePermission('manage_users');
   * ```
   *
   * @since 1.0.0
   */
  public removePermission(permissionName: string): void {
    // 指令模式：聚合根发出指令给实体
    this.role.removePermission(permissionName);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RolePermissionRemovedEvent(this.roleId, permissionName, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 添加父角色
   *
   * @description 聚合根协调内部实体执行父角色添加操作
   *
   * @param parentRoleId - 父角色ID
   *
   * @example
   * ```typescript
   * roleAggregate.addParentRole('parent-role-id');
   * ```
   *
   * @since 1.0.0
   */
  public addParentRole(parentRoleId: string): void {
    // 指令模式：聚合根发出指令给实体
    this.role.addParentRole(parentRoleId);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RoleParentAddedEvent(this.roleId, parentRoleId, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 移除父角色
   *
   * @description 聚合根协调内部实体执行父角色移除操作
   *
   * @param parentRoleId - 父角色ID
   *
   * @example
   * ```typescript
   * roleAggregate.removeParentRole('parent-role-id');
   * ```
   *
   * @since 1.0.0
   */
  public removeParentRole(parentRoleId: string): void {
    // 指令模式：聚合根发出指令给实体
    this.role.removeParentRole(parentRoleId);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RoleParentRemovedEvent(this.roleId, parentRoleId, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 更新角色名称
   *
   * @description 聚合根协调内部实体执行名称更新操作
   *
   * @param newName - 新的角色名称
   *
   * @example
   * ```typescript
   * roleAggregate.updateName('新的角色名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    // 指令模式：聚合根发出指令给实体
    this.role.updateName(newName);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RoleNameUpdatedEvent(this.roleId, newName, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 更新角色描述
   *
   * @description 聚合根协调内部实体执行描述更新操作
   *
   * @param newDescription - 新的描述
   *
   * @example
   * ```typescript
   * roleAggregate.updateDescription('新的角色描述');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    // 指令模式：聚合根发出指令给实体
    this.role.updateDescription(newDescription);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RoleDescriptionUpdatedEvent(this.roleId, newDescription, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 激活角色
   *
   * @description 聚合根协调内部实体执行角色激活操作
   *
   * @example
   * ```typescript
   * roleAggregate.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    // 指令模式：聚合根发出指令给实体
    this.role.activate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RoleActivatedEvent(this.roleId, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 停用角色
   *
   * @description 聚合根协调内部实体执行角色停用操作
   *
   * @example
   * ```typescript
   * roleAggregate.deactivate();
   * ```
   *
   * @since 1.0.0
   */
  public deactivate(): void {
    // 指令模式：聚合根发出指令给实体
    this.role.deactivate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new RoleDeactivatedEvent(this.roleId, 'default')); // TODO: 获取正确的租户ID
  }

  /**
   * 获取角色实体
   *
   * @description 聚合根管理内部实体访问
   * 外部只能通过聚合根访问内部实体
   *
   * @returns 角色实体
   *
   * @example
   * ```typescript
   * const role = roleAggregate.getRole();
   * const hasPermission = role.hasPermission('manage_users');
   * ```
   *
   * @since 1.0.0
   */
  public getRole(): Role {
    return this.role;
  }

  /**
   * 获取角色ID
   *
   * @description 获取聚合根的标识符
   *
   * @returns 角色ID
   *
   * @since 1.0.0
   */
  public getRoleId(): EntityId {
    return this.roleId;
  }
}

// 导入必要的依赖
import { RolePermissionAddedEvent, RolePermissionRemovedEvent, RoleParentAddedEvent, RoleParentRemovedEvent, RoleNameUpdatedEvent, RoleDescriptionUpdatedEvent, RoleActivatedEvent, RoleDeactivatedEvent } from '../../events/authorization-events';
