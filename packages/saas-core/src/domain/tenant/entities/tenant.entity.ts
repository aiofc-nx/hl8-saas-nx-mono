import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { TenantStatus, TenantStatusUtils } from '@hl8/hybrid-archi';
import { TenantType, TenantTypeUtils } from '@hl8/hybrid-archi';
import { TenantConfig } from '../value-objects/tenant-config.vo';
import { ResourceLimits } from '../value-objects/resource-limits.vo';
import { TenantCode } from '../value-objects/tenant-code.vo';

/**
 * 租户实体
 *
 * @description 租户是SAAS平台中的独立客户单位
 * 采用充血模型，包含完整的业务逻辑
 *
 * ## 业务规则
 *
 * ### 状态管理规则
 * - 租户创建后状态为 PENDING
 * - 只有 PENDING 状态的租户可以激活
 * - 只有 ACTIVE 状态的租户可以暂停
 * - 状态转换必须遵循状态转换矩阵
 *
 * ### 资源限制规则
 * - 租户必须遵守资源限制
 * - 超过限制时不能执行相关操作
 * - 无限制资源（-1）不受限制
 *
 * ### 功能权限规则
 * - 租户只能使用配置中允许的功能
 * - 包含 'all_features' 表示拥有所有功能
 * - 功能权限由租户类型决定
 *
 * @example
 * ```typescript
 * const tenantCode = TenantCode.generate(); // 生成18位USCI格式租户代码
 * const tenant = new Tenant(
 *   tenantId,
 *   tenantCode,
 *   '示例租户',
 *   TenantType.BASIC,
 *   TenantStatus.PENDING,
 *   'admin-user-id',
 *   tenantConfig,
 *   resourceLimits
 * );
 * 
 * tenant.activate(); // 激活租户
 * const canUse = tenant.canUseFeature('basic_user_management'); // true
 * const codeValue = tenant.getCodeValue(); // 获取USCI格式租户代码字符串值
 * ```
 *
 * @since 1.0.0
 */
