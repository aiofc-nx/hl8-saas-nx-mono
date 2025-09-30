/**
 * 多层级隔离策略接口
 *
 * 定义多层级数据隔离的策略接口，用于实现不同的多层级隔离方案
 * 支持租户、组织、部门、用户四个层级的隔离策略
 *
 * @fileoverview 多层级隔离策略接口定义
 * @author HL8 Team
 * @since 1.0.0
 */

import { FastifyRequest } from 'fastify';
import {
  IMultiLevelContext,
  IMultiLevelIsolationConfig,
  IMultiLevelAction,
  IMultiLevelStats,
  IHierarchyPath,
} from '../types/multi-level.types';

/**
 * 多层级隔离策略接口
 *
 * 定义多层级数据隔离的核心策略接口
 *
 * @description 多层级隔离策略用于实现四个层级的数据隔离
 * 支持键前缀、命名空间、数据库、模式等隔离策略
 *
 * ## 业务规则
 *
 * ### 隔离策略规则
 * - 每个策略必须实现完整的多层级隔离逻辑
 * - 策略必须保证数据的完全隔离
 * - 策略必须支持数据的双向转换（隔离和提取）
 * - 策略必须支持不同隔离级别的控制
 *
 * ### 键生成规则
 * - 多层级键必须包含完整的层级信息
 * - 键生成必须保证唯一性和可逆性
 * - 键格式必须符合预定义的规范
 * - 键生成性能必须满足高并发要求
 *
 * ### 命名空间规则
 * - 命名空间必须唯一标识层级
 * - 命名空间必须支持层级结构
 * - 命名空间必须支持动态创建和销毁
 * - 命名空间必须支持权限控制
 *
 * ### 数据隔离规则
 * - 数据隔离必须保证完全性
 * - 隔离后的数据必须包含层级标识
 * - 数据提取必须验证层级权限
 * - 隔离操作必须支持批量处理
 *
 * ## 业务逻辑流程
 *
 * 1. **策略初始化**：根据配置初始化多层级隔离策略
 * 2. **键生成**：为数据生成包含层级信息的键
 * 3. **数据隔离**：将数据与层级信息绑定
 * 4. **数据提取**：从隔离数据中提取层级相关信息
 * 5. **验证检查**：验证隔离操作的正确性
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class KeyPrefixMultiLevelIsolationStrategy implements IMultiLevelIsolationStrategy {
 *   async getIsolationKey(key: string, context: IMultiLevelContext): Promise<string> {
 *     const parts = ['multi'];
 *     if (context.tenantId) parts.push(`tenant:${context.tenantId}`);
 *     if (context.organizationId) parts.push(`org:${context.organizationId}`);
 *     if (context.departmentId) parts.push(`dept:${context.departmentId}`);
 *     if (context.userId) parts.push(`user:${context.userId}`);
 *     parts.push(key);
 *     return parts.join(':');
 *   }
 *
 *   async getIsolationNamespace(context: IMultiLevelContext): Promise<string> {
 *     const parts = ['ml'];
 *     if (context.tenantId) parts.push(`t_${context.tenantId}`);
 *     if (context.organizationId) parts.push(`o_${context.organizationId}`);
 *     if (context.departmentId) parts.push(`d_${context.departmentId}`);
 *     return parts.join('_');
 *   }
 *
 *   async isolateData<T>(data: T, context: IMultiLevelContext): Promise<T> {
 *     return {
 *       ...data,
 *       _multiLevelContext: {
 *         tenantId: context.tenantId,
 *         organizationId: context.organizationId,
 *         departmentId: context.departmentId,
 *         userId: context.userId,
 *         isolationLevel: context.isolationLevel
 *       },
 *       _isolatedAt: new Date()
 *     };
 *   }
 *
 *   async extractData<T>(data: T, context: IMultiLevelContext): Promise<T> {
 *     const { _multiLevelContext, _isolatedAt, ...cleanData } = data;
 *
 *     // 验证层级匹配
 *     if (!this.validateContextMatch(_multiLevelContext, context)) {
 *       throw new Error('Context mismatch');
 *     }
 *
 *     return cleanData;
 *   }
 *
 *   async shouldIsolateAtLevel(context: IMultiLevelContext): Promise<boolean> {
 *     return context.isolationLevel !== 'disabled';
 *   }
 *
 *   async validateHierarchy(context: IMultiLevelContext): Promise<boolean> {
 *     // 验证层级关系的有效性
 *     return true;
 *   }
 * }
 * ```
 */
export interface IMultiLevelIsolationStrategy {
  /**
   * 获取隔离键
   *
   * 为指定的键生成包含多层级信息的隔离键
   *
   * @description 生成包含完整层级信息的键，用于数据隔离
   * 不同的隔离策略会采用不同的键生成方式
   *
   * @param key 原始键
   * @param context 多层级上下文
   * @returns 包含多层级信息的键
   *
   * @example
   * ```typescript
   * const isolationKey = await strategy.getIsolationKey('user:123', context);
   * // 结果: 'multi:tenant:tenant-456:org:org-789:user:123'
   * ```
   */
  getIsolationKey(key: string, context: IMultiLevelContext): Promise<string>;

