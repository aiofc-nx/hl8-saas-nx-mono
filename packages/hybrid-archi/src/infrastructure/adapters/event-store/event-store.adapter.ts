/**
 * 事件存储适配器
 *
 * 实现事件溯源功能，提供事件存储和检索能力。
 * 作为通用功能组件，支持事件溯源模式。
 *
 * @description 事件存储适配器实现事件溯源功能
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@hl8/database';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';

/**
 * 事件存储配置接口
 */
export interface IEventStoreConfig {
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存TTL（秒） */
  cacheTtl: number;
  /** 是否启用压缩 */
  enableCompression: boolean;
  /** 是否启用加密 */
  enableEncryption: boolean;
  /** 是否启用分片 */
  enableSharding: boolean;
  /** 分片键 */
  shardKey: string;
  /** 最大事件数量 */
  maxEvents: number;
  /** 事件保留期（天） */
  retentionDays: number;
}

/**
 * 事件数据接口
 */
export interface IEventData {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  eventType: string;
  /** 时间戳 */
  timestamp: Date;
  /** 元数据 */
  metadata: Record<string, unknown>;
  /** 其他事件属性 */
  [key: string]: unknown;
}

/**
 * 事件元数据接口
 */
export interface IEventMetadata {
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 时间戳 */
  timestamp: Date;
  /** 其他元数据 */
  [key: string]: unknown;
}

/**
 * 事件存储记录
 */
export interface IEventStoreRecord {
  /** 事件ID */
  eventId: string;
  /** 聚合根ID */
  aggregateId: string;
  /** 聚合根类型 */
  aggregateType: string;
  /** 事件类型 */
  eventType: string;
  /** 事件版本 */
  version: number;
  /** 事件数据 */
  eventData: IEventData;
  /** 事件元数据 */
  metadata: IEventMetadata;
  /** 创建时间 */
  createdAt: Date;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
}

/**
 * 事件查询选项
 */
export interface IEventQueryOptions {
  /** 聚合根ID */
  aggregateId?: string;
  /** 聚合根类型 */
  aggregateType?: string;
  /** 事件类型 */
  eventType?: string;
  /** 起始版本 */
  fromVersion?: number;
  /** 结束版本 */
  toVersion?: number;
  /** 起始时间 */
  fromDate?: Date;
  /** 结束时间 */
  toDate?: Date;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 限制数量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * 事件存储适配器
 *
 * 实现事件溯源功能
 */
@Injectable()
export class EventStoreAdapter {
  private readonly config: IEventStoreConfig;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger,
    config: Partial<IEventStoreConfig> = {}
  ) {
    this.config = {
      enableCache: config.enableCache ?? true,
      cacheTtl: config.cacheTtl ?? 300,
      enableCompression: config.enableCompression ?? false,
      enableEncryption: config.enableEncryption ?? false,
      enableSharding: config.enableSharding ?? false,
      shardKey: config.shardKey ?? 'aggregateId',
      maxEvents: config.maxEvents ?? 10000,
      retentionDays: config.retentionDays ?? 365,
    };
  }

  /**
   * 存储事件
   *
   * @param aggregateId - 聚合根ID
   * @param aggregateType - 聚合根类型
   * @param events - 事件列表
   * @param expectedVersion - 期望版本
   * @returns 存储结果
   */
  async storeEvents(
    aggregateId: string,
    aggregateType: string,
    events: BaseDomainEvent[],
    expectedVersion?: number
  ): Promise<void> {
    try {
      // 检查版本冲突
      if (expectedVersion !== undefined) {
        const currentVersion = await this.getCurrentVersion(aggregateId);
        if (currentVersion !== expectedVersion) {
          throw new Error(
            `版本冲突: 期望版本 ${expectedVersion}, 当前版本 ${currentVersion}`
          );
        }
      }

      // 存储事件
      const records: IEventStoreRecord[] = events.map((event, index) => {
        const eventMetadata = event.metadata as IEventMetadata;
        return {
          eventId: event.eventId.toString(),
          aggregateId,
          aggregateType,
          eventType: event.constructor.name,
          version: (expectedVersion || 0) + index + 1,
          eventData: this.serializeEvent(event),
          metadata: {
            ...eventMetadata,
            tenantId: eventMetadata?.tenantId,
            userId: eventMetadata?.userId,
            timestamp: event.timestamp,
          },
          createdAt: new Date(),
          tenantId: eventMetadata?.tenantId,
          userId: eventMetadata?.userId,
        };
      });

      await this.saveEventsToDatabase(records);

      // 更新缓存
      if (this.config.enableCache) {
        await this.updateCache(aggregateId, records);
      }

      this.logger.debug(`存储事件成功: ${aggregateType}`, {
        aggregateId,
        eventCount: events.length,
        version: records[records.length - 1]?.version,
      });
    } catch (error) {
      this.logger.error(`存储事件失败: ${aggregateType}`, error, {
        aggregateId,
        eventCount: events.length,
      });
      throw error;
    }
  }

