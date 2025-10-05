/**
 * 租户业务规则
 * 
 * @description 定义租户相关的业务规则和约束
 * 
 * @since 1.0.0
 */

import { TenantType, TenantStatus } from '../tenant/entities/tenant.entity';

/**
 * 租户业务规则常量
 * 
 * @description 定义租户相关的业务规则常量
 */
export class TenantBusinessRules {
  // 约束规则
  static readonly TENANT_CODE_MUST_BE_UNIQUE = "租户代码必须全局唯一";
  static readonly TENANT_NAME_MUST_NOT_BE_EMPTY = "租户名称不能为空";
  static readonly TENANT_CODE_FORMAT = "租户代码必须是3-20个字符，字母开头，只能包含字母、数字、连字符、下划线";
  
  // 状态转换规则
  static readonly STATUS_TRANSITION_PENDING_TO_ACTIVE = "租户只能从PENDING状态转换到ACTIVE状态";
  static readonly STATUS_TRANSITION_ACTIVE_TO_SUSPENDED = "租户只能从ACTIVE状态转换到SUSPENDED状态";
  static readonly STATUS_TRANSITION_ACTIVE_TO_DISABLED = "租户只能从ACTIVE状态转换到DISABLED状态";
  
  // 功能权限规则
  static readonly FREE_TENANT_FEATURES = "免费租户只能使用基础功能";
  static readonly BASIC_TENANT_FEATURES = "基础租户可以使用用户管理、组织、部门、基础分析功能";
  static readonly PROFESSIONAL_TENANT_FEATURES = "专业租户可以使用所有基础功能加高级分析和API访问";
  static readonly ENTERPRISE_TENANT_FEATURES = "企业租户可以使用所有功能";
  static readonly CUSTOM_TENANT_FEATURES = "自定义租户可以使用所有功能或自定义功能配置";
  
  // 资源限制规则
  static readonly FREE_TENANT_LIMITS = "免费租户：最多5个用户，1个组织，100MB存储，每天1000次API调用";
  static readonly BASIC_TENANT_LIMITS = "基础租户：最多50个用户，2个组织，1GB存储，每天10000次API调用";
  static readonly PROFESSIONAL_TENANT_LIMITS = "专业租户：最多500个用户，10个组织，10GB存储，每天100000次API调用";
  static readonly ENTERPRISE_TENANT_LIMITS = "企业租户：最多10000个用户，100个组织，100GB存储，每天1000000次API调用";
  static readonly CUSTOM_TENANT_LIMITS = "自定义租户：无限制或自定义限制";
}

/**
 * 租户规则验证器
 * 
 * @description 验证租户相关的业务规则
 */
export class TenantRuleValidator {
  /**
   * 验证租户状态转换
   * 
   * @param currentStatus 当前状态
   * @param newStatus 新状态
   * @returns true如果转换有效，否则false
   */
  public static validateStatusTransition(currentStatus: TenantStatus, newStatus: TenantStatus): boolean {
    const validTransitions: Record<TenantStatus, TenantStatus[]> = {
      [TenantStatus.CREATING]: [TenantStatus.PENDING, TenantStatus.DISABLED],
      [TenantStatus.PENDING]: [TenantStatus.ACTIVE, TenantStatus.DISABLED],
      [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.DISABLED],
      [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.DISABLED],
      [TenantStatus.DISABLED]: [TenantStatus.ACTIVE],
      [TenantStatus.DELETED]: []
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
  
  /**
   * 验证租户类型的功能权限
   * 
   * @param tenantType 租户类型
   * @param feature 功能名称
   * @returns true如果允许使用该功能，否则false
   */
  public static validateFeaturePermission(tenantType: TenantType, feature: string): boolean {
    const featureMap: Record<TenantType, string[]> = {
      [TenantType.FREE]: ['basic_user_management', 'basic_organization'],
      [TenantType.BASIC]: ['user_management', 'organization', 'department', 'basic_analytics'],
      [TenantType.PROFESSIONAL]: ['user_management', 'organization', 'department', 'analytics', 'api_access'],
      [TenantType.ENTERPRISE]: ['all_features'],
      [TenantType.CUSTOM]: ['all_features']
    };
    
    const allowedFeatures = featureMap[tenantType] || [];
    return allowedFeatures.includes(feature) || allowedFeatures.includes('all_features');
  }
  
  /**
   * 验证资源使用是否超出限制
   * 
   * @param tenantType 租户类型
   * @param resource 资源类型
   * @param currentUsage 当前使用量
   * @returns true如果超出限制，否则false
   */
  public static validateResourceLimit(tenantType: TenantType, resource: string, currentUsage: number): boolean {
    const limitsMap: Record<TenantType, Record<string, number>> = {
      [TenantType.FREE]: { maxUsers: 5, maxOrganizations: 1, maxStorage: 100, maxApiCalls: 1000 },
      [TenantType.BASIC]: { maxUsers: 50, maxOrganizations: 2, maxStorage: 1024, maxApiCalls: 10000 },
      [TenantType.PROFESSIONAL]: { maxUsers: 500, maxOrganizations: 10, maxStorage: 10240, maxApiCalls: 100000 },
      [TenantType.ENTERPRISE]: { maxUsers: 10000, maxOrganizations: 100, maxStorage: 102400, maxApiCalls: 1000000 },
      [TenantType.CUSTOM]: { maxUsers: -1, maxOrganizations: -1, maxStorage: -1, maxApiCalls: -1 }
    };
    
    const limits = limitsMap[tenantType];
    if (!limits) return false;
    
    const limit = limits[resource];
    return limit !== -1 && currentUsage >= limit;
  }
}
