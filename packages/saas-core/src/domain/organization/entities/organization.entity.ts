import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { OrganizationStatus, OrganizationStatusUtils } from '@hl8/hybrid-archi';
import { OrganizationType, OrganizationTypeUtils } from '../value-objects/organization-type.vo';

/**
 * 组织实体
 *
 * @description 组织是租户内设的横向部门管理单位
 * 采用充血模型，包含完整的业务逻辑
 *
 * ## 业务规则
 *
 * ### 状态管理规则
 * - 组织创建后状态为 PENDING
 * - 只有 PENDING 状态的组织可以激活
 * - 只有 ACTIVE 状态的组织可以暂停
 * - 状态转换必须遵循状态转换矩阵
 *
 * ### 类型管理规则
 * - 组织类型决定其管理职责和权限范围
 * - 不同类型组织有不同的功能权限
 * - 组织类型可以变更，但需要验证业务规则
 *
 * ### 部门管理规则
 * - 组织可以管理多个部门
 * - 组织负责协调下属部门的业务
 * - 组织可以创建、修改、删除下属部门
 *
 * @example
 * ```typescript
 * const organization = new Organization(
 *   organizationId,
 *   tenantId,
 *   '技术委员会',
 *   OrganizationType.COMMITTEE,
 *   OrganizationStatus.PENDING,
 *   'admin-user-id',
 *   '负责技术决策和标准制定'
 * );
 * 
 * organization.activate(); // 激活组织
 * const canManage = organization.canManageDepartments(); // true
 * ```
 *
 * @since 1.0.0
 */
