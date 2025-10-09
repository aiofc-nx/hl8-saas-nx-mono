/**
 * 租户隔离服务
 *
 * 实现租户数据隔离的核心服务
 * 提供数据隔离策略管理和租户键生成功能
 *
 * @fileoverview 租户隔离服务实现
 * @since 1.0.0
 */

import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import {
  ITenantIsolationConfig,
  IMultiTenancyModuleOptions,
} from '../types/tenant-context.types';
import { ITenantIsolationStrategy } from '../strategies/isolation-strategy.interface';
import { TenantContextService } from './tenant-context.service';
import { DI_TOKENS } from '../constants';
import {
  TenantConfigInvalidException,
  TenantIsolationFailedException,
  TenantContextInvalidException,
} from '../exceptions';

/**
 * 租户隔离服务
 *
 * 实现租户数据隔离的核心功能
 *
 * @description 租户隔离服务是多租户架构的关键组件
 * 负责实现数据隔离策略、生成租户键、管理命名空间等核心功能
 *
 * ## 业务规则
 *
 * ### 隔离策略规则
 * - 每个租户的数据必须完全隔离，不能互相访问
 * - 隔离策略必须支持多种实现方式（键前缀、命名空间、数据库等）
 * - 隔离策略的切换必须是无缝的，不影响现有数据
 * - 隔离策略必须支持批量操作以提高性能
 *
 * ### 键生成规则
 * - 租户键必须包含租户标识符，确保唯一性
 * - 键生成必须保证可逆性，能够从键中提取租户信息
 * - 键格式必须符合存储系统的要求（Redis、数据库等）
 * - 键生成性能必须满足高并发要求
 *
 * ### 命名空间规则
 * - 命名空间必须唯一标识租户，避免冲突
 * - 命名空间必须支持层级结构，便于管理
 * - 命名空间创建和销毁必须自动化
 * - 命名空间必须支持权限控制
 *
 * ### 数据隔离规则
 * - 数据隔离必须在所有存储层生效（缓存、数据库、消息队列等）
 * - 隔离后的数据必须包含租户元信息
 * - 数据提取时必须验证租户权限
 * - 隔离操作必须支持事务和回滚
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
 * export class SomeService {
 *   constructor(private readonly tenantIsolationService: TenantIsolationService) {}
 *
 *   async getUserData(userId: string): Promise<Record<string, unknown>> {
 *     // 自动获取当前租户ID
 *     const tenantId = this.tenantIsolationService.getCurrentTenant();
 *
 *     // 生成租户键
 *     const tenantKey = await this.tenantIsolationService.getTenantKey(`user:${userId}`, tenantId);
 *
 *     // 使用租户键获取数据
 *     return await this.dataStore.get(tenantKey);
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantIsolationService implements OnModuleInit {
  private readonly isolationConfig: ITenantIsolationConfig;
  private readonly logger!: PinoLogger;
  private isolationStrategy!: ITenantIsolationStrategy;

  constructor(
    @Inject(DI_TOKENS.MODULE_OPTIONS) options: IMultiTenancyModuleOptions,
    private readonly tenantContextService: TenantContextService,
    logger: PinoLogger
  ) {
    if (!options?.isolation) {
      throw new TenantConfigInvalidException(
        'Tenant isolation configuration missing',
        'The tenant isolation configuration is required but not provided',
        { configType: 'isolation' }
      );
    }

    this.isolationConfig = options.isolation;
    this.logger = logger;
    this.logger.setContext({ requestId: 'tenant-isolation-service' });
  }

  /**
   * 模块初始化
   *
   * 初始化租户隔离服务
   *
   * @description 创建隔离策略实例、验证配置等初始化操作
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.info('租户隔离服务初始化开始');

      // 创建隔离策略实例
      await this.initializeIsolationStrategy();

      // 验证隔离配置
      this.validateIsolationConfig();

      this.logger.info('租户隔离服务初始化完成', {
        strategy: this.isolationConfig.strategy,
        level: this.isolationConfig.level,
      });
    } catch (error) {
      this.logger.error('租户隔离服务初始化失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取租户键
   *
   * 为指定的键生成包含租户信息的租户键，用于数据隔离。
   *
   * @description 此方法生成包含租户标识的键，用于数据隔离。
   * 如果当前没有租户上下文或隔离未启用，则返回原始键。
   * 支持多种隔离策略，确保数据完全隔离。
   *
   * ## 业务规则
   *
   * ### 键生成规则
   * - 租户ID存在时生成租户键
   * - 租户ID不存在时返回原始键
   * - 隔离未启用时返回原始键
   * - 键格式必须符合存储系统要求
   *
   * ### 隔离策略规则
   * - 支持键前缀隔离策略
   * - 支持命名空间隔离策略
   * - 支持数据库隔离策略
   * - 隔离策略可动态配置
   *
   * ### 性能规则
   * - 键生成延迟小于1ms
   * - 支持高频调用
   * - 支持并发访问
   * - 内存占用最小化
   *
   * @param key 原始键
   * @param tenantId 租户ID（可选，默认使用当前上下文）
   * @returns 包含租户信息的键
   *
   * @throws {TenantIsolationFailedException} 当隔离失败时抛出
   *
   * @example
   * ```typescript
   * const tenantKey = await tenantIsolationService.getTenantKey('user:123');
   * // 结果: 'tenant:tenant-456:user:123'
   * ```
   */
  async getTenantKey(key: string, tenantId?: string): Promise<string> {
    try {
      // 获取租户ID
      const currentTenantId = tenantId || this.getCurrentTenant();

      // 如果不需要隔离，返回原始键
      if (!currentTenantId || !this.isolationConfig.enableIsolation) {
        return key;
      }

      // 检查是否需要隔离
      const shouldIsolate = await this.isolationStrategy.shouldIsolate(
        currentTenantId
      );
      if (!shouldIsolate) {
        return key;
      }

      // 生成租户键
      const tenantKey = await this.isolationStrategy.getTenantKey(
        key,
        currentTenantId
      );

      this.logger.debug('租户键已生成', {
        originalKey: key,
        tenantKey,
        tenantId: currentTenantId,
      });

      return tenantKey;
    } catch (error) {
      this.logger.error('生成租户键失败', {
        key,
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取租户命名空间
   *
   * 为指定的租户生成命名空间标识
   *
   * @description 生成租户的命名空间，用于数据库、缓存等资源的隔离
   * 如果当前没有租户上下文，则返回默认命名空间
   *
   * @param tenantId 租户ID（可选，默认使用当前上下文）
   * @returns 租户命名空间
   *
   * @example
   * ```typescript
   * const namespace = await tenantIsolationService.getTenantNamespace();
   * // 结果: 'tenant_456' 或 'db_tenant_456'
   * ```
   */
  async getTenantNamespace(tenantId?: string): Promise<string> {
    try {
      // 获取租户ID
      const currentTenantId = tenantId || this.getCurrentTenant();

      // 如果没有租户ID，返回默认命名空间
      if (!currentTenantId) {
        return 'default';
      }

      // 生成租户命名空间
      const namespace = await this.isolationStrategy.getTenantNamespace(
        currentTenantId
      );

      this.logger.debug('租户命名空间已生成', {
        tenantId: currentTenantId,
        namespace,
      });

      return namespace;
    } catch (error) {
      this.logger.error('生成租户命名空间失败', {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 隔离数据
   *
   * 将数据与租户信息绑定，实现数据隔离
   *
   * @description 为数据添加租户标识，确保数据与特定租户关联
   * 如果当前没有租户上下文，则返回原始数据
   *
   * @param data 原始数据
   * @param tenantId 租户ID（可选，默认使用当前上下文）
   * @returns 隔离后的数据
   *
   * @example
   * ```typescript
   * const isolatedData = await tenantIsolationService.isolateData({
   *   name: 'John',
   *   age: 30
   * });
   * // 结果: { name: 'John', age: 30, _tenantId: 'tenant-456', _isolatedAt: Date }
   * ```
   */
  async isolateData<T = unknown>(data: T, tenantId?: string): Promise<T> {
    try {
      // 获取租户ID
      const currentTenantId = tenantId || this.getCurrentTenant();

      // 如果不需要隔离，返回原始数据
      if (!currentTenantId || !this.isolationConfig.enableIsolation) {
        return data;
      }

      // 检查是否需要隔离
      const shouldIsolate = await this.isolationStrategy.shouldIsolate(
        currentTenantId
      );
      if (!shouldIsolate) {
        return data;
      }

      // 隔离数据
      const isolatedData = await this.isolationStrategy.isolateData(
        data,
        currentTenantId
      );

      this.logger.debug('数据已隔离', {
        tenantId: currentTenantId,
        dataKeys: Object.keys(data || {}),
        isolatedDataKeys: Object.keys(isolatedData || {}),
      });

      return isolatedData;
    } catch (error) {
      this.logger.error('隔离数据失败', {
        data,
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 提取租户数据
   *
   * 从隔离数据中提取租户相关信息，返回纯净的业务数据
   *
   * @description 移除数据中的租户标识，返回原始业务数据
   * 同时验证数据的租户归属是否正确
   *
   * @param data 隔离数据
   * @param tenantId 期望的租户ID（可选，默认使用当前上下文）
   * @returns 提取后的业务数据
   *
   * @example
   * ```typescript
   * const cleanData = await tenantIsolationService.extractTenantData(isolatedData);
   * // 结果: { name: 'John', age: 30 }
   * ```
   */
  async extractTenantData<T = unknown>(data: T, tenantId?: string): Promise<T> {
    try {
      // 获取租户ID
      const currentTenantId = tenantId || this.getCurrentTenant();

      // 如果没有租户ID，返回原始数据
      if (!currentTenantId) {
        return data;
      }

      // 提取租户数据
      const cleanData = await this.isolationStrategy.extractTenantData(
        data,
        currentTenantId
      );

      this.logger.debug('租户数据已提取', {
        tenantId: currentTenantId,
        originalDataKeys: Object.keys(data || {}),
        cleanDataKeys: Object.keys(cleanData || {}),
      });

      return cleanData;
    } catch (error) {
      this.logger.error('提取租户数据失败', {
        data,
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量生成租户键
   *
   * 批量为多个键生成租户键
   *
   * @description 支持批量键生成以提高性能
   * 适用于需要处理大量键的场景
   *
   * @param keys 原始键列表
   * @param tenantId 租户ID（可选，默认使用当前上下文）
   * @returns 租户键列表
   *
   * @example
   * ```typescript
   * const tenantKeys = await tenantIsolationService.getTenantKeys([
   *   'user:123',
   *   'user:456',
   *   'user:789'
   * ]);
   * // 结果: ['tenant:tenant-456:user:123', 'tenant:tenant-456:user:456', 'tenant:tenant-456:user:789']
   * ```
   */
  async getTenantKeys(keys: string[], tenantId?: string): Promise<string[]> {
    try {
      const promises = keys.map((key) => this.getTenantKey(key, tenantId));
      const tenantKeys = await Promise.all(promises);

      this.logger.debug('批量租户键已生成', {
        keyCount: keys.length,
        tenantKeysCount: tenantKeys.length,
      });

      return tenantKeys;
    } catch (error) {
      this.logger.error('批量生成租户键失败', {
        keys,
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量隔离数据
   *
   * 批量隔离多个数据对象
   *
   * @description 支持批量数据隔离以提高性能
   * 适用于需要处理大量数据的场景
   *
   * @param dataList 原始数据列表
   * @param tenantId 租户ID（可选，默认使用当前上下文）
   * @returns 隔离后的数据列表
   *
   * @example
   * ```typescript
   * const isolatedDataList = await tenantIsolationService.isolateDataList([
   *   { name: 'John', age: 30 },
   *   { name: 'Jane', age: 25 }
   * ]);
   * ```
   */
  async isolateDataList<T = unknown>(
    dataList: T[],
    tenantId?: string
  ): Promise<T[]> {
    try {
      const promises = dataList.map((data) => this.isolateData(data, tenantId));
      const isolatedDataList = await Promise.all(promises);

      this.logger.debug('批量数据已隔离', {
        dataCount: dataList.length,
        isolatedDataCount: isolatedDataList.length,
      });

      return isolatedDataList;
    } catch (error) {
      this.logger.error('批量隔离数据失败', {
        dataList,
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 检查是否需要隔离
   *
   * 根据租户ID判断是否需要进行数据隔离
   *
   * @description 某些特殊租户可能不需要隔离
   * 此方法用于判断特定租户是否需要隔离处理
   *
   * @param tenantId 租户ID（可选，默认使用当前上下文）
   * @returns 是否需要隔离
   *
   * @example
   * ```typescript
   * const shouldIsolate = await tenantIsolationService.shouldIsolate();
   * if (shouldIsolate) {
   *   // 执行隔离操作
   * }
   * ```
   */
  async shouldIsolate(tenantId?: string): Promise<boolean> {
    try {
      // 获取租户ID
      const currentTenantId = tenantId || this.getCurrentTenant();

      // 如果没有租户ID或未启用隔离，返回false
      if (!currentTenantId || !this.isolationConfig.enableIsolation) {
        return false;
      }

      // 检查是否需要隔离
      const shouldIsolate = await this.isolationStrategy.shouldIsolate(
        currentTenantId
      );

      this.logger.debug('隔离检查完成', {
        tenantId: currentTenantId,
        shouldIsolate,
      });

      return shouldIsolate;
    } catch (error) {
      this.logger.error('检查隔离需求失败', {
        tenantId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 获取当前租户ID
   *
   * 从租户上下文服务获取当前租户ID
   *
   * @description 获取当前请求的租户ID
   * 如果当前没有租户上下文，则返回null
   *
   * @returns 当前租户ID或null
   */
  private getCurrentTenant(): string | null {
    try {
      return this.tenantContextService.getTenant();
    } catch (error) {
      this.logger.error('获取当前租户ID失败', {
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 初始化隔离策略
   *
   * 根据配置创建隔离策略实例
   *
   * @description 创建相应的隔离策略实例
   * 支持多种策略类型：键前缀、命名空间、数据库、模式等
   */
  private async initializeIsolationStrategy(): Promise<void> {
    try {
      // 这里应该根据策略类型创建相应的策略实例
      // 由于我们还没有实现具体的策略类，这里先创建一个默认实现
      this.isolationStrategy = {
        getTenantKey: async (key: string, tenantId: string) => {
          const prefix = this.isolationConfig.keyPrefix || 'tenant:';
          return `${prefix}${tenantId}:${key}`;
        },
        getTenantNamespace: async (tenantId: string) => {
          return `tenant_${tenantId}`;
        },
        isolateData: async <T = unknown>(
          data: T,
          tenantId: string
        ): Promise<T> => {
          if (data && typeof data === 'object') {
            return {
              ...(data as object),
              _tenantId: tenantId,
              _isolatedAt: new Date(),
            } as T;
          }
          return {
            data,
            _tenantId: tenantId,
            _isolatedAt: new Date(),
          } as T;
        },
        extractTenantData: async <T = unknown>(
          data: T,
          tenantId: string
        ): Promise<T> => {
          if (!data || typeof data !== 'object') {
            return data;
          }

          const dataObj = data as Record<string, unknown>;
          const { _tenantId, _isolatedAt, ...cleanData } = dataObj;
          if (_tenantId !== tenantId) {
            throw new Error(
              `Tenant ID mismatch: expected ${tenantId}, got ${_tenantId}`
            );
          }
          return cleanData as T;
        },
        shouldIsolate: async (tenantId: string) => {
          return tenantId !== 'default' && tenantId !== 'system';
        },
        getIsolationConfig: () => this.isolationConfig,
      };

      this.logger.info('隔离策略已初始化', {
        strategy: this.isolationConfig.strategy,
      });
    } catch (error) {
      this.logger.error('初始化隔离策略失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 验证隔离配置
   *
   * 验证隔离配置的有效性
   *
   * @description 检查配置参数的完整性和有效性
   * 确保隔离策略能够正常工作
   */
  private validateIsolationConfig(): void {
    try {
      if (!this.isolationConfig) {
        throw new Error('隔离配置不能为空');
      }

      if (!this.isolationConfig.strategy) {
        throw new Error('隔离策略不能为空');
      }

      if (!this.isolationConfig.level) {
        throw new Error('隔离级别不能为空');
      }

      const validStrategies = ['key-prefix', 'namespace', 'database', 'schema'];
      if (!validStrategies.includes(this.isolationConfig.strategy)) {
        throw new Error(`不支持的隔离策略: ${this.isolationConfig.strategy}`);
      }

      const validLevels = ['strict', 'relaxed', 'disabled'];
      if (!validLevels.includes(this.isolationConfig.level)) {
        throw new Error(`不支持的隔离级别: ${this.isolationConfig.level}`);
      }

      this.logger.debug('隔离配置验证通过', {
        strategy: this.isolationConfig.strategy,
        level: this.isolationConfig.level,
      });
    } catch (error) {
      this.logger.error('隔离配置验证失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

/**
 * 租户上下文服务接口
 *
 * 定义租户上下文服务的接口
 *
 * @description 为了避免循环依赖，定义接口而不是直接导入
 */
export interface ITenantContextService {
  getTenant(): string | null;
  getUser(): string | null;
  getRequestId(): string | null;
  getSessionId(): string | null;
}
