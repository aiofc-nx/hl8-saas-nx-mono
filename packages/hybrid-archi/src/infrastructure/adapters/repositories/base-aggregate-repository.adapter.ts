/**
 * 基础聚合根仓储适配器
 *
 * 实现领域层聚合根仓储接口，提供聚合根的数据持久化能力。
 * 作为通用功能组件，支持聚合根的事件存储和版本控制。
 *
 * @description 基础聚合根仓储适配器实现领域层聚合根数据持久化需求
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@hl8/database';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import { EventService } from '@hl8/messaging';
import { EntityId } from '../../../domain/value-objects/entity-id';
import { BaseAggregateRoot } from '../../../domain/aggregates/base/base-aggregate-root';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { IEntity } from '../../../domain/entities/base/entity.interface';
import {
  IRepository,
  IRepositoryQueryOptions,
  IPaginatedResult,
} from '../../../domain/repositories/base/base-repository.interface';
import { BaseRepositoryAdapter } from './base-repository.adapter';

/**
 * 聚合根仓储配置接口
 */
export interface IAggregateRepositoryConfig {
  /** 是否启用事件存储 */
  enableEventStore: boolean;
  /** 是否启用快照 */
  enableSnapshot: boolean;
  /** 快照间隔 */
  snapshotInterval: number;
  /** 是否启用事件发布 */
  enableEventPublishing: boolean;
  /** 是否启用版本控制 */
  enableVersioning: boolean;
}

/**
 * 聚合根仓储适配器
 *
 * 实现领域层聚合根仓储接口
 */
