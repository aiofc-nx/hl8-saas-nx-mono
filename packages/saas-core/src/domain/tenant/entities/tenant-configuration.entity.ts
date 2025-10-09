/**
 * 租户配置实体
 *
 * @description 租户的各项配置信息，包括资源配额、功能开关等
 *
 * ## 业务规则
 *
 * ### 配额管理
 * - maxUsers: 最大用户数
 * - maxStorageMB: 最大存储空间（MB）
 * - maxOrganizations: 最大组织数
 * - maxDepartmentLevels: 最大部门层级
 * - maxApiCallsPerDay: 每日API调用限制
 *
 * ### 功能开关
 * - enabledFeatures: 启用的功能列表
 * - 根据租户类型自动配置
 * - 支持自定义启用/禁用
 *
 * ### 自定义配置
 * - customSettings: 租户特定的配置项
 * - 支持任意键值对
 *
 * @example
 * ```typescript
 * const config = TenantConfiguration.create(
 *   EntityId.generate(),
 *   tenantId,
 *   TenantQuota.fromTenantType('FREE'),
 *   ['basic_features'],
 *   { createdBy: 'system' }
 * );
 *
 * // 更新配额
 * config.updateQuota(TenantQuota.fromTenantType('BASIC'));
 *
 * // 启用功能
 * config.enableFeature('advanced_reporting');
 * ```
 *
 * @class TenantConfiguration
 * @since 1.0.0
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { TenantQuota } from '../value-objects/tenant-quota.vo';

/**
 * 租户配置实体
 *
 * @class TenantConfiguration
 * @extends {BaseEntity}
 */
export class TenantConfiguration extends BaseEntity {
  /**
   * 构造函数
   *
   * @param {EntityId} id - 配置ID
   * @param {EntityId} tenantId - 所属租户ID（关联字段）
   * @param {TenantQuota} quota - 租户配额
   * @param {string[]} enabledFeatures - 启用的功能列表
   * @param {Record<string, any>} customSettings - 自定义配置
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @param {PinoLogger} [logger] - 日志记录器
   */
  constructor(
    id: EntityId,
    private _quota: TenantQuota,
    private _enabledFeatures: string[],
    private _customSettings: Record<string, any>,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
    this.validate();
  }