export class Organization extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建组织实体实例
   * 所有属性都是私有的，通过方法访问和修改
   *
   * @param id - 组织ID
   * @param _tenantId - 所属租户ID
   * @param _name - 组织名称
   * @param _type - 组织类型
   * @param _status - 组织状态
   * @param _adminId - 管理员用户ID
   * @param _description - 组织描述
   * @param _departmentIds - 管理的部门ID列表
   */
  constructor(
    id: EntityId,
    private readonly _tenantId: EntityId,
    private _name: string,
    private _type: OrganizationType,
    private _status: OrganizationStatus,
    private _adminId: string,
    private _description: string,
    private _departmentIds: string[] = []
  ) {
    super(id, { createdBy: 'system' });
  }

  /**
   * 激活组织
   *
   * @description 将组织状态从 PENDING 转换为 ACTIVE
   * 只有待激活状态的组织才能激活
   *
   * @throws {OrganizationNotPendingException} 当组织不是待激活状态时抛出异常
   *
   * @example
   * ```typescript
   * organization.activate(); // 激活组织
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    if (this._status !== OrganizationStatus.PENDING) {
      throw new OrganizationExceptions.OrganizationStatusException(
        '只有待激活状态的组织才能激活',
        this._status,
        'activate',
        this.id.toString()
      );
    }

    this._status = OrganizationStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 暂停组织
   *
   * @description 将组织状态从 ACTIVE 转换为 SUSPENDED
   * 只有活跃状态的组织才能暂停
   *
   * @param reason - 暂停原因
   * @throws {OrganizationNotActiveException} 当组织不是活跃状态时抛出异常
   *
   * @example
   * ```typescript
   * organization.suspend('组织重组'); // 暂停组织
   * ```
   *
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new OrganizationExceptions.OrganizationStatusException(
        '只有活跃状态的组织才能暂停',
        this._status,
        'suspend',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new OrganizationExceptions.OrganizationValidationException(
        '暂停原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = OrganizationStatus.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * 禁用组织
   *
   * @description 将组织状态转换为 DISABLED
   * 只有特定状态的组织才能禁用
   *
   * @param reason - 禁用原因
   * @throws {InvalidOrganizationStatusException} 当组织状态不允许禁用时抛出异常
   *
   * @example
   * ```typescript
   * organization.disable('组织解散'); // 禁用组织
   * ```
   *
   * @since 1.0.0
   */
  public disable(reason: string): void {
    if (!OrganizationStatusUtils.canTransitionTo(this._status, OrganizationStatus.DISABLED)) {
      throw new OrganizationExceptions.OrganizationStatusException(
        `组织状态 ${this._status} 不能转换为 DISABLED`,
        this._status,
        'disable',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new OrganizationExceptions.OrganizationValidationException(
        '禁用原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = OrganizationStatus.DISABLED;
    this.updateTimestamp();
  }

  /**
   * 归档组织
   *
   * @description 将组织状态转换为 ARCHIVED
   * 只有特定状态的组织才能归档
   *
   * @param reason - 归档原因
   * @throws {InvalidOrganizationStatusException} 当组织状态不允许归档时抛出异常
   *
   * @example
   * ```typescript
   * organization.archive('组织历史记录'); // 归档组织
   * ```
   *
   * @since 1.0.0
   */
  public archive(reason: string): void {
    if (!OrganizationStatusUtils.canTransitionTo(this._status, OrganizationStatus.ARCHIVED)) {
      throw new OrganizationExceptions.OrganizationStatusException(
        `组织状态 ${this._status} 不能转换为 ARCHIVED`,
        this._status,
        'archive',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new OrganizationExceptions.OrganizationValidationException(
        '归档原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = OrganizationStatus.ARCHIVED;
    this.updateTimestamp();
  }

  /**
   * 更新组织名称
   *
   * @description 更新组织的名称
   *
   * @param newName - 新的组织名称
   * @throws {InvalidOrganizationNameException} 当名称无效时抛出异常
   *
   * @example
   * ```typescript
   * organization.updateName('新的组织名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new OrganizationExceptions.OrganizationValidationException(
        '组织名称不能为空',
        'name',
        newName,
        this.id.toString()
      );
    }

    if (newName.trim().length > 100) {
      throw new OrganizationExceptions.OrganizationValidationException(
        '组织名称长度不能超过100个字符',
        'name',
        newName,
        this.id.toString()
      );
    }

    this._name = newName.trim();
    this.updateTimestamp();
  }

  /**
   * 更新组织类型
   *
   * @description 更新组织的类型
   *
   * @param newType - 新的组织类型
   *
   * @example
   * ```typescript
   * organization.updateType(OrganizationType.PROJECT_TEAM);
   * ```
   *
   * @since 1.0.0
   */
  public updateType(newType: OrganizationType): void {
    this._type = newType;
    this.updateTimestamp();
  }

  /**
   * 更新管理员
   *
   * @description 更新组织的管理员用户ID
   *
   * @param newAdminId - 新的管理员用户ID
   * @throws {InvalidAdminIdException} 当管理员ID无效时抛出异常
   *
   * @example
   * ```typescript
   * organization.updateAdmin('new-admin-user-id');
   * ```
   *
   * @since 1.0.0
   */
  public updateAdmin(newAdminId: string): void {
    if (!newAdminId || newAdminId.trim().length === 0) {
      throw new OrganizationExceptions.OrganizationValidationException(
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
   * @description 更新组织的描述信息
   *
   * @param newDescription - 新的描述
   * @throws {InvalidDescriptionException} 当描述无效时抛出异常
   *
   * @example
   * ```typescript
   * organization.updateDescription('新的组织描述');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    if (newDescription && newDescription.length > 500) {
      throw new OrganizationExceptions.OrganizationValidationException(
        '组织描述长度不能超过500个字符',
        'description',
        newDescription,
        this.id.toString()
      );
    }

    this._description = newDescription || '';
    this.updateTimestamp();
  }

  /**
   * 添加管理部门
   *
   * @description 将部门添加到组织的管理范围
   *
   * @param departmentId - 部门ID
   * @throws {DepartmentAlreadyManagedException} 当部门已被管理时抛出异常
   *
   * @example
   * ```typescript
   * organization.addManagedDepartment('dept-id');
   * ```
   *
   * @since 1.0.0
   */
  public addManagedDepartment(departmentId: string): void {
    if (!departmentId || departmentId.trim().length === 0) {
      throw new OrganizationExceptions.OrganizationValidationException(
        '部门ID不能为空',
        'departmentId',
        departmentId,
        this.id.toString()
      );
    }

    if (this._departmentIds.includes(departmentId)) {
      throw new OrganizationExceptions.OrganizationAlreadyExistsException(
        departmentId,
        { organizationId: this.id.toString(), departmentId }
      );
    }

    this._departmentIds.push(departmentId);
    this.updateTimestamp();
  }

  /**
   * 移除管理部门
   *
   * @description 将部门从组织的管理范围中移除
   *
   * @param departmentId - 部门ID
   * @throws {DepartmentNotManagedException} 当部门未被管理时抛出异常
   *
   * @example
   * ```typescript
   * organization.removeManagedDepartment('dept-id');
   * ```
   *
   * @since 1.0.0
   */
  public removeManagedDepartment(departmentId: string): void {
    const index = this._departmentIds.indexOf(departmentId);
    if (index === -1) {
      throw new OrganizationExceptions.OrganizationNotFoundException(
        departmentId,
        { organizationId: this.id.toString(), departmentId }
      );
    }

    this._departmentIds.splice(index, 1);
    this.updateTimestamp();
  }

  /**
   * 检查是否拥有指定权限
   *
   * @description 检查组织是否拥有指定权限
   * 基于组织类型进行权限检查
   *
   * @param permission - 权限名称
   * @returns 是否拥有该权限
   *
   * @example
   * ```typescript
   * const hasPermission = organization.hasPermission('manage_committee_members'); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasPermission(permission: string): boolean {
    return OrganizationTypeUtils.hasPermission(this._type, permission);
  }

  /**
   * 检查是否可以管理部门
   *
   * @description 检查组织是否可以管理部门
   *
   * @returns 是否可以管理部门
   *
   * @example
   * ```typescript
   * const canManage = organization.canManageDepartments(); // true
   * ```
   *
   * @since 1.0.0
   */
  public canManageDepartments(): boolean {
    return OrganizationTypeUtils.canManageDepartments(this._type);
  }

  /**
   * 检查是否可以管理用户
   *
   * @description 检查组织是否可以管理用户
   *
   * @returns 是否可以管理用户
   *
   * @example
   * ```typescript
   * const canManage = organization.canManageUsers(); // true
   * ```
   *
   * @since 1.0.0
   */
  public canManageUsers(): boolean {
    return OrganizationTypeUtils.canManageUsers(this._type);
  }

  /**
   * 检查是否可以管理预算
   *
   * @description 检查组织是否可以管理预算
   *
   * @returns 是否可以管理预算
   *
   * @example
   * ```typescript
   * const canManage = organization.canManageBudget(); // true
   * ```
   *
   * @since 1.0.0
   */
  public canManageBudget(): boolean {
    return OrganizationTypeUtils.canManageBudget(this._type);
  }

  /**
   * 检查组织是否活跃
   *
   * @description 检查组织是否处于活跃状态
   *
   * @returns 是否活跃
   *
   * @example
   * ```typescript
   * const isActive = organization.isActive(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isActive(): boolean {
    return OrganizationStatusUtils.isActive(this._status);
  }

  /**
   * 检查组织是否可用
   *
   * @description 检查组织是否可用（非禁用和删除状态）
   *
   * @returns 是否可用
   *
   * @example
   * ```typescript
   * const isAvailable = organization.isAvailable(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isAvailable(): boolean {
    return OrganizationStatusUtils.isAvailable(this._status);
  }

  /**
   * 获取管理的部门数量
   *
   * @description 返回组织管理的部门数量
   *
   * @returns 管理的部门数量
   *
   * @example
   * ```typescript
   * const deptCount = organization.getManagedDepartmentCount(); // 5
   * ```
   *
   * @since 1.0.0
   */
  public getManagedDepartmentCount(): number {
    return this._departmentIds.length;
  }

  // Getter 方法
  public getTenantId(): EntityId { return this._tenantId; }
  public getName(): string { return this._name; }
  public getType(): OrganizationType { return this._type; }
  public getStatus(): OrganizationStatus { return this._status; }
  public getAdminId(): string { return this._adminId; }
  public getDescription(): string { return this._description; }
  public getManagedDepartmentIds(): string[] { return [...this._departmentIds]; }
}

// 导入新的异常类
import { OrganizationExceptions } from '../../exceptions';
