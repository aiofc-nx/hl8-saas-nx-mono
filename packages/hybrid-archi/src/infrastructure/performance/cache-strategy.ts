/**
 * 缓存策略
 *
 * 提供完整的缓存策略功能，包括多级缓存、缓存预热、缓存失效、缓存监控等。
 * 作为通用功能组件，为业务模块提供强大的缓存能力。
 *
 * @description 缓存策略的完整实现，支持多种缓存场景
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';

/**
 * 缓存策略配置
 */
export interface CacheStrategyConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存级别 */
  level: 'L1' | 'L2' | 'L3' | 'multi';
  /** 默认TTL（秒） */
  defaultTtl: number;
  /** 最大缓存大小 */
  maxSize: number;
  /** 缓存预热 */
  preload: boolean;
  /** 缓存监控 */
  monitoring: boolean;
  /** 缓存统计 */
  statistics: boolean;
  /** 缓存压缩 */
  compression: boolean;
  /** 缓存加密 */
  encryption: boolean;
  /** 缓存分区 */
  partitioning: boolean;
  /** 分区数量 */
  partitionCount: number;
}

/**
 * 缓存策略类型
 */
export type CacheStrategyType =
  | 'write-through'
  | 'write-behind'
  | 'write-around'
  | 'read-through'
  | 'cache-aside'
  | 'refresh-ahead';

/**
 * 缓存统计信息
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
  averageAccessTime: number;
  lastAccessTime: Date;
  oldestEntry: Date;
  newestEntry: Date;
}

/**
 * 缓存条目
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  partition: number;
}

/**
 * 缓存策略
 *
 * 提供完整的缓存策略功能
 */
