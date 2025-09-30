/**
 * 租户隔离策略接口
 *
 * 定义租户数据隔离的策略接口，用于实现不同的隔离方案
 * 包括键前缀、命名空间、数据库、模式等隔离策略
 *
 * @fileoverview 租户隔离策略接口定义
 * @author HL8 Team
 * @since 1.0.0
 */

import {
  ITenantContext,
  ITenantIsolationConfig,
} from '../types/tenant-core.types';

/**
 * 租户隔离策略接口
 *
 * 定义租户数据隔离的核心策略接口
 *
 * @description 租户隔离策略用于实现数据隔离，确保不同租户的数据完全隔离
 * 支持多种隔离策略：键前缀、命名空间、数据库、模式等
 *
 * ## 业务规则
 *
 * ### 隔离策略规则
 * - 每个策略必须实现完整的隔离逻辑
 * - 策略必须保证数据的完全隔离
 * - 策略必须支持数据的双向转换（隔离和提取）
 * - 策略必须支持隔离级别的控制
 *
 * ### 键生成规则
 * - 租户键必须包含租户标识符
 * - 键生成必须保证唯一性和可逆性
 * - 键格式必须符合预定义的规范
 * - 键生成性能必须满足高并发要求
 *
 * ### 命名空间规则
 * - 命名空间必须唯一标识租户
 * - 命名空间必须支持层级结构
 * - 命名空间必须支持动态创建和销毁
 * - 命名空间必须支持权限控制
 *
 * ### 数据隔离规则
 * - 数据隔离必须保证完全性
 * - 隔离后的数据必须包含租户标识
 * - 数据提取必须验证租户权限
 * - 隔离操作必须支持批量处理
 *
 * ## 业务逻辑流程
 *
 * 1. **策略初始化**：根据配置初始化隔离策略
 * 2. **键生成**：为数据生成包含租户信息的键
 * 3. **数据隔离**：将数据与租户信息绑定
 * 4. **数据提取**：从隔离数据中提取租户相关信息
 * 5. **验证检查**：验证隔离操作的正确性
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class KeyPrefixIsolationStrategy implements ITenantIsolationStrategy {
 *   async getTenantKey(key: string, tenantId: string): Promise<string> {
 *     return `tenant:${tenantId}:${key}`;
 *   }
 *
 *   async getTenantNamespace(tenantId: string): Promise<string> {
 *     return `tenant_${tenantId}`;
 *   }
 *
 *   async isolateData<T>(data: T, tenantId: string): Promise<T> {
 *     return {
 *       ...data,
 *       _tenantId: tenantId,
 *       _isolatedAt: new Date()
 *     };
 *   }
 *
 *   async extractTenantData<T>(data: T, tenantId: string): Promise<T> {
 *     const { _tenantId, _isolatedAt, ...cleanData } = data;
 *     return cleanData;
 *   }
 *
 *   async shouldIsolate(tenantId: string): Promise<boolean> {
 *     return tenantId !== 'default';
 *   }
 * }
 * ```
 */
export interface ITenantIsolationStrategy {
  /**
   * 获取租户键
   *
   * 为指定的键生成包含租户信息的租户键
   *
   * @description 生成包含租户标识的键，用于数据隔离
   * 不同的隔离策略会采用不同的键生成方式
   *
   * @param key 原始键
   * @param tenantId 租户ID
   * @returns 包含租户信息的键
   *
   * @example
   * ```typescript
   * const tenantKey = await strategy.getTenantKey('user:123', 'tenant-456');
   * // 结果: 'tenant:tenant-456:user:123'
   * ```
   */
  getTenantKey(key: string, tenantId: string): Promise<string>;

  /**
   * 获取租户命名空间
   *
   * 为指定的租户生成命名空间标识
   *
   * @description 生成租户的命名空间，用于数据库、缓存等资源的隔离
   * 命名空间可以是数据库名、表名前缀、缓存键前缀等
   *
   * @param tenantId 租户ID
   * @returns 租户命名空间
   *
   * @example
   * ```typescript
   * const namespace = await strategy.getTenantNamespace('tenant-456');
   * // 结果: 'tenant_456' 或 'db_tenant_456'
   * ```
   */
  getTenantNamespace(tenantId: string): Promise<string>;

