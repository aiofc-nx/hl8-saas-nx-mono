/**
 * 事件存储管理器
 *
 * 提供事件存储的统一管理和协调能力。
 * 作为通用功能组件，支持事件存储的生命周期管理和依赖注入。
 *
 * @description 事件存储管理器实现事件存储的统一管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@hl8/database';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import { EventStoreAdapter, IEventStoreConfig } from './event-store.adapter';
import {
  EventStoreFactory,
  IEventStoreRegistration,
} from './event-store.factory';

/**
 * 事件存储管理器配置
 */
export interface IEventStoreManagerConfig {
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  /** 存储最大年龄（毫秒） */
  maxStoreAge: number;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
  /** 是否启用事件清理 */
  enableEventCleanup: boolean;
  /** 事件清理间隔（毫秒） */
  eventCleanupInterval: number;
}

/**
 * 事件存储管理器
 *
 * 提供事件存储的统一管理和协调
 */
@Injectable()
export class EventStoreManager {
  private readonly config: IEventStoreManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private eventCleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger,
    private readonly storeFactory: EventStoreFactory,
    config: Partial<IEventStoreManagerConfig> = {}
  ) {
    this.config = {
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60 * 60 * 1000, // 1小时
      maxStoreAge: config.maxStoreAge ?? 24 * 60 * 60 * 1000, // 24小时
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 5 * 60 * 1000, // 5分钟
      enableEventCleanup: config.enableEventCleanup ?? true,
      eventCleanupInterval: config.eventCleanupInterval ?? 24 * 60 * 60 * 1000, // 24小时
    };

    this.initialize();
  }

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
    this.logger.debug(`创建事件存储: ${storeName}`, {
      storeType,
      config,
    });

    return this.storeFactory.createStore(storeName, storeType, config);
  }

  /**
   * 获取事件存储
   *
   * @param storeName - 存储名称
   * @returns 事件存储实例
   */
  getStore(storeName: string): EventStoreAdapter | null {
    return this.storeFactory.getStore(storeName);
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
    return this.storeFactory.getOrCreateStore(storeName, storeType, config);
  }

  /**
   * 销毁事件存储
   *
   * @param storeName - 存储名称
   */
  async destroyStore(storeName: string): Promise<void> {
    this.logger.debug(`销毁事件存储: ${storeName}`);
    await this.storeFactory.destroyStore(storeName);
  }

  /**
   * 获取所有存储
   *
   * @returns 存储注册信息列表
   */
  getAllStores(): IEventStoreRegistration[] {
    return this.storeFactory.getAllStores();
  }

  /**
   * 获取存储注册信息
   *
   * @param storeName - 存储名称
   * @returns 存储注册信息
   */
  getStoreRegistration(storeName: string): IEventStoreRegistration | null {
    return this.storeFactory.getStoreRegistration(storeName);
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
    this.logger.debug(`更新事件存储配置: ${storeName}`, { config });
    this.storeFactory.updateStoreConfiguration(storeName, config);
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
    return this.storeFactory.getStoreStatistics();
  }

  /**
   * 健康检查所有存储
   *
   * @returns 健康检查结果
   */
  async healthCheckAllStores(): Promise<Record<string, any>> {
    this.logger.debug('开始健康检查所有事件存储');
    return await this.storeFactory.healthCheckAllStores();
  }

  /**
   * 清理过期存储
   *
   * @returns 清理的存储数量
   */
  async cleanupExpiredStores(): Promise<number> {
    this.logger.debug('开始清理过期事件存储');
    return await this.storeFactory.cleanupExpiredStores(
      this.config.maxStoreAge
    );
  }

  /**
   * 清理过期事件
   *
   * @returns 清理的事件数量
   */
  async cleanupExpiredEvents(): Promise<number> {
    this.logger.debug('开始清理过期事件');

    let totalCleaned = 0;
    const stores = this.getAllStores();

    for (const store of stores) {
      if (store.instance) {
        try {
          const cleaned = await store.instance.cleanupExpiredEvents();
          totalCleaned += cleaned;
        } catch (error) {
          this.logger.error(`清理存储过期事件失败: ${store.storeName}`, error);
        }
      }
    }

    this.logger.debug(`清理过期事件完成: ${totalCleaned}`, {
      storeCount: stores.length,
    });

    return totalCleaned;
  }

  /**
   * 获取管理器状态
   *
   * @returns 管理器状态
   */
  getManagerStatus(): {
    config: IEventStoreManagerConfig;
    statistics: any;
    healthy: boolean;
    timestamp: Date;
  } {
    const statistics = this.getStoreStatistics();
    const healthy = statistics.totalStores > 0;

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
    this.logger.info('启动事件存储管理器');

    // 启动自动清理
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    // 启动健康检查
    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }

    // 启动事件清理
    if (this.config.enableEventCleanup) {
      this.startEventCleanup();
    }
  }

  /**
   * 停止管理器
   */
  stop(): void {
    this.logger.info('停止事件存储管理器');

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

    // 停止事件清理
    if (this.eventCleanupTimer) {
      clearInterval(this.eventCleanupTimer);
      this.eventCleanupTimer = undefined;
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logger.info('销毁事件存储管理器');

    // 停止管理器
    this.stop();

    // 销毁所有存储
    const stores = this.getAllStores();
    for (const store of stores) {
      await this.destroyStore(store.storeName);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化管理器
   */
  private initialize(): void {
    this.logger.debug('初始化事件存储管理器', {
      config: this.config,
    });
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredStores();
        if (cleanedCount > 0) {
          this.logger.debug(`自动清理完成: ${cleanedCount} 个存储`);
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
        const healthResults = await this.healthCheckAllStores();
        const unhealthyStores = Object.entries(healthResults).filter(
          ([, result]) => !result.healthy
        );

        if (unhealthyStores.length > 0) {
          this.logger.warn('发现不健康的事件存储', {
            unhealthyStores: unhealthyStores.map(([name]) => name),
          });
        }
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * 启动事件清理
   */
  private startEventCleanup(): void {
    this.eventCleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredEvents();
        if (cleanedCount > 0) {
          this.logger.debug(`事件清理完成: ${cleanedCount} 个事件`);
        }
      } catch (error) {
        this.logger.error('事件清理失败', error);
      }
    }, this.config.eventCleanupInterval);
  }
}
