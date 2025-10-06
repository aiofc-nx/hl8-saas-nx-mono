/**
 * 数据隔离业务规则
 * 
 * @description 定义数据隔离相关的业务规则和约束
 * 确保多租户数据隔离的安全性和一致性
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { DataIsolationStrategy, IsolationStrategyUtils } from '../value-objects/isolation-strategy.vo';

/**
 * 数据隔离业务规则常量
 * 
 * @description 定义数据隔离相关的业务规则常量
 */
export class DataIsolationBusinessRules {
  // 策略选择规则
  static readonly DEFAULT_STRATEGY_ROW_LEVEL = "运营初期统一使用行级隔离策略";
  static readonly ENTERPRISE_TENANT_CAN_CHOOSE_DATABASE_ISOLATION = "企业租户可以选择数据库级隔离策略";
  static readonly PROFESSIONAL_TENANT_CAN_CHOOSE_SCHEMA_ISOLATION = "专业租户可以选择模式级隔离策略";
  static readonly CUSTOM_TENANT_CAN_CHOOSE_APPLICATION_ISOLATION = "定制租户可以选择应用级隔离策略";
  
  // 数据隔离规则
  static readonly TENANT_DATA_MUST_BE_ISOLATED = "租户间数据必须完全隔离，互不可见";
  static readonly CROSS_TENANT_ACCESS_FORBIDDEN = "禁止跨租户数据访问";
  static readonly TENANT_ID_REQUIRED_FOR_ALL_QUERIES = "所有数据查询必须包含租户ID";
  
  // 行级隔离规则
  static readonly ROW_LEVEL_SHARED_DATABASE = "行级隔离策略共享数据库和模式";
  static readonly ROW_LEVEL_TENANT_ID_FILTER = "行级隔离通过租户ID进行数据过滤";
  static readonly ROW_LEVEL_HIGHEST_RESOURCE_EFFICIENCY = "行级隔离提供最高的资源利用效率";
  
  // 数据库级隔离规则
  static readonly DATABASE_LEVEL_INDEPENDENT_DATABASE = "数据库级隔离每个租户拥有独立数据库";
  static readonly DATABASE_LEVEL_HIGHEST_ISOLATION = "数据库级隔离提供最高级别的数据隔离";
  static readonly DATABASE_LEVEL_INDEPENDENT_CONFIG = "数据库级隔离支持租户特定的数据库配置";
  
  // 模式级隔离规则
  static readonly SCHEMA_LEVEL_INDEPENDENT_SCHEMA = "模式级隔离每个租户拥有独立模式";
  static readonly SCHEMA_LEVEL_GOOD_ISOLATION = "模式级隔离提供良好的数据隔离性";
  static readonly SCHEMA_LEVEL_MODERATE_RESOURCE_USAGE = "模式级隔离提供适中的资源使用";
  
  // 应用级隔离规则
  static readonly APPLICATION_LEVEL_LOGIC_ISOLATION = "应用级隔离通过应用层逻辑实现数据隔离";
  static readonly APPLICATION_LEVEL_MAXIMUM_FLEXIBILITY = "应用级隔离提供最大的部署灵活性";
  static readonly APPLICATION_LEVEL_COMPLIANCE_SUPPORT = "应用级隔离支持特殊合规要求";
  
  // 迁移规则
  static readonly MIGRATION_ONLY_TO_HIGHER_ISOLATION = "隔离策略只能迁移到更高级别的隔离策略";
  static readonly MIGRATION_REQUIRES_DATA_CONSISTENCY = "隔离策略迁移需要保证数据一致性";
  static readonly MIGRATION_REQUIRES_SYSTEM_AVAILABILITY = "隔离策略迁移期间需要保证系统可用性";
  
  // 安全规则
  static readonly ISOLATION_STRATEGY_CANNOT_BE_DOWNGRADED = "隔离策略不允许降级";
  static readonly ISOLATION_STRATEGY_CHANGE_REQUIRES_APPROVAL = "隔离策略变更需要管理员审批";
  static readonly ISOLATION_STRATEGY_CHANGE_AUDIT_LOG = "隔离策略变更需要记录审计日志";
}

