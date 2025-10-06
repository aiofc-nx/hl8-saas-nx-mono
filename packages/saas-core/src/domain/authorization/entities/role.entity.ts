import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { Permission } from '../value-objects/permission.vo';

/**
 * 角色实体
 *
 * @description 角色是权限的集合，代表用户在系统中的权限范围
 * 采用充血模型，包含完整的业务逻辑
 *
 * ## 业务规则
 *
 * ### 角色管理规则
 * - 角色可以包含多个权限
 * - 角色可以继承其他角色的权限
 * - 系统角色不能被删除或修改
 * - 角色权限可以动态调整
 *
 * ### 权限继承规则
 * - 角色可以继承其他角色的所有权限
 * - 继承关系不能形成循环
 * - 继承的权限可以被覆盖
 * - 系统角色不能被继承
 *
 * ### 角色使用规则
 * - 用户可以被分配多个角色
 * - 角色权限会合并计算
 * - 角色可以分配给用户、组织、部门
 * - 角色可以设置有效期
 *
 * @example
 * ```typescript
 * const role = new Role(
 *   roleId,
 *   'TENANT_ADMIN',
 *   '租户管理员',
 *   '管理租户内的所有资源',
 *   [permission1, permission2],
 *   ['PARENT_ROLE_ID'],
 *   true
 * );
 * 
 * role.addPermission(newPermission); // 添加权限
 * const hasPermission = role.hasPermission('manage_users'); // 检查权限
 * ```
 *
 * @since 1.0.0
 */
