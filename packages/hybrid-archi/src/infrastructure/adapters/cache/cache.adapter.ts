/**
 * 缓存适配器
 *
 * 实现多级缓存策略，提供统一的缓存能力。
 * 作为通用功能组件，支持内存缓存、Redis缓存等多种缓存实现。
 *
 * @description 缓存适配器实现多级缓存策略
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';

/**
 * 缓存配置接口
 */
export interface ICacheConfig {
  /** 是否启用内存缓存 */
  enableMemoryCache: boolean;
  /** 是否启用Redis缓存 */
  enableRedisCache: boolean;
  /** 是否启用分布式缓存 */
  enableDistributedCache: boolean;
  /** 默认TTL（秒） */
  defaultTtl: number;
  /** 最大内存缓存大小 */
  maxMemoryCacheSize: number;
  /** 是否启用缓存压缩 */
  enableCompression: boolean;
  /** 是否启用缓存加密 */
  enableEncryption: boolean;
  /** 是否启用缓存统计 */
  enableStatistics: boolean;
  /** 缓存键前缀 */
  keyPrefix: string;
  /** 是否启用缓存预热 */
  enableWarmup: boolean;
}

/**
 * 缓存统计信息
 */
export interface ICacheStatistics {
  /** 总请求数 */
  totalRequests: number;
  /** 命中数 */
  hits: number;
  /** 未命中数 */
  misses: number;
  /** 命中率 */
  hitRate: number;
  /** 内存缓存大小 */
  memoryCacheSize: number;
  /** Redis缓存大小 */
  redisCacheSize: number;
  /** 平均响应时间 */
  averageResponseTime: number;
}

/**
 * 缓存级别枚举
 */
export enum CacheLevel {
  /** 内存缓存 */
  MEMORY = 'memory',
  /** Redis缓存 */
  REDIS = 'redis',
  /** 分布式缓存 */
  DISTRIBUTED = 'distributed',
}

/**
 * 缓存适配器
 *
 * 实现多级缓存策略
 */
