/**
 * 消息队列适配器
 *
 * 实现消息发布和订阅功能，提供统一的消息队列能力。
 * 作为通用功能组件，支持多种消息队列实现。
 *
 * @description 消息队列适配器实现消息发布和订阅功能
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { MessagingService } from '@hl8/messaging';
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';

/**
 * 消息队列配置接口
 */
export interface IMessageQueueConfig {
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存TTL（秒） */
  cacheTtl: number;
  /** 是否启用重试 */
  enableRetry: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 是否启用死信队列 */
  enableDeadLetterQueue: boolean;
  /** 是否启用消息持久化 */
  enablePersistence: boolean;
  /** 消息TTL（毫秒） */
  messageTtl: number;
  /** 是否启用消息压缩 */
  enableCompression: boolean;
  /** 是否启用消息加密 */
  enableEncryption: boolean;
}

/**
 * 消息接口
 */
export interface IMessage {
  /** 消息ID */
  messageId: string;
  /** 消息类型 */
  messageType: string;
  /** 消息内容 */
  payload: any;
  /** 消息元数据 */
  metadata: Record<string, any>;
  /** 创建时间 */
  timestamp: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 重试次数 */
  retryCount: number;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
}

/**
 * 消息订阅选项
 */
export interface IMessageSubscriptionOptions {
  /** 队列名称 */
  queueName: string;
  /** 是否自动确认 */
  autoAck: boolean;
  /** 是否独占消费 */
  exclusive: boolean;
  /** 是否持久化 */
  durable: boolean;
  /** 预取数量 */
  prefetchCount: number;
  /** 消息TTL */
  messageTtl: number;
  /** 死信队列 */
  deadLetterQueue?: string;
}

/**
 * 消息处理器接口
 */
export interface IMessageHandler {
  /** 处理器名称 */
  handlerName: string;
  /** 处理函数 */
  handle: (message: IMessage) => Promise<void>;
  /** 错误处理函数 */
  onError?: (error: Error, message: IMessage) => Promise<void>;
}

/**
 * 消息队列适配器
 *
 * 实现消息发布和订阅功能
 */
