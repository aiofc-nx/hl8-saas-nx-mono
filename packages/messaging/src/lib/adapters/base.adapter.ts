import {
  IMessagingAdapter,
  MessagingAdapterType,
  MessageHandler,
  PublishOptions,
  SendOptions,
  QueueOptions,
  ConnectionInfo,
  QueueInfo,
  AdapterInfo,
  HealthStatus,
} from '../types/messaging.types';
// import { MessagingConnectionException } from '../exceptions/messaging.exceptions';

/**
 * 基础消息队列适配器
 *
 * 所有消息队列适配器的抽象基类，提供通用的适配器功能和接口实现。
 *
 * @description 此基类定义消息队列适配器的标准接口。
 * 子类需要实现具体的消息队列操作逻辑，包括连接、发布、订阅等功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 适配器接口规则
 * - 定义标准的消息队列操作接口
 * - 支持连接管理和状态跟踪
 * - 支持消息发布和订阅
 * - 支持队列操作和管理
 *
 * ### 连接管理规则
 * - 支持连接建立和断开
 * - 支持连接状态跟踪
 * - 支持连接错误处理
 * - 支持连接重试机制
 *
 * ### 消息处理规则
 * - 支持消息发布和订阅
 * - 支持消息路由和过滤
 * - 支持消息持久化和重试
 * - 支持消息监控和统计
 *
 * @example
 * ```typescript
 * export class RabbitMQAdapter extends BaseAdapter {
 *   constructor(config: RabbitMQConfig) {
 *     super(MessagingAdapterType.RABBITMQ);
 *     this.config = config;
 *   }
 *
 *   async connect(): Promise<void> {
 *     // RabbitMQ连接逻辑
 *   }
 * }
 * ```
 */
export abstract class BaseAdapter implements IMessagingAdapter {
  protected connected = false;
  protected connectedAt?: Date;
  protected disconnectedAt?: Date;
  protected connectionError?: string;

  constructor(protected readonly adapterType: MessagingAdapterType) {}

  /**
   * 连接到消息队列
   *
   * @description 建立与消息队列服务的连接
   * 子类需要实现具体的连接逻辑
   *
   * @throws {Error} 当连接失败时抛出错误
   */
  abstract connect(): Promise<void>;

  /**
   * 断开消息队列连接
   *
   * @description 断开与消息队列服务的连接
   * 子类需要实现具体的断开连接逻辑
   *
   * @throws {Error} 当断开连接失败时抛出错误
   */
  abstract disconnect(): Promise<void>;

  /**
   * 检查连接状态
   *
   * @description 检查与消息队列服务的连接状态
   *
   * @returns 连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取连接信息
   *
   * @description 获取当前连接的信息
   *
   * @returns 连接信息
   */
  getConnectionInfo(): ConnectionInfo {
    return {
      connected: this.connected,
      connectedAt: this.connectedAt,
      disconnectedAt: this.disconnectedAt,
      error: this.connectionError,
    };
  }

  /**
   * 发布消息到主题
   *
   * @description 发布消息到指定主题
   * 子类需要实现具体的发布逻辑
   *
   * @param topic 主题名称
   * @param message 消息内容
   * @param options 发布选项
   * @throws {Error} 当发布失败时抛出错误
   */
  abstract publish<T>(
    topic: string,
    message: T,
    options?: PublishOptions
  ): Promise<void>;

  /**
   * 订阅主题消息
   *
   * @description 订阅指定主题的消息
   * 子类需要实现具体的订阅逻辑
   *
   * @param topic 主题名称
   * @param handler 消息处理器
   * @throws {Error} 当订阅失败时抛出错误
   */
  abstract subscribe<T>(
    topic: string,
    handler: MessageHandler<T>
  ): Promise<void>;

  /**
   * 取消订阅主题消息
   *
   * @description 取消订阅指定主题的消息
   * 子类可以实现具体的取消订阅逻辑
   *
   * @param topic 主题名称
   * @param handler 可选的特定处理器
   * @throws {Error} 当取消订阅失败时抛出错误
   */
  async unsubscribe?(
    _topic: string,
    _handler?: MessageHandler<unknown>
  ): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 发送消息到队列
   *
   * @description 发送消息到指定队列
   * 子类需要实现具体的发送逻辑
   *
   * @param queue 队列名称
   * @param message 消息内容
   * @param options 发送选项
   * @throws {Error} 当发送失败时抛出错误
   */
  abstract sendToQueue<T>(
    queue: string,
    message: T,
    options?: SendOptions
  ): Promise<void>;

  /**
   * 消费队列消息
   *
   * @description 消费指定队列的消息
   * 子类需要实现具体的消费逻辑
   *
   * @param queue 队列名称
   * @param handler 消息处理器
   * @throws {Error} 当消费失败时抛出错误
   */
  abstract consume<T>(queue: string, handler: MessageHandler<T>): Promise<void>;