  /**
   * 获取隔离命名空间
   *
   * 为指定的多层级上下文生成命名空间标识
   *
   * @description 生成多层级的命名空间，用于数据库、缓存等资源的隔离
   * 命名空间可以是数据库名、表名前缀、缓存键前缀等
   *
   * @param context 多层级上下文
   * @returns 多层级命名空间
   *
   * @example
   * ```typescript
   * const namespace = await strategy.getIsolationNamespace(context);
   * // 结果: 'ml_t_tenant456_o_org789_d_dept101'
   * ```
   */
  getIsolationNamespace(context: IMultiLevelContext): Promise<string>;

  /**
   * 隔离数据
   *
   * 将数据与多层级信息绑定，实现数据隔离
   *
   * @description 为数据添加多层级标识，确保数据与特定层级关联
   * 隔离后的数据包含层级信息和隔离时间戳
   *
   * @param data 原始数据
   * @param context 多层级上下文
   * @returns 隔离后的数据
   *
   * @example
   * ```typescript
   * const isolatedData = await strategy.isolateData(
   *   { name: 'John', age: 30 },
   *   context
   * );
   * // 结果: {
   * //   name: 'John',
   * //   age: 30,
   * //   _multiLevelContext: { tenantId: 'tenant-456', ... },
   * //   _isolatedAt: Date
   * // }
   * ```
   */
  isolateData<T = unknown>(data: T, context: IMultiLevelContext): Promise<T>;

  /**
   * 提取数据
   *
   * 从隔离数据中提取多层级相关信息，返回纯净的业务数据
   *
   * @description 移除数据中的多层级标识，返回原始业务数据
   * 同时验证数据的层级归属是否正确
   *
   * @param data 隔离数据
   * @param context 多层级上下文
   * @returns 提取后的业务数据
   *
   * @throws {Error} 当数据层级与上下文不匹配时抛出异常
   *
   * @example
   * ```typescript
   * const cleanData = await strategy.extractData(isolatedData, context);
   * // 结果: { name: 'John', age: 30 }
   * ```
   */
  extractData<T = unknown>(data: T, context: IMultiLevelContext): Promise<T>;

  /**
   * 判断是否需要在指定级别隔离
   *
   * 根据多层级上下文判断是否需要进行数据隔离
   *
   * @description 某些特殊层级可能不需要隔离
   * 此方法用于判断特定层级是否需要隔离处理
   *
   * @param context 多层级上下文
   * @returns 是否需要隔离
   *
   * @example
   * ```typescript
   * const shouldIsolate = await strategy.shouldIsolateAtLevel(context);
   * if (shouldIsolate) {
   *   // 执行隔离操作
   * }
   * ```
   */
  shouldIsolateAtLevel(context: IMultiLevelContext): Promise<boolean>;

  /**
   * 验证层级关系
   *
   * 验证多层级上下文的层级关系是否有效
   *
   * @description 检查层级关系的有效性
   * 确保层级关系符合业务规则
   *
   * @param context 多层级上下文
   * @returns 层级关系是否有效
   *
   * @example
   * ```typescript
   * const isValid = await strategy.validateHierarchy(context);
   * if (!isValid) {
   *   throw new Error('Invalid hierarchy');
   * }
   * ```
   */
  validateHierarchy(context: IMultiLevelContext): Promise<boolean>;

  /**
   * 批量生成隔离键
   *
   * 批量为多个键生成多层级隔离键
   *
   * @description 支持批量键生成以提高性能
   * 适用于需要处理大量键的场景
   *
   * @param keys 原始键列表
   * @param context 多层级上下文
   * @returns 多层级隔离键列表
   *
   * @example
   * ```typescript
   * const isolationKeys = await strategy.getIsolationKeys([
   *   'user:123',
   *   'user:456',
   *   'user:789'
   * ], context);
   * // 结果: [
   * //   'multi:tenant:tenant-456:org:org-789:user:123',
   * //   'multi:tenant:tenant-456:org:org-789:user:456',
   * //   'multi:tenant:tenant-456:org:org-789:user:789'
   * // ]
   * ```
   */
  getIsolationKeys(
    keys: string[],
    context: IMultiLevelContext
  ): Promise<string[]>;

