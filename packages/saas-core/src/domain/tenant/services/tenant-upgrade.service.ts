/**
 * 租户升级领域服务
 *
 * @description 处理租户升级和降级的复杂业务逻辑
 *
 * ## 业务规则
 *
 * ### 升级规则
 * - 验证升级路径是否允许
 * - FREE → BASIC → PROFESSIONAL → ENTERPRISE → CUSTOM
 * - 支持跨级升级
 * - 自动更新配额和功能
 *
 * ### 降级规则
 * - 验证降级路径是否允许
 * - 验证现有数据不超出新配额
 * - 提供数据清理建议
 * - 保留核心功能
 *
 * ### 升级策略
 * - 立即升级：配额和功能立即生效
 * - 平滑升级：旧配额有缓冲期
 * - 试用升级：先试用新功能
 *
 * @example
 * ```typescript
 * const service = new TenantUpgradeService();
 *
 * // 验证升级路径
 * const canUpgrade = service.canUpgrade(TenantType.FREE, TenantType.BASIC);
 *
 * // 获取升级计划
 * const plan = service.planUpgrade(currentType, targetType, currentUsage);
 * ```
 *
 * @class TenantUpgradeService
 * @since 1.0.0
 */

import { TenantType } from '../value-objects/tenant-type.enum';
import { TenantQuota } from '../value-objects/tenant-quota.vo';
import { TenantQuotaRule, IDowngradeValidation } from '../rules/tenant-quota.rule';
import {
  TENANT_UPGRADE_PATHS,
  TENANT_DOWNGRADE_PATHS,
} from '../../../constants/tenant.constants';

/**
 * 升级计划
 *
 * @interface IUpgradePlan
 */
export interface IUpgradePlan {
  /** 是否允许升级 */
  canUpgrade: boolean;
  /** 原类型 */
  fromType: TenantType;
  /** 目标类型 */
  toType: TenantType;
  /** 新配额 */
  newQuota: TenantQuota;
  /** 新增功能列表 */
  newFeatures: string[];
  /** 预估费用变化 */
  estimatedCostChange?: number;
}

/**
 * 降级计划
 *
 * @interface IDowngradePlan
 */
export interface IDowngradePlan {
  /** 是否允许降级 */
  canDowngrade: boolean;
  /** 原类型 */
  fromType: TenantType;
  /** 目标类型 */
  toType: TenantType;
  /** 新配额 */
  newQuota: TenantQuota;
  /** 将被移除的功能 */
  removedFeatures: string[];
  /** 降级验证结果 */
  validation: IDowngradeValidation;
}

/**
 * 租户升级领域服务
 *
 * @class TenantUpgradeService
 */
export class TenantUpgradeService {
  private readonly quotaRule: TenantQuotaRule;

  constructor() {
    this.quotaRule = new TenantQuotaRule();
  }

  /**
   * 检查是否可以升级
   *
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @returns {boolean} 是否可以升级
   */
  public canUpgrade(currentType: TenantType, targetType: TenantType): boolean {
    const allowedPaths = TENANT_UPGRADE_PATHS[currentType];
    return allowedPaths?.includes(targetType) || false;
  }

  /**
   * 检查是否可以降级
   *
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @returns {boolean} 是否可以降级
   */
  public canDowngrade(currentType: TenantType, targetType: TenantType): boolean {
    const allowedPaths = TENANT_DOWNGRADE_PATHS[currentType];
    return allowedPaths?.includes(targetType) || false;
  }

  /**
   * 规划升级
   *
   * @description 创建升级计划，包含配额变化和新功能
   *
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @returns {IUpgradePlan} 升级计划
   * @throws {Error} 当升级路径不允许时抛出错误
   */
  public planUpgrade(currentType: TenantType, targetType: TenantType): IUpgradePlan {
    if (!this.canUpgrade(currentType, targetType)) {
      throw new Error(`不支持从 ${currentType} 升级到 ${targetType}`);
    }

    const newQuota = TenantQuota.fromTenantType(targetType);
    const newFeatures = this.getNewFeatures(currentType, targetType);

    return {
      canUpgrade: true,
      fromType: currentType,
      toType: targetType,
      newQuota,
      newFeatures,
    };
  }

  /**
   * 规划降级
   *
   * @description 创建降级计划，包含验证结果和清理建议
   *
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @param {object} currentUsage - 当前使用情况
   * @returns {IDowngradePlan} 降级计划
   * @throws {Error} 当降级路径不允许时抛出错误
   */
  public planDowngrade(
    currentType: TenantType,
    targetType: TenantType,
    currentUsage: {
      userCount: number;
      storageMB: number;
      organizationCount: number;
    },
  ): IDowngradePlan {
    if (!this.canDowngrade(currentType, targetType)) {
      throw new Error(`不支持从 ${currentType} 降级到 ${targetType}`);
    }

    const currentQuota = TenantQuota.fromTenantType(currentType);
    const newQuota = TenantQuota.fromTenantType(targetType);
    
    const validation = this.quotaRule.validateDowngrade(
      currentQuota,
      newQuota,
      currentUsage,
    );

    const removedFeatures = this.getRemovedFeatures(currentType, targetType);

    return {
      canDowngrade: validation.canDowngrade,
      fromType: currentType,
      toType: targetType,
      newQuota,
      removedFeatures,
      validation,
    };
  }

  /**
   * 获取升级后新增的功能
   *
   * @private
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @returns {string[]} 新增功能列表
   */
  private getNewFeatures(currentType: TenantType, targetType: TenantType): string[] {
    const featureMap: Record<TenantType, string[]> = {
      FREE: ['basic_features'],
      BASIC: ['basic_features', 'advanced_auth'],
      PROFESSIONAL: [
        'basic_features',
        'advanced_auth',
        'advanced_reporting',
        'api_access',
      ],
      ENTERPRISE: [
        'basic_features',
        'advanced_auth',
        'advanced_reporting',
        'api_access',
        'sso',
        'audit_logs',
      ],
      CUSTOM: [
        'basic_features',
        'advanced_auth',
        'advanced_reporting',
        'api_access',
        'sso',
        'audit_logs',
        'custom_branding',
        'dedicated_support',
      ],
    };

    const currentFeatures = featureMap[currentType] || [];
    const targetFeatures = featureMap[targetType] || [];

    return targetFeatures.filter(f => !currentFeatures.includes(f));
  }

  /**
   * 获取降级后移除的功能
   *
   * @private
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @returns {string[]} 移除功能列表
   */
  private getRemovedFeatures(currentType: TenantType, targetType: TenantType): string[] {
    return this.getNewFeatures(targetType, currentType);
  }
}