  /**
   * 获取事件
   *
   * @param aggregateId - 聚合根ID
   * @param fromVersion - 起始版本
   * @param toVersion - 结束版本
   * @returns 事件列表
   */
  async getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<BaseDomainEvent[]> {
    try {
      // 尝试从缓存获取
      if (this.config.enableCache) {
        const cached = await this.getFromCache(
          aggregateId,
          fromVersion,
          toVersion
        );
        if (cached) {
          this.logger.debug(`从缓存获取事件: ${aggregateId}`, {
            fromVersion,
            toVersion,
            eventCount: cached.length,
          });
          return cached;
        }
      }

      // 从数据库获取
      const records = await this.getEventsFromDatabase(
        aggregateId,
        fromVersion,
        toVersion
      );
      const events = records.map((record) => this.deserializeEvent(record));

      // 缓存结果
      if (this.config.enableCache) {
        await this.setCache(aggregateId, events, fromVersion, toVersion);
      }

      this.logger.debug(`从数据库获取事件: ${aggregateId}`, {
        fromVersion,
        toVersion,
        eventCount: events.length,
      });

      return events;
    } catch (error) {
      this.logger.error(`获取事件失败: ${aggregateId}`, error, {
        fromVersion,
        toVersion,
      });
      throw error;
    }
  }

  /**
   * 查询事件
   *
   * @param options - 查询选项
   * @returns 事件记录列表
   */
  async queryEvents(options: IEventQueryOptions): Promise<IEventStoreRecord[]> {
    try {
      return await this.queryEventsFromDatabase(options);
    } catch (error) {
      this.logger.error('查询事件失败', error, { options });
      throw error;
    }
  }

  /**
   * 获取当前版本
   *
   * @param aggregateId - 聚合根ID
   * @returns 当前版本
   */
  async getCurrentVersion(aggregateId: string): Promise<number> {
    try {
      // 尝试从缓存获取
      if (this.config.enableCache) {
        const cached = await this.getVersionFromCache(aggregateId);
        if (cached !== null) {
          return cached;
        }
      }

      // 从数据库获取
      const version = await this.getVersionFromDatabase(aggregateId);

      // 缓存结果
      if (this.config.enableCache) {
        await this.setVersionCache(aggregateId, version);
      }

      return version;
    } catch (error) {
      this.logger.error(`获取当前版本失败: ${aggregateId}`, error);
      throw error;
    }
  }

  /**
   * 删除事件
   *
   * @param aggregateId - 聚合根ID
   * @param fromVersion - 起始版本
   * @param toVersion - 结束版本
   */
  async deleteEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<void> {
    try {
      await this.deleteEventsFromDatabase(aggregateId, fromVersion, toVersion);

      // 清除缓存
      if (this.config.enableCache) {
        await this.clearCache(aggregateId);
      }

      this.logger.debug(`删除事件成功: ${aggregateId}`, {
        fromVersion,
        toVersion,
      });
    } catch (error) {
      this.logger.error(`删除事件失败: ${aggregateId}`, error, {
        fromVersion,
        toVersion,
      });
      throw error;
    }
  }

