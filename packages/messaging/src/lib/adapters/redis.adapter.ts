import Redis from 'ioredis';
import { BaseAdapter } from './base.adapter';
import {
  MessagingAdapterType,
  MessageHandler,
  PublishOptions,
  SendOptions,
  QueueOptions,
  QueueInfo,
  RedisConfig,
} from '../types/messaging.types';

/**
 * Redis消息队列适配器
 *
 * 基于ioredis的Redis消息队列实现
 * 使用Redis Streams和Pub/Sub实现消息传递
 *
 * @description Redis适配器提供高性能的消息队列功能
 * 支持Redis Streams、Pub/Sub、列表等多种消息传递模式
 *
 * @example
 * ```typescript
 * const config = {
 *   host: 'localhost',
 *   port: 6379,
 *   db: 1,
 *   streamPrefix: 'hl8_stream_'
 * };
 * const adapter = new RedisAdapter(config);
 * await adapter.connect();
 * ```
 */
export class RedisAdapter extends BaseAdapter {
  private redis?: Redis;
  private subscribers: Map<string, Redis> = new Map(); // topic -> subscriber instance
  private consumers: Map<string, string> = new Map(); // queue -> consumer group

  constructor(private readonly config: RedisConfig) {
    super(MessagingAdapterType.REDIS);
  }