  /**
   * 批量隔离数据
   *
   * 批量隔离多个数据对象
   *
   * @description 支持批量数据隔离以提高性能
   * 适用于需要处理大量数据的场景
   *
   * @param dataList 原始数据列表
   * @param context 多层级上下文
   * @returns 隔离后的数据列表
   *
   * @example
   * ```typescript
   * const isolatedDataList = await strategy.isolateDataList([
   *   { name: 'John', age: 30 },
   *   { name: 'Jane', age: 25 }
   * ], context);
   * ```
   */
  isolateDataList<T = unknown>(
    dataList: T[],
    context: IMultiLevelContext
  ): Promise<T[]>;

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
   * // 结果: {
   * //   strategy: 'key-prefix',
   * //   keyPrefix: 'multi:',
   * //   enableMultiLevel: true
   * // }
   * ```
   */
  getIsolationConfig(): IMultiLevelIsolationConfig;

  /**
   * 获取策略统计
   *
   * 获取策略的统计信息
   *
   * @description 返回策略的性能统计信息
   * 用于监控和性能分析
   *
   * @returns 策略统计信息
   *
   * @example
   * ```typescript
   * const stats = await strategy.getStats();
   * console.log('Operations:', stats.tenant.operations);
   * console.log('Average Latency:', stats.tenant.averageLatency);
   * ```
   */
  getStats(): Promise<IMultiLevelStats>;

  /**
   * 重置统计
   *
   * 重置策略的统计信息
   *
   * @description 清除所有统计计数器
   * 用于重新开始统计
   *
   * @returns 重置是否成功
   *
   * @example
   * ```typescript
   * await strategy.resetStats();
   * ```
   */
  resetStats(): Promise<boolean>;
}

/**
 * 多层级隔离策略工厂接口
 *
 * 定义多层级隔离策略的工厂接口，用于创建和配置隔离策略
 *
 * @description 策略工厂用于创建和管理多层级隔离策略实例
 * 支持策略的动态创建、配置和替换
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MultiLevelIsolationStrategyFactory {
 *   createStrategy(config: IMultiLevelIsolationConfig): IMultiLevelIsolationStrategy {
 *     switch (config.defaultIsolationLevel) {
 *       case 'tenant':
 *         return new TenantLevelIsolationStrategy(config);
 *       case 'organization':
 *         return new OrganizationLevelIsolationStrategy(config);
 *       case 'department':
 *         return new DepartmentLevelIsolationStrategy(config);
 *       case 'user':
 *         return new UserLevelIsolationStrategy(config);
 *       default:
 *         return new KeyPrefixMultiLevelIsolationStrategy(config);
 *     }
 *   }
 * }
 * ```
 */
export interface IMultiLevelIsolationStrategyFactory {
  /**
   * 创建多层级隔离策略
   *
   * 根据配置创建相应的多层级隔离策略实例
   *
   * @param config 多层级隔离配置
   * @returns 多层级隔离策略实例
   */
  createStrategy(
    config: IMultiLevelIsolationConfig
  ): IMultiLevelIsolationStrategy;

  /**
   * 获取支持的策略类型
   *
   * 返回工厂支持的所有多层级隔离策略类型
   *
   * @returns 支持的策略类型列表
   */
  getSupportedStrategies(): string[];

  /**
   * 验证策略配置
   *
   * 验证多层级隔离策略配置的有效性
   *
   * @param config 多层级隔离配置
   * @returns 验证结果
   */
  validateConfig(config: IMultiLevelIsolationConfig): boolean;

  /**
   * 获取策略性能基准
   *
   * 获取不同策略的性能基准信息
   *
   * @param strategyType 策略类型
   * @returns 性能基准信息
   */
  getPerformanceBenchmark(
    strategyType: string
  ): Promise<Record<string, unknown>>;
}

/**
 * 多层级上下文策略接口
 *
 * 定义多层级上下文管理的策略接口
 *
 * @description 多层级上下文策略用于从请求中提取和管理多层级上下文信息
 * 支持多种提取方式和上下文验证
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class HeaderMultiLevelContextStrategy implements IMultiLevelContextStrategy {
 *   async extractContext(request: IHttpRequest): Promise<IMultiLevelContext | null> {
 *     const tenantId = request.headers['x-tenant-id'] as string;
 *     const organizationId = request.headers['x-organization-id'] as string;
 *     const departmentId = request.headers['x-department-id'] as string;
 *     const userId = request.headers['x-user-id'] as string;
 *
 *     if (!tenantId) return null;
 *
 *     return {
 *       tenantId,
 *       organizationId,
 *       departmentId,
 *       userId,
 *       isolationLevel: this.determineIsolationLevel(tenantId, organizationId, departmentId, userId),
 *       timestamp: new Date()
 *     };
 *   }
 * }
 * ```
 */
export interface IMultiLevelContextStrategy {
  /**
   * 提取多层级上下文
   *
   * 从HTTP请求中提取多层级上下文信息
   *
   * @param request HTTP请求对象
   * @returns 多层级上下文或null
   */
  extractContext(request: FastifyRequest): Promise<IMultiLevelContext | null>;

  /**
   * 验证多层级上下文
   *
   * 验证多层级上下文的完整性和有效性
   *
   * @param context 多层级上下文
   * @returns 验证是否成功
   */
  validateContext(context: IMultiLevelContext): Promise<boolean>;

  /**
   * 构建多层级上下文
   *
   * 根据层级信息构建完整的多层级上下文
   *
   * @param tenantId 租户ID
   * @param organizationId 组织ID（可选）
   * @param departmentId 部门ID（可选）
   * @param userId 用户ID（可选）
   * @returns 多层级上下文
   */
  buildContext(
    tenantId: string,
    organizationId?: string,
    departmentId?: string,
    userId?: string
  ): Promise<IMultiLevelContext>;

  /**
   * 获取上下文配置
   *
   * 获取上下文策略的配置信息
   *
   * @returns 上下文配置
   */
  getContextConfig(): Record<string, unknown>;
}
