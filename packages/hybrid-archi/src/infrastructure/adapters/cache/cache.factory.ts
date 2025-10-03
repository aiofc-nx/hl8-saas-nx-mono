/**
 * 缓存工厂
 *
 * 提供缓存适配器的动态创建和管理能力。
 * 作为通用功能组件，支持缓存的生命周期管理。
 *
 * @description 缓存工厂实现缓存适配器的动态创建和管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import { CacheAdapter, ICacheConfig } from './cache.adapter';

/**
 * 缓存注册信息
 */
export interface ICacheRegistration {
  /** 缓存名称 */
  cacheName: string;
  /** 缓存类型 */
  cacheType: string;
  /** 缓存配置 */
  config: ICacheConfig;
  /** 缓存实例 */
  instance?: CacheAdapter;
  /** 是否已初始化 */
  initialized: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
}

/**
 * 缓存工厂
 *
 * 提供缓存适配器的动态创建和管理
 */
@Injectable()
export class CacheFactory {
  private readonly caches = new Map<string, ICacheRegistration>();

  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger
  ) {}

  /**
   * 创建缓存
   *
   * @param cacheName - 缓存名称
   * @param cacheType - 缓存类型
   * @param config - 缓存配置
   * @returns 缓存实例
   */
  createCache(
    cacheName: string,
    cacheType: string,
    config: Partial<ICacheConfig> = {}
  ): CacheAdapter {
    // 检查缓存是否已存在
    if (this.caches.has(cacheName)) {
      const registration = this.caches.get(cacheName)!;
      registration.lastAccessedAt = new Date();
      return registration.instance!;
    }

    // 创建缓存实例
    const cache = new CacheAdapter(this.cacheService, this.logger, config);

    // 注册缓存
    const registration: ICacheRegistration = {
      cacheName,
      cacheType,
      config: {
        enableMemoryCache: config.enableMemoryCache ?? true,
        enableRedisCache: config.enableRedisCache ?? true,
        enableDistributedCache: config.enableDistributedCache ?? false,
        defaultTtl: config.defaultTtl ?? 300,
        maxMemoryCacheSize: config.maxMemoryCacheSize ?? 1000,
        enableCompression: config.enableCompression ?? false,
        enableEncryption: config.enableEncryption ?? false,
        enableStatistics: config.enableStatistics ?? true,
        keyPrefix: config.keyPrefix ?? 'hybrid-archi',
        enableWarmup: config.enableWarmup ?? false,
      },
      instance: cache,
      initialized: true,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.caches.set(cacheName, registration);

    this.logger.debug(`创建缓存: ${cacheName}`, {
      cacheType,
      config: registration.config,
    });

    return cache;
  }

  /**
   * 获取缓存
   *
   * @param cacheName - 缓存名称
   * @returns 缓存实例
   */
  getCache(cacheName: string): CacheAdapter | null {
    const registration = this.caches.get(cacheName);
    if (!registration) {
      return null;
    }

    registration.lastAccessedAt = new Date();
    return registration.instance!;
  }

  /**
   * 获取或创建缓存
   *
   * @param cacheName - 缓存名称
   * @param cacheType - 缓存类型
   * @param config - 缓存配置
   * @returns 缓存实例
   */
  getOrCreateCache(
    cacheName: string,
    cacheType: string,
    config: Partial<ICacheConfig> = {}
  ): CacheAdapter {
    const existingCache = this.getCache(cacheName);
    if (existingCache) {
      return existingCache;
    }

    return this.createCache(cacheName, cacheType, config);
  }

  /**
   * 销毁缓存
   *
   * @param cacheName - 缓存名称
   */
  async destroyCache(cacheName: string): Promise<void> {
    const registration = this.caches.get(cacheName);
    if (!registration) {
      return;
    }

    try {
      // 清理缓存资源
      if (registration.instance) {
        await registration.instance.clear();
      }

      // 移除缓存注册
      this.caches.delete(cacheName);

      this.logger.debug(`销毁缓存: ${cacheName}`);
    } catch (error) {
      this.logger.error(`销毁缓存失败: ${cacheName}`, error);
      throw error;
    }
  }

  /**
   * 获取所有缓存
   *
   * @returns 缓存注册信息列表
   */
  getAllCaches(): ICacheRegistration[] {
    return Array.from(this.caches.values());
  }

  /**
   * 获取缓存注册信息
   *
   * @param cacheName - 缓存名称
   * @returns 缓存注册信息
   */
  getCacheRegistration(cacheName: string): ICacheRegistration | null {
    return this.caches.get(cacheName) || null;
  }

  /**
   * 更新缓存配置
   *
   * @param cacheName - 缓存名称
   * @param config - 新配置
   */
  updateCacheConfiguration(
    cacheName: string,
    config: Partial<ICacheConfig>
  ): void {
    const registration = this.caches.get(cacheName);
    if (!registration) {
      throw new Error(`缓存不存在: ${cacheName}`);
    }

    Object.assign(registration.config, config);

    this.logger.debug(`更新缓存配置: ${cacheName}`, {
      config: registration.config,
    });
  }

  /**
   * 清理过期缓存
   *
   * @param maxAge - 最大年龄（毫秒）
   * @returns 清理的缓存数量
   */
  async cleanupExpiredCaches(
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const now = new Date();
    const expiredCaches: string[] = [];

    for (const [cacheName, registration] of this.caches) {
      const age = now.getTime() - registration.lastAccessedAt.getTime();
      if (age > maxAge) {
        expiredCaches.push(cacheName);
      }
    }

    for (const cacheName of expiredCaches) {
      await this.destroyCache(cacheName);
    }

    this.logger.debug(`清理过期缓存: ${expiredCaches.length}`, {
      expiredCaches,
    });

    return expiredCaches.length;
  }

  /**
   * 获取缓存统计信息
   *
   * @returns 缓存统计信息
   */
  getCacheStatistics(): {
    totalCaches: number;
    activeCaches: number;
    cacheTypes: Record<string, number>;
    averageAge: number;
    oldestCache: string | null;
    newestCache: string | null;
  } {
    const caches = Array.from(this.caches.values());
    const now = new Date();

    const cacheTypes: Record<string, number> = {};
    let totalAge = 0;
    let oldestCache: string | null = null;
    let newestCache: string | null = null;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const cache of caches) {
      // 统计缓存类型
      cacheTypes[cache.cacheType] = (cacheTypes[cache.cacheType] || 0) + 1;

      // 计算年龄
      const age = now.getTime() - cache.createdAt.getTime();
      totalAge += age;

      // 找到最老的缓存
      if (age > oldestAge) {
        oldestAge = age;
        oldestCache = cache.cacheName;
      }

      // 找到最新的缓存
      if (age < newestAge) {
        newestAge = age;
        newestCache = cache.cacheName;
      }
    }

    return {
      totalCaches: caches.length,
      activeCaches: caches.filter((c) => c.initialized).length,
      cacheTypes,
      averageAge: caches.length > 0 ? totalAge / caches.length : 0,
      oldestCache,
      newestCache,
    };
  }

  /**
   * 健康检查所有缓存
   *
   * @returns 健康检查结果
   */
  async healthCheckAllCaches(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [cacheName, registration] of this.caches) {
      try {
        const isHealthy = await this.checkCacheHealth(
          cacheName,
          registration.instance!
        );
        results[cacheName] = {
          healthy: isHealthy,
          status: isHealthy ? 'healthy' : 'unhealthy',
          cacheName,
          cacheType: registration.cacheType,
          createdAt: registration.createdAt,
          lastAccessedAt: registration.lastAccessedAt,
        };
      } catch (error) {
        results[cacheName] = {
          healthy: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          cacheName,
        };
      }
    }

    return results;
  }

  // ==================== 私有方法 ====================

  /**
   * 检查缓存健康状态
   */
  private async checkCacheHealth(
    cacheName: string,
    instance: CacheAdapter
  ): Promise<boolean> {
    try {
      // 检查缓存是否可用
      const testKey = `health:${cacheName}:${Date.now()}`;
      const testValue = 'test';

      await instance.set(testKey, testValue, 1);
      const retrieved = await instance.get(testKey);
      await instance.delete(testKey);

      return retrieved === testValue;
    } catch {
      return false;
    }
  }
}