/**
 * 数据隔离规则验证器
 * 
 * @description 验证数据隔离相关的业务规则
 */
export class DataIsolationRuleValidator {
  /**
   * 验证隔离策略选择
   *
   * @description 验证租户类型是否可以选择指定的隔离策略
   *
   * @param tenantType - 租户类型
   * @param isolationStrategy - 隔离策略
   * @returns 是否允许选择
   *
   * @example
   * ```typescript
   * const canSelect = validator.validateStrategySelection(
   *   TenantType.ENTERPRISE,
   *   DataIsolationStrategy.DATABASE_PER_TENANT
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateStrategySelection(tenantType: string, isolationStrategy: DataIsolationStrategy): boolean {
    // 所有租户类型都可以使用行级隔离（默认策略）
    if (isolationStrategy === DataIsolationStrategy.ROW_LEVEL_SECURITY) {
      return true;
    }

    // 企业租户和定制租户可以使用数据库级隔离
    if (isolationStrategy === DataIsolationStrategy.DATABASE_PER_TENANT) {
      return ['ENTERPRISE', 'CUSTOM'].includes(tenantType);
    }

    // 专业租户、企业租户和定制租户可以使用模式级隔离
    if (isolationStrategy === DataIsolationStrategy.SCHEMA_PER_TENANT) {
      return ['PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'].includes(tenantType);
    }

    // 定制租户可以使用应用级隔离
    if (isolationStrategy === DataIsolationStrategy.APPLICATION_LEVEL) {
      return ['CUSTOM'].includes(tenantType);
    }

    return false;
  }

  /**
   * 验证隔离策略迁移
   *
   * @description 验证从当前策略迁移到目标策略是否被允许
   *
   * @param fromStrategy - 当前策略
   * @param toStrategy - 目标策略
   * @returns 是否允许迁移
   *
   * @example
   * ```typescript
   * const canMigrate = validator.validateStrategyMigration(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY,
   *   DataIsolationStrategy.DATABASE_PER_TENANT
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateStrategyMigration(fromStrategy: DataIsolationStrategy, toStrategy: DataIsolationStrategy): boolean {
    // 不允许降级迁移
    const fromLevel = IsolationStrategyUtils.getIsolationLevel(fromStrategy);
    const toLevel = IsolationStrategyUtils.getIsolationLevel(toStrategy);
    
    if (toLevel <= fromLevel) {
      return false;
    }

    // 检查是否在允许的迁移路径中
    return IsolationStrategyUtils.canMigrateTo(fromStrategy, toStrategy);
  }

  /**
   * 验证租户数据访问权限
   *
   * @description 验证用户是否有权限访问指定租户的数据
   *
   * @param userTenantIds - 用户所属的租户ID列表
   * @param targetTenantId - 目标租户ID
   * @returns 是否有访问权限
   *
   * @example
   * ```typescript
   * const hasAccess = validator.validateTenantDataAccess(
   *   [tenantId1, tenantId2],
   *   tenantId1
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateTenantDataAccess(userTenantIds: EntityId[], targetTenantId: EntityId): boolean {
    return userTenantIds.includes(targetTenantId);
  }

  /**
   * 验证组织数据访问权限
   *
   * @description 验证用户是否有权限访问指定组织的数据
   *
   * @param userOrganizationIds - 用户所属的组织ID列表
   * @param targetOrganizationId - 目标组织ID
   * @returns 是否有访问权限
   *
   * @example
   * ```typescript
   * const hasAccess = validator.validateOrganizationDataAccess(
   *   [organizationId1, organizationId2],
   *   organizationId1
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateOrganizationDataAccess(userOrganizationIds: EntityId[], targetOrganizationId: EntityId): boolean {
    return userOrganizationIds.includes(targetOrganizationId);
  }

  /**
   * 验证部门数据访问权限
   *
   * @description 验证用户是否有权限访问指定部门的数据
   *
   * @param userDepartmentIds - 用户所属的部门ID列表
   * @param targetDepartmentId - 目标部门ID
   * @param userRole - 用户角色
   * @returns 是否有访问权限
   *
   * @example
   * ```typescript
   * const hasAccess = validator.validateDepartmentDataAccess(
   *   [departmentId1, departmentId2],
   *   departmentId1,
   *   UserRole.DEPARTMENT_ADMIN
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateDepartmentDataAccess(
    userDepartmentIds: EntityId[], 
    targetDepartmentId: EntityId,
    userRole: string
  ): boolean {
    // 用户直接属于该部门
    if (userDepartmentIds.includes(targetDepartmentId)) {
      return true;
    }

    // 管理员角色可能有跨部门访问权限
    if (['PLATFORM_ADMIN', 'TENANT_ADMIN', 'ORGANIZATION_ADMIN'].includes(userRole)) {
      return true;
    }

    return false;
  }

  /**
   * 验证数据查询条件
   *
   * @description 验证数据查询条件是否包含必要的隔离字段
   *
   * @param queryConditions - 查询条件
   * @param isolationStrategy - 隔离策略
   * @returns 是否包含必要的隔离字段
   *
   * @example
   * ```typescript
   * const isValid = validator.validateQueryConditions(
   *   { tenantId, organizationId },
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateQueryConditions(queryConditions: any, isolationStrategy: DataIsolationStrategy): boolean {
    // 行级隔离和模式级隔离必须包含租户ID
    if ([DataIsolationStrategy.ROW_LEVEL_SECURITY, DataIsolationStrategy.SCHEMA_PER_TENANT].includes(isolationStrategy)) {
      return queryConditions.tenantId !== undefined;
    }

    // 数据库级隔离不需要额外的查询条件（已经在数据库级别隔离）
    if (isolationStrategy === DataIsolationStrategy.DATABASE_PER_TENANT) {
      return true;
    }

    // 应用级隔离需要应用层逻辑验证
    if (isolationStrategy === DataIsolationStrategy.APPLICATION_LEVEL) {
      return queryConditions.tenantId !== undefined;
    }

    return false;
  }

  /**
   * 验证数据修改权限
   *
   * @description 验证用户是否有权限修改指定租户的数据
   *
   * @param userTenantIds - 用户所属的租户ID列表
   * @param targetTenantId - 目标租户ID
   * @param userRole - 用户角色
   * @returns 是否有修改权限
   *
   * @example
   * ```typescript
   * const canModify = validator.validateDataModificationPermission(
   *   [tenantId1, tenantId2],
   *   tenantId1,
   *   UserRole.TENANT_ADMIN
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateDataModificationPermission(
    userTenantIds: EntityId[],
    targetTenantId: EntityId,
    userRole: string
  ): boolean {
    // 平台管理员有所有权限
    if (userRole === 'PLATFORM_ADMIN') {
      return true;
    }

    // 租户管理员只能修改自己租户的数据
    if (userRole === 'TENANT_ADMIN') {
      return userTenantIds.includes(targetTenantId);
    }

    // 其他角色需要具体业务逻辑验证
    return userTenantIds.includes(targetTenantId);
  }

  /**
   * 验证隔离策略配置
   *
   * @description 验证隔离策略的配置是否正确
   *
   * @param strategy - 隔离策略
   * @param config - 配置对象
   * @returns 配置是否正确
   *
   * @example
   * ```typescript
   * const isValid = validator.validateIsolationConfig(
   *   DataIsolationStrategy.DATABASE_PER_TENANT,
   *   { databaseName: 'tenant_db_001' }
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateIsolationConfig(strategy: DataIsolationStrategy, config: any): boolean {
    switch (strategy) {
      case DataIsolationStrategy.ROW_LEVEL_SECURITY:
        // 行级隔离不需要特殊配置
        return true;

      case DataIsolationStrategy.DATABASE_PER_TENANT:
        // 数据库级隔离需要数据库名称
        return config.databaseName !== undefined;

      case DataIsolationStrategy.SCHEMA_PER_TENANT:
        // 模式级隔离需要模式名称
        return config.schemaName !== undefined;

      case DataIsolationStrategy.APPLICATION_LEVEL:
        // 应用级隔离需要自定义配置验证逻辑
        return config.customLogic !== undefined;

      default:
        return false;
    }
  }
}
