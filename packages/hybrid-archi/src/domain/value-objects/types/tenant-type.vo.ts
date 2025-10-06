/**
 * 租户类型枚举
 *
 * @description 定义租户的不同类型和套餐
 * 每种类型对应不同的功能权限和资源限制
 *
 * ## 业务规则
 *
 * ### 租户类型定义
 * - FREE: 免费版，基础功能，有限资源
 * - BASIC: 基础版，标准功能，中等资源
 * - PROFESSIONAL: 专业版，高级功能，丰富资源
 * - ENTERPRISE: 企业版，完整功能，无限制资源
 * - CUSTOM: 定制版，根据需求定制功能和资源
 *
 * ### 升级规则
 * - 免费版可以升级到任何付费版本
 * - 基础版可以升级到专业版和企业版
 * - 专业版可以升级到企业版
 * - 企业版是最高版本，不可升级
 * - 定制版根据合同约定确定升级规则
 *
 * @example
 * ```typescript
 * const type = TenantType.FREE;
 * const canUpgrade = TenantTypeUtils.canUpgradeTo(type, TenantType.BASIC); // true
 * const features = TenantTypeUtils.getFeatures(type);
 * ```
 *
 * @since 1.0.0
 */
export enum TenantType {
  /**
   * 免费版
   * 
   * @description 基础功能版本
   * 提供核心功能，资源有限，适合个人用户试用
   */
  FREE = 'FREE',

  /**
   * 基础版
   * 
   * @description 标准功能版本
   * 提供标准功能集，适合小型团队使用
   */
  BASIC = 'BASIC',

  /**
   * 专业版
   * 
   * @description 高级功能版本
   * 提供高级功能集，适合中型企业使用
   */
  PROFESSIONAL = 'PROFESSIONAL',

  /**
   * 企业版
   * 
   * @description 完整功能版本
   * 提供所有功能，无资源限制，适合大型企业使用
   */
  ENTERPRISE = 'ENTERPRISE',

  /**
   * 定制版
   * 
   * @description 定制化版本
   * 根据客户需求定制功能和资源，适合特殊需求客户
   */
  CUSTOM = 'CUSTOM',

  /**
   * 个人版
   * 
   * @description 个人用户版本
   * 适合个人用户使用的基础版本
   */
  PERSONAL = 'PERSONAL',

  /**
   * 团队版
   * 
   * @description 小团队版本
   * 适合小团队协作的版本
   */
  TEAM = 'TEAM',

  /**
   * 社群版
   * 
   * @description 社群组织版本
   * 适合社群、协会等组织使用的版本
   */
  COMMUNITY = 'COMMUNITY'
}

/**
 * 租户类型工具类
 *
 * @description 提供租户类型相关的工具方法
 * 包括升级验证、功能获取、资源限制等功能
 *
 * @since 1.0.0
 */
export class TenantTypeUtils {
  /**
   * 升级矩阵
   * 
   * @description 定义允许的升级路径
   * 键为当前类型，值为可升级到的类型数组
   */
  private static readonly UPGRADE_MATRIX: Record<TenantType, TenantType[]> = {
    [TenantType.FREE]: [TenantType.BASIC, TenantType.PROFESSIONAL, TenantType.ENTERPRISE],
    [TenantType.BASIC]: [TenantType.PROFESSIONAL, TenantType.ENTERPRISE],
    [TenantType.PROFESSIONAL]: [TenantType.ENTERPRISE],
    [TenantType.ENTERPRISE]: [], // 最高版本，不可升级
    [TenantType.CUSTOM]: [], // 定制版升级规则由合同约定
    [TenantType.PERSONAL]: [TenantType.TEAM, TenantType.ENTERPRISE],
    [TenantType.TEAM]: [TenantType.ENTERPRISE],
    [TenantType.COMMUNITY]: [TenantType.ENTERPRISE]
  };

