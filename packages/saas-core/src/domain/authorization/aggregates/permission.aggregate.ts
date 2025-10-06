import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { Permission } from '../entities/permission.entity';
import { PermissionScope } from '../value-objects/permission.vo';
import { PermissionCreatedEvent, PermissionUpdatedEvent, PermissionDeletedEvent } from '../../events/authorization-events';

/**
 * 权限聚合根
 *
 * @description 权限聚合的管理者，负责协调内部实体操作
 * 实现聚合根的管理职责：管理聚合一致性边界、协调内部实体操作、发布领域事件、验证业务规则
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理聚合一致性边界：确保权限聚合内数据一致性
 * - 协调内部实体操作：通过指令模式协调权限实体
 * - 发布领域事件：管理事件的生命周期
 * - 验证业务规则：确保业务规则的正确执行
 *
 * ### 权限管理规则
 * - 系统权限不能被删除或修改
 * - 权限名称必须唯一
 * - 权限级别必须合理
 * - 权限范围必须有效
 *
 * @example
 * ```typescript
 * // 创建权限聚合根
 * const permissionAggregate = PermissionAggregate.create(
 *   permissionId,
 *   {
 *     name: 'manage_users',
 *     description: '管理用户',
 *     resourceType: 'user',
 *     actionType: 'manage',
 *     scope: PermissionScope.TENANT,
 *     level: 50,
 *     isSystemPermission: true
 *   }
 * );
 * 
 * // 更新权限描述
 * permissionAggregate.updateDescription('管理租户用户');
 * 
 * // 获取权限实体
 * const permission = permissionAggregate.getPermission();
 * ```
 *
 * @since 1.0.0
 */
export class PermissionAggregate extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建权限聚合根实例
   * 聚合根包含权限实体，通过指令模式协调实体操作
   *
   * @param permissionId - 权限ID
   * @param permission - 权限实体
   */
  constructor(
    private readonly permissionId: EntityId,
    private readonly permission: Permission
  ) {
    super(permissionId, { createdBy: 'system' });
  }

  /**
   * 创建权限聚合根
   *
   * @description 工厂方法，创建新的权限聚合根
   * 权限初始状态为激活
   *
   * @param id - 权限ID
   * @param name - 权限名称
   * @param description - 权限描述
   * @param resourceType - 资源类型
   * @param actionType - 操作类型
   * @param scope - 权限范围
   * @param level - 权限级别
   * @param isSystemPermission - 是否为系统权限
   * @returns 权限聚合根实例
   *
   * @example
   * ```typescript
   * const permissionAggregate = PermissionAggregate.create(
   *   permissionId,
   *   'manage_users',
   *   '管理用户',
   *   'user',
   *   'manage',
   *   PermissionScope.TENANT,
   *   50,
   *   true
   * );
   * ```
   *
   * @since 1.0.0
   */
  public static create(
    id: EntityId,
    name: string,
    description: string,
    resourceType: string,
    actionType: string,
    scope: PermissionScope,
    level: number,
    isSystemPermission = false
  ): PermissionAggregate {
    // 1. 创建权限实体
    const permission = Permission.create(
      id,
      name,
      description,
      resourceType,
      actionType,
      scope,
      level,
      isSystemPermission
    );

    // 2. 创建聚合根
    const aggregate = new PermissionAggregate(id, permission);
    
    // 3. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new PermissionCreatedEvent(
      id,
      name,
      description,
      resourceType,
      actionType,
      scope,
      level,
      isSystemPermission,
      'default' // TODO: 获取正确的租户ID
    ));

    return aggregate;
  }

  /**
   * 更新权限描述
   *
   * @description 聚合根协调内部实体执行描述更新操作
   * 指令模式：聚合根发出指令给实体，实体执行具体业务逻辑
   *
   * @param newDescription - 新的描述
   * @throws {SystemPermissionModificationException} 当尝试修改系统权限时抛出异常
   *
   * @example
   * ```typescript
   * permissionAggregate.updateDescription('管理租户用户');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    // 指令模式：聚合根发出指令给实体
    this.permission.updateDescription(newDescription);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new PermissionUpdatedEvent(
      this.permissionId,
      'description',
      newDescription.trim(),
      'default' // TODO: 获取正确的租户ID
    ));
  }

  /**
   * 更新权限级别
   *
   * @description 聚合根协调内部实体执行级别更新操作
   *
   * @param newLevel - 新的级别
   * @throws {SystemPermissionModificationException} 当尝试修改系统权限时抛出异常
   * @throws {InvalidPermissionLevelException} 当级别无效时抛出异常
   *
   * @example
   * ```typescript
   * permissionAggregate.updateLevel(60);
   * ```
   *
   * @since 1.0.0
   */
  public updateLevel(newLevel: number): void {
    // 指令模式：聚合根发出指令给实体
    this.permission.updateLevel(newLevel);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new PermissionUpdatedEvent(
      this.permissionId,
      'level',
      newLevel.toString(),
      'default' // TODO: 获取正确的租户ID
    ));
  }

  /**
   * 删除权限
   *
   * @description 聚合根协调内部实体执行权限删除操作
   * 系统权限不能被删除
   *
   * @throws {SystemPermissionModificationException} 当尝试删除系统权限时抛出异常
   *
   * @example
   * ```typescript
   * permissionAggregate.delete();
   * ```
   *
   * @since 1.0.0
   */
  public delete(): void {
    // 检查是否为系统权限
    if (this.permission.isSystemPermission()) {
      throw new AuthorizationExceptions.SystemPermissionModificationException(
        this.permissionId.toString(),
        'delete'
      );
    }

    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new PermissionDeletedEvent(
      this.permissionId,
      this.permission.getName(),
      'default' // TODO: 获取正确的租户ID
    ));
  }

  /**
   * 获取权限实体
   *
   * @description 聚合根管理内部实体访问
   * 外部只能通过聚合根访问内部实体
   *
   * @returns 权限实体
   *
   * @example
   * ```typescript
   * const permission = permissionAggregate.getPermission();
   * const canInherit = permission.canInheritFrom(otherPermission);
   * ```
   *
   * @since 1.0.0
   */
  public getPermission(): Permission {
    return this.permission;
  }

  /**
   * 获取权限ID
   *
   * @description 获取聚合根的标识符
   *
   * @returns 权限ID
   *
   * @since 1.0.0
   */
  public getPermissionId(): EntityId {
    return this.permissionId;
  }

  /**
   * 检查是否可以管理
   *
   * @description 检查当前权限是否可以被管理
   * 系统权限不能被管理
   *
   * @returns 是否可以管理
   *
   * @example
   * ```typescript
   * const canManage = permissionAggregate.canBeManaged(); // false
   * ```
   *
   * @since 1.0.0
   */
  public canBeManaged(): boolean {
    return !this.permission.isSystemPermission();
  }
}

// 导入新的异常类
import { AuthorizationExceptions } from '../../exceptions';