  /**
   * 取消队列消费者
   *
   * @description 取消指定队列的消费者
   * 子类可以实现具体的取消消费者逻辑
   *
   * @param queue 队列名称
   * @throws {Error} 当取消消费者失败时抛出错误
   */
  async cancelConsumer?(_queue: string): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 创建队列
   *
   * @description 创建指定名称的队列
   * 子类需要实现具体的创建队列逻辑
   *
   * @param queue 队列名称
   * @param options 队列选项
   * @throws {Error} 当创建队列失败时抛出错误
   */
  abstract createQueue(queue: string, options?: QueueOptions): Promise<void>;

  /**
   * 删除队列
   *
   * @description 删除指定名称的队列
   * 子类需要实现具体的删除队列逻辑
   *
   * @param queue 队列名称
   * @throws {Error} 当删除队列失败时抛出错误
   */
  abstract deleteQueue(queue: string): Promise<void>;

  /**
   * 清空队列
   *
   * @description 清空指定队列中的所有消息
   * 子类可以实现具体的清空队列逻辑
   *
   * @param queue 队列名称
   * @throws {Error} 当清空队列失败时抛出错误
   */
  async purgeQueue?(_queue: string): Promise<void> {
    // 默认实现为空，子类可以重写
  }

  /**
   * 获取队列信息
   *
   * @description 获取指定队列的详细信息
   * 子类需要实现具体的获取队列信息逻辑
   *
   * @param queue 队列名称
   * @returns 队列信息
   * @throws {Error} 当获取队列信息失败时抛出错误
   */
  abstract getQueueInfo(queue: string): Promise<QueueInfo>;

  /**
   * 获取适配器类型
   *
   * @description 获取当前适配器的类型
   *
   * @returns 适配器类型
   */
  getAdapterType(): MessagingAdapterType {
    return this.adapterType;
  }

  /**
   * 获取适配器信息
   *
   * @description 获取当前适配器的详细信息
   * 子类可以重写此方法提供更详细的信息
   *
   * @returns 适配器信息
   */
  getAdapterInfo(): AdapterInfo {
    return {
      type: this.adapterType,
      name: this.getAdapterName(),
      version: this.getAdapterVersion(),
      description: this.getAdapterDescription(),
      config: this.getAdapterConfig(),
      status: this.getAdapterStatus(),
    };
  }

  /**
   * 获取适配器名称
   *
   * @description 获取适配器的名称
   * 子类可以重写此方法提供自定义名称
   *
   * @returns 适配器名称
   *
   * @protected
   */
  protected getAdapterName(): string {
    return this.adapterType.toUpperCase();
  }

  /**
   * 获取适配器版本
   *
   * @description 获取适配器的版本信息
   * 子类可以重写此方法提供版本信息
   *
   * @returns 适配器版本
   *
   * @protected
   */
  protected getAdapterVersion(): string {
    return '1.0.0';
  }

  /**
   * 获取适配器描述
   *
   * @description 获取适配器的描述信息
   * 子类可以重写此方法提供描述信息
   *
   * @returns 适配器描述
   *
   * @protected
   */
  protected getAdapterDescription(): string {
    return `${this.adapterType.toUpperCase()} 消息队列适配器`;
  }

  /**
   * 获取适配器配置
   *
   * @description 获取适配器的配置信息
   * 子类可以重写此方法提供配置信息
   *
   * @returns 适配器配置
   *
   * @protected
   */
  protected getAdapterConfig(): Record<string, unknown> {
    return {};
  }

  /**
   * 获取适配器状态
   *
   * @description 获取适配器的健康状态
   * 子类可以重写此方法提供状态信息
   *
   * @returns 适配器状态
   *
   * @protected
   */
  protected getAdapterStatus(): HealthStatus {
    return this.connected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
  }

  /**
   * 设置连接状态
   *
   * @description 设置适配器的连接状态
   *
   * @param connected 连接状态
   *
   * @protected
   */
  protected setConnected(connected: boolean): void {
    this.connected = connected;
    if (connected) {
      this.connectedAt = new Date();
      this.connectionError = undefined;
    } else {
      this.disconnectedAt = new Date();
    }
  }

  /**
   * 设置连接错误
   *
   * @description 设置连接错误信息
   *
   * @param error 错误信息
   *
   * @protected
   */
  protected setConnectionError(error: string): void {
    this.connectionError = error;
    this.connected = false;
    this.disconnectedAt = new Date();
  }

  /**
   * 验证连接状态
   *
   * @description 验证适配器是否已连接
   *
   * @throws {Error} 当适配器未连接时抛出错误
   *
   * @protected
   */
  protected validateConnection(): void {
    if (!this.connected) {
      throw new Error(`Adapter ${this.adapterType} is not connected`);
    }
  }
}
