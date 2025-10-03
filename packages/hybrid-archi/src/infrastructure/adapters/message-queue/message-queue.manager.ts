/**
 * 消息队列管理器
 *
 * 提供消息队列的统一管理和协调能力。
 * 作为通用功能组件，支持消息队列的生命周期管理和依赖注入。
 *
 * @description 消息队列管理器实现消息队列的统一管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { MessagingService } from '@hl8/messaging';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';
import {
  MessageQueueAdapter,
  IMessageQueueConfig,
} from './message-queue.adapter';
import {
  MessageQueueFactory,
  IMessageQueueRegistration,
} from './message-queue.factory';

/**
 * 消息队列管理器配置
 */
export interface IMessageQueueManagerConfig {
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  /** 队列最大年龄（毫秒） */
  maxQueueAge: number;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
  /** 是否启用消息清理 */
  enableMessageCleanup: boolean;
  /** 消息清理间隔（毫秒） */
  messageCleanupInterval: number;
}

/**
 * 消息队列管理器
 *
 * 提供消息队列的统一管理和协调
 */
@Injectable()
export class MessageQueueManager {
  private readonly config: IMessageQueueManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private messageCleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger,
    private readonly queueFactory: MessageQueueFactory,
    config: Partial<IMessageQueueManagerConfig> = {}
  ) {
    this.config = {
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60 * 60 * 1000, // 1小时
      maxQueueAge: config.maxQueueAge ?? 24 * 60 * 60 * 1000, // 24小时
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 5 * 60 * 1000, // 5分钟
      enableMessageCleanup: config.enableMessageCleanup ?? true,
      messageCleanupInterval:
        config.messageCleanupInterval ?? 24 * 60 * 60 * 1000, // 24小时
    };

    this.initialize();
  }

  /**
   * 创建消息队列
   *
   * @param queueName - 队列名称
   * @param queueType - 队列类型
   * @param config - 队列配置
   * @returns 消息队列实例
   */
  createQueue(
    queueName: string,
    queueType: string,
    config: Partial<IMessageQueueConfig> = {}
  ): MessageQueueAdapter {
    this.logger.debug(`创建消息队列: ${queueName}`, {
      queueType,
      config,
    });

    return this.queueFactory.createQueue(queueName, queueType, config);
  }

  /**
   * 获取消息队列
   *
   * @param queueName - 队列名称
   * @returns 消息队列实例
   */
  getQueue(queueName: string): MessageQueueAdapter | null {
    return this.queueFactory.getQueue(queueName);
  }

  /**
   * 获取或创建消息队列
   *
   * @param queueName - 队列名称
   * @param queueType - 队列类型
   * @param config - 队列配置
   * @returns 消息队列实例
   */
  getOrCreateQueue(
    queueName: string,
    queueType: string,
    config: Partial<IMessageQueueConfig> = {}
  ): MessageQueueAdapter {
    return this.queueFactory.getOrCreateQueue(queueName, queueType, config);
  }

  /**
   * 销毁消息队列
   *
   * @param queueName - 队列名称
   */
  async destroyQueue(queueName: string): Promise<void> {
    this.logger.debug(`销毁消息队列: ${queueName}`);
    await this.queueFactory.destroyQueue(queueName);
  }

  /**
   * 获取所有队列
   *
   * @returns 队列注册信息列表
   */
  getAllQueues(): IMessageQueueRegistration[] {
    return this.queueFactory.getAllQueues();
  }

  /**
   * 获取队列注册信息
   *
   * @param queueName - 队列名称
   * @returns 队列注册信息
   */
  getQueueRegistration(queueName: string): IMessageQueueRegistration | null {
    return this.queueFactory.getQueueRegistration(queueName);
  }

  /**
   * 更新队列配置
   *
   * @param queueName - 队列名称
   * @param config - 新配置
   */
  updateQueueConfiguration(
    queueName: string,
    config: Partial<IMessageQueueConfig>
  ): void {
    this.logger.debug(`更新消息队列配置: ${queueName}`, { config });
    this.queueFactory.updateQueueConfiguration(queueName, config);
  }

  /**
   * 获取队列统计信息
   *
   * @returns 队列统计信息
   */
  getQueueStatistics(): {
    totalQueues: number;
    activeQueues: number;
    queueTypes: Record<string, number>;
    averageAge: number;
    oldestQueue: string | null;
    newestQueue: string | null;
  } {
    return this.queueFactory.getQueueStatistics();
  }

  /**
   * 健康检查所有队列
   *
   * @returns 健康检查结果
   */
  async healthCheckAllQueues(): Promise<Record<string, any>> {
    this.logger.debug('开始健康检查所有消息队列');
    return await this.queueFactory.healthCheckAllQueues();
  }

  /**
   * 清理过期队列
   *
   * @returns 清理的队列数量
   */
  async cleanupExpiredQueues(): Promise<number> {
    this.logger.debug('开始清理过期消息队列');
    return await this.queueFactory.cleanupExpiredQueues(
      this.config.maxQueueAge
    );
  }

  /**
   * 清理过期消息
   *
   * @returns 清理的消息数量
   */
  async cleanupExpiredMessages(): Promise<number> {
    this.logger.debug('开始清理过期消息');

    let totalCleaned = 0;
    const queues = this.getAllQueues();

    for (const queue of queues) {
      if (queue.instance) {
        try {
          const cleaned = await queue.instance.cleanupExpiredMessages();
          totalCleaned += cleaned;
        } catch (error) {
          this.logger.error(`清理队列过期消息失败: ${queue.queueName}`, error);
        }
      }
    }

    this.logger.debug(`清理过期消息完成: ${totalCleaned}`, {
      queueCount: queues.length,
    });

    return totalCleaned;
  }

  /**
   * 获取管理器状态
   *
   * @returns 管理器状态
   */
  getManagerStatus(): {
    config: IMessageQueueManagerConfig;
    statistics: any;
    healthy: boolean;
    timestamp: Date;
  } {
    const statistics = this.getQueueStatistics();
    const healthy = statistics.totalQueues > 0;

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
    this.logger.info('启动消息队列管理器');

    // 启动自动清理
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    // 启动健康检查
    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }

    // 启动消息清理
    if (this.config.enableMessageCleanup) {
      this.startMessageCleanup();
    }
  }

  /**
   * 停止管理器
   */
  stop(): void {
    this.logger.info('停止消息队列管理器');

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

    // 停止消息清理
    if (this.messageCleanupTimer) {
      clearInterval(this.messageCleanupTimer);
      this.messageCleanupTimer = undefined;
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logger.info('销毁消息队列管理器');

    // 停止管理器
    this.stop();

    // 销毁所有队列
    const queues = this.getAllQueues();
    for (const queue of queues) {
      await this.destroyQueue(queue.queueName);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化管理器
   */
  private initialize(): void {
    this.logger.debug('初始化消息队列管理器', {
      config: this.config,
    });
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredQueues();
        if (cleanedCount > 0) {
          this.logger.debug(`自动清理完成: ${cleanedCount} 个队列`);
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
        const healthResults = await this.healthCheckAllQueues();
        const unhealthyQueues = Object.entries(healthResults).filter(
          ([, result]) => !result.healthy
        );

        if (unhealthyQueues.length > 0) {
          this.logger.warn('发现不健康的消息队列', {
            unhealthyQueues: unhealthyQueues.map(([name]) => name),
          });
        }
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * 启动消息清理
   */
  private startMessageCleanup(): void {
    this.messageCleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredMessages();
        if (cleanedCount > 0) {
          this.logger.debug(`消息清理完成: ${cleanedCount} 个消息`);
        }
      } catch (error) {
        this.logger.error('消息清理失败', error);
      }
    }, this.config.messageCleanupInterval);
  }
}
