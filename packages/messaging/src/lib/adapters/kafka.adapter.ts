import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { BaseAdapter } from './base.adapter';
import {
  MessagingAdapterType,
  MessageHandler,
  PublishOptions,
  SendOptions,
  QueueOptions,
  QueueInfo,
  KafkaConfig,
} from '../types/messaging.types';

/**
 * Kafka消息队列适配器
 *
 * 基于kafkajs的Apache Kafka消息队列实现
 * 支持高吞吐量的消息流处理
 *
 * @description Kafka适配器提供高吞吐量的消息队列功能
 * 支持分区、副本、消费者组等Kafka高级特性
 *
 * @example
 * ```typescript
 * const config = {
 *   clientId: 'hl8-saas',
 *   brokers: ['localhost:9092'],
 *   topicPrefix: 'hl8_'
 * };
 * const adapter = new KafkaAdapter(config);
 * await adapter.connect();
 * ```
 */
export class KafkaAdapter extends BaseAdapter {
  private kafka?: Kafka;
  private producer?: Producer;
  private consumers: Map<string, Consumer> = new Map(); // topic/queue -> consumer

  constructor(private readonly config: KafkaConfig) {
    super(MessagingAdapterType.KAFKA);
  }

  /**
   * 连接到Kafka
   *
   * @description 建立与Kafka集群的连接和生产者
   *
   * @throws {Error} 连接失败时抛出错误
   */
  async connect(): Promise<void> {
    try {
      this.kafka = new Kafka({
        clientId: this.config.clientId,
        brokers: this.config.brokers,
        ...this.config.options,
      });

      // 创建生产者
      this.producer = this.kafka.producer();
      await this.producer.connect();

      // 设置生产者事件监听
      this.producer.on('producer.connect', () => {
        this.setConnected(true);
      });

      this.producer.on('producer.disconnect', () => {
        this.setConnected(false);
      });

      this.producer.on('producer.network.request_timeout', (error) => {
        this.setConnectionError(
          (error as unknown as Error).message || 'Unknown error'
        );
      });

      this.setConnected(true);
    } catch (error) {
      this.setConnectionError((error as Error).message);
      throw error;
    }
  }