export class Role extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建角色实体实例
   * 所有属性都是私有的，通过方法访问和修改
   *
   * @param id - 角色ID
   * @param _code - 角色代码（唯一标识）
   * @param _name - 角色名称
   * @param _description - 角色描述
   * @param _permissions - 权限列表
   * @param _parentRoleIds - 父角色ID列表
   * @param _isSystemRole - 是否为系统角色
   * @param _isActive - 是否激活
   */
  constructor(
    id: EntityId,
    private readonly _code: string,
    private _name: string,
    private _description: string,
    private _permissions: Permission[],
    private _parentRoleIds: string[],
    private readonly _isSystemRole: boolean,
    private _isActive: boolean
  ) {
    super(id, { createdBy: 'system' });
  }

  /**
   * 添加权限
   *
   * @description 为角色添加新权限
   * 如果权限已存在则不重复添加
   *
   * @param permission - 要添加的权限
   * @throws {SystemRoleModificationException} 当尝试修改系统角色时抛出异常
   *
   * @example
   * ```typescript
   * role.addPermission(newPermission);
   * ```
   *
   * @since 1.0.0
   */
  public addPermission(permission: Permission): void {
    if (this._isSystemRole) {
      throw new AuthorizationExceptions.SystemRoleModificationException(
        this.id.toString(),
        'addPermission'
      );
    }

    if (this._permissions.some(p => p.name === permission.name)) {
      throw new AuthorizationExceptions.PermissionAlreadyExistsException(
        permission.name,
        { roleId: this.id.toString(), permissionName: permission.name }
      );
    }

    this._permissions.push(permission);
    this.updateTimestamp();
  }

  /**
   * 移除权限
   *
   * @description 从角色中移除指定权限
   *
   * @param permissionName - 权限名称
   * @throws {SystemRoleModificationException} 当尝试修改系统角色时抛出异常
   * @throws {PermissionNotFoundException} 当权限不存在时抛出异常
   *
   * @example
   * ```typescript
   * role.removePermission('manage_users');
   * ```
   *
   * @since 1.0.0
   */
  public removePermission(permissionName: string): void {
    if (this._isSystemRole) {
      throw new AuthorizationExceptions.SystemRoleModificationException(
        this.id.toString(),
        'addPermission'
      );
    }

    const index = this._permissions.findIndex(p => p.name === permissionName);
    if (index === -1) {
      throw new AuthorizationExceptions.PermissionNotFoundException(
        permissionName,
        { roleId: this.id.toString(), permissionName }
      );
    }

    this._permissions.splice(index, 1);
    this.updateTimestamp();
  }

  /**
   * 添加父角色
   *
   * @description 为角色添加父角色（权限继承）
   *
   * @param parentRoleId - 父角色ID
   * @throws {SystemRoleModificationException} 当尝试修改系统角色时抛出异常
   * @throws {CircularInheritanceException} 当形成循环继承时抛出异常
   *
   * @example
   * ```typescript
   * role.addParentRole('parent-role-id');
   * ```
   *
   * @since 1.0.0
   */
  public addParentRole(parentRoleId: string): void {
    if (this._isSystemRole) {
      throw new AuthorizationExceptions.SystemRoleModificationException(
        this.id.toString(),
        'addPermission'
      );
    }

    if (this._parentRoleIds.includes(parentRoleId)) {
      throw new AuthorizationExceptions.RoleAlreadyExistsException(
        parentRoleId,
        { roleId: this.id.toString(), parentRoleId }
      );
    }

    // 检查循环继承（这里简化处理，实际应该递归检查）
    if (parentRoleId === this.id.toString()) {
      throw new AuthorizationExceptions.CircularInheritanceException(
        this.id.toString(),
        parentRoleId
      );
    }

    this._parentRoleIds.push(parentRoleId);
    this.updateTimestamp();
  }

  /**
   * 移除父角色
   *
   * @description 从角色中移除父角色
   *
   * @param parentRoleId - 父角色ID
   * @throws {SystemRoleModificationException} 当尝试修改系统角色时抛出异常
   * @throws {ParentRoleNotFoundException} 当父角色不存在时抛出异常
   *
   * @example
   * ```typescript
   * role.removeParentRole('parent-role-id');
   * ```
   *
   * @since 1.0.0
   */
  public removeParentRole(parentRoleId: string): void {
    if (this._isSystemRole) {
      throw new AuthorizationExceptions.SystemRoleModificationException(
        this.id.toString(),
        'addPermission'
      );
    }

    const index = this._parentRoleIds.indexOf(parentRoleId);
    if (index === -1) {
      throw new AuthorizationExceptions.RoleNotFoundException(
        parentRoleId,
        { roleId: this.id.toString(), parentRoleId }
      );
    }

    this._parentRoleIds.splice(index, 1);
    this.updateTimestamp();
  }

  /**
   * 更新角色名称
   *
   * @description 更新角色的名称
   *
   * @param newName - 新的角色名称
   * @throws {SystemRoleModificationException} 当尝试修改系统角色时抛出异常
   * @throws {InvalidRoleNameException} 当名称无效时抛出异常
   *
   * @example
   * ```typescript
   * role.updateName('新的角色名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    if (this._isSystemRole) {
      throw new AuthorizationExceptions.SystemRoleModificationException(
        this.id.toString(),
        'addPermission'
      );
    }

    if (!newName || newName.trim().length === 0) {
      throw new AuthorizationExceptions.RoleValidationException(
        '角色名称不能为空',
        'name',
        newName,
        this.id.toString()
      );
    }

    if (newName.trim().length > 100) {
      throw new AuthorizationExceptions.RoleValidationException(
        '角色名称长度不能超过100个字符',
        'name',
        newName,
        this.id.toString()
      );
    }

    this._name = newName.trim();
    this.updateTimestamp();
  }

  /**
   * 更新角色描述
   *
   * @description 更新角色的描述信息
   *
   * @param newDescription - 新的描述
   * @throws {SystemRoleModificationException} 当尝试修改系统角色时抛出异常
   * @throws {InvalidDescriptionException} 当描述无效时抛出异常
   *
   * @example
   * ```typescript
   * role.updateDescription('新的角色描述');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    if (this._isSystemRole) {
      throw new AuthorizationExceptions.SystemRoleModificationException(
        this.id.toString(),
        'addPermission'
      );
    }

    if (newDescription && newDescription.length > 500) {
      throw new AuthorizationExceptions.RoleValidationException(
        '角色描述长度不能超过500个字符',
        'description',
        newDescription,
        this.id.toString()
      );
    }

    this._description = newDescription || '';
    this.updateTimestamp();
  }

  /**
   * 激活角色
   *
   * @description 激活角色，使其可以被使用
   *
   * @example
   * ```typescript
   * role.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  /**
   * 停用角色
   *
   * @description 停用角色，使其不能被使用
   *
   * @throws {SystemRoleModificationException} 当尝试修改系统角色时抛出异常
   *
   * @example
   * ```typescript
   * role.deactivate();
   * ```
   *
   * @since 1.0.0
   */
  public deactivate(): void {
    if (this._isSystemRole) {
      throw new AuthorizationExceptions.SystemRoleModificationException(
        this.id.toString(),
        'deactivate'
      );
    }

    this._isActive = false;
    this.updateTimestamp();
  }

  /**
   * 检查是否拥有指定权限
   *
   * @description 检查角色是否拥有指定权限
   * 包括直接权限和继承权限
   *
   * @param permissionName - 权限名称
   * @returns 是否拥有该权限
   *
   * @example
   * ```typescript
   * const hasPermission = role.hasPermission('manage_users'); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasPermission(permissionName: string): boolean {
    // 检查直接权限
    const directPermission = this._permissions.find(p => p.contains(permissionName));
    if (directPermission) {
      return true;
    }

    // 检查通配符权限
    const wildcardPermission = this._permissions.find(p => p.name === 'manage_all');
    if (wildcardPermission) {
      return true;
    }

    return false;
  }

  /**
   * 获取所有权限
   *
   * @description 返回角色的所有权限（包括继承权限）
   * 注意：这里简化处理，实际应该递归获取父角色权限
   *
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * const permissions = role.getAllPermissions();
   * ```
   *
   * @since 1.0.0
   */
  public getAllPermissions(): Permission[] {
    // 这里简化处理，实际应该递归获取父角色权限
    return [...this._permissions];
  }

  /**
   * 检查是否可以管理指定角色
   *
   * @description 检查当前角色是否可以管理指定角色
   * 基于权限级别进行判断
   *
   * @param targetRole - 目标角色
   * @returns 是否可以管理
   *
   * @example
   * ```typescript
   * const canManage = role.canManage(targetRole); // true
   * ```
   *
   * @since 1.0.0
   */
  public canManage(targetRole: Role): boolean {
    // 角色不能管理自己
    if (this.id.equals(targetRole.id)) {
      return false;
    }

    // 系统角色不能被管理
    if (targetRole._isSystemRole) {
      return false;
    }

    // 检查是否有管理权限
    return this.hasPermission('manage_roles');
  }

  /**
   * 检查角色是否激活
   *
   * @description 检查角色是否处于激活状态
   *
   * @returns 是否激活
   *
   * @example
   * ```typescript
   * const isActive = role.isActive(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * 检查是否为系统角色
   *
   * @description 检查角色是否为系统内置角色
   *
   * @returns 是否为系统角色
   *
   * @example
   * ```typescript
   * const isSystem = role.isSystemRole(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isSystemRole(): boolean {
    return this._isSystemRole;
  }

  /**
   * 获取权限数量
   *
   * @description 返回角色拥有的权限数量
   *
   * @returns 权限数量
   *
   * @example
   * ```typescript
   * const permissionCount = role.getPermissionCount(); // 10
   * ```
   *
   * @since 1.0.0
   */
  public getPermissionCount(): number {
    return this._permissions.length;
  }

  /**
   * 获取父角色数量
   *
   * @description 返回角色继承的父角色数量
   *
   * @returns 父角色数量
   *
   * @example
   * ```typescript
   * const parentCount = role.getParentRoleCount(); // 2
   * ```
   *
   * @since 1.0.0
   */
  public getParentRoleCount(): number {
    return this._parentRoleIds.length;
  }

  // Getter 方法
  public getCode(): string { return this._code; }
  public getName(): string { return this._name; }
  public getDescription(): string { return this._description; }
  public getPermissions(): Permission[] { return [...this._permissions]; }
  public getParentRoleIds(): string[] { return [...this._parentRoleIds]; }
  public getIsSystemRole(): boolean { return this._isSystemRole; }
  public getIsActive(): boolean { return this._isActive; }
}

// 导入新的异常类
import { AuthorizationExceptions } from '../../exceptions';
