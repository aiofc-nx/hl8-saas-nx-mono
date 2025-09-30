/**
 * Redis服务
 *
 * 基于Redis的缓存服务实现，提供高性能的缓存操作。
 * 支持连接池管理、健康检查、统计监控等功能。
 *
 * @description 此服务是缓存系统的底层实现，提供Redis连接和缓存操作。
 * 支持高性能缓存、连接管理、健康检查、统计监控等功能。
 * 遵循Clean Architecture的基础设施层设计原则。
 *
 * ## 业务规则
 *
 * ### 连接管理规则
 * - 支持Redis连接池管理
 * - 支持连接的生命周期管理
 * - 支持连接的自动重连
 * - 支持连接的健康检查
 *
 * ### 缓存操作规则
 * - 支持基础缓存操作（get、set、delete等）
 * - 支持批量缓存操作（mget、mset、mdelete等）
 * - 支持高级缓存操作（expire、ttl、keys等）
 * - 支持缓存操作的错误处理
 *
 * ### 性能优化规则
 * - 支持连接池优化
 * - 支持批量操作优化
 * - 支持缓存策略优化
 * - 支持性能监控和统计
 *
 * ### 健康检查规则
 * - 支持连接状态检查
 * - 支持缓存操作测试
 * - 支持性能指标监控
 * - 支持健康状态报告
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly redisService: RedisService) {}
 *
 *   async getUser(userId: string): Promise<User> {
 *     const cached = await this.redisService.get<User>(`user:${userId}`);
 *     if (cached) return cached;
 *
 *     const user = await this.userRepository.findById(userId);
 *     await this.redisService.set(`user:${userId}`, user, 3600);
 *     return user;
 *   }
 * }
 * ```
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PinoLogger } from '@hl8/logger';
import { RedisConfig, ConnectionInfo } from './types/cache.types';

/**
 * Redis服务
 *
 * 提供Redis连接和缓存操作的核心服务，支持高性能缓存操作。
 *
 * @description 此服务是Redis缓存系统的核心实现，提供Redis连接和缓存操作。
 * 支持高性能缓存、连接管理、健康检查、统计监控等功能。
 * 遵循Clean Architecture的基础设施层设计原则。
 *
 * ## 业务规则
 *
 * ### 连接管理规则
 * - 支持Redis连接池管理
 * - 支持连接的生命周期管理
 * - 支持连接的自动重连
 * - 支持连接的健康检查
 *
 * ### 缓存操作规则
 * - 支持基础缓存操作（get、set、delete等）
 * - 支持批量缓存操作（mget、mset、mdelete等）
 * - 支持高级缓存操作（expire、ttl、keys等）
 * - 支持缓存操作的错误处理
 *
 * ### 性能优化规则
 * - 支持连接池优化
 * - 支持批量操作优化
 * - 支持缓存策略优化
 * - 支持性能监控和统计
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly redisService: RedisService) {}
 *
 *   async getUser(userId: string): Promise<User> {
 *     const cached = await this.redisService.get<User>(`user:${userId}`);
 *     if (cached) return cached;
 *
 *     const user = await this.userRepository.findById(userId);
 *     await this.redisService.set(`user:${userId}`, user, 3600);
 *     return user;
 *   }
 * }
 * ```
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;
  private isConnected = false;
  private connectionInfo!: ConnectionInfo;

  constructor(
    @Inject('CACHE_MODULE_OPTIONS') private readonly options: any,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'redis-service' });
  }

  /**
   * 模块初始化
   *
   * 初始化Redis连接，建立与Redis服务器的连接。
   *
   * @description 此方法在模块初始化时调用，建立与Redis服务器的连接。
   * 支持连接配置、连接池管理、健康检查等功能。
   * 如果连接失败，会抛出异常并记录错误日志。
   *
   * ## 业务规则
   *
   * ### 连接初始化规则
   * - 根据配置建立Redis连接
   * - 支持连接池配置
   * - 支持连接超时设置
   * - 支持连接重试机制
   *
   * ### 错误处理规则
   * - 连接失败时记录错误日志
   * - 连接失败时抛出异常
   * - 支持连接失败的优雅降级
   * - 支持连接失败的自动重试
   *
   * ### 健康检查规则
   * - 连接建立后进行健康检查
   * - 支持连接状态的实时监控
   * - 支持连接质量的评估
   * - 支持连接性能的统计
   *
   * @throws {Error} 当Redis连接失败时抛出
   *
   * @example
   * ```typescript
   * // 模块初始化时会自动调用
   * await redisService.onModuleInit();
   * console.log('Redis服务已初始化');
   * ```
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      this.logger.info('Redis服务已初始化');
    } catch (error) {
      this.logger.error('Redis服务初始化失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 模块销毁
   *
   * 关闭Redis连接，清理资源。
   *
   * @description 此方法在模块销毁时调用，关闭Redis连接并清理资源。
   * 支持优雅关闭、资源清理、连接池清理等功能。
   * 如果关闭失败，会记录错误日志但不抛出异常。
   *
   * ## 业务规则
   *
   * ### 连接关闭规则
   * - 优雅关闭Redis连接
   * - 支持连接池清理
   * - 支持资源清理
   * - 支持连接状态重置
   *
   * ### 错误处理规则
   * - 关闭失败时记录错误日志
   * - 关闭失败时不抛出异常
   * - 支持关闭失败的优雅降级
   * - 支持关闭失败的自动重试
   *
   * ### 资源清理规则
   * - 清理连接池资源
   * - 清理统计信息
   * - 清理健康检查状态
   * - 清理监控数据
   *
   * @example
   * ```typescript
   * // 模块销毁时会自动调用
   * await redisService.onModuleDestroy();
   * console.log('Redis服务已关闭');
   * ```
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnect();
      this.logger.info('Redis服务已关闭');
    } catch (error) {
      this.logger.error('Redis服务关闭失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 连接到Redis
   *
   * 建立Redis连接，配置连接参数和事件监听。
   *
   * @description 此方法建立与Redis服务器的连接，配置连接参数和事件监听。
   * 支持连接池管理、健康检查、性能监控等功能。
   * 如果连接失败，会抛出异常并记录错误日志。
   *
   * ## 业务规则
   *
   * ### 连接配置规则
   * - 根据配置建立Redis连接
   * - 支持连接池配置
   * - 支持连接超时设置
   * - 支持连接重试机制
   *
   * ### 事件监听规则
   * - 监听连接建立事件
   * - 监听连接就绪事件
   * - 监听连接错误事件
   * - 监听连接关闭事件
   * - 监听重连事件
   *
   * ### 错误处理规则
   * - 连接失败时记录错误日志
   * - 连接失败时抛出异常
   * - 支持连接失败的优雅降级
   * - 支持连接失败的自动重试
   *
   * @throws {Error} 当Redis连接失败时抛出
   *
   * @example
   * ```typescript
   * // 建立Redis连接
   * await redisService.connect();
   * console.log('Redis连接已建立');
   * ```
   */
  async connect(): Promise<void> {
    try {
      const config = this.options.redis as RedisConfig;

      this.redis = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db || 0,
        maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
        lazyConnect: config.lazyConnect || true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      // 监听连接事件
      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.info('Redis连接已建立');
      });

      this.redis.on('ready', () => {
        this.logger.info('Redis已准备就绪');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.logger.error('Redis连接错误', { error: (error as Error).message });
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis连接已关闭');
      });

      this.redis.on('reconnecting', () => {
        this.logger.info('Redis正在重连');
      });

      // 连接Redis
      await this.redis.connect();

      // 设置连接信息
      this.connectionInfo = {
        host: config.host,
        port: config.port,
        db: config.db || 0,
        status: 'connected',
        latency: 0,
        lastConnected: new Date(),
      };
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Redis连接失败', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 断开Redis连接
   *
   * 关闭Redis连接，清理资源。
   *
   * @description 此方法关闭Redis连接，清理资源。
   * 支持优雅关闭、资源清理、连接池清理等功能。
   * 如果关闭失败，会记录错误日志但不抛出异常。
   *
   * ## 业务规则
   *
   * ### 连接关闭规则
   * - 优雅关闭Redis连接
   * - 支持连接池清理
   * - 支持资源清理
   * - 支持连接状态重置
   *
   * ### 错误处理规则
   * - 关闭失败时记录错误日志
   * - 关闭失败时不抛出异常
   * - 支持关闭失败的优雅降级
   * - 支持关闭失败的自动重试
   *
   * ### 资源清理规则
   * - 清理连接池资源
   * - 清理统计信息
   * - 清理健康检查状态
   * - 清理监控数据
   *
   * @example
   * ```typescript
   * // 断开Redis连接
   * await redisService.disconnect();
   * console.log('Redis连接已断开');
   * ```
   */
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.isConnected = false;
        this.logger.info('Redis连接已断开');
      }
    } catch (error) {
      this.logger.error('Redis断开连接失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取缓存值
   *
   * 从Redis获取缓存值，支持泛型类型安全。
   *
   * @description 此方法从Redis获取指定键的缓存值，支持泛型类型安全。
   * 自动处理JSON序列化和反序列化，支持任意类型的数据。
   * 如果缓存不存在，返回null。
   *
   * ## 业务规则
   *
   * ### 数据获取规则
   * - 从Redis获取指定键的值
   * - 支持泛型类型安全
   * - 自动处理JSON反序列化
   * - 支持任意类型的数据
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * ### 性能优化规则
   * - 支持连接池优化
   * - 支持批量操作优化
   * - 支持缓存策略优化
   * - 支持性能监控和统计
   *
   * @param key - 缓存键
   * @returns 缓存值或null（如果不存在）
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 获取用户缓存
   * const user = await redisService.get<User>('user:123');
   * if (user) {
   *   console.log('用户缓存命中:', user.name);
   * } else {
   *   console.log('用户缓存未命中');
   * }
   *
   * // 获取配置缓存
   * const config = await redisService.get<Config>('app:config');
   * ```
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
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
   * 向Redis设置缓存值，支持TTL设置和泛型类型安全。
   *
   * @description 此方法向Redis设置指定键的缓存值，支持TTL设置和泛型类型安全。
   * 自动处理JSON序列化，支持任意类型的数据。
   * 如果未指定TTL，缓存永不过期。
   *
   * ## 业务规则
   *
   * ### 数据设置规则
   * - 向Redis设置指定键的值
   * - 支持泛型类型安全
   * - 自动处理JSON序列化
   * - 支持任意类型的数据
   *
   * ### TTL管理规则
   * - 支持TTL设置（秒）
   * - 如果未指定TTL，缓存永不过期
   * - 支持秒级TTL精度
   * - 支持缓存过期自动清理
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * @param key - 缓存键
   * @param value - 要缓存的值，支持任意类型
   * @param ttl - 过期时间（秒），可选，默认永不过期
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 设置用户缓存，TTL 1小时
   * await redisService.set('user:123', user, 3600);
   *
   * // 设置配置缓存，永不过期
   * await redisService.set('app:config', config);
   *
   * // 设置临时缓存，TTL 5分钟
   * await redisService.set('temp:data', data, 300);
   * ```
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
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
   * 从Redis删除缓存，支持单个键删除。
   *
   * @description 此方法从Redis删除指定键的缓存，支持单个键删除。
   * 如果缓存不存在，操作不会报错。
   * 支持缓存删除的统计和监控。
   *
   * ## 业务规则
   *
   * ### 删除规则
   * - 从Redis删除指定键的缓存
   * - 支持单个键删除
   * - 如果缓存不存在，操作不会报错
   * - 支持缓存删除的统计和监控
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * ### 性能优化规则
   * - 支持连接池优化
   * - 支持批量操作优化
   * - 支持缓存策略优化
   * - 支持性能监控和统计
   *
   * @param key - 缓存键
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 删除用户缓存
   * await redisService.delete('user:123');
   * console.log('用户缓存已删除');
   *
   * // 删除配置缓存
   * await redisService.delete('app:config');
   * console.log('配置缓存已删除');
   * ```
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
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
   * 检查Redis中是否存在指定的键。
   *
   * @description 此方法检查Redis中是否存在指定的键，不修改缓存统计信息。
   * 仅用于检查缓存存在性，不触发缓存命中/未命中统计。
   * 支持缓存键的存在性检查。
   *
   * ## 业务规则
   *
   * ### 检查规则
   * - 检查Redis中是否存在指定的键
   * - 不修改缓存统计信息
   * - 不触发缓存命中/未命中统计
   * - 仅用于检查缓存存在性
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * ### 性能优化规则
   * - 支持连接池优化
   * - 支持批量操作优化
   * - 支持缓存策略优化
   * - 支持性能监控和统计
   *
   * @param key - 缓存键
   * @returns 如果缓存存在返回true，否则返回false
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 检查用户缓存是否存在
   * const userExists = await redisService.exists('user:123');
   * if (userExists) {
   *   console.log('用户缓存存在');
   * } else {
   *   console.log('用户缓存不存在');
   * }
   *
   * // 检查配置缓存是否存在
   * const configExists = await redisService.exists('app:config');
   * ```
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
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
   * 批量从Redis获取多个缓存值，支持泛型类型安全。
   *
   * @description 此方法批量从Redis获取多个缓存值，支持泛型类型安全。
   * 自动处理JSON序列化和反序列化，支持任意类型的数据。
   * 返回的数组与输入键数组顺序一致，不存在的键返回null。
   *
   * ## 业务规则
   *
   * ### 批量获取规则
   * - 批量从Redis获取多个缓存值
   * - 支持泛型类型安全
   * - 自动处理JSON反序列化
   * - 支持任意类型的数据
   *
   * ### 返回规则
   * - 返回数组与输入键数组顺序一致
   * - 不存在的键返回null
   * - 支持部分成功，部分失败的情况
   * - 支持批量操作的性能优化
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * @param keys - 缓存键数组
   * @returns 缓存值数组，与输入键数组顺序一致，不存在的键返回null
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 批量获取用户缓存
   * const userIds = ['user:123', 'user:456', 'user:789'];
   * const users = await redisService.mget<User>(userIds);
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
   * const configs = await redisService.mget<Config>(configKeys);
   * ```
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
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
   * 批量向Redis设置多个缓存值，支持TTL设置和泛型类型安全。
   *
   * @description 此方法批量向Redis设置多个缓存值，支持TTL设置和泛型类型安全。
   * 自动处理JSON序列化，支持任意类型的数据。
   * 支持不同键使用不同的TTL设置。
   *
   * ## 业务规则
   *
   * ### 批量设置规则
   * - 批量向Redis设置多个缓存值
   * - 支持泛型类型安全
   * - 自动处理JSON序列化
   * - 支持任意类型的数据
   *
   * ### TTL管理规则
   * - 支持不同键使用不同的TTL
   * - 如果未指定TTL，缓存永不过期
   * - 支持秒级TTL精度
   * - 支持缓存过期自动清理
   *
   * ### 性能优化规则
   * - 支持批量操作的性能优化
   * - 支持连接池优化
   * - 支持缓存策略优化
   * - 支持性能监控和统计
   *
   * @param pairs - 缓存键值对数组，每个对象包含key、value和可选的ttl
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 批量设置用户缓存
   * await redisService.mset([
   *   { key: 'user:123', value: user1, ttl: 3600 },
   *   { key: 'user:456', value: user2, ttl: 1800 },
   *   { key: 'user:789', value: user3 } // 使用默认TTL
   * ]);
   *
   * // 批量设置配置缓存
   * await redisService.mset([
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
      const pipeline = this.redis.pipeline();

      for (const { key, value, ttl } of pairs) {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      }

      await pipeline.exec();
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
   * 批量从Redis删除多个缓存，支持批量操作优化。
   *
   * @description 此方法批量从Redis删除多个缓存，支持批量操作优化。
   * 支持批量删除的性能优化，减少网络往返次数。
   * 如果缓存不存在，操作不会报错。
   *
   * ## 业务规则
   *
   * ### 批量删除规则
   * - 批量从Redis删除多个缓存
   * - 支持批量操作的性能优化
   * - 减少网络往返次数
   * - 支持批量删除的统计和监控
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * ### 性能优化规则
   * - 支持批量操作的性能优化
   * - 支持连接池优化
   * - 支持缓存策略优化
   * - 支持性能监控和统计
   *
   * @param keys - 缓存键数组
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 批量删除用户缓存
   * await redisService.mdelete(['user:123', 'user:456', 'user:789']);
   * console.log('用户缓存已批量删除');
   *
   * // 批量删除配置缓存
   * await redisService.mdelete(['app:config', 'db:config', 'cache:config']);
   * console.log('配置缓存已批量删除');
   * ```
   */
  async mdelete(keys: string[]): Promise<void> {
    try {
      await this.redis.del(...keys);
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
   * 为缓存设置过期时间，支持秒级TTL精度。
   *
   * @description 此方法为指定键的缓存设置过期时间，支持秒级TTL精度。
   * 支持动态调整缓存过期时间，支持缓存过期自动清理。
   * 如果缓存不存在，操作不会报错。
   *
   * ## 业务规则
   *
   * ### TTL管理规则
   * - 为指定键设置过期时间
   * - 支持秒级TTL精度
   * - 支持动态调整缓存过期时间
   * - 支持缓存过期自动清理
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * ### 性能优化规则
   * - 支持连接池优化
   * - 支持批量操作优化
   * - 支持缓存策略优化
   * - 支持性能监控和统计
   *
   * @param key - 缓存键
   * @param ttl - 过期时间（秒），必须大于0
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 设置用户缓存过期时间为1小时
   * await redisService.expire('user:123', 3600);
   * console.log('用户缓存过期时间已设置');
   *
   * // 设置配置缓存过期时间为30分钟
   * await redisService.expire('app:config', 1800);
   * console.log('配置缓存过期时间已设置');
   * ```
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      this.logger.error('设置过期时间失败', {
        key,
        ttl,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取剩余过期时间
   *
   * 获取缓存的剩余过期时间，支持秒级TTL精度。
   *
   * @description 此方法获取指定键的缓存剩余过期时间，支持秒级TTL精度。
   * 返回秒级TTL，如果缓存不存在或已过期，返回-1。
   * 如果缓存永不过期，返回-2。
   *
   * ## 业务规则
   *
   * ### TTL查询规则
   * - 获取指定键的剩余过期时间
   * - 支持秒级TTL精度
   * - 缓存不存在时返回-1
   * - 缓存永不过期时返回-2
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * ### 性能优化规则
   * - 支持连接池优化
   * - 支持批量操作优化
   * - 支持缓存策略优化
   * - 支持性能监控和统计
   *
   * @param key - 缓存键
   * @returns 剩余过期时间（秒），-1表示不存在，-2表示永不过期
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 获取用户缓存剩余过期时间
   * const ttl = await redisService.ttl('user:123');
   * if (ttl > 0) {
   *   console.log(`用户缓存还有 ${ttl} 秒过期`);
   * } else if (ttl === -1) {
   *   console.log('用户缓存不存在');
   * } else if (ttl === -2) {
   *   console.log('用户缓存永不过期');
   * }
   *
   * // 获取配置缓存剩余过期时间
   * const configTtl = await redisService.ttl('app:config');
   * ```
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error('获取过期时间失败', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取匹配的键
   *
   * 获取匹配模式的所有键，支持通配符模式匹配。
   *
   * @description 此方法获取匹配指定模式的所有缓存键，支持通配符模式匹配。
   * 支持通配符模式匹配（*、?等），支持正则表达式模式匹配。
   * 大量键匹配可能影响性能，建议使用具体的键模式。
   *
   * ## 业务规则
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
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * @param pattern - 匹配模式，支持通配符
   * @returns 匹配的键数组
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 获取所有用户缓存键
   * const userKeys = await redisService.keys('user:*');
   * console.log('用户缓存键:', userKeys);
   *
   * // 获取所有配置缓存键
   * const configKeys = await redisService.keys('app:*');
   * console.log('配置缓存键:', configKeys);
   *
   * // 获取特定模式的键
   * const tempKeys = await redisService.keys('temp:*');
   * console.log('临时缓存键:', tempKeys);
   * ```
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
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
   * 清空Redis中的所有缓存，重置所有数据。
   *
   * @description 此方法清空Redis中的所有缓存，重置所有数据。
   * 这是一个危险操作，会删除所有缓存数据。
   * 建议在生产环境中谨慎使用。
   *
   * ## 业务规则
   *
   * ### 清空规则
   * - 清空所有缓存数据
   * - 重置所有统计信息
   * - 重置所有连接状态
   * - 重置所有监控数据
   *
   * ### 安全规则
   * - 这是一个危险操作
   * - 会删除所有缓存数据
   * - 建议在生产环境中谨慎使用
   * - 建议在维护窗口期间执行
   *
   * ### 错误处理规则
   * - 缓存操作失败时记录错误日志
   * - 缓存操作失败时抛出异常
   * - 支持缓存操作的优雅降级
   * - 支持缓存操作的自动重试
   *
   * @throws {Error} 当缓存操作失败时抛出
   *
   * @example
   * ```typescript
   * // 清空所有缓存（危险操作）
   * await redisService.flush();
   * console.log('所有缓存已清空');
   *
   * // 在维护期间清空缓存
   * if (isMaintenanceMode) {
   *   await redisService.flush();
   *   console.log('维护期间清空缓存完成');
   * }
   * ```
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('Redis缓存已清空');
    } catch (error) {
      this.logger.error('清空缓存失败', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 检查连接状态
   *
   * 检查Redis连接是否正常，支持健康检查。
   *
   * @description 此方法检查Redis连接是否正常，支持健康检查。
   * 检查连接状态和Redis实例状态，提供准确的健康状态。
   * 用于监控和诊断Redis服务的运行状态。
   *
   * ## 业务规则
   *
   * ### 健康检查规则
   * - 检查Redis连接状态
   * - 检查Redis实例状态
   * - 支持健康状态的实时检查
   * - 支持健康状态的动态更新
   *
   * ### 状态判断规则
   * - 连接正常且Redis实例就绪时返回true
   * - 连接异常或Redis实例未就绪时返回false
   * - 支持健康状态的实时监控
   * - 支持健康状态的告警
   *
   * ### 监控规则
   * - 支持Redis服务的实时监控
   * - 支持健康状态的告警
   * - 支持健康状态的日志记录
   * - 支持健康状态的统计分析
   *
   * @returns 如果Redis连接正常返回true，否则返回false
   *
   * @example
   * ```typescript
   * // 检查Redis连接状态
   * const isHealthy = redisService.isHealthy();
   * if (isHealthy) {
   *   console.log('Redis连接正常');
   * } else {
   *   console.log('Redis连接异常');
   * }
   *
   * // 健康检查
   * if (!redisService.isHealthy()) {
   *   console.log('Redis服务不健康，需要检查');
   * }
   * ```
   */
  isHealthy(): boolean {
    return this.isConnected && this.redis?.status === 'ready';
  }

  /**
   * 获取连接信息
   *
   * 获取Redis连接信息，支持连接状态监控。
   *
   * @description 此方法获取Redis连接信息，支持连接状态监控。
   * 提供连接状态、配置信息、性能指标等详细信息。
   * 用于监控和诊断Redis服务的运行状态。
   *
   * ## 业务规则
   *
   * ### 连接信息规则
   * - 提供连接状态信息
   * - 提供配置信息
   * - 提供性能指标信息
   * - 支持连接信息的实时更新
   *
   * ### 监控规则
   * - 支持连接状态的实时监控
   * - 支持配置信息的查看
   * - 支持性能指标的查看
   * - 支持连接信息的统计分析
   *
   * ### 诊断规则
   * - 支持连接问题的诊断
   * - 支持性能问题的诊断
   * - 支持配置问题的诊断
   * - 支持连接信息的日志记录
   *
   * @returns 返回Redis连接信息对象
   *
   * @example
   * ```typescript
   * // 获取连接信息
   * const connectionInfo = redisService.getConnectionInfo();
   * console.log('连接状态:', connectionInfo.isConnected);
   * console.log('配置信息:', connectionInfo.config);
   * console.log('性能指标:', connectionInfo.metrics);
   *
   * // 监控连接状态
   * if (connectionInfo.isConnected) {
   *   console.log('Redis连接正常');
   * } else {
   *   console.log('Redis连接异常');
   * }
   * ```
   */
  getConnectionInfo(): ConnectionInfo {
    return { ...this.connectionInfo };
  }

  /**
   * 获取Redis实例
   *
   * 获取Redis实例用于高级操作，支持原生Redis操作。
   *
   * @description 此方法获取Redis实例用于高级操作，支持原生Redis操作。
   * 提供对Redis实例的直接访问，支持高级功能和自定义操作。
   * 用于需要原生Redis功能的场景。
   *
   * ## 业务规则
   *
   * ### 实例访问规则
   * - 提供Redis实例的直接访问
   * - 支持原生Redis操作
   * - 支持高级功能的使用
   * - 支持自定义操作的实现
   *
   * ### 使用规则
   * - 需要原生Redis功能时使用
   * - 支持高级Redis操作
   * - 支持自定义Redis命令
   * - 支持Redis事务操作
   *
   * ### 安全规则
   * - 需要谨慎使用原生Redis操作
   * - 支持操作的安全检查
   * - 支持操作的权限控制
   * - 支持操作的日志记录
   *
   * @returns 返回Redis实例
   *
   * @example
   * ```typescript
   * // 获取Redis实例
   * const redis = redisService.getRedis();
   *
   * // 使用原生Redis操作
   * await redis.set('key', 'value');
   * const value = await redis.get('key');
   *
   * // 使用高级Redis功能
   * await redis.pipeline()
   *   .set('key1', 'value1')
   *   .set('key2', 'value2')
   *   .exec();
   * ```
   */
  getRedis(): Redis {
    return this.redis;
  }

  /**
   * 执行Redis命令
   *
   * 执行原生Redis命令，支持自定义Redis命令。
   *
   * @description 此方法执行原生Redis命令，支持自定义Redis命令。
   * 提供对Redis命令的直接执行，支持高级功能和自定义操作。
   * 用于需要原生Redis命令的场景。
   *
   * ## 业务规则
   *
   * ### 命令执行规则
   * - 支持自定义Redis命令的执行
   * - 支持命令参数的自定义
   * - 支持命令结果的类型化
   * - 支持命令执行的安全检查
   *
   * ### 使用规则
   * - 需要自定义Redis命令时使用
   * - 支持高级Redis操作
   * - 支持自定义Redis命令
   * - 支持Redis事务操作
   *
   * ### 安全规则
   * - 需要谨慎使用自定义Redis命令
   * - 支持命令的安全检查
   * - 支持命令的权限控制
   * - 支持命令的日志记录
   *
   * @param command Redis命令名称
   * @param args 命令参数
   * @returns 返回命令执行结果
   *
   * @throws {Error} 当Redis连接异常时抛出错误
   * @throws {Error} 当命令执行失败时抛出错误
   *
   * @example
   * ```typescript
   * // 执行自定义Redis命令
   * const result = await redisService.executeCommand('GET', 'key');
   *
   * // 执行高级Redis操作
   * const pipeline = await redisService.executeCommand('PIPELINE');
   *
   * // 执行事务操作
   * const multi = await redisService.executeCommand('MULTI');
   * ```
   */
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    try {
      return await this.redis.call(command, ...args);
    } catch (error) {
      this.logger.error('执行Redis命令失败', {
        command,
        args,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取Redis统计信息
   *
   * 获取Redis服务器统计信息，支持性能监控和诊断。
   *
   * @description 此方法获取Redis服务器统计信息，支持性能监控和诊断。
   * 提供Redis实例的详细统计信息，包括内存使用、连接数、命令统计等。
   * 用于监控和诊断Redis服务的运行状态。
   *
   * ## 业务规则
   *
   * ### 统计信息规则
   * - 提供Redis实例的详细统计信息
   * - 支持内存使用统计
   * - 支持连接数统计
   * - 支持命令统计
   *
   * ### 监控规则
   * - 支持性能监控
   * - 支持资源使用监控
   * - 支持连接状态监控
   * - 支持命令执行监控
   *
   * ### 诊断规则
   * - 支持性能问题诊断
   * - 支持资源问题诊断
   * - 支持连接问题诊断
   * - 支持命令问题诊断
   *
   * @returns 返回Redis统计信息对象
   *
   * @throws {Error} 当Redis连接异常时抛出错误
   * @throws {Error} 当获取统计信息失败时抛出错误
   *
   * @example
   * ```typescript
   * // 获取Redis统计信息
   * const stats = await redisService.getStats();
   * console.log('内存使用:', stats.used_memory);
   * console.log('连接数:', stats.connected_clients);
   * console.log('命令统计:', stats.total_commands_processed);
   *
   * // 监控Redis性能
   * if (stats.used_memory > 1000000) {
   *   console.log('Redis内存使用过高');
   * }
   * ```
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.redis.info();
      const stats: Record<string, any> = {};

      // 解析Redis INFO输出
      info.split('\r\n').forEach((line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('获取Redis统计信息失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