@Injectable()
export class BaseAggregateRepositoryAdapter<
    T extends BaseAggregateRoot & IEntity,
    TId = EntityId
  >
  extends BaseRepositoryAdapter<T, TId>
  implements IRepository<T, TId>
{
  private readonly aggregateConfig: IAggregateRepositoryConfig;

  constructor(
    databaseService: DatabaseService,
    cacheService: CacheService,
    logger: PinoLogger,
    private readonly eventService: EventService,
    entityName: string,
    aggregateConfig: Partial<IAggregateRepositoryConfig> = {}
  ) {
    super(databaseService, cacheService, logger, entityName);

    this.aggregateConfig = {
      enableEventStore: aggregateConfig.enableEventStore ?? true,
      enableSnapshot: aggregateConfig.enableSnapshot ?? true,
      snapshotInterval: aggregateConfig.snapshotInterval ?? 10,
      enableEventPublishing: aggregateConfig.enableEventPublishing ?? true,
      enableVersioning: aggregateConfig.enableVersioning ?? true,
    };
  }

  /**
   * 保存聚合根
   *
   * @param aggregate - 要保存的聚合根
   */
  override async save(aggregate: T): Promise<void> {
    try {
      await this.executeWithRetry(async () => {
        // 检查并发冲突
        if (this.config.enableOptimisticLocking) {
          await this.checkConcurrency(aggregate);
        }

        // 保存聚合根状态
        await this.saveAggregateState(aggregate);

        // 处理领域事件
        if (this.aggregateConfig.enableEventStore) {
          await this.storeDomainEvents(aggregate);
        }

        // 发布领域事件
        if (this.aggregateConfig.enableEventPublishing) {
          await this.publishDomainEvents(aggregate);
        }

        // 创建快照
        if (
          this.aggregateConfig.enableSnapshot &&
          this.shouldCreateSnapshot(aggregate)
        ) {
          await this.createSnapshot(aggregate);
        }

        // 更新缓存
        if (this.config.enableCache) {
          await this.setCache((aggregate as any).getId(), aggregate);
        }

        this.logger.debug(`保存聚合根成功: ${this.entityName}`, {
          id: (aggregate as any).getId(),
          version: aggregate.getVersion(),
          eventsCount: aggregate.uncommittedEvents.length,
        });
      });
    } catch (error) {
      this.logger.error(`保存聚合根失败: ${this.entityName}`, error, {
        id: (aggregate as any).getId(),
      });
      throw error;
    }
  }

  /**
   * 根据ID查找聚合根
   *
   * @param id - 聚合根标识符
   * @returns 聚合根实例，如果不存在返回null
   */
  override async findById(id: TId): Promise<T | null> {
    try {
      // 尝试从缓存获取
      if (this.config.enableCache) {
        const cached = await this.getFromCache(id);
        if (cached) {
          this.logger.debug(`从缓存获取聚合根: ${this.entityName}`, { id });
          return cached;
        }
      }

      // 尝试从快照恢复
      if (this.aggregateConfig.enableSnapshot) {
        const snapshot = await this.getSnapshot(id);
        if (snapshot) {
          const aggregate = await this.restoreFromSnapshot(snapshot);
          if (aggregate) {
            // 应用快照后的事件
            await this.applyEventsAfterSnapshot(aggregate, snapshot.version);

            // 缓存结果
            if (this.config.enableCache) {
              await this.setCache(id, aggregate);
            }

            this.logger.debug(`从快照恢复聚合根: ${this.entityName}`, { id });
            return aggregate;
          }
        }
      }

      // 从事件存储重建
      if (this.aggregateConfig.enableEventStore) {
        const aggregate = await this.rebuildFromEvents(id);
        if (aggregate) {
          // 缓存结果
          if (this.config.enableCache) {
            await this.setCache(id, aggregate);
          }

          this.logger.debug(`从事件重建聚合根: ${this.entityName}`, { id });
          return aggregate;
        }
      }

      // 从数据库获取
      const aggregate = await this.getFromDatabase(id);
      if (!aggregate) {
        return null;
      }

      // 缓存结果
      if (this.config.enableCache) {
        await this.setCache(id, aggregate);
      }

      this.logger.debug(`从数据库获取聚合根: ${this.entityName}`, { id });
      return aggregate;
    } catch (error) {
      this.logger.error(`查找聚合根失败: ${this.entityName}`, error, { id });
      throw error;
    }
  }

  /**
   * 获取聚合根版本
   *
   * @param id - 聚合根标识符
   * @returns 版本号
   */
  async getVersion(id: TId): Promise<number> {
    try {
      if (this.aggregateConfig.enableEventStore) {
        return await this.getVersionFromEventStore(id);
      } else {
        const aggregate = await this.findById(id);
        return aggregate?.getVersion() || 0;
      }
    } catch (error) {
      this.logger.error(`获取聚合根版本失败: ${this.entityName}`, error, {
        id,
      });
      throw error;
    }
  }

  /**
   * 获取聚合根事件
   *
   * @param id - 聚合根标识符
   * @param fromVersion - 起始版本
   * @param toVersion - 结束版本
   * @returns 事件列表
   */
  async getEvents(
    id: TId,
    fromVersion?: number,
    toVersion?: number
  ): Promise<BaseDomainEvent[]> {
    try {
      if (this.aggregateConfig.enableEventStore) {
        return await this.getEventsFromEventStore(id, fromVersion, toVersion);
      } else {
        return [];
      }
    } catch (error) {
      this.logger.error(`获取聚合根事件失败: ${this.entityName}`, error, {
        id,
      });
      throw error;
    }
  }

  /**
   * 获取聚合根快照
   *
   * @param id - 聚合根标识符
   * @returns 快照
   */
  async getSnapshot(id: TId): Promise<any> {
    try {
      if (this.aggregateConfig.enableSnapshot) {
        return await this.getSnapshotFromStore(id);
      } else {
        return null;
      }
    } catch (error) {
      this.logger.error(`获取聚合根快照失败: ${this.entityName}`, error, {
        id,
      });
      throw error;
    }
  }

  /**
   * 批量删除聚合根
   *
   * @param ids - 要删除的聚合根标识符数组
   */
  override async deleteAll(ids: TId[]): Promise<void> {
    try {
      if (this.config.enableTransaction) {
        // 使用兼容性检查调用 transaction 方法
        if (typeof (this.databaseService as any).transaction === 'function') {
          await (this.databaseService as any).transaction(
            async (transaction: any) => {
              for (const id of ids) {
                await this.deleteFromDatabase(id, transaction);
              }
            }
          );
        } else {
          for (const id of ids) {
            await this.delete(id);
          }
        }
      } else {
        for (const id of ids) {
          await this.delete(id);
        }
      }

      // 清除缓存
      if (this.config.enableCache) {
        for (const id of ids) {
          await this.removeFromCache(id);
        }
      }

      this.logger.debug(`批量删除聚合根成功: ${this.entityName}`, {
        count: ids.length,
      });
    } catch (error) {
      this.logger.error(`批量删除聚合根失败: ${this.entityName}`, error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 保存聚合根状态
   */
  private async saveAggregateState(aggregate: T): Promise<void> {
    // 实现具体的聚合根状态保存逻辑
    // 这里需要根据具体的数据库服务来实现
    throw new Error('需要实现具体的聚合根状态保存逻辑');
  }

  /**
   * 存储领域事件
   */
  private async storeDomainEvents(aggregate: T): Promise<void> {
    const events = aggregate.uncommittedEvents;
    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      await this.storeEvent(event);
    }

    // 标记事件为已提交
    (aggregate as any).markEventsAsCommitted();
  }

  /**
   * 发布领域事件
   */
  private async publishDomainEvents(aggregate: T): Promise<void> {
    const events = aggregate.uncommittedEvents;
    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      // 使用兼容性检查调用 publish 方法
      if (typeof (this.eventService as any).publish === 'function') {
        await (this.eventService as any).publish(event);
      } else {
        console.warn('EventService不支持publish方法');
      }
    }
  }

  /**
   * 检查是否应该创建快照
   */
  private shouldCreateSnapshot(aggregate: T): boolean {
    return aggregate.getVersion() % this.aggregateConfig.snapshotInterval === 0;
  }

  /**
   * 创建快照
   */
  private async createSnapshot(aggregate: T): Promise<void> {
    const snapshot = {
      id: (aggregate as any).getId(),
      version: aggregate.getVersion(),
      data: (aggregate as any).toSnapshot(),
      createdAt: new Date(),
    };

    await this.storeSnapshot(snapshot);
  }

  /**
   * 从快照恢复聚合根
   */
  private async restoreFromSnapshot(snapshot: any): Promise<T | null> {
    // 实现具体的快照恢复逻辑
    // 这里需要根据具体的聚合根类型来实现
    throw new Error('需要实现具体的快照恢复逻辑');
  }

  /**
   * 应用快照后的事件
   */
  private async applyEventsAfterSnapshot(
    aggregate: T,
    fromVersion: number
  ): Promise<void> {
    const events = await this.getEvents(
      (aggregate as any).getId(),
      fromVersion + 1
    );
    for (const event of events) {
      // 由于applyEvent是protected方法，我们需要通过类型断言来访问
      (aggregate as any).applyEvent(event);
    }
  }

  /**
   * 从事件重建聚合根
   */
  private async rebuildFromEvents(id: TId): Promise<T | null> {
    // 实现具体的事件重建逻辑
    // 这里需要根据具体的聚合根类型来实现
    throw new Error('需要实现具体的事件重建逻辑');
  }

  /**
   * 存储事件
   */
  private async storeEvent(event: BaseDomainEvent): Promise<void> {
    // 实现具体的事件存储逻辑
    // 这里需要根据具体的事件存储服务来实现
    throw new Error('需要实现具体的事件存储逻辑');
  }

  /**
   * 从事件存储获取版本
   */
  private async getVersionFromEventStore(id: TId): Promise<number> {
    // 实现具体的事件存储版本获取逻辑
    // 这里需要根据具体的事件存储服务来实现
    throw new Error('需要实现具体的事件存储版本获取逻辑');
  }

  /**
   * 从事件存储获取事件
   */
  private async getEventsFromEventStore(
    id: TId,
    fromVersion?: number,
    toVersion?: number
  ): Promise<BaseDomainEvent[]> {
    // 实现具体的事件存储事件获取逻辑
    // 这里需要根据具体的事件存储服务来实现
    throw new Error('需要实现具体的事件存储事件获取逻辑');
  }

  /**
   * 从存储获取快照
   */
  private async getSnapshotFromStore(id: TId): Promise<any> {
    // 实现具体的快照存储获取逻辑
    // 这里需要根据具体的快照存储服务来实现
    throw new Error('需要实现具体的快照存储获取逻辑');
  }

  /**
   * 存储快照
   */
  private async storeSnapshot(snapshot: any): Promise<void> {
    // 实现具体的快照存储逻辑
    // 这里需要根据具体的快照存储服务来实现
    throw new Error('需要实现具体的快照存储逻辑');
  }
}
