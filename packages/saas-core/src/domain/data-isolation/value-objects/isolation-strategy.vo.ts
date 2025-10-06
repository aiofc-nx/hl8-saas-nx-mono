/**
 * 数据隔离策略枚举
 *
 * @description 定义多租户SAAS平台的数据隔离策略
 * 不同的隔离策略提供不同级别的数据隔离性和资源利用效率
 *
 * ## 业务规则
 *
 * ### 隔离策略定义
 * - ROW_LEVEL_SECURITY: 行级隔离，共享数据库和模式，通过租户ID进行行级数据隔离
 * - DATABASE_PER_TENANT: 数据库级隔离，每个租户拥有独立的数据库实例
 * - SCHEMA_PER_TENANT: 模式级隔离，每个租户拥有独立的数据库模式
 * - APPLICATION_LEVEL: 应用级隔离，通过应用层逻辑实现数据隔离
 *
 * ### 策略选择规则
 * - 运营初期统一使用行级隔离策略
 * - 大型企业租户可选择数据库级隔离
 * - 中等规模租户可选择模式级隔离
 * - 特殊合规要求租户可选择应用级隔离
 *
 * ### 迁移规则
 * - 支持隔离策略的动态迁移
 * - 迁移过程需要数据一致性保证
 * - 迁移期间系统可用性保证
 *
 * @example
 * ```typescript
 * const strategy = DataIsolationStrategy.ROW_LEVEL_SECURITY;
 * const canMigrate = IsolationStrategyUtils.canMigrateTo(
 *   strategy, 
 *   DataIsolationStrategy.DATABASE_PER_TENANT
 * ); // true
 * 
 * const features = IsolationStrategyUtils.getSupportedFeatures(strategy);
 * const isolationLevel = IsolationStrategyUtils.getIsolationLevel(strategy);
 * ```
 *
 * @since 1.0.0
 */
export enum DataIsolationStrategy {
  /**
   * 行级隔离策略
   * 
   * @description 共享数据库和模式，通过租户ID进行严格的行级数据隔离
   * 适用于运营初期，提供最高的资源利用率和成本效益
   */
  ROW_LEVEL_SECURITY = 'ROW_LEVEL_SECURITY',

  /**
   * 数据库级隔离策略
   * 
   * @description 每个租户拥有独立的数据库实例
   * 提供最高级别的数据隔离，适用于大型企业租户
   */
  DATABASE_PER_TENANT = 'DATABASE_PER_TENANT',

  /**
   * 模式级隔离策略
   * 
   * @description 每个租户拥有独立的数据库模式
   * 提供良好的数据隔离性，适用于中等规模租户
   */
  SCHEMA_PER_TENANT = 'SCHEMA_PER_TENANT',

  /**
   * 应用级隔离策略
   * 
   * @description 通过应用层逻辑实现数据隔离
   * 提供最大的部署灵活性，适用于特殊合规要求
   */
  APPLICATION_LEVEL = 'APPLICATION_LEVEL'
}

/**
 * 数据隔离策略工具类
 *
 * @description 提供数据隔离策略相关的工具方法
 * 包括策略比较、迁移验证、功能支持等功能
 *
 * @since 1.0.0
 */
export class IsolationStrategyUtils {
  /**
   * 隔离级别定义
   * 
   * @description 定义不同策略的隔离级别
   * 数值越大，隔离级别越高
   */
  private static readonly ISOLATION_LEVELS: Record<DataIsolationStrategy, number> = {
    [DataIsolationStrategy.ROW_LEVEL_SECURITY]: 1,
    [DataIsolationStrategy.SCHEMA_PER_TENANT]: 2,
    [DataIsolationStrategy.DATABASE_PER_TENANT]: 3,
    [DataIsolationStrategy.APPLICATION_LEVEL]: 4
  };

  /**
   * 策略特性支持矩阵
   * 
   * @description 定义每种策略支持的特性
   */
  private static readonly SUPPORTED_FEATURES: Record<DataIsolationStrategy, string[]> = {
    [DataIsolationStrategy.ROW_LEVEL_SECURITY]: [
      'shared_resources',
      'unified_backup',
      'unified_monitoring',
      'fast_tenant_creation',
      'cost_effective'
    ],
    [DataIsolationStrategy.DATABASE_PER_TENANT]: [
      'complete_isolation',
      'independent_config',
      'tenant_specific_optimization',
      'compliance_support',
      'independent_backup'
    ],
    [DataIsolationStrategy.SCHEMA_PER_TENANT]: [
      'good_isolation',
      'moderate_resource_usage',
      'tenant_specific_model',
      'easy_migration',
      'shared_backup'
    ],
    [DataIsolationStrategy.APPLICATION_LEVEL]: [
      'maximum_flexibility',
      'hybrid_cloud_support',
      'compliance_adaptation',
      'existing_system_integration',
      'custom_logic'
    ]
  };

