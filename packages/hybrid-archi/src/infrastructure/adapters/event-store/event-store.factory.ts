/**
 * 事件存储工厂
 *
 * 提供事件存储适配器的动态创建和管理能力。
 * 作为通用功能组件，支持事件存储的生命周期管理。
 *
 * @description 事件存储工厂实现事件存储适配器的动态创建和管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@hl8/database';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import { EventStoreAdapter, IEventStoreConfig } from './event-store.adapter';

/**
 * 健康检查结果接口
 */
interface IHealthCheckResult {
  healthy: boolean;
  status: 'healthy' | 'unhealthy' | 'error';
  storeName: string;
  storeType?: string;
  createdAt?: Date;
  lastAccessedAt?: Date;
  error?: string;
}

/**
 * 事件存储注册信息
 */
export interface IEventStoreRegistration {
  /** 存储名称 */
  storeName: string;
  /** 存储类型 */
  storeType: string;
  /** 存储配置 */
  config: IEventStoreConfig;
  /** 存储实例 */
  instance?: EventStoreAdapter;
  /** 是否已初始化 */
  initialized: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
}

/**
 * 事件存储工厂
 *
 * 提供事件存储适配器的动态创建和管理
 */
@Injectable()
export class EventStoreFactory {
  private readonly stores = new Map<string, IEventStoreRegistration>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger
  ) {}

  /**
   * 创建事件存储
   *
   * @param storeName - 存储名称
   * @param storeType - 存储类型
   * @param config - 存储配置
   * @returns 事件存储实例
   */
  createStore(
    storeName: string,
    storeType: string,
    config: Partial<IEventStoreConfig> = {}
  ): EventStoreAdapter {
    // 检查存储是否已存在
    if (this.stores.has(storeName)) {
      const registration = this.stores.get(storeName);
      if (!registration || !registration.instance) {
        throw new Error(`存储注册信息不完整: ${storeName}`);
      }
      registration.lastAccessedAt = new Date();
      return registration.instance;
    }

    // 创建存储实例
    const store = new EventStoreAdapter(
      this.databaseService,
      this.cacheService,
      this.logger,
      config
    );

    // 注册存储
    const registration: IEventStoreRegistration = {
      storeName,
      storeType,
      config: {
        enableCache: config.enableCache ?? true,
        cacheTtl: config.cacheTtl ?? 300,
        enableCompression: config.enableCompression ?? false,
        enableEncryption: config.enableEncryption ?? false,
        enableSharding: config.enableSharding ?? false,
        shardKey: config.shardKey ?? 'aggregateId',
        maxEvents: config.maxEvents ?? 10000,
        retentionDays: config.retentionDays ?? 365,
      },
      instance: store,
      initialized: true,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.stores.set(storeName, registration);

    this.logger.debug(`创建事件存储: ${storeName}`, {
      storeType,
      config: registration.config,
    });

    return store;
  }

  /**
   * 获取事件存储
   *
   * @param storeName - 存储名称
   * @returns 事件存储实例
   */
  getStore(storeName: string): EventStoreAdapter | null {
    const registration = this.stores.get(storeName);
    if (!registration || !registration.instance) {
      return null;
    }

    registration.lastAccessedAt = new Date();
    return registration.instance;
  }

  /**
   * 获取或创建事件存储
   *
   * @param storeName - 存储名称
   * @param storeType - 存储类型
   * @param config - 存储配置
   * @returns 事件存储实例
   */
  getOrCreateStore(
    storeName: string,
    storeType: string,
    config: Partial<IEventStoreConfig> = {}
  ): EventStoreAdapter {
    const existingStore = this.getStore(storeName);
    if (existingStore) {
      return existingStore;
    }

    return this.createStore(storeName, storeType, config);
  }

  /**
   * 销毁事件存储
   *
   * @param storeName - 存储名称
   */
  async destroyStore(storeName: string): Promise<void> {
    const registration = this.stores.get(storeName);
    if (!registration) {
      return;
    }

    try {
      // 清理存储资源
      if (registration.config.enableCache && registration.instance) {
        // 清理相关缓存
        await this.cleanupStoreCache(storeName);
      }

      // 移除存储注册
      this.stores.delete(storeName);

      this.logger.debug(`销毁事件存储: ${storeName}`);
    } catch (error) {
      this.logger.error(`销毁事件存储失败: ${storeName}`, error);
      throw error;
    }
  }

  /**
   * 获取所有存储
   *
   * @returns 存储注册信息列表
   */
  getAllStores(): IEventStoreRegistration[] {
    return Array.from(this.stores.values());
  }

  /**
   * 获取存储注册信息
   *
   * @param storeName - 存储名称
   * @returns 存储注册信息
   */
  getStoreRegistration(storeName: string): IEventStoreRegistration | null {
    return this.stores.get(storeName) || null;
  }

  /**
   * 更新存储配置
   *
   * @param storeName - 存储名称
   * @param config - 新配置
   */
  updateStoreConfiguration(
    storeName: string,
    config: Partial<IEventStoreConfig>
  ): void {
    const registration = this.stores.get(storeName);
    if (!registration) {
      throw new Error(`存储不存在: ${storeName}`);
    }

    Object.assign(registration.config, config);

    this.logger.debug(`更新事件存储配置: ${storeName}`, {
      config: registration.config,
    });
  }

  /**
   * 清理过期存储
   *
   * @param maxAge - 最大年龄（毫秒）
   * @returns 清理的存储数量
   */
  async cleanupExpiredStores(
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const now = new Date();
    const expiredStores: string[] = [];

    for (const [storeName, registration] of this.stores) {
      const age = now.getTime() - registration.lastAccessedAt.getTime();
      if (age > maxAge) {
        expiredStores.push(storeName);
      }
    }

    for (const storeName of expiredStores) {
      await this.destroyStore(storeName);
    }

    this.logger.debug(`清理过期事件存储: ${expiredStores.length}`, {
      expiredStores,
    });

    return expiredStores.length;
  }

  /**
   * 获取存储统计信息
   *
   * @returns 存储统计信息
   */
  getStoreStatistics(): {
    totalStores: number;
    activeStores: number;
    storeTypes: Record<string, number>;
    averageAge: number;
    oldestStore: string | null;
    newestStore: string | null;
  } {
    const stores = Array.from(this.stores.values());
    const now = new Date();

    const storeTypes: Record<string, number> = {};
    let totalAge = 0;
    let oldestStore: string | null = null;
    let newestStore: string | null = null;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const store of stores) {
      // 统计存储类型
      storeTypes[store.storeType] = (storeTypes[store.storeType] || 0) + 1;

      // 计算年龄
      const age = now.getTime() - store.createdAt.getTime();
      totalAge += age;

      // 找到最老的存储
      if (age > oldestAge) {
        oldestAge = age;
        oldestStore = store.storeName;
      }

      // 找到最新的存储
      if (age < newestAge) {
        newestAge = age;
        newestStore = store.storeName;
      }
    }

    return {
      totalStores: stores.length,
      activeStores: stores.filter((s) => s.initialized).length,
      storeTypes,
      averageAge: stores.length > 0 ? totalAge / stores.length : 0,
      oldestStore,
      newestStore,
    };
  }

  /**
   * 健康检查所有存储
   *
   * @returns 健康检查结果
   */
  async healthCheckAllStores(): Promise<Record<string, IHealthCheckResult>> {
    const results: Record<string, IHealthCheckResult> = {};

    for (const [storeName, registration] of this.stores) {
      try {
        if (!registration.instance) {
          results[storeName] = {
            healthy: false,
            status: 'error',
            storeName,
            error: '存储实例不存在',
          };
          continue;
        }

        const isHealthy = await this.checkStoreHealth(
          storeName,
          registration.instance
        );
        results[storeName] = {
          healthy: isHealthy,
          status: isHealthy ? 'healthy' : 'unhealthy',
          storeName,
          storeType: registration.storeType,
          createdAt: registration.createdAt,
          lastAccessedAt: registration.lastAccessedAt,
        };
      } catch (error) {
        results[storeName] = {
          healthy: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          storeName,
        };
      }
    }

    return results;
  }

  // ==================== 私有方法 ====================

  /**
   * 检查存储健康状态
   */
  private async checkStoreHealth(
    storeName: string,
    instance: EventStoreAdapter
  ): Promise<boolean> {
    try {
      // 检查存储是否可用
      const stats = await instance.getEventStatistics();
      return stats.totalEvents >= 0;
    } catch {
      return false;
    }
  }

  /**
   * 清理存储缓存
   */
  private async cleanupStoreCache(storeName: string): Promise<void> {
    const pattern = `event:${storeName}:*`;
    // 使用兼容性检查调用 deletePattern 方法
    const cacheServiceWithPattern = this.cacheService as CacheService & {
      deletePattern?: (pattern: string) => Promise<void>;
    };
    if (typeof cacheServiceWithPattern.deletePattern === 'function') {
      await cacheServiceWithPattern.deletePattern(pattern);
    } else {
      console.warn('CacheService不支持deletePattern方法');
    }
  }
}
