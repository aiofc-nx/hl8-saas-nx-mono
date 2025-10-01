/**
 * 事件总线端口适配器
 *
 * 实现应用层事件总线端口接口，提供统一的事件发布和订阅能力。
 * 作为通用功能组件，支持多种事件类型和事件处理策略。
 *
 * @description 事件总线端口适配器实现应用层事件处理需求
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EventService } from '@hl8/messaging';
import { IEventBusPort } from '../../../application/ports/shared/shared-ports.interface';

/**
 * 事件类型枚举
 */
export enum EventType {
  /** 领域事件 */
  DOMAIN_EVENT = 'domain_event',
  /** 集成事件 */
  INTEGRATION_EVENT = 'integration_event',
  /** 应用事件 */
  APPLICATION_EVENT = 'application_event',
  /** 系统事件 */
  SYSTEM_EVENT = 'system_event',
}

/**
 * 事件优先级枚举
 */
export enum EventPriority {
  /** 高优先级 */
  HIGH = 'high',
  /** 中优先级 */
  MEDIUM = 'medium',
  /** 低优先级 */
  LOW = 'low',
}

/**
 * 事件总线端口适配器
 *
 * 实现应用层事件总线端口接口
 */
@Injectable()
export class EventBusPortAdapter implements IEventBusPort {
  constructor(private readonly eventService: EventService) {}

  /**
   * 发布事件
   *
   * @param event - 事件对象
   * @param options - 发布选项
   */
  async publish(
    event: unknown,
    options?: {
      priority?: EventPriority;
      delay?: number;
      retryCount?: number;
    }
  ): Promise<void> {
    try {
      await this.eventService.publish(event, {
        priority: options?.priority || EventPriority.MEDIUM,
        delay: options?.delay || 0,
        retryCount: options?.retryCount || 3,
      });
    } catch (error) {
      throw new Error(
        `事件发布失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 批量发布事件
   *
   * @param events - 事件数组
   * @param options - 发布选项
   */
  async publishBatch(
    events: unknown[],
    options?: {
      priority?: EventPriority;
      delay?: number;
      retryCount?: number;
    }
  ): Promise<void> {
    try {
      await this.eventService.publishBatch(events, {
        priority: options?.priority || EventPriority.MEDIUM,
        delay: options?.delay || 0,
        retryCount: options?.retryCount || 3,
      });
    } catch (error) {
      throw new Error(
        `批量事件发布失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 订阅事件
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   * @param options - 订阅选项
   */
  async subscribe(
    eventType: string,
    handler: (event: unknown) => Promise<void>,
    options?: {
      priority?: EventPriority;
      filter?: (event: unknown) => boolean;
    }
  ): Promise<void> {
    try {
      await this.eventService.subscribe(eventType, handler, {
        priority: options?.priority || EventPriority.MEDIUM,
        filter: options?.filter,
      });
    } catch (error) {
      throw new Error(
        `事件订阅失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 取消订阅
   *
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  async unsubscribe(
    eventType: string,
    handler: (event: unknown) => Promise<void>
  ): Promise<void> {
    try {
      await this.eventService.unsubscribe(eventType, handler);
    } catch (error) {
      throw new Error(
        `取消事件订阅失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 获取事件统计
   *
   * @returns 事件统计信息
   */
  async getStatistics(): Promise<{
    totalPublished: number;
    totalSubscribed: number;
    totalHandled: number;
    totalFailed: number;
    averageProcessingTime: number;
  }> {
    try {
      return await this.eventService.getStatistics();
    } catch (error) {
      throw new Error(
        `获取事件统计失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 获取事件列表
   *
   * @param options - 查询选项
   * @returns 事件列表
   */
  async getEvents(options?: {
    eventType?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<unknown[]> {
    try {
      return await this.eventService.getEvents(options);
    } catch (error) {
      throw new Error(
        `获取事件列表失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 获取事件详情
   *
   * @param eventId - 事件ID
   * @returns 事件详情
   */
  async getEvent(eventId: string): Promise<unknown> {
    try {
      return await this.eventService.getEvent(eventId);
    } catch (error) {
      throw new Error(
        `获取事件详情失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 重试失败的事件
   *
   * @param eventId - 事件ID
   */
  async retryEvent(eventId: string): Promise<void> {
    try {
      await this.eventService.retryEvent(eventId);
    } catch (error) {
      throw new Error(
        `重试事件失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 清理过期事件
   *
   * @param olderThan - 过期时间
   */
  async cleanupEvents(olderThan: Date): Promise<number> {
    try {
      return await this.eventService.cleanupEvents(olderThan);
    } catch (error) {
      throw new Error(
        `清理过期事件失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 健康检查
   *
   * @returns 健康状态
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: Record<string, unknown>;
  }> {
    try {
      const statistics = await this.getStatistics();
      return {
        healthy: true,
        status: 'running',
        details: {
          statistics,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * 获取订阅者列表
   *
   * @param eventType - 事件类型
   * @returns 订阅者列表
   */
  async getSubscribers(eventType: string): Promise<
    Array<{
      id: string;
      handler: string;
      priority: EventPriority;
      createdAt: Date;
    }>
  > {
    try {
      return await this.eventService.getSubscribers(eventType);
    } catch (error) {
      throw new Error(
        `获取订阅者列表失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 暂停事件处理
   *
   * @param eventType - 事件类型
   */
  async pauseEventProcessing(eventType: string): Promise<void> {
    try {
      await this.eventService.pauseEventProcessing(eventType);
    } catch (error) {
      throw new Error(
        `暂停事件处理失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 恢复事件处理
   *
   * @param eventType - 事件类型
   */
  async resumeEventProcessing(eventType: string): Promise<void> {
    try {
      await this.eventService.resumeEventProcessing(eventType);
    } catch (error) {
      throw new Error(
        `恢复事件处理失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
