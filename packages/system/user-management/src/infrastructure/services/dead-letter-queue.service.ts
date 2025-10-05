/**
 * 死信队列服务
 *
 * @description 死信队列服务，处理失败的事件和消息
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@hl8/hybrid-archi';

/**
 * 死信事件接口
 *
 * @description 死信事件的数据结构
 */
export interface DeadLetterEvent {
  id: string;
  originalEvent: DomainEvent;
  error: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  lastRetryAt?: Date;
  tenantId?: string;
}

/**
 * 死信队列服务
 *
 * @description 死信队列服务，处理失败的事件和消息
 *
 * ## 业务规则
 *
 * ### 死信队列职责
 * - 处理失败的事件
 * - 支持事件重试
 * - 管理死信事件
 * - 提供监控和告警
 *
 * ### 重试策略
 * - 指数退避重试
 * - 最大重试次数限制
 * - 重试间隔配置
 * - 重试失败处理
 */
@Injectable()
export class DeadLetterQueueService {
  private deadLetterEvents = new Map<string, DeadLetterEvent>();
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };

  constructor() // private readonly eventBus: IEventBus, // TODO: 注入其他依赖
  // private readonly logger: ILoggerService
  {}

  /**
   * 发送到死信队列
   *
   * @description 将失败的事件发送到死信队列
   * @param event - 原始事件
   * @param error - 错误信息
   * @returns 发送结果
   */
  async sendToDeadLetter(event: DomainEvent, error: Error): Promise<void> {
    try {
      const deadLetterEvent: DeadLetterEvent = {
        id: `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalEvent: event,
        error: error.message,
        retryCount: 0,
        maxRetries: this.retryConfig.maxRetries,
        createdAt: new Date(),
        tenantId: event.tenantId,
      };

      this.deadLetterEvents.set(deadLetterEvent.id, deadLetterEvent);

      console.log('Event sent to dead letter queue', {
        deadLetterId: deadLetterEvent.id,
        eventType: event.eventType,
        error: error.message,
        tenantId: event.tenantId,
      });
    } catch (error) {
      console.error('Failed to send event to dead letter queue', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 重试死信事件
   *
   * @description 重试死信队列中的事件
   * @returns 重试结果
   */
  async retryDeadLetterEvents(): Promise<void> {
    try {
      console.log('Starting dead letter event retry', {
        totalEvents: this.deadLetterEvents.size,
      });

      const eventsToRetry = Array.from(this.deadLetterEvents.values()).filter(
        (event) => event.retryCount < event.maxRetries
      );

      for (const deadLetterEvent of eventsToRetry) {
        try {
          await this.retryEvent(deadLetterEvent);
        } catch (error) {
          console.error('Failed to retry dead letter event', {
            deadLetterId: deadLetterEvent.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      console.log('Dead letter event retry completed', {
        retriedEvents: eventsToRetry.length,
      });
    } catch (error) {
      console.error('Failed to retry dead letter events', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取死信事件
   *
   * @description 获取死信队列中的所有事件
   * @returns 死信事件列表
   */
  async getDeadLetterEvents(): Promise<DeadLetterEvent[]> {
    try {
      return Array.from(this.deadLetterEvents.values());
    } catch (error) {
      console.error('Failed to get dead letter events', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * 清理过期死信事件
   *
   * @description 清理过期的死信事件
   * @param maxAge - 最大年龄（毫秒）
   * @returns 清理结果
   */
  async cleanupExpiredEvents(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    try {
      const now = Date.now();
      const expiredEvents = Array.from(this.deadLetterEvents.values()).filter(
        (event) => now - event.createdAt.getTime() > maxAge
      );

      for (const event of expiredEvents) {
        this.deadLetterEvents.delete(event.id);
      }

      console.log('Expired dead letter events cleaned up', {
        cleanedCount: expiredEvents.length,
        remainingCount: this.deadLetterEvents.size,
      });
    } catch (error) {
      console.error('Failed to cleanup expired events', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取死信队列统计
   *
   * @description 获取死信队列的统计信息
   * @returns 统计信息
   */
  async getDeadLetterStats(): Promise<{
    totalEvents: number;
    retryableEvents: number;
    expiredEvents: number;
    eventsByType: Record<string, number>;
  }> {
    try {
      const events = Array.from(this.deadLetterEvents.values());
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

      const stats = {
        totalEvents: events.length,
        retryableEvents: events.filter((e) => e.retryCount < e.maxRetries)
          .length,
        expiredEvents: events.filter(
          (e) => now - e.createdAt.getTime() > maxAge
        ).length,
        eventsByType: {} as Record<string, number>,
      };

      // 按事件类型统计
      for (const event of events) {
        const eventType = event.originalEvent.eventType;
        stats.eventsByType[eventType] =
          (stats.eventsByType[eventType] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get dead letter stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalEvents: 0,
        retryableEvents: 0,
        expiredEvents: 0,
        eventsByType: {},
      };
    }
  }

  // ========== 私有辅助方法 ==========

  /**
   * 重试事件
   *
   * @description 重试单个死信事件
   * @param deadLetterEvent - 死信事件
   * @private
   */
  private async retryEvent(deadLetterEvent: DeadLetterEvent): Promise<void> {
    try {
      // 计算重试延迟
      const delay = this.calculateRetryDelay(deadLetterEvent.retryCount);

      // 等待重试延迟
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 更新重试计数
      deadLetterEvent.retryCount++;
      deadLetterEvent.lastRetryAt = new Date();

      // TODO: 重新发布事件到事件总线
      // await this.eventBus.publishSingle(deadLetterEvent.originalEvent);

      console.log('Dead letter event retried', {
        deadLetterId: deadLetterEvent.id,
        retryCount: deadLetterEvent.retryCount,
        delay,
      });

      // 如果重试成功，从死信队列中移除
      if (deadLetterEvent.retryCount >= deadLetterEvent.maxRetries) {
        this.deadLetterEvents.delete(deadLetterEvent.id);
      }
    } catch (error) {
      console.error('Failed to retry dead letter event', {
        deadLetterId: deadLetterEvent.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 计算重试延迟
   *
   * @description 使用指数退避算法计算重试延迟
   * @param retryCount - 重试次数
   * @returns 延迟时间（毫秒）
   * @private
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay *
        Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelay
    );

    // 添加随机抖动，避免雷群效应
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }
}
