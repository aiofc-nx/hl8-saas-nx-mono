/**
 * 键前缀多层级隔离策略
 *
 * 基于键前缀的多层级数据隔离策略实现
 * 使用键前缀方式实现租户、组织、部门、用户四级隔离
 *
 * @fileoverview 键前缀多层级隔离策略实现
 * @author HL8 Team
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import {
  IMultiLevelContext,
  IMultiLevelIsolationConfig,
  IMultiLevelStats,
  ILevelStats,
} from '../types/multi-level.types';
import { IMultiLevelIsolationStrategy } from './multi-level-isolation-strategy.interface';

/**
 * 键前缀多层级隔离策略
 *
 * 实现基于键前缀的多层级数据隔离策略
 *
 * @description 键前缀策略通过为数据键添加层级前缀来实现隔离
 * 支持租户、组织、部门、用户四个层级的键前缀隔离
 *
 * ## 业务规则
 *
 * ### 键生成规则
 * - 键格式：`multi:tenant:{tenantId}:org:{orgId}:dept:{deptId}:user:{userId}:{originalKey}`
 * - 每个层级都有对应的前缀标识
 * - 键长度不能超过配置的最大长度限制
 * - 键生成必须保证唯一性和可逆性
 *
 * ### 隔离级别规则
 * - 租户级：`multi:tenant:{tenantId}:{originalKey}`
 * - 组织级：`multi:tenant:{tenantId}:org:{orgId}:{originalKey}`
 * - 部门级：`multi:tenant:{tenantId}:org:{orgId}:dept:{deptId}:{originalKey}`
 * - 用户级：`multi:tenant:{tenantId}:org:{orgId}:dept:{deptId}:user:{userId}:{originalKey}`
 *
 * ### 数据隔离规则
 * - 隔离后的数据包含完整的层级标识
 * - 数据提取时验证层级匹配
 * - 支持批量隔离和提取操作
 * - 提供性能统计和监控
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ExampleService {
 *   constructor(
 *     private readonly isolationStrategy: KeyPrefixMultiLevelIsolationStrategy
 *   ) {}
 *
 *   async getUserData(userId: string) {
 *     const context: IMultiLevelContext = {
 *       tenantId: 'tenant-123',
 *       organizationId: 'org-456',
 *       departmentId: 'dept-789',
 *       userId: 'user-101',
 *       isolationLevel: 'user',
 *       timestamp: new Date()
 *     };
 *
 *     const isolationKey = await this.isolationStrategy.getIsolationKey(
 *       `user:${userId}`,
 *       context
 *     );
 *     // 结果: 'multi:tenant:tenant-123:org:org-456:dept:dept-789:user:user-101:user:user-101'
 *
 *     const namespace = await this.isolationStrategy.getIsolationNamespace(context);
 *     // 结果: 'ml_t_tenant123_o_org456_d_dept789_u_user101'
 *   }
 * }
 * ```
 */
