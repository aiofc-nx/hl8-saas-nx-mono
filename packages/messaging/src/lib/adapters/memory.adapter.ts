import { BaseAdapter } from './base.adapter';
import {
  MessagingAdapterType,
  MessageHandler,
  PublishOptions,
  SendOptions,
  QueueOptions,
  QueueInfo,
  Message,
} from '../types/messaging.types';

/**
 * 内存消息队列适配器
 *
 * 基于内存的消息队列实现，用于开发和测试环境
 * 支持主题发布/订阅和队列操作
 *
 * @description 内存适配器提供轻量级的消息队列功能
 * 适用于开发、测试和演示场景
 *
 * @example
 * ```typescript
 * const adapter = new MemoryAdapter();
 * await adapter.connect();
 *
 * // 发布消息
 * await adapter.publish('user.created', { userId: '123' });
 *
 * // 订阅消息
 * await adapter.subscribe('user.created', (message) => {
 *   console.log('收到消息:', message);
 * });
 * ```
 */
export class MemoryAdapter extends BaseAdapter {
  private topics: Map<string, MessageHandler<unknown>[]> = new Map();
  private queues: Map<string, Message[]> = new Map();
  private queueHandlers: Map<string, MessageHandler<unknown>[]> = new Map();

  constructor() {
    super(MessagingAdapterType.MEMORY);
  }

  /**
   * 连接到内存消息队列
   *
   * @description 内存适配器不需要实际连接，直接设置为已连接状态
   *
   * @throws {Error} 连接失败时抛出错误
   */
  async connect(): Promise<void> {
    try {
      this.setConnected(true);
    } catch (error) {
      this.setConnectionError((error as Error).message);
      throw error;
    }
  }

  /**
   * 断开内存消息队列连接
   *
   * @description 清理内存中的消息和处理器
   *
   * @throws {Error} 断开连接失败时抛出错误
   */
  async disconnect(): Promise<void> {
    try {
      // 清理所有数据
      this.topics.clear();
      this.queues.clear();
      this.queueHandlers.clear();
      this.setConnected(false);
    } catch (error) {
      this.setConnectionError((error as Error).message);
      throw error;
    }
  }

