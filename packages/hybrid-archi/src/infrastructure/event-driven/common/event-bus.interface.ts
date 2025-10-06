/**
 * 通用事件总线接口
 *
 * @description 事件总线的通用接口定义，支持事件驱动架构
 * @since 1.0.0
 */

import { DomainEvent } from '../../../domain';
import { IEventHandler } from '../../../application/interfaces/common';

/**
 * 事件订阅选项接口
 */
export interface EventSubscriptionOptions {
  tenantId?: string;
  priority?: number;
  filter?: (event: unknown) => boolean;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

/**
 * 事件总线接口
 *
 * @description 事件总线的通用接口定义，支持事件驱动架构模式
 *
 * ## 业务规则
 *
 * ### 事件发布规则
 * - 异步发布事件
 * - 支持批量事件发布
 * - 保证事件顺序
 * - 支持事务性发布
 *
 * ### 事件订阅规则
 * - 动态订阅事件处理器
 * - 支持多个处理器订阅同一事件
 * - 支持事件过滤器
 * - 支持租户隔离
 *
 * ### 事件路由规则
 * - 智能事件路由
 * - 支持事件重试
 * - 支持死信队列
 * - 支持事件监控
 */
export interface IEventBus {
  /**
   * 发布事件
   *
   * @description 发布一个或多个事件到事件总线
   * @param events - 要发布的事件列表
   * @returns 发布结果
   */
  publish(events: unknown[]): Promise<void>;

  /**
   * 发布单个事件
   *
   * @description 发布单个事件到事件总线
   * @param event - 要发布的事件
   * @returns 发布结果
   */
  publishSingle(event: unknown): Promise<void>;

  /**
   * 订阅事件
   *
   * @description 订阅指定类型的事件
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   * @param options - 订阅选项
   * @returns 订阅结果
   */
  subscribe<T>(
    eventType: string,
    handler: IEventHandler<T>,
    options?: EventSubscriptionOptions
  ): void;

  /**
   * 取消订阅
   *
   * @description 取消订阅指定类型的事件
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   * @returns 取消订阅结果
   */
  unsubscribe<T>(
    eventType: string,
    handler: IEventHandler<T>
  ): void;

  /**
   * 获取订阅者
   *
   * @description 获取指定事件类型的订阅者列表
   * @param eventType - 事件类型
   * @returns 订阅者列表
   */
  getSubscribers(eventType: string): IEventHandler<any>[];

  /**
   * 检查是否有订阅者
   *
   * @description 检查指定事件类型是否有订阅者
   * @param eventType - 事件类型
   * @returns 是否有订阅者
   */
  hasSubscribers(eventType: string): boolean;

  /**
   * 获取事件统计信息
   *
   * @description 获取事件总线的统计信息
   * @returns 统计信息
   */
  getStats(): Promise<EventBusStats>;

  /**
   * 检查连接状态
   *
   * @description 检查事件总线连接状态
   * @returns 连接状态
   */
  isConnected(): Promise<boolean>;

  /**
   * 关闭连接
   *
   * @description 关闭事件总线连接
   * @returns 关闭结果
   */
  close(): Promise<void>;
}

/**
 * 事件总线统计信息接口
 */
export interface EventBusStats {
  totalEventsPublished: number;
  totalEventsProcessed: number;
  totalSubscribers: number;
  eventsByType: Record<string, number>;
  averageProcessingTime: number;
  errorRate: number;
  lastEventPublished: Date;
  lastEventProcessed: Date;
}

/**
 * 事件总线配置接口
 */
export interface EventBusConfig {
  provider: 'inmemory' | 'redis' | 'kafka' | 'rabbitmq';
  connectionString?: string;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  timeout?: number;
  compression?: boolean;
  encryption?: boolean;
  monitoring?: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
}
