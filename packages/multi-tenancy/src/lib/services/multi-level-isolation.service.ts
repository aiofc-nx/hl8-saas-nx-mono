/**
 * 多层级隔离服务
 *
 * 提供多层级数据隔离的核心服务
 * 支持租户、组织、部门、用户四个层级的数据隔离
 *
 * @fileoverview 多层级隔离服务实现
 * @since 1.0.0
 */

import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import {
  IMultiLevelContext,
  IMultiLevelIsolationConfig,
  IMultiLevelAction,
  IMultiLevelStats,
  IHierarchyPath,
  IMultiTenancyModuleOptions,
} from '../types/tenant-context.types';
import {
  IMultiLevelIsolationStrategy,
  IMultiLevelIsolationStrategyFactory,
  IMultiLevelContextStrategy,
} from '../strategies/multi-level-isolation-strategy.interface';
import { TenantContextService } from './tenant-context.service';
import { DI_TOKENS } from '../constants';
import {
  TenantConfigInvalidException,
  MultiLevelContextInvalidException,
  MultiLevelIsolationFailedException,
} from '../exceptions';

/**
 * 多层级隔离服务
 *
 * 实现多层级数据隔离的核心服务，提供键生成、数据隔离、数据提取等功能
 *
 * @description 多层级隔离服务是多租户架构的核心组件
 * 负责管理租户、组织、部门、用户四个层级的数据隔离
 *
 * ## 业务规则
 *
 * ### 隔离级别规则
 * - 租户级：最高级别隔离，所有数据按租户隔离
 * - 组织级：租户内按组织隔离，组织间数据完全隔离
 * - 部门级：组织内按部门隔离，部门间数据完全隔离
 * - 用户级：部门内按用户隔离，用户间数据完全隔离
 * - 隔离级别可以动态配置，支持运行时调整
 *
 * ### 键生成规则
 * - 多层级键必须包含完整的层级路径信息
 * - 键格式：`multi:tenant:{tenantId}:org:{orgId}:dept:{deptId}:user:{userId}:{originalKey}`
 * - 键长度不能超过配置的最大长度限制
 * - 键生成必须保证唯一性和可逆性
 *
 * ### 数据隔离规则
 * - 所有数据操作必须经过多层级隔离处理
 * - 隔离后的数据必须包含层级标识和隔离时间戳
 * - 数据提取时必须验证层级权限
 * - 隔离操作必须支持事务回滚
 *
 * ### 性能规则
 * - 键生成操作延迟必须小于1ms
 * - 数据隔离操作延迟必须小于5ms
 * - 支持批量操作以提高性能
 * - 提供缓存机制减少重复计算
 *
 * ## 业务逻辑流程
 *
 * 1. **服务初始化**：加载隔离配置，初始化隔离策略
 * 2. **上下文获取**：从租户上下文服务获取当前多层级上下文
 * 3. **键生成**：根据上下文和原始键生成多层级隔离键
 * 4. **数据隔离**：将业务数据与层级信息绑定
 * 5. **数据提取**：从隔离数据中提取业务数据并验证权限
 * 6. **统计收集**：收集操作统计信息用于监控
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ExampleService {
 *   constructor(
 *     private readonly multiLevelIsolationService: MultiLevelIsolationService
 *   ) {}
 *
 *   async getUserData(userId: string) {
 *     // 获取当前多层级上下文
 *     const context = this.multiLevelIsolationService.getCurrentContext();
 *
 *     // 生成隔离键
 *     const isolationKey = await this.multiLevelIsolationService.getIsolationKey(
 *       `user:${userId}`,
 *       context
 *     );
 *
 *     // 从缓存或数据库获取数据
 *     const isolatedData = await this.cache.get(isolationKey);
 *
 *     // 提取业务数据
 *     const cleanData = await this.multiLevelIsolationService.extractData(
 *       isolatedData,
 *       context
 *     );
 *
 *     return cleanData;
 *   }
 *
 *   async saveUserData(userId: string, userData: Record<string, unknown>) {
 *     // 获取当前多层级上下文
 *     const context = this.multiLevelIsolationService.getCurrentContext();
 *
 *     // 隔离数据
 *     const isolatedData = await this.multiLevelIsolationService.isolateData(
 *       userData,
 *       context
 *     );
 *
 *     // 生成隔离键
 *     const isolationKey = await this.multiLevelIsolationService.getIsolationKey(
 *       `user:${userId}`,
 *       context
 *     );
 *
 *     // 保存到缓存或数据库
 *     await this.cache.set(isolationKey, isolatedData);
 *   }
 * }
 * ```
 */
