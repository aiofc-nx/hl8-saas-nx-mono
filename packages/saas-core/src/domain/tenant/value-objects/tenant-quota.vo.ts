/**
 * 租户配额值对象
 *
 * @description 封装租户资源配额的不可变对象
 *
 * ## 业务规则
 *
 * ### 配额类型
 * - maxUsers: 最大用户数
 * - maxStorageMB: 最大存储空间（MB）
 * - maxOrganizations: 最大组织数
 * - maxDepartmentLevels: 最大部门层级
 * - maxApiCallsPerDay: 每日API调用限制
 *
 * ### 不可变性
 * - 配额对象创建后不可修改
 * - 任何变更都创建新对象
 *
 * ## 使用场景
 *
 * 租户配额用于：
 * - 资源使用限制
 * - 租户类型配置
 * - 配额检查和警告
 *
 * @example
 * ```typescript
 * // 根据租户类型创建配额
 * const quota = TenantQuota.fromTenantType('FREE');
 *
 * // 创建自定义配额
 * const customQuota = TenantQuota.create({
 *   maxUsers: 100,
 *   maxStorageMB: 5120,
 *   maxOrganizations: 5,
 *   maxDepartmentLevels: 6,
 *   maxApiCallsPerDay: 50000,
 * });
 *
 * // 检查是否达到配额
 * if (quota.isUserQuotaReached(currentUserCount)) {
 *   // 已达到用户配额
 * }
 * ```
 *
 * @class TenantQuota
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { TENANT_TYPE_QUOTAS } from '../../../constants/tenant.constants';

/**
 * 租户配额属性
 *
 * @interface ITenantQuotaProps
 */
export interface ITenantQuotaProps {
  /** 最大用户数 */
  maxUsers: number;
  /** 最大存储空间（MB） */
  maxStorageMB: number;
  /** 最大组织数 */
  maxOrganizations: number;
  /** 最大部门层级 */
  maxDepartmentLevels: number;
  /** 每日API调用限制 */
  maxApiCallsPerDay: number;
}

/**
 * 租户类型枚举
 */
export type TenantType = 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

/**
 * 租户配额值对象
 *
 * @class TenantQuota
 * @extends {BaseValueObject}
 */
export class TenantQuota extends BaseValueObject {
  /**
   * 获取最大用户数
   *
   * @readonly
   * @type {number}
   */
  get maxUsers(): number {
    return this._maxUsers;
  }

  /**
   * 获取最大存储空间（MB）
   *
   * @readonly
   * @type {number}
   */
  get maxStorageMB(): number {
    return this._maxStorageMB;
  }

  /**
   * 获取最大组织数
   *
   * @readonly
   * @type {number}
   */
  get maxOrganizations(): number {
    return this._maxOrganizations;
  }

  /**
   * 获取最大部门层级
   *
   * @readonly
   * @type {number}
   */
  get maxDepartmentLevels(): number {
    return this._maxDepartmentLevels;
  }

  /**
   * 获取每日API调用限制
   *
   * @readonly
   * @type {number}
   */
  get maxApiCallsPerDay(): number {
    return this._maxApiCallsPerDay;
  }

  /**
   * 私有构造函数
   *
   * @private
   * @param {number} maxUsers
   * @param {number} maxStorageMB
   * @param {number} maxOrganizations
   * @param {number} maxDepartmentLevels
   * @param {number} maxApiCallsPerDay
   */
  private constructor(
    private readonly _maxUsers: number,
    private readonly _maxStorageMB: number,
    private readonly _maxOrganizations: number,
    private readonly _maxDepartmentLevels: number,
    private readonly _maxApiCallsPerDay: number,
  ) {
    super();
  }

  /**
   * 创建租户配额值对象
   *
   * @description 验证并创建租户配额值对象
   *
   * ## 验证规则
   * - 所有配额值必须为正数
   * - 配额值必须合理（不超过最大安全整数）
   *
   * @static
   * @param {ITenantQuotaProps} props - 租户配额属性
   * @returns {TenantQuota} 租户配额值对象
   * @throws {Error} 当配额不符合验证规则时抛出错误
   */
  public static create(props: ITenantQuotaProps): TenantQuota {
    this.validate(props);
    return new TenantQuota(
      props.maxUsers,
      props.maxStorageMB,
      props.maxOrganizations,
      props.maxDepartmentLevels,
      props.maxApiCallsPerDay,
    );
  }

