/**
 * 消息队列工厂
 *
 * 提供消息队列适配器的动态创建和管理能力。
 * 作为通用功能组件，支持消息队列的生命周期管理。
 *
 * @description 消息队列工厂实现消息队列适配器的动态创建和管理
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

/**
 * 消息队列注册信息
 */
export interface IMessageQueueRegistration {
  /** 队列名称 */
  queueName: string;
  /** 队列类型 */
  queueType: string;
  /** 队列配置 */
  config: IMessageQueueConfig;
  /** 队列实例 */
  instance?: MessageQueueAdapter;
  /** 是否已初始化 */
  initialized: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
}

/**
 * 消息队列工厂
 *
 * 提供消息队列适配器的动态创建和管理
 */
@Injectable()
export class MessageQueueFactory {
  private readonly queues = new Map<string, IMessageQueueRegistration>();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger
  ) {}

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
    // 检查队列是否已存在
    if (this.queues.has(queueName)) {
      const registration = this.queues.get(queueName)!;
      registration.lastAccessedAt = new Date();
      return registration.instance!;
    }

    // 创建队列实例
    const queue = new MessageQueueAdapter(
      this.messagingService,
      this.cacheService,
      this.logger,
      config
    );

    // 注册队列
    const registration: IMessageQueueRegistration = {
      queueName,
      queueType,
      config: {
        enableCache: config.enableCache ?? true,
        cacheTtl: config.cacheTtl ?? 300,
        enableRetry: config.enableRetry ?? true,
        maxRetries: config.maxRetries ?? 3,
        retryDelay: config.retryDelay ?? 1000,
        enableDeadLetterQueue: config.enableDeadLetterQueue ?? true,
        enablePersistence: config.enablePersistence ?? true,
        messageTtl: config.messageTtl ?? 3600000,
        enableCompression: config.enableCompression ?? false,
        enableEncryption: config.enableEncryption ?? false,
      },
      instance: queue,
      initialized: true,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.queues.set(queueName, registration);

    this.logger.debug(`创建消息队列: ${queueName}`, {
      queueType,
      config: registration.config,
    });

    return queue;
  }

  /**
   * 获取消息队列
   *
   * @param queueName - 队列名称
   * @returns 消息队列实例
   */
  getQueue(queueName: string): MessageQueueAdapter | null {
    const registration = this.queues.get(queueName);
    if (!registration) {
      return null;
    }

    registration.lastAccessedAt = new Date();
    return registration.instance!;
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
    const existingQueue = this.getQueue(queueName);
    if (existingQueue) {
      return existingQueue;
    }

    return this.createQueue(queueName, queueType, config);
  }

  /**
   * 销毁消息队列
   *
   * @param queueName - 队列名称
   */
  async destroyQueue(queueName: string): Promise<void> {
    const registration = this.queues.get(queueName);
    if (!registration) {
      return;
    }

    try {
      // 清理队列资源
      if (registration.config.enableCache && registration.instance) {
        // 清理相关缓存
        await this.cleanupQueueCache(queueName);
      }

      // 移除队列注册
      this.queues.delete(queueName);

      this.logger.debug(`销毁消息队列: ${queueName}`);
    } catch (error) {
      this.logger.error(`销毁消息队列失败: ${queueName}`, error);
      throw error;
    }
  }

  /**
   * 获取所有队列
   *
   * @returns 队列注册信息列表
   */
  getAllQueues(): IMessageQueueRegistration[] {
    return Array.from(this.queues.values());
  }

  /**
   * 获取队列注册信息
   *
   * @param queueName - 队列名称
   * @returns 队列注册信息
   */
  getQueueRegistration(queueName: string): IMessageQueueRegistration | null {
    return this.queues.get(queueName) || null;
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
    const registration = this.queues.get(queueName);
    if (!registration) {
      throw new Error(`队列不存在: ${queueName}`);
    }

    Object.assign(registration.config, config);

    this.logger.debug(`更新消息队列配置: ${queueName}`, {
      config: registration.config,
    });
  }

  /**
   * 清理过期队列
   *
   * @param maxAge - 最大年龄（毫秒）
   * @returns 清理的队列数量
   */
  async cleanupExpiredQueues(
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const now = new Date();
    const expiredQueues: string[] = [];

    for (const [queueName, registration] of this.queues) {
      const age = now.getTime() - registration.lastAccessedAt.getTime();
      if (age > maxAge) {
        expiredQueues.push(queueName);
      }
    }

    for (const queueName of expiredQueues) {
      await this.destroyQueue(queueName);
    }

    this.logger.debug(`清理过期消息队列: ${expiredQueues.length}`, {
      expiredQueues,
    });

    return expiredQueues.length;
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
    const queues = Array.from(this.queues.values());
    const now = new Date();

    const queueTypes: Record<string, number> = {};
    let totalAge = 0;
    let oldestQueue: string | null = null;
    let newestQueue: string | null = null;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const queue of queues) {
      // 统计队列类型
      queueTypes[queue.queueType] = (queueTypes[queue.queueType] || 0) + 1;

      // 计算年龄
      const age = now.getTime() - queue.createdAt.getTime();
      totalAge += age;

      // 找到最老的队列
      if (age > oldestAge) {
        oldestAge = age;
        oldestQueue = queue.queueName;
      }

      // 找到最新的队列
      if (age < newestAge) {
        newestAge = age;
        newestQueue = queue.queueName;
      }
    }

    return {
      totalQueues: queues.length,
      activeQueues: queues.filter((q) => q.initialized).length,
      queueTypes,
      averageAge: queues.length > 0 ? totalAge / queues.length : 0,
      oldestQueue,
      newestQueue,
    };
  }

  /**
   * 健康检查所有队列
   *
   * @returns 健康检查结果
   */
  async healthCheckAllQueues(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [queueName, registration] of this.queues) {
      try {
        const isHealthy = await this.checkQueueHealth(
          queueName,
          registration.instance!
        );
        results[queueName] = {
          healthy: isHealthy,
          status: isHealthy ? 'healthy' : 'unhealthy',
          queueName,
          queueType: registration.queueType,
          createdAt: registration.createdAt,
          lastAccessedAt: registration.lastAccessedAt,
        };
      } catch (error) {
        results[queueName] = {
          healthy: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          queueName,
        };
      }
    }

    return results;
  }

  // ==================== 私有方法 ====================

  /**
   * 检查队列健康状态
   */
  private async checkQueueHealth(
    queueName: string,
    instance: MessageQueueAdapter
  ): Promise<boolean> {
    try {
      // 检查队列是否可用
      const stats = await instance.getQueueStatistics(queueName);
      return stats.messageCount >= 0;
    } catch {
      return false;
    }
  }

  /**
   * 清理队列缓存
   */
  private async cleanupQueueCache(queueName: string): Promise<void> {
    const pattern = `message:${queueName}:*`;
    // 使用兼容性检查调用 deletePattern 方法
    if (typeof (this.cacheService as any).deletePattern === 'function') {
      await (this.cacheService as any).deletePattern(pattern);
    } else {
      console.warn('CacheService不支持deletePattern方法');
    }
  }
}
