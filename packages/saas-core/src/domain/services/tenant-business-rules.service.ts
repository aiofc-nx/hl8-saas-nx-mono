/**
 * 租户业务规则服务
 *
 * @description 纯粹的领域服务，只包含租户相关的业务规则验证
 * 继承自 hybrid-archi 的 BaseDomainService，遵循统一的架构模式
 *
 * ## 业务规则
 *
 * ### 租户代码规则
 * - 租户代码必须唯一
 * - 租户代码格式验证
 * - 租户代码长度限制
 *
 * ### 租户类型规则
 * - 租户类型数量限制
 * - 租户类型转换规则
 * - 租户类型权限规则
 *
 * ### 资源限制规则
 * - 用户数量限制
 * - 组织数量限制
 * - 存储空间限制
 * - API调用次数限制
 *
 * @example
 * ```typescript
 * const tenantRules = new TenantBusinessRulesService();
 * 
 * // 验证租户代码格式
 * const isValidCode = tenantRules.validateTenantCodeFormat('TENANT_001');
 * 
 * // 验证资源使用是否超出限制
 * const withinLimit = tenantRules.validateResourceUsage(
 *   { userCount: 10, organizationCount: 5, storageUsed: 100, apiCallsToday: 1000 },
 *   { maxUsers: 100, maxOrganizations: 50, maxStorage: 1000, maxApiCalls: 10000 }
 * );
 * ```
 *
 * @since 1.0.0
 */

import { IDomainService } from '@hl8/hybrid-archi';
import { TenantType } from '@hl8/hybrid-archi';

/**
 * 租户资源使用情况
 *
 * @description 定义租户当前的资源使用情况
 *
 * @since 1.0.0
 */
export interface TenantResourceUsage {
  /** 用户数量 */
  userCount: number;
  /** 组织数量 */
  organizationCount: number;
  /** 存储使用量（MB） */
  storageUsed: number;
  /** 今日API调用次数 */
  apiCallsToday: number;
}

/**
 * 租户资源限制
 *
 * @description 定义租户的资源限制
 *
 * @since 1.0.0
 */
export interface TenantResourceLimits {
  /** 最大用户数 */
  maxUsers: number;
  /** 最大组织数 */
  maxOrganizations: number;
  /** 最大存储空间（MB） */
  maxStorage: number;
  /** 最大API调用次数 */
  maxApiCalls: number;
}

/**
 * 租户业务规则服务
 *
 * @description 纯粹的领域服务，只包含业务规则验证逻辑
 * 继承自 hybrid-archi 的 BaseDomainService，遵循统一的架构模式
 *
 * @since 1.0.0
 */
export class TenantBusinessRulesService implements IDomainService {
  /**
   * 构造函数
   *
   * @description 创建租户业务规则服务实例
   * 继承自 BaseDomainService，提供统一的服务管理能力
   *
   * @since 1.0.0
   */
  constructor() {
    // IDomainService 是接口，不需要调用 super()
  }
  /**
   * 验证租户代码格式
   *
   * @description 验证租户代码是否符合格式要求
   * 格式规则：只能包含字母、数字、下划线和连字符，长度3-50字符
   *
   * @param code - 租户代码
   * @returns 是否格式正确
   *
   * @example
   * ```typescript
   * const isValid = tenantRules.validateTenantCodeFormat('TENANT_001'); // true
   * const isInvalid = tenantRules.validateTenantCodeFormat('123'); // false
   * ```
   *
   * @since 1.0.0
   */
  public validateTenantCodeFormat(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // 长度检查
    if (code.length < 3 || code.length > 50) {
      return false;
    }

    // 格式检查：只能包含字母、数字、下划线和连字符
    const codeRegex = /^[a-zA-Z0-9_-]+$/;
    return codeRegex.test(code);
  }

  /**
   * 验证租户代码是否已存在
   *
   * @description 检查租户代码是否已被使用
   * 注意：这个方法需要外部提供现有代码列表
   *
   * @param code - 租户代码
   * @param existingCodes - 已存在的租户代码列表
   * @returns 是否唯一
   *
   * @example
   * ```typescript
   * const existingCodes = ['TENANT_001', 'TENANT_002'];
   * const isUnique = tenantRules.validateTenantCodeUniqueness('TENANT_003', existingCodes); // true
   * ```
   *
   * @since 1.0.0
   */
  public validateTenantCodeUniqueness(code: string, existingCodes: string[]): boolean {
    if (!this.validateTenantCodeFormat(code)) {
      return false;
    }

    return !existingCodes.includes(code);
  }

