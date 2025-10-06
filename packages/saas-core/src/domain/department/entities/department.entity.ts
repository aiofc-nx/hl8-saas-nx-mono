import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { DepartmentStatus, DepartmentStatusUtils } from '../value-objects/department-status.vo';
import { DepartmentType, DepartmentTypeUtils } from '../value-objects/department-type.vo';
import { DepartmentLevel } from '../value-objects/department-level.vo';

/**
 * 部门实体
 *
 * @description 部门是组织内设的纵向管理机构
 * 采用充血模型，包含完整的业务逻辑
 *
 * ## 业务规则
 *
 * ### 状态管理规则
 * - 部门创建后状态为 PENDING
 * - 只有 PENDING 状态的部门可以激活
 * - 只有 ACTIVE 状态的部门可以暂停
 * - 状态转换必须遵循状态转换矩阵
 *
 * ### 层级管理规则
 * - 部门具有明确的层级关系
 * - 上级部门管理下级部门
 * - 部门路径必须唯一
 * - 层级变更需要验证业务规则
 *
 * ### 类型管理规则
 * - 部门类型决定其业务职能
 * - 不同类型部门有不同的权限范围
 * - 部门类型可以变更，但需要验证业务规则
 *
 * @example
 * ```typescript
 * const department = new Department(
 *   departmentId,
 *   tenantId,
 *   organizationId,
 *   '技术部',
 *   DepartmentType.TECHNICAL,
 *   DepartmentStatus.PENDING,
 *   'admin-user-id',
 *   '负责技术开发和维护',
 *   departmentLevel
 * );
 * 
 * department.activate(); // 激活部门
 * const canManage = department.canManageUsers(); // true
 * ```
 *
 * @since 1.0.0
 */
