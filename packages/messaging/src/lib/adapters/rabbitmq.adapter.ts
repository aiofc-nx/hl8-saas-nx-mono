import * as amqp from 'amqplib';
import { BaseAdapter } from './base.adapter';
import {
  MessagingAdapterType,
  MessageHandler,
  PublishOptions,
  SendOptions,
  QueueOptions,
  QueueInfo,
  RabbitMQConfig,
} from '../types/messaging.types';

/**
 * RabbitMQ消息队列适配器
 *
 * 基于amqplib的RabbitMQ消息队列实现
 * 支持主题发布/订阅和队列操作
 *
 * @description RabbitMQ适配器提供企业级消息队列功能
 * 支持消息持久化、确认机制、死信队列等高级特性
 *
 * @example
 * ```typescript
 * const config = {
 *   url: 'amqp://localhost:5672',
 *   exchange: 'hl8_saas',
 *   queuePrefix: 'hl8_'
 * };
 * const adapter = new RabbitMQAdapter(config);
 * await adapter.connect();
 * ```
 */
export class RabbitMQAdapter extends BaseAdapter {
  private connection?: amqp.Connection;
  private channel?: amqp.Channel;
  private consumers: Map<string, string> = new Map(); // topic/queue -> consumerTag

  constructor(private readonly config: RabbitMQConfig) {
    super(MessagingAdapterType.RABBITMQ);
  }

  /**
   * 连接到RabbitMQ
   *
   * @description 建立与RabbitMQ服务器的连接和通道
   *
   * @throws {Error} 连接失败时抛出错误
   */
  async connect(): Promise<void> {
    try {
      this.connection = (await amqp.connect(
        this.config.url,
        this.config.options
      )) as any;
      this.channel = await (this.connection as any).createChannel();

      // 设置连接事件监听
      (this.connection as any).on('error', (error: Error) => {
        this.setConnectionError(error.message);
      });

      (this.connection as any).on('close', () => {
        this.setConnected(false);
      });

      // 设置通道事件监听
      (this.channel as any).on('error', (error: Error) => {
        this.setConnectionError(error.message);
      });

      (this.channel as any).on('close', () => {
        this.setConnected(false);
      });

      // 声明默认交换器
      await (this.channel as any).assertExchange(
        this.config.exchange,
        'topic',
        {
          durable: true,
        }
      );

      this.setConnected(true);
    } catch (error) {
      this.setConnectionError((error as Error).message);
      throw error;
    }
  }

