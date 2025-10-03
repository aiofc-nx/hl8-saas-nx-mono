/**
 * 缓存管理器
 *
 * 提供缓存的统一管理和协调能力。
 * 作为通用功能组件，支持缓存的生命周期管理和依赖注入。
 *
 * @description 缓存管理器实现缓存的统一管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import { CacheAdapter, ICacheConfig } from './cache.adapter';
import { CacheFactory, ICacheRegistration } from './cache.factory';

/**
 * 缓存管理器配置
 */
export interface ICacheManagerConfig {
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  /** 缓存最大年龄（毫秒） */
  maxCacheAge: number;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
  /** 是否启用统计收集 */
  enableStatistics: boolean;
  /** 统计收集间隔（毫秒） */
  statisticsInterval: number;
}

/**
 * 缓存管理器
 *
 * 提供缓存的统一管理和协调
 */
@Injectable()
export class CacheManager {
  private readonly config: ICacheManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private statisticsTimer?: NodeJS.Timeout;

  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger,
    private readonly cacheFactory: CacheFactory,
    config: Partial<ICacheManagerConfig> = {}
  ) {
    this.config = {
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60 * 60 * 1000, // 1小时
      maxCacheAge: config.maxCacheAge ?? 24 * 60 * 60 * 1000, // 24小时
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 5 * 60 * 1000, // 5分钟
      enableStatistics: config.enableStatistics ?? true,
      statisticsInterval: config.statisticsInterval ?? 10 * 60 * 1000, // 10分钟
    };

    this.initialize();
  }

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
    this.logger.debug(`创建缓存: ${cacheName}`, {
      cacheType,
      config,
    });

    return this.cacheFactory.createCache(cacheName, cacheType, config);
  }

  /**
   * 获取缓存
   *
   * @param cacheName - 缓存名称
   * @returns 缓存实例
   */
  getCache(cacheName: string): CacheAdapter | null {
    return this.cacheFactory.getCache(cacheName);
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
    return this.cacheFactory.getOrCreateCache(cacheName, cacheType, config);
  }

  /**
   * 销毁缓存
   *
   * @param cacheName - 缓存名称
   */
  async destroyCache(cacheName: string): Promise<void> {
    this.logger.debug(`销毁缓存: ${cacheName}`);
    await this.cacheFactory.destroyCache(cacheName);
  }

  /**
   * 获取所有缓存
   *
   * @returns 缓存注册信息列表
   */
  getAllCaches(): ICacheRegistration[] {
    return this.cacheFactory.getAllCaches();
  }

  /**
   * 获取缓存注册信息
   *
   * @param cacheName - 缓存名称
   * @returns 缓存注册信息
   */
  getCacheRegistration(cacheName: string): ICacheRegistration | null {
    return this.cacheFactory.getCacheRegistration(cacheName);
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
    this.logger.debug(`更新缓存配置: ${cacheName}`, { config });
    this.cacheFactory.updateCacheConfiguration(cacheName, config);
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
    return this.cacheFactory.getCacheStatistics();
  }

  /**
   * 健康检查所有缓存
   *
   * @returns 健康检查结果
   */
  async healthCheckAllCaches(): Promise<Record<string, any>> {
    this.logger.debug('开始健康检查所有缓存');
    return await this.cacheFactory.healthCheckAllCaches();
  }

  /**
   * 清理过期缓存
   *
   * @returns 清理的缓存数量
   */
  async cleanupExpiredCaches(): Promise<number> {
    this.logger.debug('开始清理过期缓存');
    return await this.cacheFactory.cleanupExpiredCaches(
      this.config.maxCacheAge
    );
  }

  /**
   * 获取所有缓存统计信息
   *
   * @returns 所有缓存的统计信息
   */
  async getAllCacheStatistics(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const caches = this.getAllCaches();

    for (const cache of caches) {
      if (cache.instance) {
        try {
          const stats = cache.instance.getStatistics();
          results[cache.cacheName] = {
            cacheName: cache.cacheName,
            cacheType: cache.cacheType,
            statistics: stats,
            createdAt: cache.createdAt,
            lastAccessedAt: cache.lastAccessedAt,
          };
        } catch (error) {
          results[cache.cacheName] = {
            cacheName: cache.cacheName,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    }

    return results;
  }

  /**
   * 重置所有缓存统计信息
   */
  async resetAllCacheStatistics(): Promise<void> {
    const caches = this.getAllCaches();

    for (const cache of caches) {
      if (cache.instance) {
        cache.instance.resetStatistics();
      }
    }

    this.logger.debug(`重置所有缓存统计信息: ${caches.length}`, {
      cacheCount: caches.length,
    });
  }

  /**
   * 预热所有缓存
   *
   * @param warmupData - 预热数据映射
   * @param ttl - 生存时间（秒）
   */
  async warmupAllCaches(
    warmupData: Record<string, Record<string, any>>,
    ttl?: number
  ): Promise<void> {
    const caches = this.getAllCaches();

    for (const cache of caches) {
      if (cache.instance && warmupData[cache.cacheName]) {
        try {
          await cache.instance.warmup(warmupData[cache.cacheName], ttl);
        } catch (error) {
          this.logger.error(`预热缓存失败: ${cache.cacheName}`, error);
        }
      }
    }

    this.logger.debug(`预热所有缓存完成: ${caches.length}`, {
      cacheCount: caches.length,
    });
  }

  /**
   * 获取管理器状态
   *
   * @returns 管理器状态
   */
  getManagerStatus(): {
    config: ICacheManagerConfig;
    statistics: any;
    healthy: boolean;
    timestamp: Date;
  } {
    const statistics = this.getCacheStatistics();
    const healthy = statistics.totalCaches > 0;

    return {
      config: { ...this.config },
      statistics,
      healthy,
      timestamp: new Date(),
    };
  }

  /**
   * 启动管理器
   */
  start(): void {
    this.logger.info('启动缓存管理器');

    // 启动自动清理
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    // 启动健康检查
    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }

    // 启动统计收集
    if (this.config.enableStatistics) {
      this.startStatisticsCollection();
    }
  }

  /**
   * 停止管理器
   */
  stop(): void {
    this.logger.info('停止缓存管理器');

    // 停止自动清理
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // 停止统计收集
    if (this.statisticsTimer) {
      clearInterval(this.statisticsTimer);
      this.statisticsTimer = undefined;
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logger.info('销毁缓存管理器');

    // 停止管理器
    this.stop();

    // 销毁所有缓存
    const caches = this.getAllCaches();
    for (const cache of caches) {
      await this.destroyCache(cache.cacheName);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化管理器
   */
  private initialize(): void {
    this.logger.debug('初始化缓存管理器', {
      config: this.config,
    });
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredCaches();
        if (cleanedCount > 0) {
          this.logger.debug(`自动清理完成: ${cleanedCount} 个缓存`);
        }
      } catch (error) {
        this.logger.error('自动清理失败', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthResults = await this.healthCheckAllCaches();
        const unhealthyCaches = Object.entries(healthResults).filter(
          ([, result]) => !result.healthy
        );

        if (unhealthyCaches.length > 0) {
          this.logger.warn('发现不健康的缓存', {
            unhealthyCaches: unhealthyCaches.map(([name]) => name),
          });
        }
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * 启动统计收集
   */
  private startStatisticsCollection(): void {
    this.statisticsTimer = setInterval(async () => {
      try {
        const allStats = await this.getAllCacheStatistics();
        this.logger.debug('缓存统计信息收集完成', {
          cacheCount: Object.keys(allStats).length,
          statistics: allStats,
        });
      } catch (error) {
        this.logger.error('统计收集失败', error);
      }
    }, this.config.statisticsInterval);
  }
}
