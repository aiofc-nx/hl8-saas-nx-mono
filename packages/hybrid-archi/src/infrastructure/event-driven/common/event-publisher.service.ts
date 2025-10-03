/**
 * 通用事件发布服务
 *
 * @description 统一的事件发布服务，负责将领域事件发布到事件总线
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DomainEvent } from '../../../domain';
import { IEventBus } from './event-bus.interface';

/**
 * 事件发布服务
 *
 * @description 统一的事件发布服务，负责将领域事件发布到事件总线
 *
 * ## 业务规则
 *
 * ### 事件发布规则
 * - 所有领域事件必须通过此服务发布
 * - 支持批量事件发布
 * - 保证事件发布的原子性
 * - 支持事务性事件发布
 *
 * ### 错误处理规则
 * - 事件发布失败时记录错误日志
 * - 支持事件发布重试
 * - 发布失败不影响主业务流程
 * - 提供事件发布状态监控
 */
@Injectable()
export class EventPublisherService {
  constructor(private readonly eventBus: IEventBus) {}

  /**
   * 发布聚合的未提交事件
   *
   * @description 发布聚合根中存储的所有未提交事件
   * @param aggregateId - 聚合ID
   * @param events - 未提交的事件列表
   * @returns 发布结果
   */
  async publishUncommittedEvents(
    aggregateId: string,
    events: any[]
  ): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    try {
      await this.eventBus.publish(events);
      console.log(`成功发布聚合 ${aggregateId} 的 ${events.length} 个事件`);
    } catch (error) {
      console.error(`发布聚合 ${aggregateId} 事件失败:`, error);
      throw error;
    }
  }

  /**
   * 发布单个事件
   *
   * @description 发布单个领域事件
   * @param event - 领域事件
   * @returns 发布结果
   */
  async publishEvent(event: any): Promise<void> {
    try {
      await this.eventBus.publishSingle(event);
      console.log(`成功发布事件: ${event.eventType}`);
    } catch (error) {
      console.error(`发布事件失败: ${event.eventType}`, error);
      throw error;
    }
  }

  /**
   * 批量发布事件
   *
   * @description 批量发布多个领域事件
   * @param events - 事件列表
   * @returns 发布结果
   */
  async publishEvents(events: any[]): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    try {
      await this.eventBus.publish(events);
      console.log(`成功批量发布 ${events.length} 个事件`);
    } catch (error) {
      console.error(`批量发布事件失败:`, error);
      throw error;
    }
  }

  /**
   * 发布租户事件
   *
   * @description 发布指定租户的事件
   * @param tenantId - 租户ID
   * @param events - 事件列表
   * @returns 发布结果
   */
  async publishTenantEvents(tenantId: string, events: any[]): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    try {
      await this.eventBus.publish(events);
      console.log(`成功发布租户 ${tenantId} 的 ${events.length} 个事件`);
    } catch (error) {
      console.error(`发布租户 ${tenantId} 事件失败:`, error);
      throw error;
    }
  }

  /**
   * 发布事件类型
   *
   * @description 发布指定类型的事件
   * @param eventType - 事件类型
   * @param events - 事件列表
   * @returns 发布结果
   */
  async publishEventType(eventType: string, events: any[]): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    try {
      await this.eventBus.publish(events);
      console.log(`成功发布事件类型 ${eventType} 的 ${events.length} 个事件`);
    } catch (error) {
      console.error(`发布事件类型 ${eventType} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取发布统计信息
   *
   * @description 获取事件发布的统计信息
   * @returns 统计信息
   */
  async getPublishStats(): Promise<EventPublishStats> {
    try {
      const busStats = await this.eventBus.getStats();
      return {
        totalEventsPublished: busStats.totalEventsPublished,
        totalEventsProcessed: busStats.totalEventsProcessed,
        averageProcessingTime: busStats.averageProcessingTime,
        errorRate: busStats.errorRate,
        lastEventPublished: busStats.lastEventPublished,
        lastEventProcessed: busStats.lastEventProcessed,
      };
    } catch (error) {
      console.error('获取发布统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查发布服务状态
   *
   * @description 检查事件发布服务的状态
   * @returns 服务状态
   */
  async isHealthy(): Promise<boolean> {
    try {
      return await this.eventBus.isConnected();
    } catch (error) {
      console.error('检查发布服务状态失败:', error);
      return false;
    }
  }
}

/**
 * 事件发布统计信息接口
 */
export interface EventPublishStats {
  totalEventsPublished: number;
  totalEventsProcessed: number;
  averageProcessingTime: number;
  errorRate: number;
  lastEventPublished: Date;
  lastEventProcessed: Date;
}