  /**
   * 断开RabbitMQ连接
   *
   * @description 关闭与RabbitMQ服务器的连接和通道
   *
   * @throws {Error} 断开连接失败时抛出错误
   */
  async disconnect(): Promise<void> {
    try {
      // 取消所有消费者
      for (const [_key, consumerTag] of this.consumers) {
        if (this.channel) {
          await this.channel.cancel(consumerTag);
        }
      }
      this.consumers.clear();

      // 关闭通道
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      // 关闭连接
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = undefined;
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
   * @description 将消息发布到RabbitMQ交换器
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
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const routingKey = options?.routingKey || topic;
      const publishOptions: amqp.Options.Publish = {
        expiration: options?.expiration,
        priority: options?.priority,
        persistent: options?.persistent !== false,
        headers: options?.headers,
        mandatory: options?.mandatory || false,
      };

      const published = this.channel!.publish(
        this.config.exchange,
        routingKey,
        messageBuffer,
        publishOptions
      );

      if (options?.mandatory && !published) {
        throw new Error(`Message could not be routed for topic ${topic}`);
      }

      // 等待确认
      if (options?.ack) {
        await (this.channel as any).waitForConfirms();
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
   * @description 订阅RabbitMQ交换器的消息
   *
   * @param topic 主题名称
   * @param handler 消息处理器
   * @throws {Error} 订阅失败时抛出错误
   */
  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const queueName = `${this.config.queuePrefix}${topic}`;

      // 声明队列
      const queue = await this.channel!.assertQueue(queueName, {
        durable: true,
        exclusive: false,
        autoDelete: false,
      });

      // 绑定队列到交换器
      await this.channel!.bindQueue(queue.queue, this.config.exchange, topic);

      // 设置消费者
      const consumer = await this.channel!.consume(
        queue.queue,
        async (msg) => {
          if (msg) {
            try {
              const messageData = JSON.parse(msg.content.toString());
              await handler(messageData);

              // 确认消息
              this.channel!.ack(msg);
            } catch (error) {
              console.error(
                `Error processing message for topic ${topic}:`,
                error
              );
              // 拒绝消息并重新入队
              this.channel!.nack(msg, false, true);
            }
          }
        },
        {
          noAck: false,
        }
      );

      // 保存消费者标签
      this.consumers.set(topic, consumer.consumerTag);
    } catch (error) {
      throw new Error(
        `Failed to subscribe to topic ${topic}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消订阅主题消息
   *
   * @description 取消订阅RabbitMQ交换器的消息
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
      const consumerTag = this.consumers.get(topic);
      if (consumerTag) {
        await this.channel!.cancel(consumerTag);
        this.consumers.delete(topic);
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
   * @description 将消息发送到RabbitMQ队列
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
      const queueName = `${this.config.queuePrefix}${queue}`;
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const sendOptions: amqp.Options.Publish = {
        expiration: options?.expiration,
        priority: options?.priority,
        persistent: options?.persistent !== false,
        headers: options?.headers,
        mandatory: options?.mandatory || false,
      };

      // 如果有延迟，使用延迟插件
      if (options?.delay) {
        sendOptions.headers = {
          ...sendOptions.headers,
          'x-delay': options.delay,
        };
      }

      const published = this.channel!.sendToQueue(
        queueName,
        messageBuffer,
        sendOptions
      );

      if (options?.mandatory && !published) {
        throw new Error(`Message could not be routed to queue ${queue}`);
      }

      // 等待确认
      if (options?.ack) {
        await (this.channel as any).waitForConfirms();
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
   * @description 消费RabbitMQ队列的消息
   *
   * @param queue 队列名称
   * @param handler 消息处理器
   * @throws {Error} 消费失败时抛出错误
   */
  async consume<T>(queue: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const queueName = `${this.config.queuePrefix}${queue}`;

      // 声明队列
      await this.channel!.assertQueue(queueName, {
        durable: true,
        exclusive: false,
        autoDelete: false,
      });

      // 设置消费者
      const consumer = await this.channel!.consume(
        queueName,
        async (msg) => {
          if (msg) {
            try {
              const messageData = JSON.parse(msg.content.toString());
              await handler(messageData);

              // 确认消息
              this.channel!.ack(msg);
            } catch (error) {
              console.error(
                `Error processing message in queue ${queue}:`,
                error
              );
              // 拒绝消息并重新入队
              this.channel!.nack(msg, false, true);
            }
          }
        },
        {
          noAck: false,
        }
      );

      // 保存消费者标签
      this.consumers.set(queue, consumer.consumerTag);
    } catch (error) {
      throw new Error(
        `Failed to consume from queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消队列消费者
   *
   * @description 取消RabbitMQ队列的消费者
   *
   * @param queue 队列名称
   * @throws {Error} 取消消费者失败时抛出错误
   */
  override async cancelConsumer(queue: string): Promise<void> {
    this.validateConnection();

    try {
      const consumerTag = this.consumers.get(queue);
      if (consumerTag) {
        await this.channel!.cancel(consumerTag);
        this.consumers.delete(queue);
      }
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
   * @description 创建RabbitMQ队列
   *
   * @param queue 队列名称
   * @param options 队列选项
   * @throws {Error} 创建队列失败时抛出错误
   */
  async createQueue(queue: string, options?: QueueOptions): Promise<void> {
    this.validateConnection();

    try {
      const queueName = `${this.config.queuePrefix}${queue}`;

      await this.channel!.assertQueue(queueName, {
        durable: options?.durable !== false,
        exclusive: options?.exclusive || false,
        autoDelete: options?.autoDelete || false,
        arguments: {
          'x-message-ttl': options?.messageTtl,
          'x-expires': options?.queueTtl,
          'x-max-length': options?.maxLength,
          'x-max-length-bytes': options?.maxBytes,
          'x-dead-letter-exchange': options?.deadLetterExchange,
          'x-dead-letter-routing-key': options?.deadLetterRoutingKey,
          ...options?.arguments,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to create queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 删除队列
   *
   * @description 删除RabbitMQ队列
   *
   * @param queue 队列名称
   * @throws {Error} 删除队列失败时抛出错误
   */
  async deleteQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      const queueName = `${this.config.queuePrefix}${queue}`;
      await this.channel!.deleteQueue(queueName);
    } catch (error) {
      throw new Error(
        `Failed to delete queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 清空队列
   *
   * @description 清空RabbitMQ队列中的所有消息
   *
   * @param queue 队列名称
   * @throws {Error} 清空队列失败时抛出错误
   */
  override async purgeQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      const queueName = `${this.config.queuePrefix}${queue}`;
      await this.channel!.purgeQueue(queueName);
    } catch (error) {
      throw new Error(
        `Failed to purge queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取队列信息
   *
   * @description 获取RabbitMQ队列的详细信息
   *
   * @param queue 队列名称
   * @returns 队列信息
   * @throws {Error} 获取队列信息失败时抛出错误
   */
  async getQueueInfo(queue: string): Promise<QueueInfo> {
    this.validateConnection();

    try {
      const queueName = `${this.config.queuePrefix}${queue}`;
      const queueInfo = await this.channel!.checkQueue(queueName);

      return {
        name: queue,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
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
    return 'RabbitMQ';
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
    return '基于RabbitMQ的企业级消息队列适配器';
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
      url: this.config.url,
      exchange: this.config.exchange,
      queuePrefix: this.config.queuePrefix,
      consumers: this.consumers.size,
    };
  }
}