  /**
   * 断开Kafka连接
   *
   * @description 关闭与Kafka集群的连接和生产者
   *
   * @throws {Error} 断开连接失败时抛出错误
   */
  async disconnect(): Promise<void> {
    try {
      // 断开所有消费者
      for (const [_key, consumer] of this.consumers) {
        await consumer.disconnect();
      }
      this.consumers.clear();

      // 断开生产者
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = undefined;
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
   * @description 将消息发布到Kafka主题
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
      const topicName = `${this.config.topicPrefix}${topic}`;
      const messageData = {
        key: options?.routingKey || this.generateMessageId(),
        value: JSON.stringify({
          id: this.generateMessageId(),
          data: message,
          timestamp: Date.now(),
          headers: (options?.headers || {}) as Record<string, string | Buffer>,
        }),
        headers: (options?.headers || {}) as Record<string, string | Buffer>,
        partition: options?.partition,
      };

      await this.producer!.send({
        topic: topicName,
        messages: [messageData],
      });
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
   * @description 订阅Kafka主题的消息
   *
   * @param topic 主题名称
   * @param handler 消息处理器
   * @throws {Error} 订阅失败时抛出错误
   */
  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const topicName = `${this.config.topicPrefix}${topic}`;

      // 创建消费者
      const consumer = this.kafka!.consumer({
        groupId: `${this.config.clientId}_${topic}`,
      });

      // 连接消费者
      await consumer.connect();

      // 订阅主题
      await consumer.subscribe({
        topic: topicName,
        fromBeginning: false,
      });

      // 设置消息处理
      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          try {
            const messageData = JSON.parse(
              payload.message.value?.toString() || '{}'
            );
            await handler(messageData.data);
          } catch (error) {
            console.error(
              `Error processing message for topic ${topic}:`,
              error
            );
          }
        },
      });

      // 保存消费者
      this.consumers.set(topic, consumer);
    } catch (error) {
      throw new Error(
        `Failed to subscribe to topic ${topic}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消订阅主题消息
   *
   * @description 取消订阅Kafka主题的消息
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
      const consumer = this.consumers.get(topic);
      if (consumer) {
        await consumer.disconnect();
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
   * @description 将消息发送到Kafka队列主题
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
      const topicName = `${this.config.topicPrefix}queue_${queue}`;
      const messageData = {
        key: this.generateMessageId(),
        value: JSON.stringify({
          id: this.generateMessageId(),
          data: message,
          timestamp: Date.now(),
          headers: (options?.headers || {}) as Record<string, string | Buffer>,
        }),
        headers: (options?.headers || {}) as Record<string, string | Buffer>,
        partition: options?.partition,
      };

      await this.producer!.send({
        topic: topicName,
        messages: [messageData],
      });
    } catch (error) {
      throw new Error(
        `Failed to send message to queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 消费队列消息
   *
   * @description 消费Kafka队列主题的消息
   *
   * @param queue 队列名称
   * @param handler 消息处理器
   * @throws {Error} 消费失败时抛出错误
   */
  async consume<T>(queue: string, handler: MessageHandler<T>): Promise<void> {
    this.validateConnection();

    try {
      const topicName = `${this.config.topicPrefix}queue_${queue}`;

      // 创建消费者
      const consumer = this.kafka!.consumer({
        groupId: `${this.config.clientId}_queue_${queue}`,
      });

      // 连接消费者
      await consumer.connect();

      // 订阅主题
      await consumer.subscribe({
        topic: topicName,
        fromBeginning: false,
      });

      // 设置消息处理
      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          try {
            const messageData = JSON.parse(
              payload.message.value?.toString() || '{}'
            );
            await handler(messageData.data);
          } catch (error) {
            console.error(`Error processing message in queue ${queue}:`, error);
          }
        },
      });

      // 保存消费者
      this.consumers.set(queue, consumer);
    } catch (error) {
      throw new Error(
        `Failed to consume from queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 取消队列消费者
   *
   * @description 取消Kafka队列的消费者
   *
   * @param queue 队列名称
   * @throws {Error} 取消消费者失败时抛出错误
   */
  override async cancelConsumer(queue: string): Promise<void> {
    this.validateConnection();

    try {
      const consumer = this.consumers.get(queue);
      if (consumer) {
        await consumer.disconnect();
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
   * @description 创建Kafka主题（队列）
   *
   * @param queue 队列名称
   * @param options 队列选项
   * @throws {Error} 创建队列失败时抛出错误
   */
  async createQueue(queue: string, options?: QueueOptions): Promise<void> {
    this.validateConnection();

    try {
      const topicName = `${this.config.topicPrefix}queue_${queue}`;
      const admin = this.kafka!.admin();

      await admin.connect();

      // 创建主题
      await admin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: options?.partitions || 1,
            replicationFactor: options?.replicationFactor || 1,
            configEntries: options?.configEntries || [],
          },
        ],
      });

      await admin.disconnect();
    } catch (error) {
      throw new Error(
        `Failed to create queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 删除队列
   *
   * @description 删除Kafka主题（队列）
   *
   * @param queue 队列名称
   * @throws {Error} 删除队列失败时抛出错误
   */
  async deleteQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      const topicName = `${this.config.topicPrefix}queue_${queue}`;
      const admin = this.kafka!.admin();

      await admin.connect();

      // 删除主题
      await admin.deleteTopics({
        topics: [topicName],
      });

      await admin.disconnect();
    } catch (error) {
      throw new Error(
        `Failed to delete queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 清空队列
   *
   * @description Kafka不支持直接清空主题，此方法会删除并重新创建主题
   *
   * @param queue 队列名称
   * @throws {Error} 清空队列失败时抛出错误
   */
  override async purgeQueue(queue: string): Promise<void> {
    this.validateConnection();

    try {
      // 先删除队列
      await this.deleteQueue(queue);

      // 重新创建队列
      await this.createQueue(queue);
    } catch (error) {
      throw new Error(
        `Failed to purge queue ${queue}: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取队列信息
   *
   * @description 获取Kafka主题（队列）的详细信息
   *
   * @param queue 队列名称
   * @returns 队列信息
   * @throws {Error} 获取队列信息失败时抛出错误
   */
  async getQueueInfo(queue: string): Promise<QueueInfo> {
    this.validateConnection();

    try {
      const topicName = `${this.config.topicPrefix}queue_${queue}`;
      const admin = this.kafka!.admin();

      await admin.connect();

      // 获取主题元数据
      const metadata = await admin.fetchTopicMetadata({
        topics: [topicName],
      });

      await admin.disconnect();

      const topicMetadata = metadata.topics.find((t) => t.name === topicName);
      if (!topicMetadata) {
        throw new Error(`Topic ${topicName} not found`);
      }

      return {
        name: queue,
        messageCount: 0, // Kafka不直接提供消息计数
        consumerCount: this.consumers.has(queue) ? 1 : 0,
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: {
          partitions: topicMetadata.partitions.length,
          replicationFactor: topicMetadata.partitions[0]?.replicas.length || 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get queue info for ${queue}: ${(error as Error).message}`
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
    return 'Kafka';
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
    return '基于Apache Kafka的高吞吐量消息队列适配器';
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
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      topicPrefix: this.config.topicPrefix,
      consumers: this.consumers.size,
    };
  }
}
