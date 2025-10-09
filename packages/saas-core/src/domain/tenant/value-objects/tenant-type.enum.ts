/**
 * 租户类型枚举
 *
 * @description 定义租户的订阅类型
 *
 * ## 业务规则
 *
 * ### 租户类型及配额
 * - FREE: 免费版（5用户/100MB/1组织）
 * - BASIC: 基础版（50用户/1GB/2组织）
 * - PROFESSIONAL: 专业版（500用户/10GB/10组织）
 * - ENTERPRISE: 企业版（5000用户/100GB/100组织）
 * - CUSTOM: 定制版（无限制，按需配置）
 *
 * ### 升级路径
 * - FREE → BASIC → PROFESSIONAL → ENTERPRISE → CUSTOM
 * - 支持跨级升级
 * - 降级需要验证现有数据不超出新配额
 *
 * @example
 * ```typescript
 * const type = TenantType.FREE;
 * if (type === TenantType.ENTERPRISE) {
 *   // 企业版逻辑
 * }
 * ```
 *
 * @enum {string}
 * @since 1.0.0
 */
export enum TenantType {
  /** 免费版 - 5用户/100MB/1组织 */
  FREE = 'FREE',

  /** 基础版 - 50用户/1GB/2组织 */
  BASIC = 'BASIC',

  /** 专业版 - 500用户/10GB/10组织 */
  PROFESSIONAL = 'PROFESSIONAL',

  /** 企业版 - 5000用户/100GB/100组织 */
  ENTERPRISE = 'ENTERPRISE',

  /** 定制版 - 无限制，按需配置 */
  CUSTOM = 'CUSTOM',
}

/**
 * 租户类型辅助工具
 *
 * @class TenantTypeUtils
 */
export class TenantTypeUtils {
  /**
   * 获取所有租户类型
   *
   * @static
   * @returns {TenantType[]}
   */
  public static getAllTypes(): TenantType[] {
    return Object.values(TenantType);
  }

  /**
   * 检查是否为有效的租户类型
   *
   * @static
   * @param {string} type - 待验证的类型
   * @returns {boolean}
   */
  public static isValidType(type: string): type is TenantType {
    return Object.values(TenantType).includes(type as TenantType);
  }

  /**
   * 从字符串转换为租户类型
   *
   * @static
   * @param {string} type - 类型字符串
   * @returns {TenantType}
   * @throws {Error} 当类型无效时抛出错误
   */
  public static fromString(type: string): TenantType {
    if (!this.isValidType(type)) {
      throw new Error(`无效的租户类型: ${type}`);
    }
    return type as TenantType;
  }

  /**
   * 获取租户类型的显示名称
   *
   * @static
   * @param {TenantType} type - 租户类型
   * @returns {string}
   */
  public static getDisplayName(type: TenantType): string {
    const names: Record<TenantType, string> = {
      [TenantType.FREE]: '免费版',
      [TenantType.BASIC]: '基础版',
      [TenantType.PROFESSIONAL]: '专业版',
      [TenantType.ENTERPRISE]: '企业版',
      [TenantType.CUSTOM]: '定制版',
    };
    return names[type];
  }

  /**
   * 检查是否可以升级到目标类型
   *
   * @static
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @returns {boolean}
   */
  public static canUpgradeTo(currentType: TenantType, targetType: TenantType): boolean {
    const hierarchy = [
      TenantType.FREE,
      TenantType.BASIC,
      TenantType.PROFESSIONAL,
      TenantType.ENTERPRISE,
      TenantType.CUSTOM,
    ];

    const currentIndex = hierarchy.indexOf(currentType);
    const targetIndex = hierarchy.indexOf(targetType);

    return targetIndex > currentIndex;
  }

  /**
   * 检查是否可以降级到目标类型
   *
   * @static
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} targetType - 目标类型
   * @returns {boolean}
   */
  public static canDowngradeTo(currentType: TenantType, targetType: TenantType): boolean {
    const hierarchy = [
      TenantType.FREE,
      TenantType.BASIC,
      TenantType.PROFESSIONAL,
      TenantType.ENTERPRISE,
      TenantType.CUSTOM,
    ];

    const currentIndex = hierarchy.indexOf(currentType);
    const targetIndex = hierarchy.indexOf(targetType);

    return targetIndex < currentIndex;
  }
}