  /**
   * 创建租户配置实体
   *
   * @description 工厂方法，创建新的租户配置
   *
   * @static
   * @param {EntityId} id - 配置ID
   * @param {TenantQuota} quota - 租户配额
   * @param {string[]} enabledFeatures - 启用的功能列表
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @returns {TenantConfiguration} 租户配置实体
   */
  public static create(
    id: EntityId,
    quota: TenantQuota,
    enabledFeatures: string[] = [],
    auditInfo: IPartialAuditInfo,
  ): TenantConfiguration {
    return new TenantConfiguration(
      id,
      quota,
      enabledFeatures,
      {},
      auditInfo,
    );
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * 获取租户配额
   *
   * @returns {TenantQuota}
   */
  public getQuota(): TenantQuota {
    return this._quota;
  }

  /**
   * 获取启用的功能列表
   *
   * @returns {string[]}
   */
  public getEnabledFeatures(): string[] {
    return [...this._enabledFeatures];
  }

  /**
   * 获取自定义配置
   *
   * @returns {Record<string, any>}
   */
  public getCustomSettings(): Record<string, any> {
    return { ...this._customSettings };
  }

  /**
   * 获取最大用户数
   *
   * @returns {number}
   */
  public getMaxUsers(): number {
    return this._quota.maxUsers;
  }

  /**
   * 获取最大存储空间（MB）
   *
   * @returns {number}
   */
  public getMaxStorageMB(): number {
    return this._quota.maxStorageMB;
  }

  /**
   * 获取最大组织数
   *
   * @returns {number}
   */
  public getMaxOrganizations(): number {
    return this._quota.maxOrganizations;
  }

  // ============================================================================
  // 业务方法
  // ============================================================================

  /**
   * 更新配额
   *
   * @description 更新租户的资源配额（通常在升级/降级时调用）
   *
   * @param {TenantQuota} quota - 新的配额
   * @param {string} [updatedBy] - 更新人ID
   */
  public updateQuota(quota: TenantQuota, updatedBy?: string): void {
    this._quota = quota;
    this.updateTimestamp();
  }

  /**
   * 启用功能
   *
   * @description 为租户启用特定功能
   *
   * @param {string} feature - 功能标识
   * @param {string} [updatedBy] - 更新人ID
   */
  public enableFeature(feature: string, updatedBy?: string): void {
    if (!this._enabledFeatures.includes(feature)) {
      this._enabledFeatures.push(feature);
      this.updateTimestamp();
    }
  }

  /**
   * 禁用功能
   *
   * @description 为租户禁用特定功能
   *
   * @param {string} feature - 功能标识
   * @param {string} [updatedBy] - 更新人ID
   */
  public disableFeature(feature: string, updatedBy?: string): void {
    const index = this._enabledFeatures.indexOf(feature);
    if (index > -1) {
      this._enabledFeatures.splice(index, 1);
      this.updateTimestamp();
    }
  }

  /**
   * 设置自定义配置
   *
   * @description 设置租户的自定义配置项
   *
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @param {string} [updatedBy] - 更新人ID
   */
  public setCustomSetting(key: string, value: any, updatedBy?: string): void {
    this._customSettings[key] = value;
    this.updateTimestamp();
  }

  /**
   * 获取自定义配置项
   *
   * @param {string} key - 配置键
   * @returns {any} 配置值
   */
  public getCustomSetting(key: string): any {
    return this._customSettings[key];
  }

  /**
   * 删除自定义配置项
   *
   * @param {string} key - 配置键
   * @param {string} [updatedBy] - 更新人ID
   */
  public removeCustomSetting(key: string, updatedBy?: string): void {
    if (key in this._customSettings) {
      delete this._customSettings[key];
      this.updateTimestamp();
    }
  }

  // ============================================================================
  // 查询方法
  // ============================================================================

  /**
   * 检查功能是否启用
   *
   * @param {string} feature - 功能标识
   * @returns {boolean}
   */
  public isFeatureEnabled(feature: string): boolean {
    return this._enabledFeatures.includes(feature);
  }

  /**
   * 检查用户配额是否已达到
   *
   * @param {number} currentUserCount - 当前用户数
   * @returns {boolean}
   */
  public isUserQuotaReached(currentUserCount: number): boolean {
    return this._quota.isUserQuotaReached(currentUserCount);
  }

  /**
   * 检查存储配额是否已达到
   *
   * @param {number} currentStorageMB - 当前存储空间（MB）
   * @returns {boolean}
   */
  public isStorageQuotaReached(currentStorageMB: number): boolean {
    return this._quota.isStorageQuotaReached(currentStorageMB);
  }

  /**
   * 检查组织配额是否已达到
   *
   * @param {number} currentOrganizationCount - 当前组织数
   * @returns {boolean}
   */
  public isOrganizationQuotaReached(currentOrganizationCount: number): boolean {
    return this._quota.isOrganizationQuotaReached(currentOrganizationCount);
  }

  // ============================================================================
  // 验证方法
  // ============================================================================

  /**
   * 验证配置数据
   *
   * @private
   */
  protected override validate(): void {
    // 配额由值对象保证有效性
    // enabledFeatures 可以为空数组
    // customSettings 可以为空对象
  }

  /**
   * 转换为纯对象
   *
   * @returns {object} 配置数据对象
   */
  public toObject(): object {
    return {
      id: this.id.toString(),
      quota: this._quota.toJSON(),
      enabledFeatures: [...this._enabledFeatures],
      customSettings: { ...this._customSettings },
      tenantId: this.tenantId.toString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}

