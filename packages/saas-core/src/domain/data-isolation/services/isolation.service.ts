/**
 * 数据隔离服务
 *
 * @description 提供数据隔离策略的管理和验证服务
 * 继承自 hybrid-archi 的 BaseDomainService，遵循统一的架构模式
 *
 * ## 业务规则
 *
 * ### 隔离策略管理规则
 * - 策略选择验证
 * - 策略迁移管理
 * - 策略配置验证
 *
 * ### 数据访问控制规则
 * - 租户数据访问验证
 * - 组织数据访问验证
 * - 部门数据访问验证
 *
 * ### 查询条件验证规则
 * - 隔离字段检查
 * - 权限验证
 * - 安全策略验证
 *
 * @example
 * ```typescript
 * const isolationService = new IsolationService();
 * 
 * // 验证策略选择
 * const canSelect = isolationService.validateStrategySelection(
 *   TenantType.ENTERPRISE,
 *   DataIsolationStrategy.DATABASE_PER_TENANT
 * );
 * 
 * // 验证数据访问
 * const hasAccess = isolationService.validateDataAccess(
 *   userTenantIds,
 *   targetTenantId
 * );
 * ```
 *
 * @since 1.0.0
 */

import { IDomainService } from '@hl8/hybrid-archi';
import { EntityId } from '@hl8/hybrid-archi';
import { DataIsolationStrategy, IsolationStrategyUtils } from '../value-objects/isolation-strategy.vo';
import { DataIsolationRuleValidator } from '../rules/isolation-rules';

/**
 * 数据隔离配置
 *
 * @description 定义不同隔离策略的配置信息
 */
export interface IsolationConfig {
  /** 数据库名称（数据库级隔离） */
  databaseName?: string;
  
  /** 模式名称（模式级隔离） */
  schemaName?: string;
  
  /** 自定义逻辑配置（应用级隔离） */
  customLogic?: any;
  
  /** 连接字符串 */
  connectionString?: string;
  
  /** 其他配置 */
  [key: string]: any;
}

/**
 * 数据访问上下文
 *
 * @description 定义数据访问的上下文信息
 */
export interface DataAccessContext {
  /** 用户ID */
  userId: EntityId;
  
  /** 用户所属的租户ID列表 */
  userTenantIds: EntityId[];
  
  /** 用户所属的组织ID列表 */
  userOrganizationIds: EntityId[];
  
  /** 用户所属的部门ID列表 */
  userDepartmentIds: EntityId[];
  
  /** 用户角色 */
  userRole: string;
  
  /** 目标租户ID */
  targetTenantId?: EntityId;
  
  /** 目标组织ID */
  targetOrganizationId?: EntityId;
  
  /** 目标部门ID */
  targetDepartmentId?: EntityId;
}

/**
 * 数据隔离服务
 *
 * @description 纯粹的领域服务，只包含数据隔离相关的业务逻辑
 * 继承自 hybrid-archi 的 BaseDomainService，遵循统一的架构模式
 */
export class IsolationService implements IDomainService {
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
   * const canSelect = isolationService.validateStrategySelection(
   *   TenantType.ENTERPRISE,
   *   DataIsolationStrategy.DATABASE_PER_TENANT
   * );
   * ```
   *
   * @since 1.0.0
   */
  public validateStrategySelection(tenantType: string, isolationStrategy: DataIsolationStrategy): boolean {
    return DataIsolationRuleValidator.validateStrategySelection(tenantType, isolationStrategy);
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
   * const canMigrate = isolationService.validateStrategyMigration(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY,
   *   DataIsolationStrategy.DATABASE_PER_TENANT
   * );
   * ```
   *
   * @since 1.0.0
   */
  public validateStrategyMigration(fromStrategy: DataIsolationStrategy, toStrategy: DataIsolationStrategy): boolean {
    return DataIsolationRuleValidator.validateStrategyMigration(fromStrategy, toStrategy);
  }

