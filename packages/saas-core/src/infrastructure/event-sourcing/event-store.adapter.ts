/**
 * 事件存储适配器
 *
 * @description 基于 PostgreSQL 的事件存储实现
 *
 * ## 业务规则
 *
 * ### 事件流
 * - 每个聚合根有独立的事件流
 * - 事件流ID格式：{aggregateType}-{aggregateId}
 * - 事件按版本号顺序存储
 *
 * ### 并发控制
 * - 使用乐观锁防止并发冲突
 * - 版本号递增验证
 * - 事务保证一致性
 *
 * ### 事件持久化
 * - 事件不可变（只追加，不修改）
 * - 事件包含完整的元数据
 * - 支持事件重放和溯源
 *
 * @module infrastructure/event-sourcing
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { BaseDomainEvent } from '@hl8/hybrid-archi';

/**
 * 事件存储记录接口
 *
 * @interface IEventStoreRecord
 */
export interface IEventStoreRecord {
  /** 事件ID */
  id: string;
  /** 聚合根类型 */
  aggregateType: string;
  /** 聚合根ID */
  aggregateId: string;
  /** 事件类型 */
  eventType: string;
  /** 事件数据（JSON） */
  eventData: Record<string, any>;
  /** 事件元数据 */
  metadata: Record<string, any>;
  /** 事件版本号 */
  version: number;
  /** 租户ID */
  tenantId: string;
  /** 发生时间 */
  occurredAt: Date;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 事件存储适配器
 *
 * @class EventStoreAdapter
 * @description 提供事件的追加、读取和查询功能
 */
@Injectable()
export class EventStoreAdapter {
  constructor(private readonly em: EntityManager) {}

  /**
   * 追加事件到事件流
   *
   * @description 将领域事件持久化到事件存储
   *
   * ## 业务规则
   * 1. 验证版本号连续性
   * 2. 验证租户上下文
   * 3. 事务保证原子性
   * 4. 记录完整的事件元数据
   *
   * @async
   * @param {string} streamId - 事件流ID
   * @param {BaseDomainEvent[]} events - 领域事件数组
   * @param {number} expectedVersion - 预期版本号（用于乐观锁）
   * @returns {Promise<void>}
   * @throws {Error} 当版本冲突或验证失败时抛出错误
   *
   * @example
   * ```typescript
   * const streamId = 'tenant-123';
   * const events = [new TenantCreatedEvent(...)];
   * await eventStore.appendEvents(streamId, events, 0);
   * ```
   */
  public async appendEvents(
    streamId: string,
    events: BaseDomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    // 开启事务
    await this.em.transactional(async (em) => {
      // 验证版本号（乐观锁）
      const currentVersion = await this.getCurrentVersion(streamId);
      if (currentVersion !== expectedVersion) {
        throw new Error(
          `版本冲突：预期版本 ${expectedVersion}，实际版本 ${currentVersion}`,
        );
      }

      // 准备事件记录
      const records: IEventStoreRecord[] = events.map((event, index) => ({
        id: this.generateEventId(),
        aggregateType: this.extractAggregateType(streamId),
        aggregateId: this.extractAggregateId(streamId),
        eventType: event.constructor.name,
        eventData: this.serializeEvent(event),
        metadata: this.extractMetadata(event),
        version: expectedVersion + index + 1,
        tenantId: event.tenantId?.toString() || '',
        occurredAt: event.occurredAt,
        createdAt: new Date(),
      }));

      // 批量插入事件
      for (const record of records) {
        // 注意：这里需要实际的 EventStoreOrmEntity
        // 当前只是示例代码，实际需要创建对应的 ORM 实体
        // TODO: MikroORM 6.x API 变更 - 使用 em.insert() 或创建 ORM 实体
        // await em.nativeInsert('event_store', record);
        console.log('TODO: 保存事件到事件存储', record);
      }
    });
  }

  /**
   * 读取事件流
   *
   * @description 从事件存储读取指定流的所有事件
   *
   * @async
   * @param {string} streamId - 事件流ID
   * @param {number} fromVersion - 起始版本号（可选）
   * @returns {Promise<BaseDomainEvent[]>} 事件数组
   *
   * @example
   * ```typescript
   * const events = await eventStore.readEvents('tenant-123', 0);
   * ```
   */
  public async readEvents(
    streamId: string,
    fromVersion = 0,
  ): Promise<BaseDomainEvent[]> {
    const records = await this.em.find<IEventStoreRecord>('event_store', {
      aggregateType: this.extractAggregateType(streamId),
      aggregateId: this.extractAggregateId(streamId),
      version: { $gte: fromVersion },
    }, {
      orderBy: { version: 'ASC' },
    });

    return records.map(record => this.deserializeEvent(record));
  }

  /**
   * 获取当前版本号
   *
   * @private
   * @async
   * @param {string} streamId - 事件流ID
   * @returns {Promise<number>} 当前版本号
   */
  private async getCurrentVersion(streamId: string): Promise<number> {
    // TODO: MikroORM 6.x API 变更 - limit 选项已移除，需要使用 em.find().limit(1)
    // const result = await this.em.findOne<IEventStoreRecord>(
    //   'event_store',
    //   {
    //     aggregateType: this.extractAggregateType(streamId),
    //     aggregateId: this.extractAggregateId(streamId),
    //   },
    //   {
    //     orderBy: { version: 'DESC' },
    //   },
    // );
    // return result?.version || 0;
    
    console.log('TODO: 获取流的当前版本', streamId);
    return 0;
  }

  /**
   * 生成事件ID
   *
   * @private
   * @returns {string} 事件ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从流ID提取聚合根类型
   *
   * @private
   * @param {string} streamId - 事件流ID
   * @returns {string} 聚合根类型
   */
  private extractAggregateType(streamId: string): string {
    return streamId.split('-')[0];
  }

  /**
   * 从流ID提取聚合根ID
   *
   * @private
   * @param {string} streamId - 事件流ID
   * @returns {string} 聚合根ID
   */
  private extractAggregateId(streamId: string): string {
    return streamId.substring(streamId.indexOf('-') + 1);
  }

  /**
   * 序列化事件
   *
   * @private
   * @param {BaseDomainEvent} event - 领域事件
   * @returns {Record<string, any>} 序列化后的事件数据
   */
  private serializeEvent(event: BaseDomainEvent): Record<string, any> {
    return {
      aggregateId: event.aggregateId.toString(),
      version: event.aggregateVersion,
      tenantId: event.tenantId?.toString(),
      occurredAt: event.occurredAt.toISOString(),
      ...event.toJSON(),
    };
  }

  /**
   * 反序列化事件
   *
   * @private
   * @param {IEventStoreRecord} record - 事件存储记录
   * @returns {BaseDomainEvent} 领域事件
   */
  private deserializeEvent(record: IEventStoreRecord): BaseDomainEvent {
    // 注意：实际实现需要根据 eventType 动态创建对应的事件类实例
    // 这里只是示例，需要事件注册表来完成反序列化
    throw new Error('Event deserialization not implemented');
  }

  /**
   * 提取事件元数据
   *
   * @private
   * @param {BaseDomainEvent} event - 领域事件
   * @returns {Record<string, any>} 元数据
   */
  private extractMetadata(event: BaseDomainEvent): Record<string, any> {
    return {
      eventId: event.eventId,
      aggregateId: event.aggregateId.toString(),
      version: event.aggregateVersion,
      occurredAt: event.occurredAt.toISOString(),
    };
  }
}

