import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { PermissionScope } from '../value-objects/permission.vo';

/**
 * 权限实体
 *
 * @description 权限是系统中的核心概念，代表对特定资源的操作能力
 * 采用充血模型，包含完整的业务逻辑
 *
 * ## 业务规则
 *
 * ### 权限管理规则
 * - 权限名称必须唯一
 * - 权限可以设置有效期
 * - 权限可以启用/禁用
 * - 系统权限不能被删除或修改
 *
 * ### 权限级别规则
 * - 权限级别决定权限的优先级
 * - 高级别权限包含低级别权限
 * - 权限级别范围：0-100
 * - 系统权限级别最高
 *
 * ### 权限范围规则
 * - 权限范围决定权限的作用域
 * - 从 OWN 到 PLATFORM 递增
 * - 高级范围包含低级范围
 * - 跨范围权限需要特殊授权
 *
 * @example
 * ```typescript
 * const permission = new Permission(
 *   permissionId,
 *   'manage_users',
 *   '管理用户',
 *   'user',
 *   'manage',
 *   PermissionScope.TENANT,
 *   50,
 *   true,
 *   true
 * );
 * 
 * permission.updateDescription('管理租户用户'); // 更新描述
 * const canInherit = permission.canInheritFrom(otherPermission); // 检查继承
 * ```
 *
 * @since 1.0.0
 */