  /**
   * 验证数据访问权限
   *
   * @description 验证用户是否有权限访问指定数据
   *
   * @param context - 数据访问上下文
   * @returns 是否有访问权限
   *
   * @example
   * ```typescript
   * const hasAccess = isolationService.validateDataAccess({
   *   userId,
   *   userTenantIds: [tenantId1, tenantId2],
   *   userOrganizationIds: [organizationId1],
   *   userDepartmentIds: [departmentId1],
   *   userRole: UserRole.TENANT_ADMIN,
   *   targetTenantId: tenantId1
   * });
   * ```
   *
   * @since 1.0.0
   */
  public validateDataAccess(context: DataAccessContext): boolean {
    // 验证租户数据访问权限
    if (context.targetTenantId) {
      const hasTenantAccess = DataIsolationRuleValidator.validateTenantDataAccess(
        context.userTenantIds,
        context.targetTenantId
      );
      if (!hasTenantAccess) {
        return false;
      }
    }

    // 验证组织数据访问权限
    if (context.targetOrganizationId) {
      const hasOrganizationAccess = DataIsolationRuleValidator.validateOrganizationDataAccess(
        context.userOrganizationIds,
        context.targetOrganizationId
      );
      if (!hasOrganizationAccess) {
        return false;
      }
    }

    // 验证部门数据访问权限
    if (context.targetDepartmentId) {
      const hasDepartmentAccess = DataIsolationRuleValidator.validateDepartmentDataAccess(
        context.userDepartmentIds,
        context.targetDepartmentId,
        context.userRole
      );
      if (!hasDepartmentAccess) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证数据修改权限
   *
   * @description 验证用户是否有权限修改指定数据
   *
   * @param context - 数据访问上下文
   * @returns 是否有修改权限
   *
   * @example
   * ```typescript
   * const canModify = isolationService.validateDataModificationPermission({
   *   userId,
   *   userTenantIds: [tenantId1],
   *   userRole: UserRole.TENANT_ADMIN,
   *   targetTenantId: tenantId1
   * });
   * ```
   *
   * @since 1.0.0
   */
  public validateDataModificationPermission(context: DataAccessContext): boolean {
    if (!context.targetTenantId) {
      return false;
    }

    return DataIsolationRuleValidator.validateDataModificationPermission(
      context.userTenantIds,
      context.targetTenantId,
      context.userRole
    );
  }

  /**
   * 验证查询条件
   *
   * @description 验证数据查询条件是否包含必要的隔离字段
   *
   * @param queryConditions - 查询条件
   * @param isolationStrategy - 隔离策略
   * @returns 是否包含必要的隔离字段
   *
   * @example
   * ```typescript
   * const isValid = isolationService.validateQueryConditions(
   *   { tenantId, organizationId },
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * );
   * ```
   *
   * @since 1.0.0
   */
  public validateQueryConditions(queryConditions: any, isolationStrategy: DataIsolationStrategy): boolean {
    return DataIsolationRuleValidator.validateQueryConditions(queryConditions, isolationStrategy);
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
   * const isValid = isolationService.validateIsolationConfig(
   *   DataIsolationStrategy.DATABASE_PER_TENANT,
   *   { databaseName: 'tenant_db_001' }
   * );
   * ```
   *
   * @since 1.0.0
   */
  public validateIsolationConfig(strategy: DataIsolationStrategy, config: IsolationConfig): boolean {
    return DataIsolationRuleValidator.validateIsolationConfig(strategy, config);
  }

  /**
   * 获取推荐的隔离策略
   *
   * @description 根据租户类型和需求推荐合适的隔离策略
   *
   * @param tenantType - 租户类型
   * @param requirements - 需求列表
   * @returns 推荐的隔离策略
   *
   * @example
   * ```typescript
   * const recommended = isolationService.getRecommendedStrategy(
   *   TenantType.ENTERPRISE,
   *   ['high_security', 'compliance', 'performance']
   * );
   * ```
   *
   * @since 1.0.0
   */
  public getRecommendedStrategy(tenantType: string, requirements: string[]): DataIsolationStrategy {
    // 根据租户类型和需求推荐策略
    if (tenantType === 'CUSTOM' && requirements.includes('compliance')) {
      return DataIsolationStrategy.APPLICATION_LEVEL;
    }

    if (['ENTERPRISE', 'CUSTOM'].includes(tenantType) && requirements.includes('high_security')) {
      return DataIsolationStrategy.DATABASE_PER_TENANT;
    }

    if (['PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'].includes(tenantType) && requirements.includes('moderate_isolation')) {
      return DataIsolationStrategy.SCHEMA_PER_TENANT;
    }

    // 默认推荐行级隔离
    return DataIsolationStrategy.ROW_LEVEL_SECURITY;
  }

  /**
   * 获取隔离策略的迁移路径
   *
   * @description 获取从当前策略可以迁移到的策略列表
   *
   * @param currentStrategy - 当前策略
   * @returns 可迁移的策略列表
   *
   * @example
   * ```typescript
   * const migrationPaths = isolationService.getMigrationPaths(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * );
   * ```
   *
   * @since 1.0.0
   */
  public getMigrationPaths(currentStrategy: DataIsolationStrategy): DataIsolationStrategy[] {
    return IsolationStrategyUtils.getAvailableMigrations(currentStrategy);
  }

  /**
   * 计算隔离策略的资源成本
   *
   * @description 计算不同隔离策略的资源使用成本
   *
   * @param strategy - 隔离策略
   * @param tenantCount - 租户数量
   * @returns 资源成本估算
   *
   * @example
   * ```typescript
   * const cost = isolationService.calculateResourceCost(
   *   DataIsolationStrategy.DATABASE_PER_TENANT,
   *   100
   * );
   * ```
   *
   * @since 1.0.0
   */
  public calculateResourceCost(strategy: DataIsolationStrategy, tenantCount: number): {
    databaseInstances: number;
    estimatedStorage: number;
    estimatedMemory: number;
    costLevel: 'low' | 'medium' | 'high';
  } {
    switch (strategy) {
      case DataIsolationStrategy.ROW_LEVEL_SECURITY:
        return {
          databaseInstances: 1,
          estimatedStorage: tenantCount * 0.1, // GB
          estimatedMemory: 2, // GB
          costLevel: 'low'
        };

      case DataIsolationStrategy.SCHEMA_PER_TENANT:
        return {
          databaseInstances: 1,
          estimatedStorage: tenantCount * 0.2, // GB
          estimatedMemory: 4, // GB
          costLevel: 'medium'
        };

      case DataIsolationStrategy.DATABASE_PER_TENANT:
        return {
          databaseInstances: tenantCount,
          estimatedStorage: tenantCount * 0.5, // GB
          estimatedMemory: tenantCount * 0.5, // GB
          costLevel: 'high'
        };

      case DataIsolationStrategy.APPLICATION_LEVEL:
        return {
          databaseInstances: 1,
          estimatedStorage: tenantCount * 0.3, // GB
          estimatedMemory: 6, // GB
          costLevel: 'medium'
        };

      default:
        return {
          databaseInstances: 1,
          estimatedStorage: tenantCount * 0.1,
          estimatedMemory: 2,
          costLevel: 'low'
        };
    }
  }

  /**
   * 获取隔离策略的性能特征
   *
   * @description 获取不同隔离策略的性能特征
   *
   * @param strategy - 隔离策略
   * @returns 性能特征
   *
   * @example
   * ```typescript
   * const performance = isolationService.getPerformanceCharacteristics(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * );
   * ```
   *
   * @since 1.0.0
   */
  public getPerformanceCharacteristics(strategy: DataIsolationStrategy): {
    queryPerformance: 'high' | 'medium' | 'low';
    isolationLevel: 'high' | 'medium' | 'low';
    scalability: 'high' | 'medium' | 'low';
    maintenanceComplexity: 'high' | 'medium' | 'low';
  } {
    switch (strategy) {
      case DataIsolationStrategy.ROW_LEVEL_SECURITY:
        return {
          queryPerformance: 'high',
          isolationLevel: 'medium',
          scalability: 'high',
          maintenanceComplexity: 'low'
        };

      case DataIsolationStrategy.SCHEMA_PER_TENANT:
        return {
          queryPerformance: 'medium',
          isolationLevel: 'high',
          scalability: 'medium',
          maintenanceComplexity: 'medium'
        };

      case DataIsolationStrategy.DATABASE_PER_TENANT:
        return {
          queryPerformance: 'high',
          isolationLevel: 'high',
          scalability: 'low',
          maintenanceComplexity: 'high'
        };

      case DataIsolationStrategy.APPLICATION_LEVEL:
        return {
          queryPerformance: 'medium',
          isolationLevel: 'high',
          scalability: 'high',
          maintenanceComplexity: 'high'
        };

      default:
        return {
          queryPerformance: 'high',
          isolationLevel: 'medium',
          scalability: 'high',
          maintenanceComplexity: 'low'
        };
    }
  }
}