  /**
   * 迁移路径矩阵
   * 
   * @description 定义允许的迁移路径
   * 键为当前策略，值为可迁移到的策略数组
   */
  private static readonly MIGRATION_PATHS: Record<DataIsolationStrategy, DataIsolationStrategy[]> = {
    [DataIsolationStrategy.ROW_LEVEL_SECURITY]: [
      DataIsolationStrategy.SCHEMA_PER_TENANT,
      DataIsolationStrategy.DATABASE_PER_TENANT,
      DataIsolationStrategy.APPLICATION_LEVEL
    ],
    [DataIsolationStrategy.SCHEMA_PER_TENANT]: [
      DataIsolationStrategy.DATABASE_PER_TENANT,
      DataIsolationStrategy.APPLICATION_LEVEL
    ],
    [DataIsolationStrategy.DATABASE_PER_TENANT]: [
      DataIsolationStrategy.APPLICATION_LEVEL
    ],
    [DataIsolationStrategy.APPLICATION_LEVEL]: [] // 应用级隔离是最高级别
  };

  /**
   * 获取隔离级别
   *
   * @description 返回策略的隔离级别数值
   * 数值越大，隔离级别越高
   *
   * @param strategy - 数据隔离策略
   * @returns 隔离级别数值
   *
   * @example
   * ```typescript
   * const level = IsolationStrategyUtils.getIsolationLevel(
   *   DataIsolationStrategy.DATABASE_PER_TENANT
   * ); // 3
   * ```
   *
   * @since 1.0.0
   */
  public static getIsolationLevel(strategy: DataIsolationStrategy): number {
    return this.ISOLATION_LEVELS[strategy];
  }

  /**
   * 检查是否可以迁移到指定策略
   *
   * @description 验证从当前策略迁移到目标策略是否被允许
   *
   * @param fromStrategy - 当前策略
   * @param toStrategy - 目标策略
   * @returns 是否允许迁移
   *
   * @example
   * ```typescript
   * const canMigrate = IsolationStrategyUtils.canMigrateTo(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY,
   *   DataIsolationStrategy.DATABASE_PER_TENANT
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static canMigrateTo(fromStrategy: DataIsolationStrategy, toStrategy: DataIsolationStrategy): boolean {
    const allowedMigrations = this.MIGRATION_PATHS[fromStrategy];
    return allowedMigrations.includes(toStrategy);
  }

  /**
   * 获取策略支持的特性列表
   *
   * @description 返回指定策略支持的特性列表
   *
   * @param strategy - 数据隔离策略
   * @returns 支持的特性列表
   *
   * @example
   * ```typescript
   * const features = IsolationStrategyUtils.getSupportedFeatures(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * );
   * // ['shared_resources', 'unified_backup', ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getSupportedFeatures(strategy: DataIsolationStrategy): string[] {
    return [...this.SUPPORTED_FEATURES[strategy]];
  }

  /**
   * 检查策略是否支持指定特性
   *
   * @description 验证指定策略是否包含某个特性
   *
   * @param strategy - 数据隔离策略
   * @param feature - 特性名称
   * @returns 是否支持该特性
   *
   * @example
   * ```typescript
   * const supports = IsolationStrategyUtils.supportsFeature(
   *   DataIsolationStrategy.DATABASE_PER_TENANT,
   *   'complete_isolation'
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static supportsFeature(strategy: DataIsolationStrategy, feature: string): boolean {
    const features = this.getSupportedFeatures(strategy);
    return features.includes(feature);
  }

  /**
   * 获取策略的中文描述
   *
   * @description 返回策略的中文描述，用于界面显示
   *
   * @param strategy - 数据隔离策略
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = IsolationStrategyUtils.getDescription(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * );
   * // "行级隔离"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(strategy: DataIsolationStrategy): string {
    const descriptions: Record<DataIsolationStrategy, string> = {
      [DataIsolationStrategy.ROW_LEVEL_SECURITY]: '行级隔离',
      [DataIsolationStrategy.DATABASE_PER_TENANT]: '数据库级隔离',
      [DataIsolationStrategy.SCHEMA_PER_TENANT]: '模式级隔离',
      [DataIsolationStrategy.APPLICATION_LEVEL]: '应用级隔离'
    };

    return descriptions[strategy];
  }

  /**
   * 获取策略的详细说明
   *
   * @description 返回策略的详细说明，包括适用场景和特点
   *
   * @param strategy - 数据隔离策略
   * @returns 详细说明
   *
   * @example
   * ```typescript
   * const details = IsolationStrategyUtils.getDetailedDescription(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * );
   * // "共享数据库和模式，通过租户ID进行严格的行级数据隔离..."
   * ```
   *
   * @since 1.0.0
   */
  public static getDetailedDescription(strategy: DataIsolationStrategy): string {
    const descriptions: Record<DataIsolationStrategy, string> = {
      [DataIsolationStrategy.ROW_LEVEL_SECURITY]: 
        '共享数据库和模式，通过租户ID进行严格的行级数据隔离。提供最高的资源利用率和成本效益，适用于运营初期的所有租户类型。',
      [DataIsolationStrategy.DATABASE_PER_TENANT]: 
        '每个租户拥有独立的数据库实例，提供最高级别的数据隔离。支持租户特定的数据库配置和优化，适用于大型企业租户和高安全要求租户。',
      [DataIsolationStrategy.SCHEMA_PER_TENANT]: 
        '每个租户拥有独立的数据库模式，提供良好的数据隔离性。支持租户特定的数据模型，便于数据迁移和管理，适用于中等规模的专业租户。',
      [DataIsolationStrategy.APPLICATION_LEVEL]: 
        '通过应用层逻辑实现数据隔离，提供最大的部署灵活性。支持混合云架构和特殊合规要求，适用于定制租户和政府机构。'
    };

    return descriptions[strategy];
  }