export class Department extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建部门实体实例
   * 所有属性都是私有的，通过方法访问和修改
   *
   * @param id - 部门ID
   * @param _tenantId - 所属租户ID
   * @param _organizationId - 所属组织ID
   * @param _name - 部门名称
   * @param _type - 部门类型
   * @param _status - 部门状态
   * @param _adminId - 管理员用户ID
   * @param _description - 部门描述
   * @param _level - 部门层级信息
   */
  constructor(
    id: EntityId,
    private readonly _code: string,
    private readonly _tenantId: EntityId,
    private readonly _organizationId: EntityId,
    private _name: string,
    private _type: DepartmentType,
    private _status: DepartmentStatus,
    private _adminId: string,
    private _description: string,
    private _level: DepartmentLevel
  ) {
    super(id, { createdBy: 'system' });
  }

  /**
   * 激活部门
   *
   * @description 将部门状态从 PENDING 转换为 ACTIVE
   * 只有待激活状态的部门才能激活
   *
   * @throws {DepartmentNotPendingException} 当部门不是待激活状态时抛出异常
   *
   * @example
   * ```typescript
   * department.activate(); // 激活部门
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    if (this._status !== DepartmentStatus.PENDING) {
      throw new DepartmentExceptions.DepartmentStatusException(
        '只有待激活状态的部门才能激活',
        this._status,
        'activate',
        this.id.toString()
      );
    }

    this._status = DepartmentStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 停用部门
   *
   * @description 停用部门，将状态设置为停用
   * 只有活跃状态的部门才能停用
   *
   * @throws {DepartmentNotActiveException} 当部门不是活跃状态时抛出异常
   *
   * @since 1.0.0
   */
  public deactivate(): void {
    if (this._status !== DepartmentStatus.ACTIVE) {
      throw new DepartmentExceptions.DepartmentStatusException(
        '只有活跃状态的部门才能停用',
        this._status,
        'deactivate',
        this.id.toString()
      );
    }

    this._status = DepartmentStatus.INACTIVE;
    this.updateTimestamp();
  }

  /**
   * 暂停部门
   *
   * @description 将部门状态从 ACTIVE 转换为 SUSPENDED
   * 只有活跃状态的部门才能暂停
   *
   * @param reason - 暂停原因
   * @throws {DepartmentNotActiveException} 当部门不是活跃状态时抛出异常
   *
   * @example
   * ```typescript
   * department.suspend('部门重组'); // 暂停部门
   * ```
   *
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    if (this._status !== DepartmentStatus.ACTIVE) {
      throw new DepartmentExceptions.DepartmentStatusException(
        '只有活跃状态的部门才能暂停',
        this._status,
        'suspend',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new DepartmentExceptions.DepartmentValidationException(
        '暂停原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = DepartmentStatus.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * 禁用部门
   *
   * @description 将部门状态转换为 DISABLED
   * 只有特定状态的部门才能禁用
   *
   * @param reason - 禁用原因
   * @throws {InvalidDepartmentStatusException} 当部门状态不允许禁用时抛出异常
   *
   * @example
   * ```typescript
   * department.disable('部门解散'); // 禁用部门
   * ```
   *
   * @since 1.0.0
   */
  public disable(reason: string): void {
    if (!DepartmentStatusUtils.canTransitionTo(this._status, DepartmentStatus.DISABLED)) {
      throw new DepartmentExceptions.DepartmentStatusException(
        `部门状态 ${this._status} 不能转换为 DISABLED`,
        this._status,
        'disable',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new DepartmentExceptions.DepartmentValidationException(
        '禁用原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = DepartmentStatus.DISABLED;
    this.updateTimestamp();
  }

  /**
   * 归档部门
   *
   * @description 将部门状态转换为 ARCHIVED
   * 只有特定状态的部门才能归档
   *
   * @param reason - 归档原因
   * @throws {InvalidDepartmentStatusException} 当部门状态不允许归档时抛出异常
   *
   * @example
   * ```typescript
   * department.archive('部门历史记录'); // 归档部门
   * ```
   *
   * @since 1.0.0
   */
  public archive(reason: string): void {
    if (!DepartmentStatusUtils.canTransitionTo(this._status, DepartmentStatus.ARCHIVED)) {
      throw new DepartmentExceptions.DepartmentStatusException(
        `部门状态 ${this._status} 不能转换为 ARCHIVED`,
        this._status,
        'archive',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new DepartmentExceptions.DepartmentValidationException(
        '归档原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = DepartmentStatus.ARCHIVED;
    this.updateTimestamp();
  }

  /**
   * 更新部门名称
   *
   * @description 更新部门的名称
   *
   * @param newName - 新的部门名称
   * @throws {InvalidDepartmentNameException} 当名称无效时抛出异常
   *
   * @example
   * ```typescript
   * department.updateName('新的部门名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DepartmentExceptions.DepartmentValidationException(
        '部门名称不能为空',
        'name',
        newName,
        this.id.toString()
      );
    }

    if (newName.trim().length > 100) {
      throw new DepartmentExceptions.DepartmentValidationException(
        '部门名称长度不能超过100个字符',
        'name',
        newName,
        this.id.toString()
      );
    }

    this._name = newName.trim();
    this.updateTimestamp();
  }

  /**
   * 更新部门类型
   *
   * @description 更新部门的类型
   *
   * @param newType - 新的部门类型
   *
   * @example
   * ```typescript
   * department.updateType(DepartmentType.MARKETING);
   * ```
   *
   * @since 1.0.0
   */
  public updateType(newType: DepartmentType): void {
    this._type = newType;
    this.updateTimestamp();
  }

  /**
   * 更新管理员
   *
   * @description 更新部门的管理员用户ID
   *
   * @param newAdminId - 新的管理员用户ID
   * @throws {InvalidAdminIdException} 当管理员ID无效时抛出异常
   *
   * @example
   * ```typescript
   * department.updateAdmin('new-admin-user-id');
   * ```
   *
   * @since 1.0.0
   */
  public updateAdmin(newAdminId: string): void {
    if (!newAdminId || newAdminId.trim().length === 0) {
      throw new DepartmentExceptions.DepartmentValidationException(
        '管理员用户ID不能为空',
        'adminId',
        newAdminId,
        this.id.toString()
      );
    }

    this._adminId = newAdminId.trim();
    this.updateTimestamp();
  }

  /**
   * 更新描述
   *
   * @description 更新部门的描述信息
   *
   * @param newDescription - 新的描述
   * @throws {InvalidDescriptionException} 当描述无效时抛出异常
   *
   * @example
   * ```typescript
   * department.updateDescription('新的部门描述');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    if (newDescription && newDescription.length > 500) {
      throw new DepartmentExceptions.DepartmentValidationException(
        '部门描述长度不能超过500个字符',
        'description',
        newDescription,
        this.id.toString()
      );
    }

    this._description = newDescription || '';
    this.updateTimestamp();
  }

  /**
   * 更新层级信息
   *
   * @description 更新部门的层级信息
   *
   * @param newLevel - 新的层级信息
   *
   * @example
   * ```typescript
   * department.updateLevel(newDepartmentLevel);
   * ```
   *
   * @since 1.0.0
   */
  public updateLevel(newLevel: DepartmentLevel): void {
    this._level = newLevel;
    this.updateTimestamp();
  }

  /**
   * 添加子部门
   *
   * @description 将子部门添加到当前部门
   *
   * @param childDepartmentId - 子部门ID
   *
   * @example
   * ```typescript
   * department.addChildDepartment('child-dept-id');
   * ```
   *
   * @since 1.0.0
   */
  public addChildDepartment(childDepartmentId: string): void {
    this._level = this._level.addChild(childDepartmentId);
    this.updateTimestamp();
  }

  /**
   * 移除子部门
   *
   * @description 将子部门从当前部门移除
   *
   * @param childDepartmentId - 子部门ID
   *
   * @example
   * ```typescript
   * department.removeChildDepartment('child-dept-id');
   * ```
   *
   * @since 1.0.0
   */
  public removeChildDepartment(childDepartmentId: string): void {
    this._level = this._level.removeChild(childDepartmentId);
    this.updateTimestamp();
  }

  /**
   * 检查是否拥有指定权限
   *
   * @description 检查部门是否拥有指定权限
   * 基于部门类型进行权限检查
   *
   * @param permission - 权限名称
   * @returns 是否拥有该权限
   *
   * @example
   * ```typescript
   * const hasPermission = department.hasPermission('manage_technical_projects'); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasPermission(permission: string): boolean {
    return DepartmentTypeUtils.hasPermission(this._type, permission);
  }

  /**
   * 检查是否可以管理用户
   *
   * @description 检查部门是否可以管理用户
   *
   * @returns 是否可以管理用户
   *
   * @example
   * ```typescript
   * const canManage = department.canManageUsers(); // true
   * ```
   *
   * @since 1.0.0
   */
  public canManageUsers(): boolean {
    return DepartmentTypeUtils.canManageUsers(this._type);
  }

  /**
   * 检查是否可以管理预算
   *
   * @description 检查部门是否可以管理预算
   *
   * @returns 是否可以管理预算
   *
   * @example
   * ```typescript
   * const canManage = department.canManageBudget(); // true
   * ```
   *
   * @since 1.0.0
   */
  public canManageBudget(): boolean {
    return DepartmentTypeUtils.canManageBudget(this._type);
  }

  /**
   * 检查部门是否活跃
   *
   * @description 检查部门是否处于活跃状态
   *
   * @returns 是否活跃
   *
   * @example
   * ```typescript
   * const isActive = department.isActive(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isActive(): boolean {
    return DepartmentStatusUtils.isActive(this._status);
  }

  /**
   * 检查部门是否可用
   *
   * @description 检查部门是否可用（非禁用和删除状态）
   *
   * @returns 是否可用
   *
   * @example
   * ```typescript
   * const isAvailable = department.isAvailable(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isAvailable(): boolean {
    return DepartmentStatusUtils.isAvailable(this._status);
  }

  /**
   * 检查是否为根部门
   *
   * @description 检查部门是否为根部门（一级部门）
   *
   * @returns 是否为根部门
   *
   * @example
   * ```typescript
   * const isRoot = department.isRoot(); // false
   * ```
   *
   * @since 1.0.0
   */
  public isRoot(): boolean {
    return this._level.isRoot();
  }

  /**
   * 检查是否有子部门
   *
   * @description 检查部门是否拥有子部门
   *
   * @returns 是否有子部门
   *
   * @example
   * ```typescript
   * const hasChildren = department.hasChildren(); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasChildren(): boolean {
    return this._level.hasChildren();
  }

  /**
   * 检查是否为叶子部门
   *
   * @description 检查部门是否为叶子部门（没有子部门）
   *
   * @returns 是否为叶子部门
   *
   * @example
   * ```typescript
   * const isLeaf = department.isLeaf(); // false
   * ```
   *
   * @since 1.0.0
   */
  public isLeaf(): boolean {
    return this._level.isLeaf();
  }

  /**
   * 获取子部门数量
   *
   * @description 返回子部门的数量
   *
   * @returns 子部门数量
   *
   * @example
   * ```typescript
   * const childCount = department.getChildCount(); // 3
   * ```
   *
   * @since 1.0.0
   */
  public getChildCount(): number {
    return this._level.getChildCount();
  }

  // Getter 方法
  public getTenantId(): EntityId { return this._tenantId; }
  public getOrganizationId(): EntityId { return this._organizationId; }
  public getCode(): string { return this._code; }
  public getName(): string { return this._name; }
  public getType(): DepartmentType { return this._type; }
  public getStatus(): DepartmentStatus { return this._status; }
  public getAdminId(): string { return this._adminId; }
  public getDescription(): string { return this._description; }
  public getLevel(): DepartmentLevel { return this._level; }
}

// 导入新的异常类
import { DepartmentExceptions } from '../../exceptions';