export class Tenant extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建租户实体实例
   * 所有属性都是私有的，通过方法访问和修改
   *
   * @param id - 租户ID
   * @param _code - 租户代码值对象（18位统一社会信用代码USCI格式）
   * @param _name - 租户名称
   * @param _type - 租户类型
   * @param _status - 租户状态
   * @param _adminId - 管理员用户ID
   * @param _config - 租户配置
   * @param _resourceLimits - 资源限制
   */
  constructor(
    id: EntityId,
    private readonly _code: TenantCode,
    private _name: string,
    private _type: TenantType,
    private _status: TenantStatus,
    private _adminId: string,
    private _config: TenantConfig,
    private _resourceLimits: ResourceLimits
  ) {
    super(id, { createdBy: 'system' });
  }

  /**
   * 激活租户
   *
   * @description 将租户状态从 PENDING 转换为 ACTIVE
   * 只有待激活状态的租户才能激活
   *
   * @throws {TenantNotPendingException} 当租户不是待激活状态时抛出异常
   *
   * @example
   * ```typescript
   * tenant.activate(); // 激活租户
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    if (this._status !== TenantStatus.PENDING) {
      throw new TenantExceptions.TenantStatusException(
        '只有待激活状态的租户才能激活',
        this._status,
        'activate',
        this.id.toString()
      );
    }

    this._status = TenantStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 暂停租户
   *
   * @description 将租户状态从 ACTIVE 转换为 SUSPENDED
   * 只有活跃状态的租户才能暂停
   *
   * @param reason - 暂停原因
   * @throws {TenantNotActiveException} 当租户不是活跃状态时抛出异常
   *
   * @example
   * ```typescript
   * tenant.suspend('违反服务条款'); // 暂停租户
   * ```
   *
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    if (this._status !== TenantStatus.ACTIVE) {
      throw new TenantExceptions.TenantStatusException(
        '只有活跃状态的租户才能暂停',
        this._status,
        'suspend',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new TenantExceptions.TenantValidationException(
        '暂停原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = TenantStatus.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * 禁用租户
   *
   * @description 将租户状态转换为 DISABLED
   * 只有 PENDING、ACTIVE、SUSPENDED 状态的租户才能禁用
   *
   * @param reason - 禁用原因
   * @throws {InvalidTenantStatusException} 当租户状态不允许禁用时抛出异常
   *
   * @example
   * ```typescript
   * tenant.disable('账户违规'); // 禁用租户
   * ```
   *
   * @since 1.0.0
   */
  public disable(reason: string): void {
    if (!TenantStatusUtils.canTransitionTo(this._status, TenantStatus.DISABLED)) {
      throw new TenantExceptions.TenantStatusException(
        `租户状态 ${this._status} 不能转换为 DISABLED`,
        this._status,
        'disable',
        this.id.toString()
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new TenantExceptions.TenantValidationException(
        '禁用原因不能为空',
        'reason',
        reason,
        this.id.toString()
      );
    }

    this._status = TenantStatus.DISABLED;
    this.updateTimestamp();
  }

  /**
   * 升级租户类型
   *
   * @description 升级租户到更高的类型
   * 更新配置和资源限制
   *
   * @param newType - 新的租户类型
   * @param newConfig - 新的配置
   * @param newResourceLimits - 新的资源限制
   * @throws {InvalidUpgradeException} 当升级无效时抛出异常
   *
   * @example
   * ```typescript
   * tenant.upgrade(
   *   TenantType.PROFESSIONAL,
   *   newConfig,
   *   newResourceLimits
   * );
   * ```
   *
   * @since 1.0.0
   */
  public upgrade(
    newType: TenantType,
    newConfig: TenantConfig,
    newResourceLimits: ResourceLimits
  ): void {
    if (!TenantTypeUtils.canUpgradeTo(this._type, newType)) {
      throw new TenantExceptions.TenantStatusException(
        `不能从 ${this._type} 升级到 ${newType}`,
        this._type,
        'upgrade',
        this.id.toString()
      );
    }

    this._type = newType;
    this._config = newConfig;
    this._resourceLimits = newResourceLimits;
    this.updateTimestamp();
  }

  /**
   * 更新租户名称
   *
   * @description 更新租户的名称
   *
   * @param newName - 新的租户名称
   * @throws {InvalidTenantNameException} 当名称无效时抛出异常
   *
   * @example
   * ```typescript
   * tenant.updateName('新的租户名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new TenantExceptions.TenantValidationException(
        '租户名称不能为空',
        'name',
        newName,
        this.id.toString()
      );
    }

    if (newName.trim().length > 100) {
      throw new TenantExceptions.TenantValidationException(
        '租户名称长度不能超过100个字符',
        'name',
        newName,
        this.id.toString()
      );
    }

    this._name = newName.trim();
    this.updateTimestamp();
  }

  /**
   * 更新管理员
   *
   * @description 更新租户的管理员用户ID
   *
   * @param newAdminId - 新的管理员用户ID
   * @throws {InvalidAdminIdException} 当管理员ID无效时抛出异常
   *
   * @example
   * ```typescript
   * tenant.updateAdmin('new-admin-user-id');
   * ```
   *
   * @since 1.0.0
   */
  public updateAdmin(newAdminId: string): void {
    if (!newAdminId || newAdminId.trim().length === 0) {
      throw new TenantExceptions.TenantValidationException(
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
   * 更新配置
   *
   * @description 更新租户的配置信息
   *
   * @param newConfig - 新的配置
   *
   * @example
   * ```typescript
   * tenant.updateConfig(newTenantConfig);
   * ```
   *
   * @since 1.0.0
   */
  public updateConfig(newConfig: TenantConfig): void {
    this._config = newConfig;
    this.updateTimestamp();
  }

  /**
   * 更新资源限制
   *
   * @description 更新租户的资源限制
   *
   * @param newResourceLimits - 新的资源限制
   *
   * @example
   * ```typescript
   * tenant.updateResourceLimits(newResourceLimits);
   * ```
   *
   * @since 1.0.0
   */
  public updateResourceLimits(newResourceLimits: ResourceLimits): void {
    this._resourceLimits = newResourceLimits;
    this.updateTimestamp();
  }

  /**
   * 检查功能权限
   *
   * @description 检查租户是否可以使用指定功能
   *
   * @param feature - 功能名称
   * @returns 是否可以使用该功能
   *
   * @example
   * ```typescript
   * const canUse = tenant.canUseFeature('basic_user_management'); // true
   * ```
   *
   * @since 1.0.0
   */
  public canUseFeature(feature: string): boolean {
    return this._config.hasFeature(feature);
  }

  /**
   * 检查资源限制
   *
   * @description 检查指定资源是否超过限制
   *
   * @param resource - 资源类型
   * @param currentUsage - 当前使用量
   * @returns 是否超过限制
   *
   * @example
   * ```typescript
   * const isExceeded = tenant.isResourceLimitExceeded('maxUsers', 150); // true
   * ```
   *
   * @since 1.0.0
   */
  public isResourceLimitExceeded(
    resource: keyof import('../value-objects/resource-limits.vo').ResourceLimitsProps,
    currentUsage: number
  ): boolean {
    return this._resourceLimits.isExceeded(resource, currentUsage);
  }

  /**
   * 检查是否可以创建新用户
   *
   * @description 检查租户是否可以创建新用户
   * 考虑用户数量限制
   *
   * @param currentUserCount - 当前用户数量
   * @returns 是否可以创建新用户
   *
   * @example
   * ```typescript
   * const canCreate = tenant.canCreateUser(50); // true
   * ```
   *
   * @since 1.0.0
   */
  public canCreateUser(currentUserCount: number): boolean {
    return !this.isResourceLimitExceeded('maxUsers', currentUserCount);
  }

  /**
   * 检查是否可以创建新组织
   *
   * @description 检查租户是否可以创建新组织
   * 考虑组织数量限制
   *
   * @param currentOrganizationCount - 当前组织数量
   * @returns 是否可以创建新组织
   *
   * @example
   * ```typescript
   * const canCreate = tenant.canCreateOrganization(3); // true
   * ```
   *
   * @since 1.0.0
   */
  public canCreateOrganization(currentOrganizationCount: number): boolean {
    return !this.isResourceLimitExceeded('maxOrganizations', currentOrganizationCount);
  }

  /**
   * 检查租户是否活跃
   *
   * @description 检查租户是否处于活跃状态
   *
   * @returns 是否活跃
   *
   * @example
   * ```typescript
   * const isActive = tenant.isActive(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  /**
   * 检查租户是否可用
   *
   * @description 检查租户是否可以使用（非禁用和删除状态）
   *
   * @returns 是否可用
   *
   * @example
   * ```typescript
   * const isAvailable = tenant.isAvailable(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isAvailable(): boolean {
    return this._status !== TenantStatus.DISABLED && 
           this._status !== TenantStatus.DELETED;
  }

  // Getter 方法
  public getCode(): TenantCode { return this._code; }
  public getCodeValue(): string { return this._code.value; }
  public getName(): string { return this._name; }
  public getType(): TenantType { return this._type; }
  public getStatus(): TenantStatus { return this._status; }
  public getAdminId(): string { return this._adminId; }
  public getConfig(): TenantConfig { return this._config; }
  public getResourceLimits(): ResourceLimits { return this._resourceLimits; }
}

// 导入新的异常类
import { TenantExceptions } from '../../exceptions';