  /**
   * 清理过期事件
   *
   * @returns 清理的事件数量
   */
  async cleanupExpiredEvents(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const deletedCount = await this.deleteExpiredEventsFromDatabase(
        cutoffDate
      );

      this.logger.debug(`清理过期事件完成: ${deletedCount}`, {
        cutoffDate,
        retentionDays: this.config.retentionDays,
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('清理过期事件失败', error);
      throw error;
    }
  }

  /**
   * 获取事件统计信息
   *
   * @returns 事件统计信息
   */
  async getEventStatistics(): Promise<{
    totalEvents: number;
    totalAggregates: number;
    eventsByType: Record<string, number>;
    eventsByAggregateType: Record<string, number>;
    averageEventsPerAggregate: number;
  }> {
    try {
      return await this.getStatisticsFromDatabase();
    } catch (error) {
      this.logger.error('获取事件统计信息失败', error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 序列化事件
   */
  private serializeEvent(event: BaseDomainEvent): IEventData {
    let data: IEventData = {
      eventId: event.eventId.toString(),
      eventType: event.constructor.name,
      timestamp: event.timestamp,
      metadata: event.metadata as Record<string, unknown>,
    };

    if (this.config.enableCompression) {
      data = this.compressData(data);
    }

    if (this.config.enableEncryption) {
      data = this.encryptData(data);
    }

    return data;
  }

  /**
   * 反序列化事件
   */
  private deserializeEvent(record: IEventStoreRecord): BaseDomainEvent {
    let data: IEventData = record.eventData;

    if (this.config.enableEncryption) {
      data = this.decryptData(data);
    }

    if (this.config.enableCompression) {
      data = this.decompressData(data);
    }

    // 这里需要根据具体的事件类型来创建事件实例
    // 实际实现中需要事件工厂来创建具体的事件类型
    // 使用 unknown 进行安全的类型转换
    return data as unknown as BaseDomainEvent;
  }

  /**
   * 压缩数据
   */
  private compressData(data: IEventData): IEventData {
    // 实现数据压缩逻辑
    return data;
  }

  /**
   * 解压缩数据
   */
  private decompressData(data: IEventData): IEventData {
    // 实现数据解压缩逻辑
    return data;
  }

  /**
   * 加密数据
   */
  private encryptData(data: IEventData): IEventData {
    // 实现数据加密逻辑
    return data;
  }

  /**
   * 解密数据
   */
  private decryptData(data: IEventData): IEventData {
    // 实现数据解密逻辑
    return data;
  }

  /**
   * 保存事件到数据库
   */
  private async saveEventsToDatabase(
    _records: IEventStoreRecord[]
  ): Promise<void> {
    // 实现具体的数据库保存逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的数据库保存逻辑');
  }

  /**
   * 从数据库获取事件
   */
  private async getEventsFromDatabase(
    _aggregateId: string,
    _fromVersion?: number,
    _toVersion?: number
  ): Promise<IEventStoreRecord[]> {
    // 实现具体的数据库查询逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的数据库查询逻辑');
  }

  /**
   * 从数据库查询事件
   */
  private async queryEventsFromDatabase(
    _options: IEventQueryOptions
  ): Promise<IEventStoreRecord[]> {
    // 实现具体的数据库查询逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的数据库查询逻辑');
  }

  /**
   * 从数据库获取版本
   */
  private async getVersionFromDatabase(_aggregateId: string): Promise<number> {
    // 实现具体的数据库版本查询逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的数据库版本查询逻辑');
  }

  /**
   * 从数据库删除事件
   */
  private async deleteEventsFromDatabase(
    _aggregateId: string,
    _fromVersion?: number,
    _toVersion?: number
  ): Promise<void> {
    // 实现具体的数据库删除逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的数据库删除逻辑');
  }

  /**
   * 从数据库删除过期事件
   */
  private async deleteExpiredEventsFromDatabase(
    _cutoffDate: Date
  ): Promise<number> {
    // 实现具体的数据库过期事件删除逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的数据库过期事件删除逻辑');
  }

  /**
   * 从数据库获取统计信息
   */
  private async getStatisticsFromDatabase(): Promise<{
    totalEvents: number;
    totalAggregates: number;
    eventsByType: Record<string, number>;
    eventsByAggregateType: Record<string, number>;
    averageEventsPerAggregate: number;
  }> {
    // 实现具体的数据库统计查询逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的数据库统计查询逻辑');
  }

  /**
   * 从缓存获取事件
   */
  private async getFromCache(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<BaseDomainEvent[] | null> {
    const cacheKey = this.getEventCacheKey(aggregateId, fromVersion, toVersion);
    return await this.cacheService.get<BaseDomainEvent[]>(cacheKey);
  }

  /**
   * 设置事件缓存
   */
  private async setCache(
    aggregateId: string,
    events: BaseDomainEvent[],
    fromVersion?: number,
    toVersion?: number
  ): Promise<void> {
    const cacheKey = this.getEventCacheKey(aggregateId, fromVersion, toVersion);
    await this.cacheService.set(cacheKey, events, this.config.cacheTtl);
  }

  /**
   * 从缓存获取版本
   */
  private async getVersionFromCache(
    aggregateId: string
  ): Promise<number | null> {
    const cacheKey = this.getVersionCacheKey(aggregateId);
    return await this.cacheService.get<number>(cacheKey);
  }

  /**
   * 设置版本缓存
   */
  private async setVersionCache(
    aggregateId: string,
    version: number
  ): Promise<void> {
    const cacheKey = this.getVersionCacheKey(aggregateId);
    await this.cacheService.set(cacheKey, version, this.config.cacheTtl);
  }

  /**
   * 更新缓存
   */
  private async updateCache(
    aggregateId: string,
    _records: IEventStoreRecord[]
  ): Promise<void> {
    // 清除相关缓存
    await this.clearCache(aggregateId);
  }

  /**
   * 清除缓存
   */
  private async clearCache(aggregateId: string): Promise<void> {
    const pattern = `event:${aggregateId}:*`;
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

  /**
   * 获取事件缓存键
   */
  private getEventCacheKey(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): string {
    return `event:${aggregateId}:${fromVersion || 0}:${toVersion || 'latest'}`;
  }

  /**
   * 获取版本缓存键
   */
  private getVersionCacheKey(aggregateId: string): string {
    return `version:${aggregateId}`;
  }
}