  /**
   * 获取所有可迁移的策略
   *
   * @description 返回从指定策略可以迁移到的所有策略
   *
   * @param strategy - 当前策略
   * @returns 可迁移的策略数组
   *
   * @example
   * ```typescript
   * const migrations = IsolationStrategyUtils.getAvailableMigrations(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY
   * );
   * // [DataIsolationStrategy.SCHEMA_PER_TENANT, DataIsolationStrategy.DATABASE_PER_TENANT, ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getAvailableMigrations(strategy: DataIsolationStrategy): DataIsolationStrategy[] {
    return [...this.MIGRATION_PATHS[strategy]];
  }

  /**
   * 比较两个策略的隔离级别
   *
   * @description 比较两个策略的隔离级别高低
   *
   * @param strategy1 - 第一个策略
   * @param strategy2 - 第二个策略
   * @returns 比较结果：-1(更低), 0(相等), 1(更高)
   *
   * @example
   * ```typescript
   * const result = IsolationStrategyUtils.compareIsolationLevel(
   *   DataIsolationStrategy.ROW_LEVEL_SECURITY,
   *   DataIsolationStrategy.DATABASE_PER_TENANT
   * ); // -1 (更低)
   * ```
   *
   * @since 1.0.0
   */
  public static compareIsolationLevel(strategy1: DataIsolationStrategy, strategy2: DataIsolationStrategy): number {
    const level1 = this.getIsolationLevel(strategy1);
    const level2 = this.getIsolationLevel(strategy2);
    
    if (level1 < level2) return -1;
    if (level1 > level2) return 1;
    return 0;
  }

  /**
   * 检查是否为最高隔离级别
   *
   * @description 判断策略是否为最高隔离级别（不可再升级）
   *
   * @param strategy - 数据隔离策略
   * @returns 是否为最高隔离级别
   *
   * @example
   * ```typescript
   * const isHighest = IsolationStrategyUtils.isHighestIsolationLevel(
   *   DataIsolationStrategy.APPLICATION_LEVEL
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isHighestIsolationLevel(strategy: DataIsolationStrategy): boolean {
    return this.MIGRATION_PATHS[strategy].length === 0;
  }

  /**
   * 获取默认策略
   *
   * @description 返回平台运营初期的默认隔离策略
   *
   * @returns 默认策略
   *
   * @example
   * ```typescript
   * const defaultStrategy = IsolationStrategyUtils.getDefaultStrategy();
   * // DataIsolationStrategy.ROW_LEVEL_SECURITY
   * ```
   *
   * @since 1.0.0
   */
  public static getDefaultStrategy(): DataIsolationStrategy {
    return DataIsolationStrategy.ROW_LEVEL_SECURITY;
  }
}
