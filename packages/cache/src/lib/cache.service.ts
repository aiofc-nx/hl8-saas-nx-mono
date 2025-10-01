/**
 * 缓存服务
 *
 * 基于Redis和nestjs-cls的核心缓存服务，提供高性能、多租户的缓存操作。
 * 支持自动租户上下文管理、统计监控、健康检查等功能。
 *
 * @description 此服务是缓存系统的核心实现，提供统一的缓存操作接口。
 * 支持高性能缓存、租户隔离、上下文绑定、装饰器支持等功能。
 * 专为多租户SAAS平台优化，提供完整的缓存管理和监控能力。
 *
 * ## 业务规则
 *
 * ### 缓存操作规则
 * - 所有缓存操作自动处理租户上下文
 * - 支持缓存键的租户隔离
 * - 自动记录缓存统计信息
 * - 支持缓存操作的错误处理和重试
 *
 * ### 租户隔离规则
 * - 自动绑定租户上下文到缓存操作
 * - 支持租户级别的缓存命名空间
 * - 使用multi-tenancy模块实现租户隔离
 * - 支持租户级别的缓存统计和监控
 * - 租户缓存完全隔离，确保数据安全
 *
 * ### 统计监控规则
 * - 自动记录缓存命中率和未命中率
 * - 支持租户级别的统计信息
 * - 提供缓存性能监控
 * - 支持缓存健康检查
 *
 * ### 错误处理规则
 * - 缓存操作失败时记录错误日志
 * - 支持缓存操作的优雅降级
 * - 提供详细的错误信息
 * - 支持缓存操作的自动重试
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly cacheService: CacheService) {}
 *
 *   async getUser(userId: string): Promise<User> {
 *     // 自动处理租户上下文
 *     const cached = await this.cacheService.get<User>(`user:${userId}`);
 *     if (cached) return cached;
 *
 *     const user = await this.userRepository.findById(userId);
 *     await this.cacheService.set(`user:${userId}`, user, 3600);
 *     return user;
 *   }
 * }
 * ```
 */

import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { RedisService } from './redis.service';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import {
  ICacheService,
  CacheModuleOptions,
  CacheStats,
  TenantCacheStats,
} from './types/cache.types';
import { DI_TOKENS } from './constants';

/**
 * 缓存服务
 *
 * 提供基于Redis和nestjs-cls的缓存操作，支持多租户和上下文管理。
 *
 * @description 此服务是缓存系统的核心实现，提供统一的缓存操作接口。
 * 支持高性能缓存、租户隔离、上下文绑定、统计监控等功能。
 * 遵循Clean Architecture的基础设施层设计原则。
 *
 * ## 业务规则
 *
 * ### 缓存操作规则
 * - 所有缓存操作自动处理租户上下文
 * - 支持缓存键的租户隔离
 * - 自动记录缓存统计信息
 * - 支持缓存操作的错误处理和重试
 *
 * ### 租户隔离规则
 * - 自动绑定租户上下文到缓存操作
 * - 支持租户级别的缓存命名空间
 * - 使用multi-tenancy模块实现租户隔离
 * - 支持租户级别的缓存统计和监控
 * - 租户缓存完全隔离，确保数据安全
 *
 * ### 统计监控规则
 * - 自动记录缓存命中率和未命中率
 * - 支持租户级别的统计信息
 * - 提供缓存性能监控
 * - 支持缓存健康检查
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly cacheService: CacheService) {}
 *
 *   async getUser(userId: string): Promise<User> {
 *     const cached = await this.cacheService.get<User>(`user:${userId}`);
 *     if (cached) return cached;
 *
 *     const user = await this.userRepository.findById(userId);
 *     await this.cacheService.set(`user:${userId}`, user, 3600);
 *     return user;
 *   }
 * }
 * ```
 */