@Injectable()
export class MultiLevelIsolationService
  implements OnModuleInit, OnModuleDestroy
{
  private isolationConfig!: IMultiLevelIsolationConfig;
  private isolationStrategy!: IMultiLevelIsolationStrategy;
  private contextStrategy!: IMultiLevelContextStrategy;
  private isInitialized = false;

  constructor(
    private readonly logger: PinoLogger,
    private readonly tenantContextService: TenantContextService,
    @Inject(DI_TOKENS.MODULE_OPTIONS)
    private readonly options: IMultiTenancyModuleOptions
  ) {
    if (!options?.multiLevel) {
      throw new TenantConfigInvalidException(
        'Multi-level isolation configuration missing',
        'The multi-level isolation configuration is required but not provided',
        { configType: 'multiLevel' }
      );
    }

    this.logger.setContext({ requestId: 'multi-level-isolation-service' });
  }

  /**
   * 模块初始化
   *
   * 初始化多层级隔离服务，加载配置和策略
   */
  async onModuleInit(): Promise<void> {
    try {
      this.isolationConfig = this.options.multiLevel || {
        enableMultiLevelIsolation: true,
        defaultIsolationLevel: 'tenant',
        keyPrefix: 'multi:',
        namespacePrefix: 'ml_',
        levels: {
          tenant: {
            strategy: 'key-prefix',
            keyPrefix: 'tenant:',
            enableIsolation: true,
          },
          organization: {
            strategy: 'key-prefix',
            keyPrefix: 'org:',
            enableIsolation: true,
          },
          department: {
            strategy: 'key-prefix',
            keyPrefix: 'dept:',
            enableIsolation: true,
          },
          user: {
            strategy: 'key-prefix',
            keyPrefix: 'user:',
            enableIsolation: true,
          },
        },
        enableHierarchyValidation: true,
        enablePermissionCheck: true,
      };

      await this.initializeIsolationStrategy();
      await this.initializeContextStrategy();

      this.isInitialized = true;
      this.logger.info('多层级隔离服务初始化成功', {
        config: this.isolationConfig,
      });
    } catch (error) {
      this.logger.error('多层级隔离服务初始化失败', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }
  }

  /**
   * 模块销毁
   *
   * 清理多层级隔离服务的资源
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.isInitialized = false;
      this.logger.info('多层级隔离服务已销毁');
    } catch (error) {
      this.logger.error('多层级隔离服务销毁失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 获取隔离键
   *
   * 为指定的键生成包含多层级信息的隔离键，支持租户、组织、部门、用户四个层级。
   *
   * @description 此方法为指定的键生成包含多层级信息的隔离键。
   * 支持租户、组织、部门、用户四个层级的数据隔离，确保数据完全隔离。
   *
   * ## 业务规则
   *
   * ### 隔离键生成规则
   * - 包含完整的层级路径信息
   * - 键格式：`multi:tenant:{tenantId}:org:{orgId}:dept:{deptId}:user:{userId}:{originalKey}`
   * - 键长度不能超过配置的最大长度限制
   * - 键生成必须保证唯一性和可逆性
   *
   * ### 上下文验证规则
   * - 多层级上下文必须有效
   * - 租户ID是必填字段
   * - 组织ID、部门ID、用户ID是可选的
   * - 上下文验证失败时抛出异常
   *
   * ### 性能规则
   * - 键生成操作延迟必须小于1ms
   * - 支持高频调用
   * - 支持并发访问
   * - 内存占用最小化
   *
   * @param key 原始键
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 包含多层级信息的键
   *
   * @throws {Error} 当服务未初始化时抛出异常
   * @throws {Error} 当上下文无效时抛出异常
   *
   * @example
   * ```typescript
   * const isolationKey = await service.getIsolationKey('user:123');
   * // 结果: 'multi:tenant:tenant-456:org:org-789:user:123'
   * ```
   */
  async getIsolationKey(
    key: string,
    context?: IMultiLevelContext
  ): Promise<string> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        throw new Error('多层级上下文不可用');
      }

      const isolationKey = await this.isolationStrategy.getIsolationKey(
        key,
        ctx
      );

      this.logger.debug('生成隔离键成功', {
        originalKey: key,
        isolationKey,
        context: ctx,
      });

      return isolationKey;
    } catch (error) {
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
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 多层级命名空间
   *
   * @example
   * ```typescript
   * const namespace = await service.getIsolationNamespace();
   * // 结果: 'ml_t_tenant456_o_org789_d_dept101'
   * ```
   */
  async getIsolationNamespace(context?: IMultiLevelContext): Promise<string> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        throw new Error('多层级上下文不可用');
      }

      const namespace = await this.isolationStrategy.getIsolationNamespace(ctx);

      this.logger.debug('生成隔离命名空间成功', {
        namespace,
        context: ctx,
      });

      return namespace;
    } catch (error) {
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
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 隔离后的数据
   *
   * @example
   * ```typescript
   * const isolatedData = await service.isolateData(
   *   { name: 'John', age: 30 },
   *   context
   * );
   * ```
   */
  async isolateData<T = unknown>(
    data: T,
    context?: IMultiLevelContext
  ): Promise<T> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        throw new Error('多层级上下文不可用');
      }

      const isolatedData = await this.isolationStrategy.isolateData(data, ctx);

      this.logger.debug('数据隔离成功', {
        dataType: typeof data,
        context: ctx,
        isolatedDataSize: JSON.stringify(isolatedData).length,
      });

      return isolatedData;
    } catch (error) {
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
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 提取后的业务数据
   *
   * @throws {Error} 当数据层级与上下文不匹配时抛出异常
   *
   * @example
   * ```typescript
   * const cleanData = await service.extractData(isolatedData);
   * // 结果: { name: 'John', age: 30 }
   * ```
   */
  async extractData<T = unknown>(
    data: T,
    context?: IMultiLevelContext
  ): Promise<T> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        throw new Error('多层级上下文不可用');
      }

      const cleanData = await this.isolationStrategy.extractData(data, ctx);

      this.logger.debug('数据提取成功', {
        dataType: typeof data,
        context: ctx,
        cleanDataSize: JSON.stringify(cleanData).length,
      });

      return cleanData;
    } catch (error) {
      this.logger.error('数据提取失败', {
        data,
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量生成隔离键
   *
   * 批量为多个键生成多层级隔离键
   *
   * @param keys 原始键列表
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 多层级隔离键列表
   *
   * @example
   * ```typescript
   * const isolationKeys = await service.getIsolationKeys([
   *   'user:123',
   *   'user:456',
   *   'user:789'
   * ]);
   * ```
   */
  async getIsolationKeys(
    keys: string[],
    context?: IMultiLevelContext
  ): Promise<string[]> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        throw new Error('多层级上下文不可用');
      }

      const isolationKeys = await this.isolationStrategy.getIsolationKeys(
        keys,
        ctx
      );

      this.logger.debug('批量生成隔离键成功', {
        originalKeys: keys,
        isolationKeys,
        context: ctx,
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
   * 批量隔离多个数据对象
   *
   * @param dataList 原始数据列表
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 隔离后的数据列表
   *
   * @example
   * ```typescript
   * const isolatedDataList = await service.isolateDataList([
   *   { name: 'John', age: 30 },
   *   { name: 'Jane', age: 25 }
   * ]);
   * ```
   */
  async isolateDataList<T = unknown>(
    dataList: T[],
    context?: IMultiLevelContext
  ): Promise<T[]> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        throw new Error('多层级上下文不可用');
      }

      const isolatedDataList = await this.isolationStrategy.isolateDataList(
        dataList,
        ctx
      );

      this.logger.debug('批量数据隔离成功', {
        originalDataCount: dataList.length,
        isolatedDataCount: isolatedDataList.length,
        context: ctx,
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
   * 判断是否需要在指定级别隔离
   *
   * 根据多层级上下文判断是否需要进行数据隔离
   *
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 是否需要隔离
   *
   * @example
   * ```typescript
   * const shouldIsolate = await service.shouldIsolateAtLevel();
   * if (shouldIsolate) {
   *   // 执行隔离操作
   * }
   * ```
   */
  async shouldIsolateAtLevel(context?: IMultiLevelContext): Promise<boolean> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        return false;
      }

      const shouldIsolate = await this.isolationStrategy.shouldIsolateAtLevel(
        ctx
      );

      this.logger.debug('隔离级别检查完成', {
        shouldIsolate,
        context: ctx,
      });

      return shouldIsolate;
    } catch (error) {
      this.logger.error('隔离级别检查失败', {
        context,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 验证层级关系
   *
   * 验证多层级上下文的层级关系是否有效
   *
   * @param context 多层级上下文（可选，默认使用当前上下文）
   * @returns 层级关系是否有效
   *
   * @example
   * ```typescript
   * const isValid = await service.validateHierarchy();
   * if (!isValid) {
   *   throw new Error('Invalid hierarchy');
   * }
   * ```
   */
  async validateHierarchy(context?: IMultiLevelContext): Promise<boolean> {
    this.ensureInitialized();

    try {
      const ctx = context || this.getCurrentContext();
      if (!ctx) {
        return false;
      }

      const isValid = await this.isolationStrategy.validateHierarchy(ctx);

      this.logger.debug('层级关系验证完成', {
        isValid,
        context: ctx,
      });

      return isValid;
    } catch (error) {
      this.logger.error('层级关系验证失败', {
        context,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 获取当前多层级上下文
   *
   * 从租户上下文服务获取当前的多层级上下文
   *
   * @returns 当前多层级上下文或null
   *
   * @example
   * ```typescript
   * const context = service.getCurrentContext();
   * if (context) {
   *   console.log('当前租户:', context.tenantId);
   *   console.log('当前组织:', context.organizationId);
   * }
   * ```
   */
  getCurrentContext(): IMultiLevelContext | null {
    try {
      const tenantContext = this.tenantContextService.getContext();
      if (!tenantContext) {
        return null;
      }

      const multiLevelContext: IMultiLevelContext = {
        tenantId: tenantContext.tenantId.toString(),
        userId: tenantContext.userId,
        requestId: tenantContext.requestId,
        isolationLevel: 'tenant', // 默认租户级隔离
        timestamp: tenantContext.timestamp || new Date(),
      };

      // 尝试从自定义上下文中获取组织、部门信息
      const organizationId =
        this.tenantContextService.getCustomContext<string>('organizationId');
      const departmentId =
        this.tenantContextService.getCustomContext<string>('departmentId');

      if (organizationId) {
        multiLevelContext.organizationId = organizationId;
        multiLevelContext.isolationLevel = 'organization';
      }

      if (departmentId) {
        multiLevelContext.departmentId = departmentId;
        multiLevelContext.isolationLevel = 'department';
      }

      if (multiLevelContext.userId) {
        multiLevelContext.isolationLevel = 'user';
      }

      return multiLevelContext;
    } catch (error) {
      this.logger.error('获取当前多层级上下文失败', {
        error: (error as Error).message,
      });
      return null;
    }
  }

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
   *
   * @example
   * ```typescript
   * const context = await service.buildContext(
   *   'tenant-123',
   *   'org-456',
   *   'dept-789',
   *   'user-101'
   * );
   * ```
   */
  async buildContext(
    tenantId: string,
    organizationId?: string,
    departmentId?: string,
    userId?: string
  ): Promise<IMultiLevelContext> {
    this.ensureInitialized();

    try {
      const context = await this.contextStrategy.buildContext(
        tenantId,
        organizationId,
        departmentId,
        userId
      );

      this.logger.debug('构建多层级上下文成功', {
        context,
      });

      return context;
    } catch (error) {
      this.logger.error('构建多层级上下文失败', {
        tenantId,
        organizationId,
        departmentId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取隔离配置
   *
   * 获取当前的多层级隔离配置信息
   *
   * @returns 隔离配置
   *
   * @example
   * ```typescript
   * const config = service.getIsolationConfig();
   * console.log('默认隔离级别:', config.defaultIsolationLevel);
   * ```
   */
  getIsolationConfig(): IMultiLevelIsolationConfig {
    return this.isolationConfig;
  }

  /**
   * 获取策略统计
   *
   * 获取多层级隔离策略的统计信息
   *
   * @returns 策略统计信息
   *
   * @example
   * ```typescript
   * const stats = await service.getStats();
   * console.log('租户级操作次数:', stats.tenant.operations);
   * ```
   */
  async getStats(): Promise<IMultiLevelStats> {
    this.ensureInitialized();

    try {
      const stats = await this.isolationStrategy.getStats();

      this.logger.debug('获取策略统计成功', {
        stats,
      });

      return stats;
    } catch (error) {
      this.logger.error('获取策略统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 重置统计
   *
   * 重置多层级隔离策略的统计信息
   *
   * @returns 重置是否成功
   *
   * @example
   * ```typescript
   * await service.resetStats();
   * ```
   */
  async resetStats(): Promise<boolean> {
    this.ensureInitialized();

    try {
      const success = await this.isolationStrategy.resetStats();

      this.logger.debug('重置策略统计成功', {
        success,
      });

      return success;
    } catch (error) {
      this.logger.error('重置策略统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 确保服务已初始化
   *
   * @private
   * @throws {Error} 当服务未初始化时抛出异常
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('多层级隔离服务未初始化');
    }
  }

  /**
   * 初始化隔离策略
   *
   * @private
   */
  private async initializeIsolationStrategy(): Promise<void> {
    try {
      // 这里应该根据配置创建相应的隔离策略
      // 目前使用默认的键前缀策略
      const { KeyPrefixMultiLevelIsolationStrategy } = await import(
        '../strategies/key-prefix-multi-level-isolation.strategy'
      );

      this.isolationStrategy = new KeyPrefixMultiLevelIsolationStrategy(
        this.isolationConfig
      );

      this.logger.debug('隔离策略初始化成功', {
        strategyType: 'KeyPrefixMultiLevelIsolationStrategy',
      });
    } catch (error) {
      this.logger.error('隔离策略初始化失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 初始化上下文策略
   *
   * @private
   */
  private async initializeContextStrategy(): Promise<void> {
    try {
      // 这里应该根据配置创建相应的上下文策略
      // 目前使用默认的上下文策略
      const { DefaultMultiLevelContextStrategy } = await import(
        '../strategies/default-multi-level-context.strategy'
      );

      this.contextStrategy = new DefaultMultiLevelContextStrategy();

      this.logger.debug('上下文策略初始化成功', {
        strategyType: 'DefaultMultiLevelContextStrategy',
      });
    } catch (error) {
      this.logger.error('上下文策略初始化失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