  /**
   * 验证租户类型数量限制
   *
   * @description 检查某种类型租户的数量是否超出限制
   *
   * @param currentCount - 当前数量
   * @param maxCount - 最大数量限制
   * @returns 是否在限制范围内
   *
   * @example
   * ```typescript
   * const withinLimit = tenantRules.validateTenantTypeLimit(5, 10); // true
   * const exceedsLimit = tenantRules.validateTenantTypeLimit(15, 10); // false
   * ```
   *
   * @since 1.0.0
   */
  public validateTenantTypeLimit(currentCount: number, maxCount: number): boolean {
    if (maxCount === -1) {
      return true; // 无限制
    }

    return currentCount < maxCount;
  }

  /**
   * 验证资源使用是否超出限制
   *
   * @description 检查租户的资源使用情况是否超出限制
   *
   * @param usage - 当前资源使用情况
   * @param limits - 资源限制
   * @returns 是否在限制范围内
   *
   * @example
   * ```typescript
   * const usage = { userCount: 10, organizationCount: 5, storageUsed: 100, apiCallsToday: 1000 };
   * const limits = { maxUsers: 100, maxOrganizations: 50, maxStorage: 1000, maxApiCalls: 10000 };
   * const withinLimit = tenantRules.validateResourceUsage(usage, limits); // true
   * ```
   *
   * @since 1.0.0
   */
  public validateResourceUsage(usage: TenantResourceUsage, limits: TenantResourceLimits): boolean {
    // 检查用户数量
    if (!this.validateTenantTypeLimit(usage.userCount, limits.maxUsers)) {
      return false;
    }

    // 检查组织数量
    if (!this.validateTenantTypeLimit(usage.organizationCount, limits.maxOrganizations)) {
      return false;
    }

    // 检查存储使用量
    if (limits.maxStorage !== -1 && usage.storageUsed > limits.maxStorage) {
      return false;
    }

    // 检查API调用次数
    if (limits.maxApiCalls !== -1 && usage.apiCallsToday > limits.maxApiCalls) {
      return false;
    }

    return true;
  }

  /**
   * 计算资源使用百分比
   *
   * @description 计算各项资源的使用百分比
   *
   * @param usage - 当前资源使用情况
   * @param limits - 资源限制
   * @returns 各项资源使用百分比
   *
   * @example
   * ```typescript
   * const usage = { userCount: 50, organizationCount: 10, storageUsed: 500, apiCallsToday: 5000 };
   * const limits = { maxUsers: 100, maxOrganizations: 50, maxStorage: 1000, maxApiCalls: 10000 };
   * const percentages = tenantRules.calculateResourceUsagePercentage(usage, limits);
   * // { userPercentage: 50, orgPercentage: 20, storagePercentage: 50, apiPercentage: 50 }
   * ```
   *
   * @since 1.0.0
   */
  public calculateResourceUsagePercentage(
    usage: TenantResourceUsage,
    limits: TenantResourceLimits
  ): { userPercentage: number; orgPercentage: number; storagePercentage: number; apiPercentage: number } {
    const calculatePercentage = (used: number, limit: number): number => {
      if (limit === -1) return 0; // 无限制
      return Math.round((used / limit) * 100);
    };

    return {
      userPercentage: calculatePercentage(usage.userCount, limits.maxUsers),
      orgPercentage: calculatePercentage(usage.organizationCount, limits.maxOrganizations),
      storagePercentage: calculatePercentage(usage.storageUsed, limits.maxStorage),
      apiPercentage: calculatePercentage(usage.apiCallsToday, limits.maxApiCalls)
    };
  }

  /**
   * 验证租户是否可以创建新用户
   *
   * @description 检查租户是否还有用户配额
   *
   * @param currentUserCount - 当前用户数量
   * @param maxUsers - 最大用户数限制
   * @returns 是否可以创建新用户
   *
   * @example
   * ```typescript
   * const canCreate = tenantRules.canCreateUser(50, 100); // true
   * const cannotCreate = tenantRules.canCreateUser(100, 100); // false
   * ```
   *
   * @since 1.0.0
   */
  public canCreateUser(currentUserCount: number, maxUsers: number): boolean {
    return this.validateTenantTypeLimit(currentUserCount, maxUsers);
  }

  /**
   * 验证租户是否可以创建新组织
   *
   * @description 检查租户是否还有组织配额
   *
   * @param currentOrgCount - 当前组织数量
   * @param maxOrganizations - 最大组织数限制
   * @returns 是否可以创建新组织
   *
   * @example
   * ```typescript
   * const canCreate = tenantRules.canCreateOrganization(10, 50); // true
   * const cannotCreate = tenantRules.canCreateOrganization(50, 50); // false
   * ```
   *
   * @since 1.0.0
   */
  public canCreateOrganization(currentOrgCount: number, maxOrganizations: number): boolean {
    return this.validateTenantTypeLimit(currentOrgCount, maxOrganizations);
  }