  /**
   * 隔离数据
   *
   * 将数据与租户信息绑定，实现数据隔离
   *
   * @description 为数据添加租户标识，确保数据与特定租户关联
   * 隔离后的数据包含租户信息和隔离时间戳
   *
   * @param data 原始数据
   * @param tenantId 租户ID
   * @returns 隔离后的数据
   *
   * @example
   * ```typescript
   * const isolatedData = await strategy.isolateData(
   *   { name: 'John', age: 30 },
   *   'tenant-456'
   * );
   * // 结果: { name: 'John', age: 30, _tenantId: 'tenant-456', _isolatedAt: Date }
   * ```
   */
  isolateData<T = unknown>(data: T, tenantId: string): Promise<T>;

  /**
   * 提取租户数据
   *
   * 从隔离数据中提取租户相关信息，返回纯净的业务数据
   *
   * @description 移除数据中的租户标识，返回原始业务数据
   * 同时验证数据的租户归属是否正确
   *
   * @param data 隔离数据
   * @param tenantId 期望的租户ID
   * @returns 提取后的业务数据
   *
   * @throws {Error} 当数据租户ID与期望不匹配时抛出异常
   *
   * @example
   * ```typescript
   * const cleanData = await strategy.extractTenantData(
   *   { name: 'John', age: 30, _tenantId: 'tenant-456', _isolatedAt: Date },
   *   'tenant-456'
   * );
   * // 结果: { name: 'John', age: 30 }
   * ```
   */
  extractTenantData<T = unknown>(data: T, tenantId: string): Promise<T>;

  /**
   * 判断是否需要隔离
   *
   * 根据租户ID判断是否需要进行数据隔离
   *
   * @description 某些特殊租户（如系统租户、默认租户）可能不需要隔离
   * 此方法用于判断特定租户是否需要隔离处理
   *
   * @param tenantId 租户ID
   * @returns 是否需要隔离
   *
   * @example
   * ```typescript
   * const shouldIsolate = await strategy.shouldIsolate('tenant-456');
   * // 结果: true
   *
   * const shouldIsolateDefault = await strategy.shouldIsolate('default');
   * // 结果: false
   * ```
   */
  shouldIsolate(tenantId: string): Promise<boolean>;

  /**
   * 获取隔离配置
   *
   * 获取当前策略的隔离配置信息
   *
   * @description 返回策略的配置信息，用于调试和监控
   * 包含策略类型、配置参数等信息
   *
   * @returns 隔离配置
   *
   * @example
   * ```typescript
   * const config = await strategy.getIsolationConfig();
   * // 结果: { strategy: 'key-prefix', keyPrefix: 'tenant:', level: 'strict' }
   * ```
   */
  getIsolationConfig(): ITenantIsolationConfig;
}

/**
 * 租户隔离策略工厂接口
 *
 * 定义租户隔离策略的工厂接口，用于创建和配置隔离策略
 *
 * @description 策略工厂用于创建和管理隔离策略实例
 * 支持策略的动态创建、配置和替换
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TenantIsolationStrategyFactory {
 *   createStrategy(config: ITenantIsolationConfig): ITenantIsolationStrategy {
 *     switch (config.strategy) {
 *       case 'key-prefix':
 *         return new KeyPrefixIsolationStrategy(config);
 *       case 'namespace':
 *         return new NamespaceIsolationStrategy(config);
 *       case 'database':
 *         return new DatabaseIsolationStrategy(config);
 *       default:
 *         throw new Error(`Unsupported isolation strategy: ${config.strategy}`);
 *     }
 *   }
 * }
 * ```
 */
export interface ITenantIsolationStrategyFactory {
  /**
   * 创建隔离策略
   *
   * 根据配置创建相应的隔离策略实例
   *
   * @param config 隔离配置
   * @returns 隔离策略实例
   */
  createStrategy(config: ITenantIsolationConfig): ITenantIsolationStrategy;

  /**
   * 获取支持的策略类型
   *
   * 返回工厂支持的所有隔离策略类型
   *
   * @returns 支持的策略类型列表
   */
  getSupportedStrategies(): string[];

  /**
   * 验证策略配置
   *
   * 验证隔离策略配置的有效性
   *
   * @param config 隔离配置
   * @returns 验证结果
   */
  validateConfig(config: ITenantIsolationConfig): boolean;
}