@Injectable()
export class KeyPrefixMultiLevelIsolationStrategy
  implements IMultiLevelIsolationStrategy
{
  private stats!: IMultiLevelStats;

  constructor(
    private readonly config: IMultiLevelIsolationConfig,
    private readonly logger: PinoLogger = new PinoLogger()
  ) {
    this.logger.setContext({
      requestId: 'key-prefix-multi-level-isolation-strategy',
    });
    this.initializeStats();
  }

  /**
   * 获取隔离键
   *
   * 为指定的键生成包含多层级信息的隔离键
   *
   * @param key 原始键
   * @param context 多层级上下文
   * @returns 包含多层级信息的键
   */
  async getIsolationKey(
    key: string,
    context: IMultiLevelContext
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const parts = [this.config.keyPrefix || 'multi:'];

      // 添加租户级前缀
      if (context.tenantId) {
        parts.push(`tenant:${context.tenantId}`);
      }

      // 添加组织级前缀
      if (
        context.organizationId &&
        this.shouldIncludeLevel(context, 'organization')
      ) {
        parts.push(`org:${context.organizationId}`);
      }

      // 添加部门级前缀
      if (
        context.departmentId &&
        this.shouldIncludeLevel(context, 'department')
      ) {
        parts.push(`dept:${context.departmentId}`);
      }

      // 添加用户级前缀
      if (context.userId && this.shouldIncludeLevel(context, 'user')) {
        parts.push(`user:${context.userId}`);
      }

      // 添加原始键
      parts.push(key);

      const isolationKey = parts.join(':');

      // 检查键长度限制
      if (
        this.config.levels.tenant.maxKeyLength &&
        isolationKey.length > this.config.levels.tenant.maxKeyLength
      ) {
        throw new Error(
          `Isolation key too long: ${isolationKey.length} > ${this.config.levels.tenant.maxKeyLength}`
        );
      }

      // 更新统计
      this.updateStats(context.isolationLevel, Date.now() - startTime, true);

      this.logger.debug('生成隔离键成功', {
        originalKey: key,
        isolationKey,
        context,
        duration: Date.now() - startTime,
      });

      return isolationKey;
    } catch (error) {
      this.updateStats(context.isolationLevel, Date.now() - startTime, false);
      this.logger.error('生成隔离键失败', {
        key,
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取隔离命名空间
   *
   * 为指定的多层级上下文生成命名空间标识
   *
   * @param context 多层级上下文
   * @returns 多层级命名空间
   */
  async getIsolationNamespace(context: IMultiLevelContext): Promise<string> {
    const startTime = Date.now();

    try {
      const parts = [this.config.namespacePrefix || 'ml_'];

      // 添加租户级标识
      if (context.tenantId) {
        parts.push(`t_${context.tenantId}`);
      }

      // 添加组织级标识
      if (
        context.organizationId &&
        this.shouldIncludeLevel(context, 'organization')
      ) {
        parts.push(`o_${context.organizationId}`);
      }

      // 添加部门级标识
      if (
        context.departmentId &&
        this.shouldIncludeLevel(context, 'department')
      ) {
        parts.push(`d_${context.departmentId}`);
      }

      // 添加用户级标识
      if (context.userId && this.shouldIncludeLevel(context, 'user')) {
        parts.push(`u_${context.userId}`);
      }

      const namespace = parts.join('_');

      // 更新统计
      this.updateStats(context.isolationLevel, Date.now() - startTime, true);

      this.logger.debug('生成隔离命名空间成功', {
        namespace,
        context,
        duration: Date.now() - startTime,
      });

      return namespace;
    } catch (error) {
      this.updateStats(context.isolationLevel, Date.now() - startTime, false);
      this.logger.error('生成隔离命名空间失败', {
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 隔离数据
   *
   * 将数据与多层级信息绑定，实现数据隔离
   *
   * @param data 原始数据
   * @param context 多层级上下文
   * @returns 隔离后的数据
   */
  async isolateData<T = unknown>(
    data: T,
    context: IMultiLevelContext
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const isolatedData = {
        ...data,
        _multiLevelContext: {
          tenantId: context.tenantId,
          organizationId: context.organizationId,
          departmentId: context.departmentId,
          userId: context.userId,
          isolationLevel: context.isolationLevel,
        },
        _isolatedAt: new Date(),
        _isolationStrategy: 'key-prefix',
      };

      // 更新统计
      this.updateStats(context.isolationLevel, Date.now() - startTime, true);

      this.logger.debug('数据隔离成功', {
        dataType: typeof data,
        context,
        duration: Date.now() - startTime,
      });

      return isolatedData;
    } catch (error) {
      this.updateStats(context.isolationLevel, Date.now() - startTime, false);
      this.logger.error('数据隔离失败', {
        data,
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 提取数据
   *
   * 从隔离数据中提取多层级相关信息，返回纯净的业务数据
   *
   * @param data 隔离数据
   * @param context 多层级上下文
   * @returns 提取后的业务数据
   */
  async extractData<T = unknown>(
    data: T,
    context: IMultiLevelContext
  ): Promise<T> {
    const startTime = Date.now();

    try {
      if (!data || typeof data !== 'object') {
        return data;
      }

      const {
        _multiLevelContext,
        _isolatedAt,
        _isolationStrategy,
        ...cleanData
      } = data as Record<string, unknown>;

      // 验证层级匹配
      if (
        _multiLevelContext &&
        !this.validateContextMatch(_multiLevelContext, context)
      ) {
        throw new Error(
          `Context mismatch: expected ${JSON.stringify(
            context
          )}, got ${JSON.stringify(_multiLevelContext)}`
        );
      }

      // 更新统计
      this.updateStats(context.isolationLevel, Date.now() - startTime, true);

      this.logger.debug('数据提取成功', {
        dataType: typeof data,
        context,
        duration: Date.now() - startTime,
      });

      return cleanData as T;
    } catch (error) {
      this.updateStats(context.isolationLevel, Date.now() - startTime, false);
      this.logger.error('数据提取失败', {
        data,
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 判断是否需要在指定级别隔离
   *
   * @param context 多层级上下文
   * @returns 是否需要隔离
   */
  async shouldIsolateAtLevel(context: IMultiLevelContext): Promise<boolean> {
    const levelConfig = this.config.levels[context.isolationLevel];
    return levelConfig ? levelConfig.enableIsolation : true;
  }

  /**
   * 验证层级关系
   *
   * @param context 多层级上下文
   * @returns 层级关系是否有效
   */
  async validateHierarchy(context: IMultiLevelContext): Promise<boolean> {
    try {
      // 基础验证
      if (!context.tenantId) {
        return false;
      }

      // 验证层级逻辑
      if (context.organizationId && !context.tenantId) {
        return false;
      }

      if (context.departmentId && !context.organizationId) {
        return false;
      }

      if (context.userId && !context.departmentId) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('层级关系验证失败', {
        context,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 批量生成隔离键
   *
   * @param keys 原始键列表
   * @param context 多层级上下文
   * @returns 多层级隔离键列表
   */
  async getIsolationKeys(
    keys: string[],
    context: IMultiLevelContext
  ): Promise<string[]> {
    const startTime = Date.now();

    try {
      const isolationKeys = await Promise.all(
        keys.map((key) => this.getIsolationKey(key, context))
      );

      this.logger.debug('批量生成隔离键成功', {
        originalKeys: keys,
        isolationKeys,
        context,
        duration: Date.now() - startTime,
      });

      return isolationKeys;
    } catch (error) {
      this.logger.error('批量生成隔离键失败', {
        keys,
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量隔离数据
   *
   * @param dataList 原始数据列表
   * @param context 多层级上下文
   * @returns 隔离后的数据列表
   */
  async isolateDataList<T = unknown>(
    dataList: T[],
    context: IMultiLevelContext
  ): Promise<T[]> {
    const startTime = Date.now();

    try {
      const isolatedDataList = await Promise.all(
        dataList.map((data) => this.isolateData(data, context))
      );

      this.logger.debug('批量数据隔离成功', {
        originalDataCount: dataList.length,
        isolatedDataCount: isolatedDataList.length,
        context,
        duration: Date.now() - startTime,
      });

      return isolatedDataList;
    } catch (error) {
      this.logger.error('批量数据隔离失败', {
        dataList,
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取隔离配置
   *
   * @returns 隔离配置
   */
  getIsolationConfig(): IMultiLevelIsolationConfig {
    return this.config;
  }

  /**
   * 获取策略统计
   *
   * @returns 策略统计信息
   */
  async getStats(): Promise<IMultiLevelStats> {
    return { ...this.stats };
  }

  /**
   * 重置统计
   *
   * @returns 重置是否成功
   */
  async resetStats(): Promise<boolean> {
    try {
      this.initializeStats();
      this.logger.debug('策略统计重置成功');
      return true;
    } catch (error) {
      this.logger.error('策略统计重置失败', {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 判断是否应该包含指定级别
   *
   * @private
   */
  private shouldIncludeLevel(
    context: IMultiLevelContext,
    level: string
  ): boolean {
    const levelHierarchy = ['tenant', 'organization', 'department', 'user'];
    const contextLevelIndex = levelHierarchy.indexOf(context.isolationLevel);
    const targetLevelIndex = levelHierarchy.indexOf(level);

    return targetLevelIndex <= contextLevelIndex;
  }

  /**
   * 验证上下文匹配
   *
   * @private
   */
  private validateContextMatch(
    dataContext: unknown,
    expectedContext: IMultiLevelContext
  ): boolean {
    if (!dataContext || typeof dataContext !== 'object') {
      return false;
    }

    const context = dataContext as Record<string, unknown>;
    return (
      context['tenantId'] === expectedContext.tenantId &&
      context['organizationId'] === expectedContext.organizationId &&
      context['departmentId'] === expectedContext.departmentId &&
      context['userId'] === expectedContext.userId
    );
  }

  /**
   * 更新统计信息
   *
   * @private
   */
  private updateStats(level: string, latency: number, success: boolean): void {
    const levelStats = this.stats[
      level as keyof IMultiLevelStats
    ] as ILevelStats;
    if (
      levelStats &&
      typeof levelStats === 'object' &&
      'operations' in levelStats
    ) {
      levelStats.operations++;
      if (success) {
        levelStats.successfulOperations++;
      } else {
        levelStats.failedOperations++;
      }

      // 更新延迟统计
      levelStats.averageLatency =
        (levelStats.averageLatency * (levelStats.operations - 1) + latency) /
        levelStats.operations;
      levelStats.maxLatency = Math.max(levelStats.maxLatency, latency);
      levelStats.minLatency = Math.min(levelStats.minLatency, latency);
      levelStats.errorRate =
        levelStats.failedOperations / levelStats.operations;
    }
  }

  /**
   * 初始化统计信息
   *
   * @private
   */
  private initializeStats(): void {
    const createLevelStats = (): ILevelStats => ({
      operations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: Number.MAX_SAFE_INTEGER,
      errorRate: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
    });

    this.stats = {
      tenant: createLevelStats(),
      organization: createLevelStats(),
      department: createLevelStats(),
      user: createLevelStats(),
      timestamp: new Date(),
    };
  }
}