  /**
   * 验证租户是否可以执行API调用
   *
   * @description 检查租户是否还有API调用配额
   *
   * @param currentApiCalls - 当前API调用次数
   * @param maxApiCalls - 最大API调用次数限制
   * @returns 是否可以执行API调用
   *
   * @example
   * ```typescript
   * const canCall = tenantRules.canMakeApiCall(5000, 10000); // true
   * const cannotCall = tenantRules.canMakeApiCall(10000, 10000); // false
   * ```
   *
   * @since 1.0.0
   */
  public canMakeApiCall(currentApiCalls: number, maxApiCalls: number): boolean {
    if (maxApiCalls === -1) return true; // 无限制
    return currentApiCalls < maxApiCalls;
  }

  /**
   * 验证租户类型转换
   *
   * @description 检查租户类型是否可以转换
   *
   * @param fromType - 原类型
   * @param toType - 目标类型
   * @returns 是否可以转换
   *
   * @example
   * ```typescript
   * const canUpgrade = tenantRules.canChangeTenantType(
   *   TenantType.PERSONAL,
   *   TenantType.ENTERPRISE
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public canChangeTenantType(fromType: TenantType, toType: TenantType): boolean {
    // 相同类型不需要转换
    if (fromType === toType) {
      return true;
    }

    // 定义类型转换规则
    const allowedTransitions: Record<TenantType, TenantType[]> = {
      [TenantType.FREE]: [TenantType.BASIC, TenantType.PROFESSIONAL, TenantType.ENTERPRISE],
      [TenantType.BASIC]: [TenantType.PROFESSIONAL, TenantType.ENTERPRISE],
      [TenantType.PROFESSIONAL]: [TenantType.ENTERPRISE],
      [TenantType.ENTERPRISE]: [], // 企业版不能降级
      [TenantType.CUSTOM]: [], // 定制版转换规则由合同约定
      [TenantType.PERSONAL]: [TenantType.TEAM, TenantType.ENTERPRISE],
      [TenantType.TEAM]: [TenantType.ENTERPRISE],
      [TenantType.COMMUNITY]: [TenantType.ENTERPRISE]
    };

    const allowedTypes = allowedTransitions[fromType] || [];
    return allowedTypes.includes(toType);
  }

  /**
   * 获取租户类型的功能权限
   *
   * @description 根据租户类型返回其功能权限列表
   *
   * @param tenantType - 租户类型
   * @returns 功能权限列表
   *
   * @example
   * ```typescript
   * const features = tenantRules.getTenantTypeFeatures(TenantType.ENTERPRISE);
   * // ['unlimited_users', 'unlimited_organizations', 'advanced_analytics', 'custom_branding']
   * ```
   *
   * @since 1.0.0
   */
  public getTenantTypeFeatures(tenantType: TenantType): string[] {
    const typeFeatures: Record<TenantType, string[]> = {
      [TenantType.FREE]: [
        'basic_access',
        'limited_users',
        'basic_organizations',
        'basic_departments'
      ],
      [TenantType.BASIC]: [
        'basic_access',
        'standard_users',
        'standard_organizations',
        'standard_departments',
        'basic_analytics',
        'email_notifications'
      ],
      [TenantType.PROFESSIONAL]: [
        'advanced_access',
        'advanced_users',
        'advanced_organizations',
        'advanced_departments',
        'advanced_analytics',
        'custom_reports',
        'api_access'
      ],
      [TenantType.ENTERPRISE]: [
        'unlimited_users',
        'unlimited_organizations',
        'advanced_analytics',
        'custom_branding',
        'sso_integration',
        'api_access',
        'priority_support'
      ],
      [TenantType.CUSTOM]: [
        'custom_features' // 定制版功能由合同定义
      ],
      [TenantType.PERSONAL]: [
        'basic_access',
        'profile_management',
        'limited_storage'
      ],
      [TenantType.TEAM]: [
        'team_collaboration',
        'basic_analytics',
        'team_management',
        'limited_organizations'
      ],
      [TenantType.COMMUNITY]: [
        'community_features',
        'public_profiles',
        'community_management',
        'limited_analytics'
      ]
    };

    return typeFeatures[tenantType] || [];
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'TenantBusinessRulesService';
  }
}