  /**
   * 连接到Redis
   *
   * @description 建立与Redis服务器的连接
   *
   * @throws {Error} 连接失败时抛出错误
   */
  async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
        ...this.config.options,
      });

      // 设置连接事件监听
      this.redis.on('error', (error) => {
        this.setConnectionError(error.message);
      });

      this.redis.on('connect', () => {
        this.setConnected(true);
      });

      this.redis.on('close', () => {
        this.setConnected(false);
      });

      // 测试连接
      await this.redis.ping();
      this.setConnected(true);
    } catch (error) {
      this.setConnectionError((error as Error).message);
      throw error;
    }
  }

  /**
   * 断开Redis连接
   *
   * @description 关闭与Redis服务器的连接
   *
   * @throws {Error} 断开连接失败时抛出错误
   */
  async disconnect(): Promise<void> {
    try {
      // 关闭所有订阅者
      for (const [_topic, subscriber] of this.subscribers) {
        await subscriber.quit();
      }
      this.subscribers.clear();

      // 关闭主连接
      if (this.redis) {
        await this.redis.quit();
        this.redis = undefined;
      }

      this.setConnected(false);
    } catch (error) {
      this.setConnectionError((error as Error).message);
      throw error;
    }
  }

  /**
   * 发布消息到主题
   *
   * @description 将消息发布到Redis频道
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
      const messageData = JSON.stringify({
        id: this.generateMessageId(),
        data: message,
        timestamp: Date.now(),
        headers: options?.headers || {},
      });

      const channel = `${this.config.streamPrefix}${topic}`;
      const published = await this.redis!.publish(channel, messageData);

      if (published === 0) {
        throw new Error(`No subscribers for topic ${topic}`);
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
   * @description 订阅Redis频道的消息
   *
   * @param topic 主题名称
   * @param handler 消息处理器
   * @throws {Error} 订阅失败时抛出错误
   */
  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const channel = `${this.config.streamPrefix}${topic}`;

      // 创建专用的订阅者连接
      const subscriber = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
        ...this.config.options,
      });

      // 订阅频道
      await subscriber.subscribe(channel);

      // 设置消息处理
      subscriber.on('message', async (receivedChannel, messageData) => {
        if (receivedChannel === channel) {
          try {
            const message = JSON.parse(messageData);
            await handler(message.data);
          } catch (error) {
            console.error(
              `Error processing message for topic ${topic}:`,
              error
            );
          }
        }
      });

      // 保存订阅者
      this.subscribers.set(topic, subscriber);
    } catch (error) {
      throw new Error(
        `Failed to subscribe to topic ${topic}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消订阅主题消息
   *
   * @description 取消订阅Redis频道的消息
   *
   * @param topic 主题名称
   * @param handler 可选的特定处理器
   * @throws {Error} 取消订阅失败时抛出错误
   */
  override async unsubscribe(
    topic: string,
    _handler?: MessageHandler<unknown>
  ): Promise<void> {
    this.validateConnection();

    try {
      const subscriber = this.subscribers.get(topic);
      if (subscriber) {
        const channel = `${this.config.streamPrefix}${topic}`;
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
        this.subscribers.delete(topic);
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
   * @description 将消息发送到Redis列表队列
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
      const messageData = JSON.stringify({
        id: this.generateMessageId(),
        data: message,
        timestamp: Date.now(),
        headers: options?.headers || {},
      });

      const queueKey = `${this.config.streamPrefix}${queue}`;

      // 如果有延迟，使用延迟队列
      if (options?.delay) {
        const delayScore = Date.now() + options.delay;
        await this.redis!.zadd(`${queueKey}:delayed`, delayScore, messageData);

        // 启动延迟处理
        this.processDelayedMessages(queue);
      } else {
        await this.redis!.lpush(queueKey, messageData);
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
   * @description 消费Redis列表队列的消息
   *
   * @param queue 队列名称
   * @param handler 消息处理器
   * @throws {Error} 消费失败时抛出错误
   */
  async consume<T>(queue: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const queueKey = `${this.config.streamPrefix}${queue}`;
      const consumerGroup = `consumer_${Date.now()}`;

      // 创建消费者组（如果不存在）
      try {
        await this.redis!.xgroup(
          'CREATE',
          queueKey,
          consumerGroup,
          '0',
          'MKSTREAM'
        );
      } catch (_error) {
        // 消费者组可能已存在，忽略错误
      }

      // 保存消费者组
      this.consumers.set(queue, consumerGroup);

      // 启动消息消费循环
      this.consumeMessages(queue, handler);
    } catch (error) {
      throw new Error(
        `Failed to consume from queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消队列消费者
   *
   * @description 取消Redis队列的消费者
   *
   * @param queue 队列名称
   * @throws {Error} 取消消费者失败时抛出错误
   */
  override async cancelConsumer(queue: string): Promise<void> {
    this.validateConnection();

    try {
      this.consumers.delete(queue);
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
   * @description 创建Redis队列
   *
   * @param queue 队列名称
   * @param options 队列选项
   * @throws {Error} 创建队列失败时抛出错误
   */
  async createQueue(queue: string, options?: QueueOptions): Promise<void> {
    this.validateConnection();

    try {
      const queueKey = `${this.config.streamPrefix}${queue}`;

      // 创建流
      await this.redis!.xadd(queueKey, '*', 'init', 'queue_created');

      // 设置过期时间
      if (options?.queueTtl) {
        await this.redis!.expire(queueKey, Math.floor(options.queueTtl / 1000));
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
   * @description 删除Redis队列
   *
   * @param queue 队列名称
   * @throws {Error} 删除队列失败时抛出错误
   */
  async deleteQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      const queueKey = `${this.config.streamPrefix}${queue}`;
      await this.redis!.del(queueKey);
      await this.redis!.del(`${queueKey}:delayed`);
    } catch (error) {
      throw new Error(
        `Failed to delete queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 清空队列
   *
   * @description 清空Redis队列中的所有消息
   *
   * @param queue 队列名称
   * @throws {Error} 清空队列失败时抛出错误
   */
  override async purgeQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      const queueKey = `${this.config.streamPrefix}${queue}`;
      await this.redis!.del(queueKey);
    } catch (error) {
      throw new Error(
        `Failed to purge queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取队列信息
   *
   * @description 获取Redis队列的详细信息
   *
   * @param queue 队列名称
   * @returns 队列信息
   * @throws {Error} 获取队列信息失败时抛出错误
   */
  async getQueueInfo(queue: string): Promise<QueueInfo> {
    this.validateConnection();

    try {
      const queueKey = `${this.config.streamPrefix}${queue}`;
      const streamInfo = await this.redis!.xinfo('STREAM', queueKey);

      const messageCount = (streamInfo as any)[1] as number; // length
      const consumerCount = this.consumers.has(queue) ? 1 : 0;

      return {
        name: queue,
        messageCount,
        consumerCount,
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
   * 消费消息
   *
   * @description 持续消费队列中的消息
   *
   * @param queue 队列名称
   * @param handler 消息处理器
   *
   * @private
   */
  private async consumeMessages<T>(
    queue: string,
    handler: MessageHandler<T>
  ): Promise<void> {
    const queueKey = `${this.config.streamPrefix}${queue}`;
    const consumerGroup = this.consumers.get(queue);

    if (!consumerGroup) return;

    try {
      while (this.consumers.has(queue)) {
        // 读取消息
        const messages = await this.redis!.xreadgroup(
          'GROUP',
          consumerGroup,
          'consumer',
          'COUNT',
          1,
          'BLOCK',
          1000,
          'STREAMS',
          queueKey,
          '>'
        );

        if (messages && messages.length > 0) {
          for (const [_stream, streamMessages] of messages as any) {
            for (const [messageId, fields] of streamMessages) {
              try {
                // 解析消息
                const messageData = JSON.parse(fields[1]);
                await handler(messageData.data);

                // 确认消息
                await this.redis!.xack(queueKey, consumerGroup, messageId);
              } catch (error) {
                console.error(
                  `Error processing message in queue ${queue}:`,
                  error
                );
                // 消息处理失败时不确认，以便重试
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error consuming messages from queue ${queue}:`, error);
    }
  }

  /**
   * 处理延迟消息
   *
   * @description 处理延迟队列中的消息
   *
   * @param queue 队列名称
   *
   * @private
   */
  private async processDelayedMessages(queue: string): Promise<void> {
    const queueKey = `${this.config.streamPrefix}${queue}`;
    const delayedKey = `${queueKey}:delayed`;

    try {
      while (this.consumers.has(queue)) {
        const now = Date.now();

        // 获取到期的延迟消息
        const delayedMessages = await this.redis!.zrangebyscore(
          delayedKey,
          0,
          now,
          'LIMIT',
          0,
          10
        );

        if (delayedMessages.length > 0) {
          // 将延迟消息移动到主队列
          for (const message of delayedMessages) {
            await this.redis!.lpush(queueKey, message);
            await this.redis!.zrem(delayedKey, message);
          }
        }

        // 等待一段时间再检查
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(
        `Error processing delayed messages for queue ${queue}:`,
        error
      );
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

  /**
   * 获取适配器名称
   *
   * @returns 适配器名称
   *
   * @protected
   */
  protected override getAdapterName(): string {
    return 'Redis';
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
    return '基于Redis的高性能消息队列适配器';
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
      host: this.config.host,
      port: this.config.port,
      db: this.config.db,
      streamPrefix: this.config.streamPrefix,
      subscribers: this.subscribers.size,
      consumers: this.consumers.size,
    };
  }
}
