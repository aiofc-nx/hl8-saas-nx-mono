/**
 * 通用事件存储接口
 *
 * @description 事件存储的通用接口定义，支持事件溯源
 * @since 1.0.0
 */

import { DomainEvent } from '../../../domain';

/**
 * 事件存储异常类
 */
export class EventStoreException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'EventStoreException';
  }
}

/**
 * 并发异常类
 */
export class ConcurrencyException extends EventStoreException {
  constructor(
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      `聚合 ${aggregateId} 版本冲突: 期望版本 ${expectedVersion}, 实际版本 ${actualVersion}`,
      'CONCURRENCY_CONFLICT'
    );
  }
}

/**
 * 事件存储接口
 *
 * @description 事件存储的通用接口定义，支持事件溯源模式
 *
 * ## 业务规则
 *
 * ### 事件保存规则
 * - 保存聚合的所有事件
 * - 支持乐观并发控制
 * - 保证事件的原子性
 * - 支持事件版本控制
 *
 * ### 事件查询规则
 * - 按聚合ID查询事件
 * - 按事件类型查询
 * - 按租户ID查询
 * - 支持事件时间范围查询
 *
 * ### 事件重放规则
 * - 支持完整事件重放
 * - 支持增量事件重放
 * - 支持时间点快照
 * - 支持事件过滤
 */
export interface IEventStore {
  /**
   * 保存事件
   *
   * @description 保存聚合的所有未提交事件
   * @param aggregateId - 聚合ID
   * @param events - 事件列表
   * @param expectedVersion - 期望的聚合版本号（乐观并发控制）
   * @returns 保存结果
   */
  saveEvents(
    aggregateId: string,
    events: unknown[],
    expectedVersion: number
  ): Promise<void>;

  /**
   * 获取聚合的所有事件
   *
   * @description 获取指定聚合的所有事件
   * @param aggregateId - 聚合ID
   * @returns 事件列表
   */
  getEvents(aggregateId: string): Promise<unknown[]>;

  /**
   * 从指定版本获取事件
   *
   * @description 从指定版本开始获取聚合的事件
   * @param aggregateId - 聚合ID
   * @param fromVersion - 起始版本号
   * @returns 事件列表
   */
  getEventsFromVersion(
    aggregateId: string,
    fromVersion: number
  ): Promise<unknown[]>;

  /**
   * 按事件类型获取事件
   *
   * @description 获取指定类型的事件
   * @param eventType - 事件类型
   * @param fromDate - 开始日期
   * @param toDate - 结束日期
   * @returns 事件列表
   */
  getEventsByType(
    eventType: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<unknown[]>;

  /**
   * 按租户获取事件
   *
   * @description 获取指定租户的事件
   * @param tenantId - 租户ID
   * @param fromDate - 开始日期
   * @param toDate - 结束日期
   * @returns 事件列表
   */
  getEventsByTenant(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<unknown[]>;

  /**
   * 获取聚合版本号
   *
   * @description 获取聚合的当前版本号
   * @param aggregateId - 聚合ID
   * @returns 版本号
   */
  getAggregateVersion(aggregateId: string): Promise<number>;

  /**
   * 检查聚合是否存在
   *
   * @description 检查聚合是否存在
   * @param aggregateId - 聚合ID
   * @returns 是否存在
   */
  exists(aggregateId: string): Promise<boolean>;

  /**
   * 删除聚合事件
   *
   * @description 删除指定聚合的所有事件
   * @param aggregateId - 聚合ID
   * @returns 删除结果
   */
  deleteEvents(aggregateId: string): Promise<void>;

  /**
   * 获取事件统计信息
   *
   * @description 获取事件存储的统计信息
   * @returns 统计信息
   */
  getStats(): Promise<EventStoreStats>;
}

/**
 * 事件存储统计信息接口
 */
export interface EventStoreStats {
  totalEvents: number;
  totalAggregates: number;
  eventsByType: Record<string, number>;
  eventsByTenant: Record<string, number>;
  averageEventsPerAggregate: number;
  oldestEvent: Date;
  newestEvent: Date;
}

/**
 * 事件存储配置接口
 */
export interface EventStoreConfig {
  provider: 'postgresql' | 'mysql' | 'mongodb' | 'inmemory';
  connectionString?: string;
  tableName?: string;
  batchSize?: number;
  retentionPeriod?: number;
  compression?: boolean;
  encryption?: boolean;
  backup?: {
    enabled: boolean;
    interval: number;
    retention: number;
  };
}