export class Permission extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建权限实体实例
   * 所有属性都是私有的，通过方法访问和修改
   *
   * @param id - 权限ID
   * @param _name - 权限名称
   * @param _description - 权限描述
   * @param _resourceType - 资源类型
   * @param _actionType - 操作类型
   * @param _scope - 权限范围
   * @param _level - 权限级别
   * @param _isSystemPermission - 是否为系统权限
   * @param _isActive - 是否激活
   */
  constructor(
    id: EntityId,
    private readonly _name: string,
    private _description: string,
    private readonly _resourceType: string,
    private readonly _actionType: string,
    private readonly _scope: PermissionScope,
    private _level: number,
    private readonly _isSystemPermission: boolean,
    private _isActive: boolean
  ) {
    super(id, { createdBy: 'system' });
    this.validate();
  }

  /**
   * 创建权限实例
   *
   * @description 工厂方法，创建并验证权限实例
   *
   * @param id - 权限ID
   * @param name - 权限名称
   * @param description - 权限描述
   * @param resourceType - 资源类型
   * @param actionType - 操作类型
   * @param scope - 权限范围
   * @param level - 权限级别
   * @param isSystemPermission - 是否为系统权限
   * @returns 权限实例
   * @throws {InvalidPermissionException} 当权限数据无效时抛出异常
   *
   * @example
   * ```typescript
   * const permission = Permission.create(
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
  ): Permission {
    return new Permission(
      id,
      name,
      description,
      resourceType,
      actionType,
      scope,
      level,
      isSystemPermission,
      true // 初始状态为激活
    );
  }

  /**
   * 验证权限数据
   *
   * @description 验证权限数据是否符合业务规则
   *
   * @throws {InvalidPermissionException} 当权限数据无效时抛出异常
   *
   * @since 1.0.0
   */
  protected override validate(): void {
    // 验证权限名称
    if (!this._name || this._name.trim().length === 0) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限名称不能为空',
        'name',
        this._name,
        this.id.toString()
      );
    }

    const nameRegex = /^[a-z][a-z0-9_]*$/;
    if (!nameRegex.test(this._name)) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限名称格式不正确，只能包含小写字母、数字和下划线',
        'name',
        this._name,
        this.id.toString()
      );
    }

    // 验证描述
    if (!this._description || this._description.trim().length === 0) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限描述不能为空',
        'description',
        this._description,
        this.id.toString()
      );
    }

    if (this._description.length > 200) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限描述长度不能超过200个字符',
        'description',
        this._description,
        this.id.toString()
      );
    }

    // 验证资源类型
    if (!this._resourceType || this._resourceType.trim().length === 0) {
      throw new AuthorizationExceptions.RoleValidationException(
        '资源类型不能为空',
        'resourceType',
        this._resourceType,
        this.id.toString()
      );
    }

    // 验证操作类型
    if (!this._actionType || this._actionType.trim().length === 0) {
      throw new AuthorizationExceptions.RoleValidationException(
        '操作类型不能为空',
        'actionType',
        this._actionType,
        this.id.toString()
      );
    }

    // 验证权限级别
    if (this._level < 0 || this._level > 100) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限级别必须在0-100之间',
        'level',
        this._level,
        this.id.toString()
      );
    }
  }

  /**
   * 更新权限描述
   *
   * @description 更新权限的描述信息
   *
   * @param newDescription - 新的描述
   * @throws {SystemPermissionModificationException} 当尝试修改系统权限时抛出异常
   * @throws {InvalidDescriptionException} 当描述无效时抛出异常
   *
   * @example
   * ```typescript
   * permission.updateDescription('管理租户用户');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    if (this._isSystemPermission) {
      throw new AuthorizationExceptions.SystemPermissionModificationException(
        this.id.toString(),
        'updateDescription'
      );
    }

    if (!newDescription || newDescription.trim().length === 0) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限描述不能为空',
        'description',
        newDescription,
        this.id.toString()
      );
    }

    if (newDescription.length > 200) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限描述长度不能超过200个字符',
        'description',
        newDescription,
        this.id.toString()
      );
    }

    this._description = newDescription.trim();
    this.updateTimestamp();
  }

  /**
   * 更新权限级别
   *
   * @description 更新权限的级别
   *
   * @param newLevel - 新的级别
   * @throws {SystemPermissionModificationException} 当尝试修改系统权限时抛出异常
   * @throws {InvalidPermissionLevelException} 当级别无效时抛出异常
   *
   * @example
   * ```typescript
   * permission.updateLevel(60);
   * ```
   *
   * @since 1.0.0
   */
  public updateLevel(newLevel: number): void {
    if (this._isSystemPermission) {
      throw new AuthorizationExceptions.SystemPermissionModificationException(
        this.id.toString(),
        'updateDescription'
      );
    }

    if (newLevel < 0 || newLevel > 100) {
      throw new AuthorizationExceptions.RoleValidationException(
        '权限级别必须在0-100之间',
        'level',
        newLevel,
        this.id.toString()
      );
    }

    this._level = newLevel;
    this.updateTimestamp();
  }

  /**
   * 激活权限
   *
   * @description 激活权限，使其可以被使用
   *
   * @example
   * ```typescript
   * permission.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  /**
   * 停用权限
   *
   * @description 停用权限，使其不能被使用
   *
   * @throws {SystemPermissionModificationException} 当尝试停用系统权限时抛出异常
   *
   * @example
   * ```typescript
 * permission.deactivate();
   * ```
   *
   * @since 1.0.0
   */
  public deactivate(): void {
    if (this._isSystemPermission) {
      throw new AuthorizationExceptions.SystemPermissionModificationException(
        this.id.toString(),
        'disable'
      );
    }

    this._isActive = false;
    this.updateTimestamp();
  }

  /**
   * 检查是否可以继承自指定权限
   *
   * @description 检查当前权限是否可以继承自指定权限
   * 基于权限级别和范围进行判断
   *
   * @param otherPermission - 其他权限
   * @returns 是否可以继承
   *
   * @example
   * ```typescript
   * const canInherit = permission.canInheritFrom(otherPermission); // true
   * ```
   *
   * @since 1.0.0
   */
  public canInheritFrom(otherPermission: Permission): boolean {
    // 不能继承自己
    if (this._name === otherPermission._name) {
      return false;
    }

    // 检查权限级别
    if (this._level <= otherPermission._level) {
      return false;
    }

    // 检查权限范围
    return this.isScopeHigherThan(otherPermission._scope);
  }

  /**
   * 检查是否比指定权限级别更高
   *
   * @description 比较两个权限的级别
   *
   * @param otherPermission - 其他权限
   * @returns 是否级别更高
   *
   * @example
   * ```typescript
   * const isHigher = permission.isHigherThan(otherPermission); // true
   * ```
   *
   * @since 1.0.0
   */
  public isHigherThan(otherPermission: Permission): boolean {
    return this._level > otherPermission._level;
  }

  /**
   * 检查权限范围是否更高
   *
   * @description 比较权限范围的高低
   *
   * @param scope - 权限范围
   * @returns 是否范围更高
   *
   * @since 1.0.0
   */
  private isScopeHigherThan(scope: PermissionScope): boolean {
    const scopeLevels: Record<PermissionScope, number> = {
      [PermissionScope.OWN]: 1,
      [PermissionScope.DEPARTMENT]: 2,
      [PermissionScope.ORGANIZATION]: 3,
      [PermissionScope.TENANT]: 4,
      [PermissionScope.PLATFORM]: 5
    };

    return scopeLevels[this._scope] > scopeLevels[scope];
  }

  /**
   * 检查是否包含指定权限
   *
   * @description 检查当前权限是否包含指定权限
   * 基于权限名称、资源类型、操作类型进行判断
   *
   * @param permissionName - 权限名称
   * @returns 是否包含该权限
   *
   * @example
   * ```typescript
   * const contains = permission.contains('read_users'); // true
   * ```
   *
   * @since 1.0.0
   */
  public contains(permissionName: string): boolean {
    // 完全匹配
    if (this._name === permissionName) {
      return true;
    }

    // 通配符匹配
    if (this._name.endsWith('_all') && permissionName.startsWith(this._name.replace('_all', ''))) {
      return true;
    }

    return false;
  }

  /**
   * 检查权限是否激活
   *
   * @description 检查权限是否处于激活状态
   *
   * @returns 是否激活
   *
   * @example
   * ```typescript
   * const isActive = permission.isActive(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * 检查是否为系统权限
   *
   * @description 检查权限是否为系统内置权限
   *
   * @returns 是否为系统权限
   *
   * @example
   * ```typescript
   * const isSystem = permission.isSystemPermission(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isSystemPermission(): boolean {
    return this._isSystemPermission;
  }

  /**
   * 获取权限范围的中文描述
   *
   * @description 返回权限范围的中文描述
   *
   * @returns 范围中文描述
   *
   * @since 1.0.0
   */
  public getScopeDescription(): string {
    const scopeDescriptions: Record<PermissionScope, string> = {
      [PermissionScope.OWN]: '自己的',
      [PermissionScope.DEPARTMENT]: '部门内',
      [PermissionScope.ORGANIZATION]: '组织内',
      [PermissionScope.TENANT]: '租户内',
      [PermissionScope.PLATFORM]: '平台级'
    };

    return scopeDescriptions[this._scope];
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
   * const canManage = permission.canBeManaged(); // false
   * ```
   *
   * @since 1.0.0
   */
  public canBeManaged(): boolean {
    return !this._isSystemPermission;
  }

  // Getter 方法
  public getName(): string { return this._name; }
  public getDescription(): string { return this._description; }
  public getResourceType(): string { return this._resourceType; }
  public getActionType(): string { return this._actionType; }
  public getScope(): PermissionScope { return this._scope; }
  public getLevel(): number { return this._level; }
  public getIsSystemPermission(): boolean { return this._isSystemPermission; }
  public getIsActive(): boolean { return this._isActive; }
}

// 导入新的异常类
import { AuthorizationExceptions } from '../../exceptions';