@Injectable()
export class CacheStrategy {
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    missRate: 0,
    evictions: 0,
    size: 0,
    maxSize: 0,
    memoryUsage: 0,
    averageAccessTime: 0,
    lastAccessTime: new Date(),
    oldestEntry: new Date(),
    newestEntry: new Date(),
  };

  private readonly entries = new Map<string, CacheEntry>();
  private readonly accessTimes: number[] = [];
  private readonly partitions = new Map<number, Map<string, CacheEntry>>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    @Inject('CacheStrategyConfig') private readonly config: CacheStrategyConfig
  ) {
    this.initializePartitions();
  }

  /**
   * 获取缓存
   *
   * @description 根据策略获取缓存数据
   * @param key - 缓存键
   * @param strategy - 缓存策略
   * @returns 缓存数据
   */
  async get<T>(
    key: string,
    strategy: CacheStrategyType = 'cache-aside'
  ): Promise<T | null> {
    const startTime = Date.now();

    try {
      // 检查缓存是否存在
      const entry = this.getEntry(key);
      if (!entry) {
        this.stats.misses++;
        this.updateStats();
        return null;
      }

      // 检查是否过期
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.stats.misses++;
        this.updateStats();
        return null;
      }

      // 更新访问信息
      entry.lastAccessedAt = new Date();
      entry.accessCount++;
      this.accessTimes.push(Date.now() - startTime);

      this.stats.hits++;
      this.stats.lastAccessTime = new Date();
      this.updateStats();

      this.logger.debug('缓存命中', {
        key,
        strategy,
        accessTime: Date.now() - startTime,
        hitRate: this.stats.hitRate,
      });

      return entry.value as T;
    } catch (error) {
      this.logger.error('获取缓存失败', error, { key, strategy });
      return null;
    }
  }

  /**
   * 设置缓存
   *
   * @description 根据策略设置缓存数据
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 生存时间
   * @param strategy - 缓存策略
   */
  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    strategy: CacheStrategyType = 'cache-aside'
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const entryTtl = ttl || this.config.defaultTtl;
      const entry: CacheEntry<T> = {
        key,
        value,
        ttl: entryTtl,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        accessCount: 0,
        size: this.calculateSize(value),
        compressed: this.config.compression,
        encrypted: this.config.encryption,
        partition: this.getPartition(key),
      };

      // 根据策略处理
      switch (strategy) {
        case 'write-through':
          await this.writeThrough(key, entry);
          break;
        case 'write-behind':
          await this.writeBehind(key, entry);
          break;
        case 'write-around':
          await this.writeAround(key, entry);
          break;
        default:
          await this.cacheAside(key, entry);
      }

      // 更新统计信息
      this.stats.size++;
      this.stats.newestEntry = new Date();
      this.updateStats();

      this.logger.debug('缓存设置成功', {
        key,
        strategy,
        ttl: entryTtl,
        size: entry.size,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error('设置缓存失败', error, { key, strategy });
      throw error;
    }
  }

  /**
   * 删除缓存
   *
   * @description 删除指定的缓存
   * @param key - 缓存键
   */
  async delete(key: string): Promise<boolean> {
    try {
      const entry = this.getEntry(key);
      if (!entry) {
        return false;
      }

      // 从内存删除
      this.entries.delete(key);

      // 从分区删除
      const partition = this.partitions.get(entry.partition);
      if (partition) {
        partition.delete(key);
      }

      // 从外部缓存删除
      await this.cacheService.delete(key);

      this.stats.size--;
      this.updateStats();

      this.logger.debug('缓存删除成功', { key });
      return true;
    } catch (error) {
      this.logger.error('删除缓存失败', error, { key });
      return false;
    }
  }

  /**
   * 清空缓存
   *
   * @description 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      // 清空内存缓存
      this.entries.clear();
      this.partitions.clear();
      this.initializePartitions();

      // 清空外部缓存
      // 清空所有缓存 - 使用flush方法清空Redis缓存
      await this.cacheService.flush();

      // 重置统计信息
      this.stats.size = 0;
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.updateStats();

      this.logger.info('缓存已清空');
    } catch (error) {
      this.logger.error('清空缓存失败', error);
      throw error;
    }
  }

  /**
   * 预热缓存
   *
   * @description 预热指定的缓存数据
   * @param keys - 缓存键列表
   * @param loader - 数据加载器
   */
  async preload<T>(
    keys: string[],
    loader: (key: string) => Promise<T>
  ): Promise<void> {
    try {
      const promises = keys.map(async (key) => {
        try {
          const value = await loader(key);
          await this.set(key, value);
        } catch (error) {
          this.logger.warn('缓存预热失败', error, { key });
        }
      });

      await Promise.all(promises);

      this.logger.info('缓存预热完成', { keyCount: keys.length });
    } catch (error) {
      this.logger.error('缓存预热失败', error);
      throw error;
    }
  }

  /**
   * 获取缓存统计信息
   *
   * @description 获取缓存的统计信息
   * @returns 统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 获取缓存条目
   *
   * @description 获取指定的缓存条目
   * @param key - 缓存键
   * @returns 缓存条目
   */
  getEntry(key: string): CacheEntry | null {
    return this.entries.get(key) || null;
  }

  /**
   * 获取所有缓存条目
   *
   * @description 获取所有缓存条目
   * @returns 缓存条目列表
   */
  getAllEntries(): CacheEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * 检查缓存是否存在
   *
   * @description 检查指定的缓存是否存在
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: string): boolean {
    const entry = this.getEntry(key);
    return entry !== null && !this.isExpired(entry);
  }

  /**
   * 获取缓存大小
   *
   * @description 获取当前缓存的大小
   * @returns 缓存大小
   */
  getSize(): number {
    return this.stats.size;
  }

  /**
   * 获取内存使用量
   *
   * @description 获取当前缓存的内存使用量
   * @returns 内存使用量（字节）
   */
  getMemoryUsage(): number {
    return this.stats.memoryUsage;
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化分区
   */
  private initializePartitions(): void {
    this.partitions.clear();
    for (let i = 0; i < this.config.partitionCount; i++) {
      this.partitions.set(i, new Map());
    }
  }

  /**
   * 获取分区
   */
  private getPartition(key: string): number {
    if (!this.config.partitioning) {
      return 0;
    }
    return this.hash(key) % this.config.partitionCount;
  }

  /**
   * 哈希函数
   */
  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 检查是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const createdAt = entry.createdAt.getTime();
    const ttl = entry.ttl * 1000; // 转换为毫秒
    return now - createdAt > ttl;
  }

  /**
   * 计算大小
   */
  private calculateSize(value: any): number {
    return JSON.stringify(value).length;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    this.stats.missRate = total > 0 ? (this.stats.misses / total) * 100 : 0;

    if (this.accessTimes.length > 0) {
      this.stats.averageAccessTime =
        this.accessTimes.reduce((sum, time) => sum + time, 0) /
        this.accessTimes.length;
    }

    this.stats.memoryUsage = this.calculateMemoryUsage();
  }

  /**
   * 计算内存使用量
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.entries.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * 写穿透策略
   */
  private async writeThrough(key: string, entry: CacheEntry): Promise<void> {
    // 同时写入缓存和外部存储
    this.entries.set(key, entry);
    await this.cacheService.set(key, JSON.stringify(entry.value), entry.ttl);
  }

  /**
   * 写回策略
   */
  private async writeBehind(key: string, entry: CacheEntry): Promise<void> {
    // 先写入缓存，异步写入外部存储
    this.entries.set(key, entry);
    setImmediate(async () => {
      try {
        await this.cacheService.set(
          key,
          JSON.stringify(entry.value),
          entry.ttl
        );
      } catch (error) {
        this.logger.warn('异步写入外部存储失败', error, { key });
      }
    });
  }

  /**
   * 写绕过策略
   */
  private async writeAround(key: string, entry: CacheEntry): Promise<void> {
    // 直接写入外部存储，不写入缓存
    await this.cacheService.set(key, JSON.stringify(entry.value), entry.ttl);
  }

  /**
   * 缓存旁路策略
   */
  private async cacheAside(key: string, entry: CacheEntry): Promise<void> {
    // 写入缓存
    this.entries.set(key, entry);
  }
}