@Injectable()
export class MessageQueueAdapter {
  private readonly config: IMessageQueueConfig;
  private readonly handlers = new Map<string, IMessageHandler>();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly cacheService: CacheService,
    private readonly logger: PinoLogger,
    config: Partial<IMessageQueueConfig> = {}
  ) {
    this.config = {
      enableCache: config.enableCache ?? true,
      cacheTtl: config.cacheTtl ?? 300,
      enableRetry: config.enableRetry ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      enableDeadLetterQueue: config.enableDeadLetterQueue ?? true,
      enablePersistence: config.enablePersistence ?? true,
      messageTtl: config.messageTtl ?? 3600000, // 1小时
      enableCompression: config.enableCompression ?? false,
      enableEncryption: config.enableEncryption ?? false,
    };
  }

  /**
   * 发布消息
   *
   * @param topic - 主题名称
   * @param message - 消息内容
   * @param options - 发布选项
   */
  async publish(
    topic: string,
    message: any,
    options: {
      messageType?: string;
      metadata?: Record<string, any>;
      tenantId?: string;
      userId?: string;
      ttl?: number;
    } = {}
  ): Promise<void> {
    try {
      const messageId = this.generateMessageId();
      const messageType =
        options.messageType || message.constructor?.name || 'Unknown';

      const messageData: IMessage = {
        messageId,
        messageType,
        payload: this.serializeMessage(message),
        metadata: {
          ...options.metadata,
          tenantId: options.tenantId,
          userId: options.userId,
          timestamp: new Date(),
        },
        timestamp: new Date(),
        expiresAt: options.ttl ? new Date(Date.now() + options.ttl) : undefined,
        retryCount: 0,
        tenantId: options.tenantId,
        userId: options.userId,
      };

      // 发布消息
      await this.messagingService.publish(topic, messageData);

      // 缓存消息（如果启用）
      if (this.config.enableCache) {
        await this.cacheMessage(messageId, messageData);
      }

      this.logger.debug(`发布消息成功: ${topic}`, {
        messageId,
        messageType,
        topic,
      });
    } catch (error) {
      this.logger.error(`发布消息失败: ${topic}`, error, {
        messageType: options.messageType,
        topic,
      });
      throw error;
    }
  }

  /**
   * 批量发布消息
   *
   * @param topic - 主题名称
   * @param messages - 消息列表
   * @param options - 发布选项
   */
  async publishBatch(
    topic: string,
    messages: any[],
    options: {
      messageType?: string;
      metadata?: Record<string, any>;
      tenantId?: string;
      userId?: string;
      ttl?: number;
    } = {}
  ): Promise<void> {
    try {
      const messageDataList: IMessage[] = messages.map((message, index) => {
        const messageId = this.generateMessageId();
        const messageType =
          options.messageType || message.constructor?.name || 'Unknown';

        return {
          messageId,
          messageType,
          payload: this.serializeMessage(message),
          metadata: {
            ...options.metadata,
            tenantId: options.tenantId,
            userId: options.userId,
            timestamp: new Date(),
            batchIndex: index,
          },
          timestamp: new Date(),
          expiresAt: options.ttl
            ? new Date(Date.now() + options.ttl)
            : undefined,
          retryCount: 0,
          tenantId: options.tenantId,
          userId: options.userId,
        };
      });

      // 批量发布消息
      // 批量发布消息 - 使用循环调用单个发布方法
      for (const messageData of messageDataList) {
        await this.messagingService.publish(topic, messageData);
      }

      // 缓存消息（如果启用）
      if (this.config.enableCache) {
        for (const messageData of messageDataList) {
          await this.cacheMessage(messageData.messageId, messageData);
        }
      }

      this.logger.debug(`批量发布消息成功: ${topic}`, {
        messageCount: messages.length,
        topic,
      });
    } catch (error) {
      this.logger.error(`批量发布消息失败: ${topic}`, error, {
        messageCount: messages.length,
        topic,
      });
      throw error;
    }
  }

  /**
   * 订阅消息
   *
   * @param topic - 主题名称
   * @param handler - 消息处理器
   * @param options - 订阅选项
   */
  async subscribe(
    topic: string,
    handler: IMessageHandler,
    options: IMessageSubscriptionOptions = {
      queueName: topic,
      autoAck: true,
      exclusive: false,
      durable: true,
      prefetchCount: 1,
      messageTtl: this.config.messageTtl,
    }
  ): Promise<void> {
    try {
      // 注册处理器
      this.handlers.set(handler.handlerName, handler);

      // 订阅消息
      await this.messagingService.subscribe(
        topic,
        async (message: IMessage) => {
          try {
            // 检查消息是否过期
            if (message.expiresAt && message.expiresAt < new Date()) {
              this.logger.warn(`消息已过期: ${message.messageId}`, {
                messageId: message.messageId,
                expiresAt: message.expiresAt,
              });
              return;
            }

            // 处理消息
            await handler.handle(message);

            // 自动确认消息
            if (options.autoAck) {
              await this.ackMessage(message.messageId);
            }

            this.logger.debug(`处理消息成功: ${message.messageId}`, {
              messageId: message.messageId,
              messageType: message.messageType,
              handlerName: handler.handlerName,
            });
          } catch (error) {
            this.logger.error(`处理消息失败: ${message.messageId}`, error, {
              messageId: message.messageId,
              messageType: message.messageType,
              handlerName: handler.handlerName,
            });

            // 错误处理
            if (handler.onError) {
              await handler.onError(error as Error, message);
            }

            // 重试逻辑
            if (
              this.config.enableRetry &&
              message.retryCount < this.config.maxRetries
            ) {
              await this.retryMessage(message, options);
            } else {
              // 发送到死信队列
              if (this.config.enableDeadLetterQueue) {
                await this.sendToDeadLetterQueue(message, error as Error);
              }
            }
          }
        }
      );

      this.logger.debug(`订阅消息成功: ${topic}`, {
        topic,
        handlerName: handler.handlerName,
        options,
      });
    } catch (error) {
      this.logger.error(`订阅消息失败: ${topic}`, error, {
        topic,
        handlerName: handler.handlerName,
      });
      throw error;
    }
  }

  /**
   * 取消订阅
   *
   * @param topic - 主题名称
   * @param handlerName - 处理器名称
   */
  async unsubscribe(topic: string, handlerName: string): Promise<void> {
    try {
      // 移除处理器
      this.handlers.delete(handlerName);

      // 取消订阅
      await this.messagingService.unsubscribe(topic);

      this.logger.debug(`取消订阅成功: ${topic}`, {
        topic,
        handlerName,
      });
    } catch (error) {
      this.logger.error(`取消订阅失败: ${topic}`, error, {
        topic,
        handlerName,
      });
      throw error;
    }
  }

  /**
   * 确认消息
   *
   * @param messageId - 消息ID
   */
  async ackMessage(messageId: string): Promise<void> {
    try {
      // 确认消息 - 使用兼容性检查
      if (typeof (this.messagingService as any).ack === 'function') {
        await (this.messagingService as any).ack(messageId);
      } else {
        console.warn('MessagingService不支持ack方法');
      }

      // 清除缓存
      if (this.config.enableCache) {
        await this.clearMessageCache(messageId);
      }

      this.logger.debug(`确认消息成功: ${messageId}`);
    } catch (error) {
      this.logger.error(`确认消息失败: ${messageId}`, error);
      throw error;
    }
  }

  /**
   * 拒绝消息
   *
   * @param messageId - 消息ID
   * @param requeue - 是否重新入队
   */
  async nackMessage(messageId: string, requeue = false): Promise<void> {
    try {
      // 拒绝消息 - 使用兼容性检查
      if (typeof (this.messagingService as any).nack === 'function') {
        await (this.messagingService as any).nack(messageId, requeue);
      } else {
        console.warn('MessagingService不支持nack方法');
      }

      this.logger.debug(`拒绝消息成功: ${messageId}`, {
        messageId,
        requeue,
      });
    } catch (error) {
      this.logger.error(`拒绝消息失败: ${messageId}`, error);
      throw error;
    }
  }

  /**
   * 获取队列统计信息
   *
   * @param topic - 主题名称
   * @returns 队列统计信息
   */
  async getQueueStatistics(topic: string): Promise<{
    messageCount: number;
    consumerCount: number;
    publishedCount: number;
    consumedCount: number;
    errorCount: number;
  }> {
    try {
      // 获取队列统计信息 - 使用兼容性检查
      if (typeof (this.messagingService as any).getQueueStats === 'function') {
        return await (this.messagingService as any).getQueueStats(topic);
      } else {
        console.warn('MessagingService不支持getQueueStats方法');
        return {
          messageCount: 0,
          consumerCount: 0,
          publishedCount: 0,
          consumedCount: 0,
          errorCount: 0,
        };
      }
    } catch (error) {
      this.logger.error(`获取队列统计信息失败: ${topic}`, error);
      throw error;
    }
  }

  /**
   * 清理过期消息
   *
   * @returns 清理的消息数量
   */
  async cleanupExpiredMessages(): Promise<number> {
    try {
      // 这里需要根据具体的消息队列实现来清理过期消息
      // 实际实现中需要调用消息队列服务的清理方法
      return 0;
    } catch (error) {
      this.logger.error('清理过期消息失败', error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 序列化消息
   */
  private serializeMessage(message: any): any {
    let data = message;

    if (this.config.enableCompression) {
      data = this.compressData(data);
    }

    if (this.config.enableEncryption) {
      data = this.encryptData(data);
    }

    return data;
  }

  /**
   * 反序列化消息
   */
  private deserializeMessage(data: any): any {
    let message = data;

    if (this.config.enableEncryption) {
      message = this.decryptData(message);
    }

    if (this.config.enableCompression) {
      message = this.decompressData(message);
    }

    return message;
  }

  /**
   * 压缩数据
   */
  private compressData(data: any): any {
    // 实现数据压缩逻辑
    return data;
  }

  /**
   * 解压缩数据
   */
  private decompressData(data: any): any {
    // 实现数据解压缩逻辑
    return data;
  }

  /**
   * 加密数据
   */
  private encryptData(data: any): any {
    // 实现数据加密逻辑
    return data;
  }

  /**
   * 解密数据
   */
  private decryptData(data: any): any {
    // 实现数据解密逻辑
    return data;
  }

  /**
   * 重试消息
   */
  private async retryMessage(
    message: IMessage,
    options: IMessageSubscriptionOptions
  ): Promise<void> {
    const retryMessage = {
      ...message,
      retryCount: message.retryCount + 1,
    };

    // 延迟重试
    await this.delay(this.config.retryDelay * message.retryCount);

    // 重新发布消息
    await this.publish(options.queueName, retryMessage.payload, {
      messageType: message.messageType,
      metadata: message.metadata,
      tenantId: message.tenantId,
      userId: message.userId,
    });

    this.logger.debug(`重试消息: ${message.messageId}`, {
      messageId: message.messageId,
      retryCount: retryMessage.retryCount,
    });
  }

  /**
   * 发送到死信队列
   */
  private async sendToDeadLetterQueue(
    message: IMessage,
    error: Error
  ): Promise<void> {
    const deadLetterMessage = {
      ...message,
      metadata: {
        ...message.metadata,
        originalError: error.message,
        deadLetterTimestamp: new Date(),
      },
    };

    await this.publish('dead-letter-queue', deadLetterMessage.payload, {
      messageType: `DeadLetter:${message.messageType}`,
      metadata: deadLetterMessage.metadata,
      tenantId: message.tenantId,
      userId: message.userId,
    });

    this.logger.warn(`发送到死信队列: ${message.messageId}`, {
      messageId: message.messageId,
      error: error.message,
    });
  }

  /**
   * 延迟执行
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 缓存消息
   */
  private async cacheMessage(
    messageId: string,
    message: IMessage
  ): Promise<void> {
    const cacheKey = this.getMessageCacheKey(messageId);
    await this.cacheService.set(cacheKey, message, this.config.cacheTtl);
  }

  /**
   * 清除消息缓存
   */
  private async clearMessageCache(messageId: string): Promise<void> {
    const cacheKey = this.getMessageCacheKey(messageId);
    await this.cacheService.delete(cacheKey);
  }

  /**
   * 获取消息缓存键
   */
  private getMessageCacheKey(messageId: string): string {
    return `message:${messageId}`;
  }
}