  /**
   * 根据租户类型创建配额
   *
   * @description 根据预定义的租户类型创建相应的配额配置
   *
   * @static
   * @param {TenantType} tenantType - 租户类型
   * @returns {TenantQuota} 租户配额值对象
   * @throws {Error} 当租户类型无效时抛出错误
   *
   * @example
   * ```typescript
   * const freeQuota = TenantQuota.fromTenantType('FREE');
   * const enterpriseQuota = TenantQuota.fromTenantType('ENTERPRISE');
   * ```
   */
  public static fromTenantType(tenantType: TenantType): TenantQuota {
    const quotaConfig = TENANT_TYPE_QUOTAS[tenantType];
    if (!quotaConfig) {
      throw new Error(`无效的租户类型: ${tenantType}`);
    }

    return new TenantQuota({
      maxUsers: quotaConfig.maxUsers,
      maxStorageMB: quotaConfig.maxStorageMB,
      maxOrganizations: quotaConfig.maxOrganizations,
      maxDepartmentLevels: quotaConfig.maxDepartmentLevels,
      maxApiCallsPerDay: quotaConfig.maxApiCallsPerDay,
    });
  }

  /**
   * 验证配额属性
   *
   * @private
   * @static
   * @param {ITenantQuotaProps} props - 待验证的配额属性
   * @throws {Error} 当配额不符合验证规则时抛出错误
   */
  private static validate(props: ITenantQuotaProps): void {
    // 验证所有配额值为正数
    if (props.maxUsers <= 0) {
      throw new Error('最大用户数必须大于0');
    }
    if (props.maxStorageMB <= 0) {
      throw new Error('最大存储空间必须大于0');
    }
    if (props.maxOrganizations <= 0) {
      throw new Error('最大组织数必须大于0');
    }
    if (props.maxDepartmentLevels <= 0) {
      throw new Error('最大部门层级必须大于0');
    }
    if (props.maxApiCallsPerDay <= 0) {
      throw new Error('每日API调用限制必须大于0');
    }

    // 验证配额值在合理范围内
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;
    if (
      props.maxUsers > maxSafeInteger ||
      props.maxStorageMB > maxSafeInteger ||
      props.maxOrganizations > maxSafeInteger ||
      props.maxDepartmentLevels > maxSafeInteger ||
      props.maxApiCallsPerDay > maxSafeInteger
    ) {
      throw new Error('配额值超出合理范围');
    }
  }

  /**
   * 检查用户配额是否已达到
   *
   * @param {number} currentUserCount - 当前用户数
   * @returns {boolean} 是否已达到配额
   */
  public isUserQuotaReached(currentUserCount: number): boolean {
    return currentUserCount >= this.maxUsers;
  }

  /**
   * 检查存储配额是否已达到
   *
   * @param {number} currentStorageMB - 当前存储空间（MB）
   * @returns {boolean} 是否已达到配额
   */
  public isStorageQuotaReached(currentStorageMB: number): boolean {
    return currentStorageMB >= this.maxStorageMB;
  }

  /**
   * 检查组织配额是否已达到
   *
   * @param {number} currentOrganizationCount - 当前组织数
   * @returns {boolean} 是否已达到配额
   */
  public isOrganizationQuotaReached(currentOrganizationCount: number): boolean {
    return currentOrganizationCount >= this.maxOrganizations;
  }

  /**
   * 计算用户配额使用率
   *
   * @param {number} currentUserCount - 当前用户数
   * @returns {number} 使用率（0-1之间）
   */
  public getUserQuotaUsage(currentUserCount: number): number {
    return Math.min(currentUserCount / this.maxUsers, 1);
  }

  /**
   * 计算存储配额使用率
   *
   * @param {number} currentStorageMB - 当前存储空间（MB）
   * @returns {number} 使用率（0-1之间）
   */
  public getStorageQuotaUsage(currentStorageMB: number): number {
    return Math.min(currentStorageMB / this.maxStorageMB, 1);
  }

  /**
   * 计算组织配额使用率
   *
   * @param {number} currentOrganizationCount - 当前组织数
   * @returns {number} 使用率（0-1之间）
   */
  public getOrganizationQuotaUsage(currentOrganizationCount: number): number {
    return Math.min(currentOrganizationCount / this.maxOrganizations, 1);
  }

  /**
   * 转换为纯对象
   *
   * @returns {ITenantQuotaProps} 配额属性对象
   */
  public toObject(): ITenantQuotaProps {
    return {
      maxUsers: this.maxUsers,
      maxStorageMB: this.maxStorageMB,
      maxOrganizations: this.maxOrganizations,
      maxDepartmentLevels: this.maxDepartmentLevels,
      maxApiCallsPerDay: this.maxApiCallsPerDay,
    };
  }

  /**
   * 转换为JSON
   *
   * @returns {ITenantQuotaProps} 配额属性对象
   */
  public toJSON(): ITenantQuotaProps {
    return this.toObject();
  }

  protected arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof TenantQuota)) {
      return false;
    }
    return (
      this._maxUsers === other._maxUsers &&
      this._maxStorageMB === other._maxStorageMB &&
      this._maxOrganizations === other._maxOrganizations &&
      this._maxDepartmentLevels === other._maxDepartmentLevels &&
      this._maxApiCallsPerDay === other._maxApiCallsPerDay
    );
  }
}