  /**
   * 发布消息到主题
   *
   * @description 将消息发布到指定主题，立即通知所有订阅者
   *
   * @param topic 主题名称
   * @param message 消息内容
   * @param options 发布选项
   * @throws {Error} 发布失败时抛出错误
   */
  async publish<T>(
    topic: string,
    message: T,
    options?: PublishOptions
  ): Promise<void> {
    this.validateConnection();

    try {
      const handlers = this.topics.get(topic) || [];
      const messageObj: Message<T> = {
        id: this.generateMessageId(),
        data: message,
        timestamp: new Date(),
        headers: options?.headers || {},
        type: options?.adapter?.toString(),
      };

      // 立即通知所有订阅者
      for (const handler of handlers) {
        try {
          await handler(messageObj.data);
        } catch (error) {
          console.error(`Error in message handler for topic ${topic}:`, error);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to publish message to topic ${topic}: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * 订阅主题消息
   *
   * @description 订阅指定主题的消息
   *
   * @param topic 主题名称
   * @param handler 消息处理器
   * @throws {Error} 订阅失败时抛出错误
   */
  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const handlers = this.topics.get(topic) || [];
      handlers.push(handler as MessageHandler<unknown>);
      this.topics.set(topic, handlers);
    } catch (error) {
      throw new Error(
        `Failed to subscribe to topic ${topic}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消订阅主题消息
   *
   * @description 取消订阅指定主题的消息
   *
   * @param topic 主题名称
   * @param handler 可选的特定处理器
   * @throws {Error} 取消订阅失败时抛出错误
   */
  override async unsubscribe(
    topic: string,
    handler?: MessageHandler<unknown>
  ): Promise<void> {
    this.validateConnection();

    try {
      if (handler) {
        const handlers = this.topics.get(topic) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
          this.topics.set(topic, handlers);
        }
      } else {
        this.topics.delete(topic);
      }
    } catch (error) {
      throw new Error(
        `Failed to unsubscribe from topic ${topic}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 发送消息到队列
   *
   * @description 将消息发送到指定队列
   *
   * @param queue 队列名称
   * @param message 消息内容
   * @param options 发送选项
   * @throws {Error} 发送失败时抛出错误
   */
  async sendToQueue<T>(
    queue: string,
    message: T,
    options?: SendOptions
  ): Promise<void> {
    this.validateConnection();

    try {
      const messages = this.queues.get(queue) || [];
      const messageObj: Message<T> = {
        id: this.generateMessageId(),
        data: message,
        timestamp: new Date(),
        headers: options?.headers || {},
        type: options?.adapter?.toString(),
      };

      messages.push(messageObj);
      this.queues.set(queue, messages);

      // 如果有延迟，使用setTimeout
      if (options?.delay) {
        setTimeout(() => {
          this.processQueueMessage(queue, messageObj);
        }, options.delay);
      } else {
        // 立即处理消息
        this.processQueueMessage(queue, messageObj);
      }
    } catch (error) {
      throw new Error(
        `Failed to send message to queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 消费队列消息
   *
   * @description 消费指定队列的消息
   *
   * @param queue 队列名称
   * @param handler 消息处理器
   * @throws {Error} 消费失败时抛出错误
   */
  async consume<T>(queue: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const handlers = this.queueHandlers.get(queue) || [];
      handlers.push(handler as MessageHandler<unknown>);
      this.queueHandlers.set(queue, handlers);
    } catch (error) {
      throw new Error(
        `Failed to consume from queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消队列消费者
   *
   * @description 取消指定队列的消费者
   *
   * @param queue 队列名称
   * @throws {Error} 取消消费者失败时抛出错误
   */
  override async cancelConsumer(queue: string): Promise<void> {
    this.validateConnection();

    try {
      this.queueHandlers.delete(queue);
    } catch (error) {
      throw new Error(
        `Failed to cancel consumer for queue ${queue}: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * 创建队列
   *
   * @description 创建指定名称的队列
   *
   * @param queue 队列名称
   * @param options 队列选项
   * @throws {Error} 创建队列失败时抛出错误
   */
  async createQueue(queue: string, _options?: QueueOptions): Promise<void> {
    this.validateConnection();

    try {
      if (!this.queues.has(queue)) {
        this.queues.set(queue, []);
      }
    } catch (error) {
      throw new Error(
        `Failed to create queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 删除队列
   *
   * @description 删除指定名称的队列
   *
   * @param queue 队列名称
   * @throws {Error} 删除队列失败时抛出错误
   */
  async deleteQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      this.queues.delete(queue);
      this.queueHandlers.delete(queue);
    } catch (error) {
      throw new Error(
        `Failed to delete queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 清空队列
   *
   * @description 清空指定队列中的所有消息
   *
   * @param queue 队列名称
   * @throws {Error} 清空队列失败时抛出错误
   */
  override async purgeQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      this.queues.set(queue, []);
    } catch (error) {
      throw new Error(
        `Failed to purge queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取队列信息
   *
   * @description 获取指定队列的详细信息
   *
   * @param queue 队列名称
   * @returns 队列信息
   * @throws {Error} 获取队列信息失败时抛出错误
   */
  async getQueueInfo(queue: string): Promise<QueueInfo> {
    this.validateConnection();

    try {
      const messages = this.queues.get(queue) || [];
      const handlers = this.queueHandlers.get(queue) || [];

      return {
        name: queue,
        messageCount: messages.length,
        consumerCount: handlers.length,
        durable: true,
        exclusive: false,
        autoDelete: false,
      };
    } catch (error) {
      throw new Error(
        `Failed to get queue info for ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取适配器名称
   *
   * @returns 适配器名称
   *
   * @protected
   */
  protected override getAdapterName(): string {
    return 'Memory';
  }

  /**
   * 获取适配器版本
   *
   * @returns 适配器版本
   *
   * @protected
   */
  protected override getAdapterVersion(): string {
    return '1.0.0';
  }

  /**
   * 获取适配器描述
   *
   * @returns 适配器描述
   *
   * @protected
   */
  protected override getAdapterDescription(): string {
    return '基于内存的消息队列适配器，适用于开发和测试环境';
  }

  /**
   * 获取适配器配置
   *
   * @returns 适配器配置
   *
   * @protected
   */
  protected override getAdapterConfig(): Record<string, unknown> {
    return {
      topics: Array.from(this.topics.keys()),
      queues: Array.from(this.queues.keys()),
    };
  }

  /**
   * 处理队列消息
   *
   * @description 处理队列中的消息，通知所有消费者
   *
   * @param queue 队列名称
   * @param message 消息对象
   *
   * @private
   */
  private async processQueueMessage(
    queue: string,
    message: Message
  ): Promise<void> {
    const handlers = this.queueHandlers.get(queue) || [];

    for (const handler of handlers) {
      try {
        await handler(message.data);

        // 从队列中移除已处理的消息
        const messages = this.queues.get(queue) || [];
        const index = messages.findIndex((m) => m.id === message.id);
        if (index > -1) {
          messages.splice(index, 1);
          this.queues.set(queue, messages);
        }
      } catch (error) {
        console.error(`Error processing message in queue ${queue}:`, error);
        // 消息处理失败时不从队列中移除，以便重试
      }
    }
  }

  /**
   * 生成消息ID
   *
   * @description 生成唯一的消息标识符
   *
   * @returns 消息ID
   *
   * @private
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