  /**
   * 功能权限定义
   * 
   * @description 定义每种类型的功能权限
   */
  private static readonly FEATURES: Record<TenantType, string[]> = {
    [TenantType.FREE]: [
      'basic_user_management',
      'basic_organization_management',
      'basic_department_management',
      'basic_reporting'
    ],
    [TenantType.BASIC]: [
      'basic_user_management',
      'basic_organization_management',
      'basic_department_management',
      'basic_reporting',
      'advanced_user_management',
      'basic_analytics',
      'email_notifications'
    ],
    [TenantType.PROFESSIONAL]: [
      'basic_user_management',
      'basic_organization_management',
      'basic_department_management',
      'basic_reporting',
      'advanced_user_management',
      'basic_analytics',
      'email_notifications',
      'advanced_organization_management',
      'advanced_analytics',
      'api_access',
      'custom_branding'
    ],
    [TenantType.ENTERPRISE]: [
      'all_features' // 企业版包含所有功能
    ],
    [TenantType.CUSTOM]: [
      'custom_features' // 定制版功能由合同定义
    ],
    [TenantType.PERSONAL]: [
      'basic_user_management',
      'personal_profile',
      'basic_notifications'
    ],
    [TenantType.TEAM]: [
      'basic_user_management',
      'team_management',
      'basic_organization_management',
      'team_collaboration',
      'basic_analytics'
    ],
    [TenantType.COMMUNITY]: [
      'basic_user_management',
      'community_management',
      'basic_organization_management',
      'community_features',
      'basic_analytics',
      'public_profiles'
    ]
  };

  /**
   * 检查是否可以升级到指定类型
   *
   * @description 验证从当前类型升级到目标类型是否被允许
   *
   * @param fromType - 当前类型
   * @param toType - 目标类型
   * @returns 是否允许升级
   *
   * @example
   * ```typescript
   * const canUpgrade = TenantTypeUtils.canUpgradeTo(
   *   TenantType.FREE, 
   *   TenantType.BASIC
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static canUpgradeTo(fromType: TenantType, toType: TenantType): boolean {
    const allowedUpgrades = this.UPGRADE_MATRIX[fromType];
    return allowedUpgrades.includes(toType);
  }

  /**
   * 获取租户类型的功能列表
   *
   * @description 返回指定类型的功能权限列表
   *
   * @param type - 租户类型
   * @returns 功能权限列表
   *
   * @example
   * ```typescript
   * const features = TenantTypeUtils.getFeatures(TenantType.BASIC);
   * // ['basic_user_management', 'basic_organization_management', ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getFeatures(type: TenantType): string[] {
    return [...this.FEATURES[type]];
  }

  /**
   * 检查租户类型是否支持指定功能
   *
   * @description 验证指定类型是否包含某个功能
   *
   * @param type - 租户类型
   * @param feature - 功能名称
   * @returns 是否支持该功能
   *
   * @example
   * ```typescript
   * const hasFeature = TenantTypeUtils.hasFeature(
   *   TenantType.BASIC, 
   *   'basic_user_management'
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static hasFeature(type: TenantType, feature: string): boolean {
    const features = this.getFeatures(type);
    return features.includes(feature) || features.includes('all_features');
  }

  /**
   * 获取租户类型的中文描述
   *
   * @description 返回类型的中文描述，用于界面显示
   *
   * @param type - 租户类型
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = TenantTypeUtils.getDescription(TenantType.BASIC);
   * // "基础版"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(type: TenantType): string {
    const descriptions: Record<TenantType, string> = {
      [TenantType.FREE]: '免费版',
      [TenantType.BASIC]: '基础版',
      [TenantType.PROFESSIONAL]: '专业版',
      [TenantType.ENTERPRISE]: '企业版',
      [TenantType.CUSTOM]: '定制版',
      [TenantType.PERSONAL]: '个人版',
      [TenantType.TEAM]: '团队版',
      [TenantType.COMMUNITY]: '社群版'
    };

    return descriptions[type];
  }

  /**
   * 获取所有可升级的类型
   *
   * @description 返回从指定类型可以升级到的所有类型
   *
   * @param type - 当前类型
   * @returns 可升级的类型数组
   *
   * @example
   * ```typescript
   * const upgrades = TenantTypeUtils.getAvailableUpgrades(TenantType.FREE);
   * // [TenantType.BASIC, TenantType.PROFESSIONAL, TenantType.ENTERPRISE]
   * ```
   *
   * @since 1.0.0
   */
  public static getAvailableUpgrades(type: TenantType): TenantType[] {
    return [...this.UPGRADE_MATRIX[type]];
  }

  /**
   * 检查是否为最高版本
   *
   * @description 判断类型是否为最高版本（不可再升级）
   *
   * @param type - 租户类型
   * @returns 是否为最高版本
   *
   * @example
   * ```typescript
   * const isHighest = TenantTypeUtils.isHighest(TenantType.ENTERPRISE);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isHighest(type: TenantType): boolean {
    return this.UPGRADE_MATRIX[type].length === 0;
  }
}
