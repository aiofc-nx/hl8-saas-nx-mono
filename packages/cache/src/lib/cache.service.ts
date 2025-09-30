/**
 * 缓存服务
 *
 * @description 基于Redis和nestjs-cls的核心缓存服务
 * 提供高性能、多租户的缓存操作，支持自动租户上下文管理
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { RedisService } from './redis.service';
import { ContextService } from './context.service';
import {
  ICacheService,
  CacheModuleOptions,
  CacheStats,
  TenantCacheStats,
} from './types/cache.types';

/**
 * 缓存服务
 *
 * @description 提供基于Redis和nestjs-cls的缓存操作
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
    private readonly contextService: ContextService,
    private readonly logger: PinoLogger,
    private readonly options: CacheModuleOptions
  ) {
    this.logger.setContext({ requestId: 'cache-service' });
  }

  /**
   * 获取缓存值
   *
   * @description 从Redis获取缓存值，自动处理租户上下文
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const tenantKey = this.getTenantKey(key);
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
   * @description 向Redis设置缓存值，自动处理租户上下文
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const tenantKey = this.getTenantKey(key);
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
   * @description 从Redis删除缓存，自动处理租户上下文
   */
  async delete(key: string): Promise<void> {
    try {
      const tenantKey = this.getTenantKey(key);
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
   * @description 检查Redis中是否存在指定的键，自动处理租户上下文
   */
  async exists(key: string): Promise<boolean> {
    try {
      const tenantKey = this.getTenantKey(key);
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
   * @description 批量从Redis获取多个缓存值，自动处理租户上下文
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const tenantKeys = keys.map((key) => this.getTenantKey(key));
      const values = await this.redisService.mget<T>(tenantKeys);

      // 更新统计
      values.forEach((value, index) => {
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
   * @description 批量向Redis设置多个缓存值，自动处理租户上下文
   */
  async mset<T>(
    pairs: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    try {
      const tenantPairs = pairs.map(({ key, value, ttl }) => ({
        key: this.getTenantKey(key),
        value,
        ttl: ttl || this.options.defaultTTL || 3600,
      }));

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
   * @description 批量从Redis删除多个缓存，自动处理租户上下文
   */
  async mdelete(keys: string[]): Promise<void> {
    try {
      const tenantKeys = keys.map((key) => this.getTenantKey(key));
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
   * @description 为缓存设置过期时间，自动处理租户上下文
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      const tenantKey = this.getTenantKey(key);
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
   * @description 获取缓存的剩余过期时间，自动处理租户上下文
   */
  async ttl(key: string): Promise<number> {
    try {
      const tenantKey = this.getTenantKey(key);
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
   * @description 获取匹配模式的所有键，自动处理租户上下文
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const tenantPattern = this.getTenantKey(pattern);
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
   * @description 清空Redis中的所有缓存
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
   * @description 获取当前上下文中的租户ID
   */
  getCurrentTenant(): string | null {
    return this.contextService.getTenant();
  }

  /**
   * 检查是否有租户上下文
   *
   * @description 检查当前是否有租户上下文
   */
  hasTenantContext(): boolean {
    return this.contextService.hasTenantContext();
  }

  /**
   * 获取缓存统计
   *
   * @description 获取缓存使用统计信息
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
   * @description 获取指定租户的缓存统计信息
   */
  getTenantStats(tenantId: string): TenantCacheStats | null {
    return this.stats.tenantStats.get(tenantId) || null;
  }

  /**
   * 清空租户缓存
   *
   * @description 清空指定租户的所有缓存
   */
  async clearTenantCache(tenantId: string): Promise<void> {
    try {
      const pattern = this.getTenantKey('*', tenantId);
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
   * @description 根据租户ID生成租户隔离的缓存键
   */
  private getTenantKey(key: string, tenantId?: string): string {
    const currentTenantId = tenantId || this.contextService.getTenant();
    const keyPrefix = this.options.keyPrefix || 'hl8:cache:';

    if (this.options.enableTenantIsolation && currentTenantId) {
      return `${keyPrefix}tenant:${currentTenantId}:${key}`;
    }

    return `${keyPrefix}${key}`;
  }

  /**
   * 更新租户统计
   *
   * @description 更新指定租户的缓存统计信息
   */
  private updateTenantStats(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    count = 1
  ): void {
    const tenantId = this.contextService.getTenant();
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
   * @description 更新整体缓存命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * 获取缓存健康状态
   *
   * @description 获取缓存服务的健康状态
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    redisConnected: boolean;
    contextAvailable: boolean;
    stats: CacheStats;
  }> {
    const redisConnected = this.redisService.isHealthy();
    const contextAvailable = this.contextService.hasTenantContext();
    const isHealthy = redisConnected && contextAvailable;

    return {
      isHealthy,
      redisConnected,
      contextAvailable,
      stats: this.getStats(),
    };
  }
}