@Injectable()
export class CacheAdapter {
  private readonly config: ICacheConfig;
  private readonly statistics: ICacheStatistics = {
    totalRequests: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    memoryCacheSize: 0,
    redisCacheSize: 0,
    averageResponseTime: 0,
  };
  private readonly memoryCache = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();

  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger,
    config: Partial<ICacheConfig> = {}
  ) {
    this.config = {
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
    };
  }

  /**
   * 获取缓存值
   *
   * @param key - 缓存键
   * @param level - 缓存级别
   * @returns 缓存值
   */
  async get<T = unknown>(key: string, level?: CacheLevel): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.getFullKey(key);

    try {
      let value: T | null = null;

      // 根据缓存级别获取值
      if (level === CacheLevel.MEMORY || !level) {
        value = await this.getFromMemoryCache<T>(fullKey);
      }

      if (!value && (level === CacheLevel.REDIS || !level)) {
        value = await this.getFromRedisCache<T>(fullKey);
      }

      if (!value && (level === CacheLevel.DISTRIBUTED || !level)) {
        value = await this.getFromDistributedCache<T>(fullKey);
      }

      // 更新统计信息
      if (this.config.enableStatistics) {
        this.updateStatistics(value !== null, Date.now() - startTime);
      }

      if (value) {
        this.logger.debug(`缓存命中: ${key}`, {
          key,
          level: level || 'auto',
          responseTime: Date.now() - startTime,
        });
      }

      return value;
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error, {
        key,
        level,
      });
      throw error;
    }
  }

  /**
   * 设置缓存值
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 生存时间（秒）
   * @param level - 缓存级别
   */
  async set<T = unknown>(
    key: string,
    value: T,
    ttl?: number,
    level?: CacheLevel
  ): Promise<void> {
    const startTime = Date.now();
    const fullKey = this.getFullKey(key);
    const actualTtl = ttl || this.config.defaultTtl;

    try {
      // 序列化值
      const serializedValue = this.serializeValue(value);

      // 根据缓存级别设置值
      if (level === CacheLevel.MEMORY || !level) {
        await this.setToMemoryCache(fullKey, serializedValue, actualTtl);
      }

      if (level === CacheLevel.REDIS || !level) {
        await this.setToRedisCache(fullKey, serializedValue, actualTtl);
      }

      if (level === CacheLevel.DISTRIBUTED || !level) {
        await this.setToDistributedCache(fullKey, serializedValue, actualTtl);
      }

      this.logger.debug(`设置缓存成功: ${key}`, {
        key,
        ttl: actualTtl,
        level: level || 'auto',
        responseTime: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error, {
        key,
        ttl: actualTtl,
        level,
      });
      throw error;
    }
  }

  /**
   * 删除缓存
   *
   * @param key - 缓存键
   * @param level - 缓存级别
   */
  async delete(key: string, level?: CacheLevel): Promise<void> {
    const fullKey = this.getFullKey(key);

    try {
      // 根据缓存级别删除值
      if (level === CacheLevel.MEMORY || !level) {
        await this.deleteFromMemoryCache(fullKey);
      }

      if (level === CacheLevel.REDIS || !level) {
        await this.deleteFromRedisCache(fullKey);
      }

      if (level === CacheLevel.DISTRIBUTED || !level) {
        await this.deleteFromDistributedCache(fullKey);
      }

      this.logger.debug(`删除缓存成功: ${key}`, {
        key,
        level: level || 'auto',
      });
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error, {
        key,
        level,
      });
      throw error;
    }
  }

  /**
   * 检查缓存是否存在
   *
   * @param key - 缓存键
   * @param level - 缓存级别
   * @returns 是否存在
   */
  async exists(key: string, level?: CacheLevel): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    try {
      if (level === CacheLevel.MEMORY || !level) {
        return this.existsInMemoryCache(fullKey);
      }

      if (level === CacheLevel.REDIS || !level) {
        return await this.existsInRedisCache(fullKey);
      }

      if (level === CacheLevel.DISTRIBUTED || !level) {
        return await this.existsInDistributedCache(fullKey);
      }

      return false;
    } catch (error) {
      this.logger.error(`检查缓存存在性失败: ${key}`, error, {
        key,
        level,
      });
      return false;
    }
  }

  /**
   * 批量获取缓存
   *
   * @param keys - 缓存键列表
   * @param level - 缓存级别
   * @returns 缓存值映射
   */
  async mget<T = any>(
    keys: string[],
    level?: CacheLevel
  ): Promise<Record<string, T | null>> {
    const startTime = Date.now();
    const fullKeys = keys.map((key) => this.getFullKey(key));
    const result: Record<string, T | null> = {};

    try {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const fullKey = fullKeys[i];

        let value: T | null = null;

        if (level === CacheLevel.MEMORY || !level) {
          value = await this.getFromMemoryCache<T>(fullKey);
        }

        if (!value && (level === CacheLevel.REDIS || !level)) {
          value = await this.getFromRedisCache<T>(fullKey);
        }

        if (!value && (level === CacheLevel.DISTRIBUTED || !level)) {
          value = await this.getFromDistributedCache<T>(fullKey);
        }

        result[key] = value;
      }

      // 更新统计信息
      if (this.config.enableStatistics) {
        const hitCount = Object.values(result).filter((v) => v !== null).length;
        this.updateStatistics(hitCount > 0, Date.now() - startTime);
      }

      this.logger.debug(`批量获取缓存成功: ${keys.length}`, {
        keyCount: keys.length,
        hitCount: Object.values(result).filter((v) => v !== null).length,
        responseTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error(`批量获取缓存失败: ${keys.length}`, error, {
        keyCount: keys.length,
        level,
      });
      throw error;
    }
  }

  /**
   * 批量设置缓存
   *
   * @param data - 缓存数据映射
   * @param ttl - 生存时间（秒）
   * @param level - 缓存级别
   */
  async mset<T = any>(
    data: Record<string, T>,
    ttl?: number,
    level?: CacheLevel
  ): Promise<void> {
    const startTime = Date.now();
    const actualTtl = ttl || this.config.defaultTtl;

    try {
      for (const [key, value] of Object.entries(data)) {
        await this.set(key, value, actualTtl, level);
      }

      this.logger.debug(`批量设置缓存成功: ${Object.keys(data).length}`, {
        keyCount: Object.keys(data).length,
        ttl: actualTtl,
        level: level || 'auto',
        responseTime: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error(
        `批量设置缓存失败: ${Object.keys(data).length}`,
        error,
        {
          keyCount: Object.keys(data).length,
          ttl: actualTtl,
          level,
        }
      );
      throw error;
    }
  }

  /**
   * 按模式删除缓存
   *
   * @param pattern - 缓存键模式
   * @param level - 缓存级别
   */
  async deletePattern(pattern: string, level?: CacheLevel): Promise<number> {
    const fullPattern = this.getFullKey(pattern);
    let deletedCount = 0;

    try {
      if (level === CacheLevel.MEMORY || !level) {
        deletedCount += await this.deletePatternFromMemoryCache(fullPattern);
      }

      if (level === CacheLevel.REDIS || !level) {
        deletedCount += await this.deletePatternFromRedisCache(fullPattern);
      }

      if (level === CacheLevel.DISTRIBUTED || !level) {
        deletedCount += await this.deletePatternFromDistributedCache(
          fullPattern
        );
      }

      this.logger.debug(`按模式删除缓存成功: ${pattern}`, {
        pattern,
        deletedCount,
        level: level || 'auto',
      });

      return deletedCount;
    } catch (error) {
      this.logger.error(`按模式删除缓存失败: ${pattern}`, error, {
        pattern,
        level,
      });
      throw error;
    }
  }

  /**
   * 清除所有缓存
   *
   * @param level - 缓存级别
   */
  async clear(level?: CacheLevel): Promise<void> {
    try {
      if (level === CacheLevel.MEMORY || !level) {
        this.memoryCache.clear();
      }

      if (level === CacheLevel.REDIS || !level) {
        await this.clearRedisCache();
      }

      if (level === CacheLevel.DISTRIBUTED || !level) {
        await this.clearDistributedCache();
      }

      this.logger.debug(`清除缓存成功`, {
        level: level || 'auto',
      });
    } catch (error) {
      this.logger.error('清除缓存失败', error, {
        level,
      });
      throw error;
    }
  }

  /**
   * 获取缓存统计信息
   *
   * @returns 缓存统计信息
   */
  getStatistics(): ICacheStatistics {
    return { ...this.statistics };
  }

  /**
   * 重置统计信息
   */
  resetStatistics(): void {
    this.statistics.totalRequests = 0;
    this.statistics.hits = 0;
    this.statistics.misses = 0;
    this.statistics.hitRate = 0;
    this.statistics.averageResponseTime = 0;
  }

  /**
   * 预热缓存
   *
   * @param data - 预热数据
   * @param ttl - 生存时间（秒）
   */
  async warmup<T = any>(data: Record<string, T>, ttl?: number): Promise<void> {
    if (!this.config.enableWarmup) {
      return;
    }

    try {
      await this.mset(data, ttl);

      this.logger.debug(`缓存预热成功: ${Object.keys(data).length}`, {
        keyCount: Object.keys(data).length,
        ttl: ttl || this.config.defaultTtl,
      });
    } catch (error) {
      this.logger.error('缓存预热失败', error, {
        keyCount: Object.keys(data).length,
      });
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取完整缓存键
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  /**
   * 序列化值
   */
  private serializeValue<T>(value: T): any {
    let data = value;

    if (this.config.enableCompression) {
      data = this.compressData(data);
    }

    if (this.config.enableEncryption) {
      data = this.encryptData(data);
    }

    return data;
  }

  /**
   * 反序列化值
   */
  private deserializeValue<T>(data: any): T {
    let value = data;

    if (this.config.enableEncryption) {
      value = this.decryptData(value);
    }

    if (this.config.enableCompression) {
      value = this.decompressData(value);
    }

    return value;
  }

  /**
   * 压缩数据
   */
  private compressData(data: any): any {
    // 实现数据压缩逻辑
    return data;
  }

  /**
   * 解压缩数据
   */
  private decompressData(data: any): any {
    // 实现数据解压缩逻辑
    return data;
  }

  /**
   * 加密数据
   */
  private encryptData(data: any): any {
    // 实现数据加密逻辑
    return data;
  }

  /**
   * 解密数据
   */
  private decryptData(data: any): any {
    // 实现数据解密逻辑
    return data;
  }

  /**
   * 从内存缓存获取
   */
  private async getFromMemoryCache<T>(key: string): Promise<T | null> {
    if (!this.config.enableMemoryCache) {
      return null;
    }

    const item = this.memoryCache.get(key);
    if (!item) {
      return null;
    }

    if (item.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return this.deserializeValue<T>(item.value);
  }

  /**
   * 设置到内存缓存
   */
  private async setToMemoryCache(
    key: string,
    value: any,
    ttl: number
  ): Promise<void> {
    if (!this.config.enableMemoryCache) {
      return;
    }

    // 检查内存缓存大小限制
    if (this.memoryCache.size >= this.config.maxMemoryCacheSize) {
      this.evictOldestMemoryCache();
    }

    const expiresAt = Date.now() + ttl * 1000;
    this.memoryCache.set(key, { value, expiresAt });
  }

  /**
   * 从内存缓存删除
   */
  private async deleteFromMemoryCache(key: string): Promise<void> {
    if (!this.config.enableMemoryCache) {
      return;
    }

    this.memoryCache.delete(key);
  }

  /**
   * 检查内存缓存是否存在
   */
  private existsInMemoryCache(key: string): boolean {
    if (!this.config.enableMemoryCache) {
      return false;
    }

    const item = this.memoryCache.get(key);
    if (!item) {
      return false;
    }

    if (item.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 从Redis缓存获取
   */
  private async getFromRedisCache<T>(key: string): Promise<T | null> {
    if (!this.config.enableRedisCache) {
      return null;
    }

    const value = await this.cacheService.get<T>(key);
    return value ? this.deserializeValue<T>(value) : null;
  }

  /**
   * 设置到Redis缓存
   */
  private async setToRedisCache(
    key: string,
    value: any,
    ttl: number
  ): Promise<void> {
    if (!this.config.enableRedisCache) {
      return;
    }

    await this.cacheService.set(key, value, ttl);
  }

  /**
   * 从Redis缓存删除
   */
  private async deleteFromRedisCache(key: string): Promise<void> {
    if (!this.config.enableRedisCache) {
      return;
    }

    await this.cacheService.delete(key);
  }

  /**
   * 检查Redis缓存是否存在
   */
  private async existsInRedisCache(key: string): Promise<boolean> {
    if (!this.config.enableRedisCache) {
      return false;
    }

    return await this.cacheService.exists(key);
  }

  /**
   * 从分布式缓存获取
   */
  private async getFromDistributedCache<T>(key: string): Promise<T | null> {
    if (!this.config.enableDistributedCache) {
      return null;
    }

    // 实现分布式缓存获取逻辑
    // 这里需要根据具体的分布式缓存实现
    return null;
  }

  /**
   * 设置到分布式缓存
   */
  private async setToDistributedCache(
    key: string,
    value: any,
    ttl: number
  ): Promise<void> {
    if (!this.config.enableDistributedCache) {
      return;
    }

    // 实现分布式缓存设置逻辑
    // 这里需要根据具体的分布式缓存实现
  }

  /**
   * 从分布式缓存删除
   */
  private async deleteFromDistributedCache(key: string): Promise<void> {
    if (!this.config.enableDistributedCache) {
      return;
    }

    // 实现分布式缓存删除逻辑
    // 这里需要根据具体的分布式缓存实现
  }

  /**
   * 检查分布式缓存是否存在
   */
  private async existsInDistributedCache(key: string): Promise<boolean> {
    if (!this.config.enableDistributedCache) {
      return false;
    }

    // 实现分布式缓存存在性检查逻辑
    // 这里需要根据具体的分布式缓存实现
    return false;
  }

  /**
   * 清除Redis缓存
   */
  private async clearRedisCache(): Promise<void> {
    if (!this.config.enableRedisCache) {
      return;
    }

    // 使用兼容性检查调用 clear 方法
    if (typeof (this.cacheService as any).clear === 'function') {
      await (this.cacheService as any).clear();
    } else {
      console.warn('CacheService不支持clear方法');
    }
  }

  /**
   * 清除分布式缓存
   */
  private async clearDistributedCache(): Promise<void> {
    if (!this.config.enableDistributedCache) {
      return;
    }

    // 实现分布式缓存清除逻辑
    // 这里需要根据具体的分布式缓存实现
  }

  /**
   * 驱逐最旧的内存缓存
   */
  private evictOldestMemoryCache(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache) {
      if (item.expiresAt < oldestTime) {
        oldestTime = item.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * 从内存缓存按模式删除
   */
  private async deletePatternFromMemoryCache(pattern: string): Promise<number> {
    if (!this.config.enableMemoryCache) {
      return 0;
    }

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deletedCount = 0;

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 从Redis缓存按模式删除
   */
  private async deletePatternFromRedisCache(pattern: string): Promise<number> {
    if (!this.config.enableRedisCache) {
      return 0;
    }

    // 这里需要实现Redis模式删除逻辑
    // 由于CacheService可能没有deletePattern方法，我们提供一个基础实现
    try {
      // 尝试调用CacheService的deletePattern方法
      if (typeof (this.cacheService as any).deletePattern === 'function') {
        return await (this.cacheService as any).deletePattern(pattern);
      }

      // 如果没有deletePattern方法，返回0
      this.logger.warn('CacheService不支持deletePattern方法', { pattern });
      return 0;
    } catch (error) {
      this.logger.error('Redis模式删除失败', error, { pattern });
      return 0;
    }
  }

  /**
   * 从分布式缓存按模式删除
   */
  private async deletePatternFromDistributedCache(
    pattern: string
  ): Promise<number> {
    if (!this.config.enableDistributedCache) {
      return 0;
    }

    // 实现分布式缓存模式删除逻辑
    // 这里需要根据具体的分布式缓存实现
    return 0;
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(hit: boolean, responseTime: number): void {
    this.statistics.totalRequests++;

    if (hit) {
      this.statistics.hits++;
    } else {
      this.statistics.misses++;
    }

    this.statistics.hitRate =
      this.statistics.hits / this.statistics.totalRequests;
    this.statistics.averageResponseTime =
      (this.statistics.averageResponseTime *
        (this.statistics.totalRequests - 1) +
        responseTime) /
      this.statistics.totalRequests;
  }
}