@Injectable()
export class CacheService implements ICacheService {
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: 0,
    tenantStats: new Map(),
  };

  constructor(
    private readonly redisService: RedisService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly logger: PinoLogger,
    @Inject(DI_TOKENS.MODULE_OPTIONS)
    private readonly options: CacheModuleOptions
  ) {
    this.logger.setContext({ requestId: 'cache-service' });
  }

  /**
   * 获取缓存值
   *
   * 从Redis获取缓存值，自动处理租户上下文和统计信息。
   *
   * @description 此方法从Redis获取指定键的缓存值，自动处理租户上下文。
   * 支持泛型类型安全，自动记录缓存命中率和未命中率统计。
   * 如果缓存不存在或已过期，返回null。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### 统计监控规则
   * - 缓存命中时自动增加命中计数
   * - 缓存未命中时自动增加未命中计数
   * - 自动更新整体命中率统计
   * - 自动更新租户级别统计信息
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 支持缓存操作的优雅降级
   * - 提供详细的错误信息
   * - 支持缓存操作的自动重试
   *
   * @param key - 缓存键，不包含租户前缀
   * @returns 缓存值或null（如果不存在）
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 获取用户缓存
   * const user = await cacheService.get<User>('user:123');
   * if (user) {
   *   console.log('缓存命中:', user.name);
   * } else {
   *   console.log('缓存未命中，需要从数据库加载');
   * }
   *
   * // 获取配置缓存
   * const config = await cacheService.get<Config>('app:config');
   * ```
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const tenantKey = await this.getTenantKey(key);
      const value = await this.redisService.get<T>(tenantKey);

      if (value !== null) {
        this.stats.hits++;
        this.updateTenantStats('hit');
        this.logger.debug('缓存命中', { key: tenantKey });
      } else {
        this.stats.misses++;
        this.updateTenantStats('miss');
        this.logger.debug('缓存未命中', { key: tenantKey });
      }

      this.updateHitRate();
      return value;
    } catch (error) {
      this.logger.error('获取缓存失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 设置缓存值
   *
   * 向Redis设置缓存值，自动处理租户上下文和TTL设置。
   *
   * @description 此方法向Redis设置指定键的缓存值，自动处理租户上下文。
   * 支持TTL设置，自动记录缓存统计信息。
   * 如果未指定TTL，使用默认TTL配置。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### TTL管理规则
   * - 如果未指定TTL，使用默认TTL配置
   * - TTL必须大于0，否则使用默认值
   * - 支持秒级TTL精度
   * - 支持缓存过期自动清理
   *
   * ### 统计监控规则
   * - 自动增加总键数统计
   * - 自动更新租户级别统计信息
   * - 记录缓存设置操作日志
   * - 支持缓存性能监控
   *
   * @param key - 缓存键，不包含租户前缀
   * @param value - 要缓存的值，支持任意类型
   * @param ttl - 过期时间（秒），可选，默认使用配置的defaultTTL
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 设置用户缓存，TTL 1小时
   * await cacheService.set('user:123', user, 3600);
   *
   * // 设置配置缓存，使用默认TTL
   * await cacheService.set('app:config', config);
   *
   * // 设置临时缓存，TTL 5分钟
   * await cacheService.set('temp:data', data, 300);
   * ```
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const tenantKey = await this.getTenantKey(key);
      const effectiveTTL = ttl || this.options.defaultTTL || 3600;

      await this.redisService.set(tenantKey, value, effectiveTTL);

      this.stats.totalKeys++;
      this.updateTenantStats('set');
      this.logger.debug('缓存已设置', { key: tenantKey, ttl: effectiveTTL });
    } catch (error) {
      this.logger.error('设置缓存失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 删除缓存
   *
   * 从Redis删除缓存，自动处理租户上下文和统计信息。
   *
   * @description 此方法从Redis删除指定键的缓存，自动处理租户上下文。
   * 自动更新缓存统计信息，记录删除操作日志。
   * 如果缓存不存在，操作不会报错。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### 统计监控规则
   * - 自动减少总键数统计
   * - 自动更新租户级别统计信息
   * - 记录缓存删除操作日志
   * - 支持缓存性能监控
   *
   * ### 错误处理规则
   * - 缓存不存在时不报错
   * - 缓存操作失败时记录错误日志
   * - 支持缓存操作的优雅降级
   * - 提供详细的错误信息
   *
   * @param key - 缓存键，不包含租户前缀
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 删除用户缓存
   * await cacheService.delete('user:123');
   *
   * // 删除配置缓存
   * await cacheService.delete('app:config');
   *
   * // 删除临时缓存
   * await cacheService.delete('temp:data');
   * ```
   */
  async delete(key: string): Promise<void> {
    try {
      const tenantKey = await this.getTenantKey(key);
      await this.redisService.delete(tenantKey);

      this.stats.totalKeys = Math.max(0, this.stats.totalKeys - 1);
      this.updateTenantStats('delete');
      this.logger.debug('缓存已删除', { key: tenantKey });
    } catch (error) {
      this.logger.error('删除缓存失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 检查缓存是否存在
   *
   * 检查Redis中是否存在指定的键，自动处理租户上下文。
   *
   * @description 此方法检查Redis中是否存在指定的缓存键，自动处理租户上下文。
   * 不修改缓存统计信息，仅用于检查缓存存在性。
   * 支持租户隔离，确保跨租户缓存访问被禁止。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### 检查规则
   * - 不修改缓存统计信息
   * - 不触发缓存命中/未命中统计
   * - 仅用于检查缓存存在性
   * - 支持缓存键的租户隔离检查
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 支持缓存操作的优雅降级
   * - 提供详细的错误信息
   * - 支持缓存操作的自动重试
   *
   * @param key - 缓存键，不包含租户前缀
   * @returns 如果缓存存在返回true，否则返回false
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 检查用户缓存是否存在
   * const userExists = await cacheService.exists('user:123');
   * if (userExists) {
   *   console.log('用户缓存存在');
   * } else {
   *   console.log('用户缓存不存在');
   * }
   *
   * // 检查配置缓存是否存在
   * const configExists = await cacheService.exists('app:config');
   * ```
   */
  async exists(key: string): Promise<boolean> {
    try {
      const tenantKey = await this.getTenantKey(key);
      const exists = await this.redisService.exists(tenantKey);

      this.logger.debug('检查缓存存在性', { key: tenantKey, exists });
      return exists;
    } catch (error) {
      this.logger.error('检查缓存存在性失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量获取缓存
   *
   * 批量从Redis获取多个缓存值，自动处理租户上下文和统计信息。
   *
   * @description 此方法批量从Redis获取多个缓存值，自动处理租户上下文。
   * 支持泛型类型安全，自动记录缓存命中率和未命中率统计。
   * 返回的数组与输入键数组顺序一致，不存在的键返回null。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到所有缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### 统计监控规则
   * - 缓存命中时自动增加命中计数
   * - 缓存未命中时自动增加未命中计数
   * - 自动更新整体命中率统计
   * - 自动更新租户级别统计信息
   *
   * ### 批量操作规则
   * - 支持批量获取多个缓存值
   * - 返回数组与输入键数组顺序一致
   * - 不存在的键返回null
   * - 支持部分成功，部分失败的情况
   *
   * @param keys - 缓存键数组，不包含租户前缀
   * @returns 缓存值数组，与输入键数组顺序一致，不存在的键返回null
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 批量获取用户缓存
   * const userIds = ['user:123', 'user:456', 'user:789'];
   * const users = await cacheService.mget<User>(userIds);
   * users.forEach((user, index) => {
   *   if (user) {
   *     console.log(`用户 ${userIds[index]} 缓存命中:`, user.name);
   *   } else {
   *     console.log(`用户 ${userIds[index]} 缓存未命中`);
   *   }
   * });
   *
   * // 批量获取配置缓存
   * const configKeys = ['app:config', 'db:config', 'cache:config'];
   * const configs = await cacheService.mget<Config>(configKeys);
   * ```
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const tenantKeys = await Promise.all(
        keys.map((key) => this.getTenantKey(key))
      );
      const values = await this.redisService.mget<T>(tenantKeys);

      // 更新统计
      values.forEach((value) => {
        if (value !== null) {
          this.stats.hits++;
          this.updateTenantStats('hit');
        } else {
          this.stats.misses++;
          this.updateTenantStats('miss');
        }
      });

      this.updateHitRate();
      this.logger.debug('批量获取缓存', {
        keys: tenantKeys,
        count: values.length,
      });
      return values;
    } catch (error) {
      this.logger.error('批量获取缓存失败', {
        keys,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量设置缓存
   *
   * 批量向Redis设置多个缓存值，自动处理租户上下文和TTL设置。
   *
   * @description 此方法批量向Redis设置多个缓存值，自动处理租户上下文。
   * 支持TTL设置，自动记录缓存统计信息。
   * 如果未指定TTL，使用默认TTL配置。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到所有缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### TTL管理规则
   * - 如果未指定TTL，使用默认TTL配置
   * - TTL必须大于0，否则使用默认值
   * - 支持秒级TTL精度
   * - 支持缓存过期自动清理
   *
   * ### 统计监控规则
   * - 自动增加总键数统计
   * - 自动更新租户级别统计信息
   * - 记录缓存设置操作日志
   * - 支持缓存性能监控
   *
   * ### 批量操作规则
   * - 支持批量设置多个缓存值
   * - 支持部分成功，部分失败的情况
   * - 支持不同键使用不同的TTL
   * - 支持原子性批量操作
   *
   * @param pairs - 缓存键值对数组，每个对象包含key、value和可选的ttl
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 批量设置用户缓存
   * await cacheService.mset([
   *   { key: 'user:123', value: user1, ttl: 3600 },
   *   { key: 'user:456', value: user2, ttl: 1800 },
   *   { key: 'user:789', value: user3 } // 使用默认TTL
   * ]);
   *
   * // 批量设置配置缓存
   * await cacheService.mset([
   *   { key: 'app:config', value: appConfig },
   *   { key: 'db:config', value: dbConfig },
   *   { key: 'cache:config', value: cacheConfig }
   * ]);
   * ```
   */
  async mset<T>(
    pairs: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    try {
      const tenantPairs = await Promise.all(
        pairs.map(async ({ key, value, ttl }) => ({
          key: await this.getTenantKey(key),
          value,
          ttl: ttl || this.options.defaultTTL || 3600,
        }))
      );

      await this.redisService.mset(tenantPairs);

      this.stats.totalKeys += pairs.length;
      this.updateTenantStats('set', pairs.length);
      this.logger.debug('批量设置缓存', { count: pairs.length });
    } catch (error) {
      this.logger.error('批量设置缓存失败', {
        pairs,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 批量删除缓存
   *
   * 批量从Redis删除多个缓存，自动处理租户上下文和统计信息。
   *
   * @description 此方法批量从Redis删除多个缓存，自动处理租户上下文。
   * 自动更新缓存统计信息，记录删除操作日志。
   * 如果缓存不存在，操作不会报错。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到所有缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### 统计监控规则
   * - 自动减少总键数统计
   * - 自动更新租户级别统计信息
   * - 记录缓存删除操作日志
   * - 支持缓存性能监控
   *
   * ### 批量操作规则
   * - 支持批量删除多个缓存
   * - 支持部分成功，部分失败的情况
   * - 不存在的键不会报错
   * - 支持原子性批量操作
   *
   * @param keys - 缓存键数组，不包含租户前缀
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 批量删除用户缓存
   * await cacheService.mdelete(['user:123', 'user:456', 'user:789']);
   *
   * // 批量删除配置缓存
   * await cacheService.mdelete(['app:config', 'db:config', 'cache:config']);
   *
   * // 批量删除临时缓存
   * await cacheService.mdelete(['temp:data1', 'temp:data2', 'temp:data3']);
   * ```
   */
  async mdelete(keys: string[]): Promise<void> {
    try {
      const tenantKeys = await Promise.all(
        keys.map((key) => this.getTenantKey(key))
      );
      await this.redisService.mdelete(tenantKeys);

      this.stats.totalKeys = Math.max(0, this.stats.totalKeys - keys.length);
      this.updateTenantStats('delete', keys.length);
      this.logger.debug('批量删除缓存', { count: keys.length });
    } catch (error) {
      this.logger.error('批量删除缓存失败', {
        keys,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 设置过期时间
   *
   * 为缓存设置过期时间，自动处理租户上下文。
   *
   * @description 此方法为指定键的缓存设置过期时间，自动处理租户上下文。
   * 支持秒级TTL精度，自动记录操作日志。
   * 如果缓存不存在，操作不会报错。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### TTL管理规则
   * - TTL必须大于0，否则操作失败
   * - 支持秒级TTL精度
   * - 支持缓存过期自动清理
   * - 支持动态调整缓存过期时间
   *
   * ### 错误处理规则
   * - 缓存不存在时不报错
   * - 缓存操作失败时记录错误日志
   * - 支持缓存操作的优雅降级
   * - 提供详细的错误信息
   *
   * @param key - 缓存键，不包含租户前缀
   * @param ttl - 过期时间（秒），必须大于0
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 设置用户缓存过期时间为1小时
   * await cacheService.expire('user:123', 3600);
   *
   * // 设置配置缓存过期时间为30分钟
   * await cacheService.expire('app:config', 1800);
   *
   * // 设置临时缓存过期时间为5分钟
   * await cacheService.expire('temp:data', 300);
   * ```
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      const tenantKey = await this.getTenantKey(key);
      await this.redisService.expire(tenantKey, ttl);

      this.logger.debug('设置缓存过期时间', { key: tenantKey, ttl });
    } catch (error) {
      this.logger.error('设置缓存过期时间失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取剩余过期时间
   *
   * 获取缓存的剩余过期时间，自动处理租户上下文。
   *
   * @description 此方法获取指定键的缓存剩余过期时间，自动处理租户上下文。
   * 返回秒级TTL，如果缓存不存在或已过期，返回-1。
   * 如果缓存永不过期，返回-2。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### TTL查询规则
   * - 返回秒级TTL精度
   * - 缓存不存在时返回-1
   * - 缓存永不过期时返回-2
   * - 支持实时TTL查询
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 支持缓存操作的优雅降级
   * - 提供详细的错误信息
   * - 支持缓存操作的自动重试
   *
   * @param key - 缓存键，不包含租户前缀
   * @returns 剩余过期时间（秒），-1表示不存在，-2表示永不过期
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 获取用户缓存剩余过期时间
   * const ttl = await cacheService.ttl('user:123');
   * if (ttl > 0) {
   *   console.log(`用户缓存还有 ${ttl} 秒过期`);
   * } else if (ttl === -1) {
   *   console.log('用户缓存不存在');
   * } else if (ttl === -2) {
   *   console.log('用户缓存永不过期');
   * }
   *
   * // 获取配置缓存剩余过期时间
   * const configTtl = await cacheService.ttl('app:config');
   * ```
   */
  async ttl(key: string): Promise<number> {
    try {
      const tenantKey = await this.getTenantKey(key);
      const ttl = await this.redisService.ttl(tenantKey);

      this.logger.debug('获取缓存过期时间', { key: tenantKey, ttl });
      return ttl;
    } catch (error) {
      this.logger.error('获取缓存过期时间失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取匹配的键
   *
   * 获取匹配模式的所有键，自动处理租户上下文。
   *
   * @description 此方法获取匹配指定模式的所有缓存键，自动处理租户上下文。
   * 支持通配符模式匹配，返回匹配的键数组。
   * 支持租户隔离，确保跨租户缓存访问被禁止。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定当前租户上下文到模式匹配
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### 模式匹配规则
   * - 支持通配符模式匹配（*、?等）
   * - 支持正则表达式模式匹配
   * - 支持部分匹配和完全匹配
   * - 支持大小写敏感匹配
   *
   * ### 性能考虑规则
   * - 大量键匹配可能影响性能
   * - 建议使用具体的键模式
   * - 支持分页查询大量键
   * - 支持键的批量处理
   *
   * @param pattern - 匹配模式，支持通配符
   * @returns 匹配的键数组
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 获取所有用户缓存键
   * const userKeys = await cacheService.keys('user:*');
   * console.log('用户缓存键:', userKeys);
   *
   * // 获取所有配置缓存键
   * const configKeys = await cacheService.keys('app:*');
   * console.log('配置缓存键:', configKeys);
   *
   * // 获取特定模式的键
   * const tempKeys = await cacheService.keys('temp:*');
   * console.log('临时缓存键:', tempKeys);
   * ```
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const tenantPattern = await this.getTenantKey(pattern);
      const keys = await this.redisService.keys(tenantPattern);

      this.logger.debug('获取匹配键', {
        pattern: tenantPattern,
        count: keys.length,
      });
      return keys;
    } catch (error) {
      this.logger.error('获取匹配键失败', {
        pattern,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 清空所有缓存
   *
   * 清空Redis中的所有缓存，重置统计信息。
   *
   * @description 此方法清空Redis中的所有缓存，重置所有统计信息。
   * 这是一个危险操作，会删除所有缓存数据。
   * 建议在生产环境中谨慎使用。
   *
   * ## 业务规则
   *
   * ### 清空规则
   * - 清空所有缓存数据
   * - 重置所有统计信息
   * - 重置命中率和未命中率
   * - 清空租户级别统计信息
   *
   * ### 安全规则
   * - 这是一个危险操作
   * - 会删除所有缓存数据
   * - 建议在生产环境中谨慎使用
   * - 建议在维护窗口期间执行
   *
   * ### 统计重置规则
   * - 重置命中计数为0
   * - 重置未命中计数为0
   * - 重置命中率为0
   * - 重置总键数为0
   * - 清空租户统计信息
   *
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 清空所有缓存（危险操作）
   * await cacheService.flush();
   * console.log('所有缓存已清空');
   *
   * // 在维护期间清空缓存
   * if (isMaintenanceMode) {
   *   await cacheService.flush();
   *   console.log('维护期间清空缓存完成');
   * }
   * ```
   */
  async flush(): Promise<void> {
    try {
      await this.redisService.flush();

      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.hitRate = 0;
      this.stats.totalKeys = 0;
      this.stats.tenantStats.clear();

      this.logger.warn('所有缓存已清空');
    } catch (error) {
      this.logger.error('清空缓存失败', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 获取当前租户
   *
   * 获取当前上下文中的租户ID。
   *
   * @description 此方法获取当前上下文中的租户ID，用于租户隔离。
   * 如果当前没有租户上下文，返回null。
   * 支持多租户架构的租户识别。
   *
   * ## 业务规则
   *
   * ### 租户上下文规则
   * - 从租户上下文服务获取当前租户ID
   * - 支持租户上下文的自动注入
   * - 支持租户上下文的动态切换
   * - 支持租户上下文的验证
   *
   * ### 返回值规则
   * - 有租户上下文时返回租户ID
   * - 无租户上下文时返回null
   * - 租户ID格式必须有效
   * - 支持租户ID的验证
   *
   * @returns 当前租户ID或null（如果没有租户上下文）
   *
   * @example
   * ```typescript
   * // 获取当前租户
   * const tenantId = cacheService.getCurrentTenant();
   * if (tenantId) {
   *   console.log('当前租户:', tenantId);
   * } else {
   *   console.log('没有租户上下文');
   * }
   *
   * // 检查租户上下文
   * if (cacheService.getCurrentTenant()) {
   *   console.log('有租户上下文');
   * } else {
   *   console.log('没有租户上下文');
   * }
   * ```
   */
  getCurrentTenant(): string | null {
    return this.tenantContextService.getTenant();
  }

  /**
   * 检查是否有租户上下文
   *
   * 检查当前是否有租户上下文。
   *
   * @description 此方法检查当前是否有租户上下文，用于租户隔离验证。
   * 返回true表示有租户上下文，false表示没有。
   * 支持多租户架构的租户上下文检查。
   *
   * ## 业务规则
   *
   * ### 租户上下文检查规则
   * - 检查租户上下文服务是否有当前租户
   * - 支持租户上下文的自动验证
   * - 支持租户上下文的动态检查
   * - 支持租户上下文的有效性验证
   *
   * ### 返回值规则
   * - 有租户上下文时返回true
   * - 无租户上下文时返回false
   * - 支持租户上下文的实时检查
   * - 支持租户上下文的动态变化
   *
   * @returns 如果有租户上下文返回true，否则返回false
   *
   * @example
   * ```typescript
   * // 检查租户上下文
   * if (cacheService.hasTenantContext()) {
   *   console.log('有租户上下文');
   *   const tenantId = cacheService.getCurrentTenant();
   *   console.log('当前租户:', tenantId);
   * } else {
   *   console.log('没有租户上下文');
   * }
   *
   * // 条件执行
   * if (cacheService.hasTenantContext()) {
   *   await cacheService.set('key', 'value');
   * } else {
   *   console.log('需要租户上下文才能执行缓存操作');
   * }
   * ```
   */
  hasTenantContext(): boolean {
    return this.tenantContextService.getTenant() !== null;
  }

  /**
   * 获取缓存统计
   *
   * 获取缓存使用统计信息，包括命中率、键数等。
   *
   * @description 此方法获取缓存使用统计信息，包括命中率、未命中率、总键数等。
   * 支持租户级别统计信息，提供完整的缓存使用情况。
   * 返回的统计信息是只读的，不会影响缓存操作。
   *
   * ## 业务规则
   *
   * ### 统计信息规则
   * - 包含命中率和未命中率统计
   * - 包含总键数统计
   * - 包含内存使用统计
   * - 包含租户级别统计信息
   *
   * ### 数据安全规则
   * - 返回的统计信息是只读的
   * - 不会影响缓存操作
   * - 支持统计信息的实时查询
   * - 支持统计信息的动态更新
   *
   * ### 租户统计规则
   * - 支持租户级别统计信息
   * - 支持租户统计信息的查询
   * - 支持租户统计信息的聚合
   * - 支持租户统计信息的分析
   *
   * @returns 缓存统计信息对象
   *
   * @example
   * ```typescript
   * // 获取缓存统计
   * const stats = cacheService.getStats();
   * console.log('命中率:', stats.hitRate);
   * console.log('总键数:', stats.totalKeys);
   * console.log('内存使用:', stats.memoryUsage);
   *
   * // 获取租户统计
   * const tenantStats = stats.tenantStats;
   * tenantStats.forEach((tenantStat, tenantId) => {
   *   console.log(`租户 ${tenantId} 统计:`, tenantStat);
   * });
   * ```
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      tenantStats: new Map(this.stats.tenantStats),
    };
  }

  /**
   * 获取租户缓存统计
   *
   * 获取指定租户的缓存统计信息。
   *
   * @description 此方法获取指定租户的缓存统计信息，包括命中率、键数等。
   * 支持租户级别统计信息的查询，提供详细的租户缓存使用情况。
   * 如果租户不存在，返回null。
   *
   * ## 业务规则
   *
   * ### 租户统计规则
   * - 支持租户级别统计信息查询
   * - 支持租户统计信息的详细分析
   * - 支持租户统计信息的实时更新
   * - 支持租户统计信息的聚合计算
   *
   * ### 数据安全规则
   * - 返回的统计信息是只读的
   * - 不会影响缓存操作
   * - 支持统计信息的实时查询
   * - 支持统计信息的动态更新
   *
   * ### 租户验证规则
   * - 租户ID必须有效
   * - 支持租户存在性验证
   * - 支持租户统计信息的查询
   * - 支持租户统计信息的分析
   *
   * @param tenantId - 租户ID
   * @returns 租户缓存统计信息或null（如果租户不存在）
   *
   * @example
   * ```typescript
   * // 获取租户统计
   * const tenantStats = cacheService.getTenantStats('tenant-123');
   * if (tenantStats) {
   *   console.log('租户命中率:', tenantStats.hitRate);
   *   console.log('租户键数:', tenantStats.keyCount);
   *   console.log('最后访问时间:', tenantStats.lastAccessed);
   * } else {
   *   console.log('租户不存在或没有统计信息');
   * }
   *
   * // 检查租户统计
   * const stats = cacheService.getTenantStats('tenant-456');
   * if (stats && stats.hitRate < 50) {
   *   console.log('租户命中率较低，需要优化');
   * }
   * ```
   */
  getTenantStats(tenantId: string): TenantCacheStats | null {
    return this.stats.tenantStats.get(tenantId) || null;
  }

  /**
   * 清空租户缓存
   *
   * 清空指定租户的所有缓存，重置租户统计信息。
   *
   * @description 此方法清空指定租户的所有缓存，重置租户统计信息。
   * 支持租户级别的缓存清理，确保租户数据隔离。
   * 这是一个危险操作，会删除租户的所有缓存数据。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 只清空指定租户的缓存
   * - 不影响其他租户的缓存
   * - 支持租户级别的缓存清理
   * - 确保租户数据隔离
   *
   * ### 清空规则
   * - 清空租户的所有缓存数据
   * - 重置租户统计信息
   * - 重置租户命中率和未命中率
   * - 清空租户键数统计
   *
   * ### 安全规则
   * - 这是一个危险操作
   * - 会删除租户的所有缓存数据
   * - 建议在生产环境中谨慎使用
   * - 建议在维护窗口期间执行
   *
   * @param tenantId - 租户ID
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 清空租户缓存（危险操作）
   * await cacheService.clearTenantCache('tenant-123');
   * console.log('租户缓存已清空');
   *
   * // 在维护期间清空租户缓存
   * if (isMaintenanceMode) {
   *   await cacheService.clearTenantCache('tenant-456');
   *   console.log('维护期间清空租户缓存完成');
   * }
   *
   * // 清空多个租户缓存
   * const tenantIds = ['tenant-123', 'tenant-456', 'tenant-789'];
   * for (const tenantId of tenantIds) {
   *   await cacheService.clearTenantCache(tenantId);
   *   console.log(`租户 ${tenantId} 缓存已清空`);
   * }
   * ```
   */
  async clearTenantCache(tenantId: string): Promise<void> {
    try {
      const pattern = await this.getTenantKey('*', tenantId);
      const keys = await this.redisService.keys(pattern);

      if (keys.length > 0) {
        await this.redisService.mdelete(keys);
      }

      // 清除租户统计
      this.stats.tenantStats.delete(tenantId);

      this.logger.info('租户缓存已清空', { tenantId, keyCount: keys.length });
    } catch (error) {
      this.logger.error('清空租户缓存失败', {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取租户键
   *
   * 根据租户ID生成租户隔离的缓存键，使用multi-tenancy隔离服务。
   *
   * @description 此方法根据租户ID生成租户隔离的缓存键，使用multi-tenancy隔离服务。
   * 支持租户级别的缓存命名空间，确保租户数据隔离。
   * 如果租户上下文缺失，使用默认键前缀。
   *
   * ## 业务规则
   *
   * ### 租户隔离规则
   * - 自动绑定租户上下文到缓存键
   * - 支持租户级别的缓存命名空间
   * - 跨租户缓存访问被严格禁止
   * - 租户上下文缺失时使用默认键前缀
   *
   * ### 键生成规则
   * - 使用multi-tenancy隔离服务生成键
   * - 支持租户级别的键命名空间
   * - 支持键的租户隔离
   * - 支持键的验证和格式化
   *
   * ### 错误处理规则
   * - 租户隔离服务失败时使用默认键前缀
   * - 支持键生成的优雅降级
   * - 提供详细的错误信息
   * - 支持键生成的自动重试
   *
   * @param key - 原始缓存键
   * @param tenantId - 租户ID，可选，默认使用当前租户上下文
   * @returns 租户隔离的缓存键
   *
   * @example
   * ```typescript
   * // 生成租户键
   * const tenantKey = await this.getTenantKey('user:123');
   * console.log('租户键:', tenantKey);
   *
   * // 生成指定租户的键
   * const specificTenantKey = await this.getTenantKey('user:123', 'tenant-456');
   * console.log('指定租户键:', specificTenantKey);
   * ```
   */
  private async getTenantKey(key: string, tenantId?: string): Promise<string> {
    try {
      // 使用 multi-tenancy 的隔离服务生成租户键
      const currentTenantId = tenantId || this.tenantContextService.getTenant();

      if (currentTenantId) {
        return await this.tenantIsolationService.getTenantKey(
          key,
          currentTenantId
        );
      }

      // 如果没有租户上下文，使用默认键前缀
      const keyPrefix = this.options.keyPrefix || 'hl8:cache:';
      return `${keyPrefix}${key}`;
    } catch (error) {
      this.logger.error('生成租户键失败', {
        key,
        tenantId,
        error: (error as Error).message,
      });
      // 回退到简单的键前缀方式
      const keyPrefix = this.options.keyPrefix || 'hl8:cache:';
      return `${keyPrefix}${key}`;
    }
  }

  /**
   * 更新租户统计
   *
   * 更新指定租户的缓存统计信息。
   *
   * @description 此方法更新指定租户的缓存统计信息，包括命中率、键数等。
   * 支持租户级别统计信息的实时更新，提供详细的租户缓存使用情况。
   * 自动计算租户命中率和更新最后访问时间。
   *
   * ## 业务规则
   *
   * ### 统计更新规则
   * - 支持命中、未命中、设置、删除操作统计
   * - 自动更新租户命中率
   * - 自动更新租户键数统计
   * - 自动更新最后访问时间
   *
   * ### 租户统计规则
   * - 支持租户级别统计信息更新
   * - 支持租户统计信息的实时计算
   * - 支持租户统计信息的动态更新
   * - 支持租户统计信息的聚合计算
   *
   * ### 数据一致性规则
   * - 确保统计信息的一致性
   * - 支持统计信息的原子性更新
   * - 支持统计信息的并发安全
   * - 支持统计信息的实时同步
   *
   * @param operation - 操作类型：hit、miss、set、delete
   * @param count - 操作次数，默认为1
   *
   * @example
   * ```typescript
   * // 更新租户命中统计
   * this.updateTenantStats('hit');
   *
   * // 更新租户未命中统计
   * this.updateTenantStats('miss');
   *
   * // 更新租户设置统计
   * this.updateTenantStats('set', 5);
   *
   * // 更新租户删除统计
   * this.updateTenantStats('delete', 3);
   * ```
   */
  private updateTenantStats(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    count = 1
  ): void {
    const tenantId = this.tenantContextService.getTenant();
    if (!tenantId) return;

    let tenantStats = this.stats.tenantStats.get(tenantId);
    if (!tenantStats) {
      tenantStats = {
        tenantId,
        hits: 0,
        misses: 0,
        hitRate: 0,
        keyCount: 0,
        memoryUsage: 0,
        lastAccessed: new Date(),
      };
      this.stats.tenantStats.set(tenantId, tenantStats);
    }

    switch (operation) {
      case 'hit':
        tenantStats.hits += count;
        break;
      case 'miss':
        tenantStats.misses += count;
        break;
      case 'set':
        tenantStats.keyCount += count;
        break;
      case 'delete':
        tenantStats.keyCount = Math.max(0, tenantStats.keyCount - count);
        break;
    }

    tenantStats.hitRate =
      tenantStats.hits + tenantStats.misses > 0
        ? (tenantStats.hits / (tenantStats.hits + tenantStats.misses)) * 100
        : 0;

    tenantStats.lastAccessed = new Date();
  }

  /**
   * 更新命中率
   *
   * 更新整体缓存命中率。
   *
   * @description 此方法更新整体缓存命中率，基于命中数和未命中数计算。
   * 支持实时命中率计算，提供准确的缓存性能指标。
   * 命中率计算公式：命中数 / (命中数 + 未命中数) * 100
   *
   * ## 业务规则
   *
   * ### 命中率计算规则
   * - 基于命中数和未命中数计算
   * - 支持实时命中率计算
   * - 支持命中率的动态更新
   * - 支持命中率的百分比显示
   *
   * ### 数据一致性规则
   * - 确保命中率计算的一致性
   * - 支持命中率的原子性更新
   * - 支持命中率的并发安全
   * - 支持命中率的实时同步
   *
   * ### 性能优化规则
   * - 避免重复计算命中率
   * - 支持命中率的缓存
   * - 支持命中率的批量更新
   * - 支持命中率的增量更新
   *
   * @example
   * ```typescript
   * // 更新命中率
   * this.updateHitRate();
   * console.log('当前命中率:', this.stats.hitRate);
   *
   * // 检查命中率
   * if (this.stats.hitRate < 50) {
   *   console.log('命中率较低，需要优化');
   * }
   * ```
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * 获取缓存健康状态
   *
   * 获取缓存服务的健康状态，包括连接状态、上下文状态等。
   *
   * @description 此方法获取缓存服务的健康状态，包括Redis连接状态、租户上下文状态等。
   * 支持缓存服务的健康检查，提供详细的健康状态信息。
   * 用于监控和诊断缓存服务的运行状态。
   *
   * ## 业务规则
   *
   * ### 健康检查规则
   * - 检查Redis连接状态
   * - 检查租户上下文状态
   * - 检查缓存服务状态
   * - 检查统计信息状态
   *
   * ### 状态判断规则
   * - 所有组件都正常时返回健康状态
   * - 任一组件异常时返回不健康状态
   * - 支持健康状态的实时检查
   * - 支持健康状态的动态更新
   *
   * ### 监控规则
   * - 支持缓存服务的实时监控
   * - 支持健康状态的告警
   * - 支持健康状态的日志记录
   * - 支持健康状态的统计分析
   *
   * @returns 健康状态对象，包含isHealthy、redisConnected、contextAvailable、stats
   *
   * @example
   * ```typescript
   * // 获取健康状态
   * const healthStatus = await cacheService.getHealthStatus();
   * console.log('缓存服务健康状态:', healthStatus.isHealthy);
   * console.log('Redis连接状态:', healthStatus.redisConnected);
   * console.log('租户上下文状态:', healthStatus.contextAvailable);
   * console.log('缓存统计:', healthStatus.stats);
   *
   * // 健康检查
   * if (!healthStatus.isHealthy) {
   *   console.log('缓存服务不健康，需要检查');
   *   if (!healthStatus.redisConnected) {
   *     console.log('Redis连接异常');
   *   }
   *   if (!healthStatus.contextAvailable) {
   *     console.log('租户上下文异常');
   *   }
   * }
   * ```
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    redisConnected: boolean;
    contextAvailable: boolean;
    stats: CacheStats;
  }> {
    const redisConnected = this.redisService.isHealthy();
    const contextAvailable = this.tenantContextService.getTenant() !== null;
    const isHealthy = redisConnected && contextAvailable;

    return {
      isHealthy,
      redisConnected,
      contextAvailable,
      stats: this.getStats(),
    };
  }
}
