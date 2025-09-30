import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import {
  MessagingConnectionException,
  MessagingPublishException,
  MessagingConsumeException,
  MessagingAdapterNotFoundException,
  // MessagingTenantIsolationException,  // 当前未使用
  // MessagingConfigException,           // 当前未使用
} from './exceptions/messaging.exceptions';
import { MessageDeduplicationService } from './services/message-deduplication.service';
import { ConsumerStateService } from './services/consumer-state.service';
import {
  IMessagingService,
  IMessagingAdapter,
  MessagingModuleOptions,
  MessagingAdapterType,
  MessageHandler,
  PublishOptions,
  SendOptions,
  QueueOptions,
  ConnectionInfo,
  QueueInfo,
  MESSAGING_MODULE_OPTIONS,
} from './types/messaging.types';

/**
 * 消息队列服务
 *
 * 集成@hl8/multi-tenancy的企业级多租户消息队列服务，提供统一的消息管理。
 *
 * @description 此服务是核心消息队列服务，自动处理租户上下文。
 * 支持多种消息队列适配器，提供完整的租户隔离和消息管理。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 消息管理规则
 * - 支持消息发布和订阅
 * - 支持队列操作和管理
 * - 支持消息持久化和重试
 * - 支持消息去重和状态管理
 *
 * ### 租户隔离规则
 * - 自动处理租户上下文
 * - 支持租户级别的消息隔离
 * - 支持租户级别的配置管理
 * - 支持租户级别的监控统计
 *
 * ### 适配器规则
 * - 支持多种消息队列适配器
 * - 支持适配器动态切换
 * - 支持适配器健康检查
 * - 支持适配器性能监控
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly messagingService: MessagingService) {}
 *
 *   async createUser(userData: UserData): Promise<User> {
 *     const user = await this.userRepository.create(userData);
 *
 *     // 发布用户创建事件 - 自动处理租户上下文
 *     await this.messagingService.publish('user.created', {
 *       userId: user.id,
 *       userData: user
 *     });
 *
 *     return user;
 *   }
 * }
 * ```
 */
@Injectable()
export class MessagingService implements IMessagingService {
  private adapters: Map<MessagingAdapterType, IMessagingAdapter> = new Map();
  private defaultAdapter!: IMessagingAdapter;

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly cacheService: CacheService,
    private readonly deduplicationService: MessageDeduplicationService,
    private readonly consumerStateService: ConsumerStateService,
    private readonly logger: PinoLogger,
    @Inject(MESSAGING_MODULE_OPTIONS)
    private readonly options: MessagingModuleOptions
  ) {
    this.logger.setContext({ requestId: 'messaging-service' });
    this.initializeAdapters();
  }

  /**
   * 发布消息到主题
   *
   * @description 发布消息到指定主题，自动处理租户上下文
   * 支持租户隔离，确保消息在正确的租户上下文中处理
   *
   * @param topic 主题名称
   * @param message 消息内容
   * @param options 发布选项
   * @throws {Error} 当适配器未找到或发布失败时抛出错误
   *
   * @example
   * ```typescript
   * // 发布用户创建事件
   * await messagingService.publish('user.created', {
   *   userId: 'user-123',
   *   email: 'user@example.com'
   * });
   * ```
   */
  async publish<T>(
    topic: string,
    message: T,
    options?: PublishOptions
  ): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      // 检查消息去重（如果启用）
      if (this.options.cache?.enableMessageDeduplication) {
        const isDuplicate = await this.deduplicationService.isDuplicate(
          message
        );
        if (isDuplicate) {
          this.logger.warn('检测到重复消息，跳过发布', {
            topic,
            tenantId,
            messageId: (message as Record<string, unknown>)['id'] || 'unknown',
          });
          return;
        }
      }

      let finalTopic = topic;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的主题
        finalTopic = await this.tenantIsolationService.getTenantKey(
          topic,
          tenantId
        );
      }

      const adapter = this.getAdapter(options?.adapter);
      await adapter.publish(finalTopic, message, options);

      // 标记消息为已处理（如果启用去重）
      if (this.options.cache?.enableMessageDeduplication) {
        await this.deduplicationService.markAsProcessed(message);
      }

      this.logger.info('消息发布成功', {
        topic: finalTopic,
        tenantId,
        messageId: (message as Record<string, unknown>)['id'] || 'unknown',
      });
    } catch (error) {
      this.logger.error('消息发布失败', {
        topic,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw new MessagingPublishException(
        'Failed to publish message',
        'Unable to publish message to topic',
        { topic, tenantId: this.tenantContextService.getTenant() },
        error
      );
    }
  }

  /**
   * 订阅主题消息
   *
   * @description 订阅指定主题的消息，自动处理租户上下文
   * 支持租户隔离，确保只接收当前租户的消息
   *
   * @param topic 主题名称
   * @param handler 消息处理器
   * @throws {Error} 当适配器未找到或订阅失败时抛出错误
   *
   * @example
   * ```typescript
   * // 订阅用户创建事件
   * await messagingService.subscribe('user.created', async (event) => {
   *   console.log('用户创建事件:', event);
   * });
   * ```
   */
  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalTopic = topic;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的主题
        finalTopic = await this.tenantIsolationService.getTenantKey(
          topic,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();
      await adapter.subscribe(finalTopic, handler);

      this.logger.info('消息订阅成功', {
        topic: finalTopic,
        tenantId,
      });
    } catch (error) {
      this.logger.error('消息订阅失败', {
        topic,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 取消订阅主题消息
   *
   * @description 取消订阅指定主题的消息
   *
   * @param topic 主题名称
   * @param handler 可选的特定处理器
   * @throws {Error} 当适配器未找到或取消订阅失败时抛出错误
   */
  async unsubscribe(
    topic: string,
    handler?: MessageHandler<unknown>
  ): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalTopic = topic;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的主题
        finalTopic = await this.tenantIsolationService.getTenantKey(
          topic,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();
      if (adapter.unsubscribe && handler) {
        await adapter.unsubscribe(finalTopic, handler);
      }

      this.logger.info('消息取消订阅成功', {
        topic: finalTopic,
        tenantId,
      });
    } catch (error) {
      this.logger.error('消息取消订阅失败', {
        topic,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 发送消息到队列
   *
   * @description 发送消息到指定队列，自动处理租户上下文
   * 支持租户隔离，确保消息在正确的租户上下文中处理
   *
   * @param queue 队列名称
   * @param message 消息内容
   * @param options 发送选项
   * @throws {Error} 当适配器未找到或发送失败时抛出错误
   *
   * @example
   * ```typescript
   * // 发送邮件任务到队列
   * await messagingService.sendToQueue('email.queue', {
   *   to: 'user@example.com',
   *   subject: '欢迎邮件',
   *   content: '欢迎使用我们的服务'
   * });
   * ```
   */
  async sendToQueue<T>(
    queue: string,
    message: T,
    options?: SendOptions
  ): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalQueue = queue;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的队列
        finalQueue = await this.tenantIsolationService.getTenantKey(
          queue,
          tenantId
        );
      }

      const adapter = this.getAdapter(options?.adapter);
      await adapter.sendToQueue(finalQueue, message, options);

      this.logger.info('消息发送到队列成功', {
        queue: finalQueue,
        tenantId,
        messageId: (message as Record<string, unknown>)['id'] || 'unknown',
      });
    } catch (error) {
      this.logger.error('消息发送到队列失败', {
        queue,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 消费队列消息
   *
   * @description 消费指定队列的消息，自动处理租户上下文
   * 支持租户隔离，确保只处理当前租户的消息
   *
   * @param queue 队列名称
   * @param handler 消息处理器
   * @throws {Error} 当适配器未找到或消费失败时抛出错误
   *
   * @example
   * ```typescript
   * // 消费邮件队列消息
   * await messagingService.consume('email.queue', async (emailTask) => {
   *   await emailService.sendEmail(emailTask);
   * });
   * ```
   */
  async consume<T>(queue: string, handler: MessageHandler<T>): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();
      const consumerId = this.generateConsumerId(queue);

      // 创建或恢复消费者状态（如果启用）
      if (this.options.cache?.enableConsumerStateCache) {
        let state = await this.consumerStateService.getConsumerState(
          consumerId
        );
        if (!state) {
          state = await this.consumerStateService.createConsumerState(
            consumerId,
            queue
          );
          this.logger.info('创建新的消费者状态', {
            consumerId,
            queue,
            tenantId,
          });
        } else {
          this.logger.info('恢复消费者状态', {
            consumerId,
            queue,
            tenantId,
            lastProcessedMessageId: state.lastProcessedMessageId,
          });
        }
      }

      let finalQueue = queue;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的队列
        finalQueue = await this.tenantIsolationService.getTenantKey(
          queue,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();

      // 包装处理器以集成状态管理
      const wrappedHandler: MessageHandler<T> = async (message: T) => {
        try {
          await handler(message);

          // 更新消费者状态（如果启用）
          if (this.options.cache?.enableConsumerStateCache) {
            const messageId =
              ((message as Record<string, unknown>)['id'] as string) ||
              'unknown';
            await this.consumerStateService.updateProcessedState(
              consumerId,
              queue,
              messageId
            );
          }
        } catch (error) {
          // 更新错误状态（如果启用）
          if (this.options.cache?.enableConsumerStateCache) {
            await this.consumerStateService.updateErrorState(
              consumerId,
              (error as Error).message
            );
          }
          throw error;
        }
      };

      await adapter.consume(finalQueue, wrappedHandler);

      this.logger.info('消息消费成功', {
        queue: finalQueue,
        consumerId,
        tenantId,
      });
    } catch (error) {
      this.logger.error('消息消费失败', {
        queue,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw new MessagingConsumeException(
        'Failed to consume messages',
        'Unable to start message consumption',
        { queue, tenantId: this.tenantContextService.getTenant() },
        error
      );
    }
  }

  /**
   * 取消队列消费者
   *
   * @description 取消指定队列的消费者
   *
   * @param queue 队列名称
   * @throws {Error} 当适配器未找到或取消失败时抛出错误
   */
  async cancelConsumer(queue: string): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalQueue = queue;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的队列
        finalQueue = await this.tenantIsolationService.getTenantKey(
          queue,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();
      await adapter.cancelConsumer?.(finalQueue);

      this.logger.info('队列消费者取消成功', {
        queue: finalQueue,
        tenantId,
      });
    } catch (error) {
      this.logger.error('队列消费者取消失败', {
        queue,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 连接到消息队列
   *
   * @description 连接到配置的消息队列服务
   *
   * @throws {Error} 当连接失败时抛出错误
   */
  async connect(): Promise<void> {
    try {
      for (const [type, adapter] of this.adapters) {
        await adapter.connect();
        this.logger.info(`消息队列适配器连接成功: ${type}`);
      }
    } catch (error) {
      this.logger.error('消息队列连接失败', {
        error: (error as Error).message,
      });
      throw new MessagingConnectionException(
        'Failed to connect to messaging queue',
        'Unable to establish connection to messaging queue',
        { adapterType: this.options.adapter },
        error
      );
    }
  }

  /**
   * 断开消息队列连接
   *
   * @description 断开与消息队列服务的连接
   *
   * @throws {Error} 当断开连接失败时抛出错误
   */
  async disconnect(): Promise<void> {
    try {
      for (const [type, adapter] of this.adapters) {
        await adapter.disconnect();
        this.logger.info(`消息队列适配器断开连接成功: ${type}`);
      }
    } catch (error) {
      this.logger.error('消息队列断开连接失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 检查消息队列连接状态
   *
   * @description 检查默认适配器的连接状态
   *
   * @returns 连接状态
   */
  isConnected(): boolean {
    return this.defaultAdapter?.isConnected() || false;
  }

  /**
   * 获取连接信息
   *
   * @description 获取默认适配器的连接信息
   *
   * @returns 连接信息
   */
  getConnectionInfo(): ConnectionInfo {
    return (
      (this.defaultAdapter?.getConnectionInfo &&
        this.defaultAdapter.getConnectionInfo()) || {
        connected: false,
      }
    );
  }

  /**
   * 创建队列
   *
   * @description 创建指定名称的队列
   *
   * @param queue 队列名称
   * @param options 队列选项
   * @throws {Error} 当创建队列失败时抛出错误
   */
  async createQueue(queue: string, options?: QueueOptions): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalQueue = queue;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的队列
        finalQueue = await this.tenantIsolationService.getTenantKey(
          queue,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();
      await adapter.createQueue(finalQueue, options);

      this.logger.info('队列创建成功', {
        queue: finalQueue,
        tenantId,
      });
    } catch (error) {
      this.logger.error('队列创建失败', {
        queue,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 删除队列
   *
   * @description 删除指定名称的队列
   *
   * @param queue 队列名称
   * @throws {Error} 当删除队列失败时抛出错误
   */
  async deleteQueue(queue: string): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalQueue = queue;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的队列
        finalQueue = await this.tenantIsolationService.getTenantKey(
          queue,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();
      await adapter.deleteQueue(finalQueue);

      this.logger.info('队列删除成功', {
        queue: finalQueue,
        tenantId,
      });
    } catch (error) {
      this.logger.error('队列删除失败', {
        queue,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 清空队列
   *
   * @description 清空指定队列中的所有消息
   *
   * @param queue 队列名称
   * @throws {Error} 当清空队列失败时抛出错误
   */
  async purgeQueue(queue: string): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalQueue = queue;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的队列
        finalQueue = await this.tenantIsolationService.getTenantKey(
          queue,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();
      await adapter.purgeQueue?.(finalQueue);

      this.logger.info('队列清空成功', {
        queue: finalQueue,
        tenantId,
      });
    } catch (error) {
      this.logger.error('队列清空失败', {
        queue,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取队列信息
   *
   * @description 获取指定队列的详细信息
   *
   * @param queue 队列名称
   * @returns 队列信息
   * @throws {Error} 当获取队列信息失败时抛出错误
   */
  async getQueueInfo(queue: string): Promise<QueueInfo> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      let finalQueue = queue;
      if (tenantId && this.options.enableTenantIsolation !== false) {
        // 使用多租户隔离服务生成租户感知的队列
        finalQueue = await this.tenantIsolationService.getTenantKey(
          queue,
          tenantId
        );
      }

      const adapter = this.getDefaultAdapter();
      return await adapter.getQueueInfo(finalQueue);
    } catch (error) {
      this.logger.error('获取队列信息失败', {
        queue,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取当前租户ID
   *
   * @description 获取当前请求的租户ID
   *
   * @returns 租户ID或null
   */
  getCurrentTenant(): string | null {
    return this.tenantContextService.getTenant();
  }

  /**
   * 生成消费者ID
   *
   * @description 为指定队列生成唯一的消费者ID
   *
   * @param queue 队列名称
   * @returns 消费者ID
   * @private
   */
  private generateConsumerId(queue: string): string {
    const tenantId = this.tenantContextService.getTenant() || 'default';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `consumer:${tenantId}:${queue}:${timestamp}:${random}`;
  }

  /**
   * 检查是否有租户上下文
   *
   * @description 检查当前请求是否有租户上下文
   *
   * @returns 是否有租户上下文
   */
  hasTenantContext(): boolean {
    return this.tenantContextService.getTenant() !== null;
  }

  /**
   * 初始化适配器
   *
   * @description 根据配置初始化消息队列适配器
   *
   * @private
   */
  private initializeAdapters(): void {
    // 这里会在模块创建时由依赖注入系统提供适配器
    // 实际的适配器初始化在模块配置中完成
  }

  /**
   * 获取指定类型的适配器
   *
   * @description 根据适配器类型获取相应的适配器实例
   *
   * @param type 适配器类型
   * @returns 适配器实例
   * @throws {Error} 当适配器未找到时抛出错误
   *
   * @private
   */
  private getAdapter(type?: MessagingAdapterType): IMessagingAdapter {
    if (type && this.adapters.has(type)) {
      const adapter = this.adapters.get(type);
      if (!adapter) {
        throw new MessagingAdapterNotFoundException(
          'Adapter not found',
          `Messaging adapter ${type} is not available`,
          {
            adapterType: type,
            availableAdapters: Array.from(this.adapters.keys()),
          }
        );
      }
      return adapter;
    }
    return this.getDefaultAdapter();
  }

  /**
   * 获取默认适配器
   *
   * @description 获取默认的消息队列适配器
   *
   * @returns 默认适配器实例
   * @throws {Error} 当默认适配器未找到时抛出错误
   *
   * @private
   */
  private getDefaultAdapter(): IMessagingAdapter {
    if (this.defaultAdapter) {
      return this.defaultAdapter;
    }

    const adapterType = this.getDefaultAdapterType();
    const adapter = this.adapters.get(adapterType);
    if (!adapter) {
      throw new MessagingAdapterNotFoundException(
        'Default adapter not found',
        `Default messaging adapter ${adapterType} is not available`,
        { adapterType, availableAdapters: Array.from(this.adapters.keys()) }
      );
    }

    this.defaultAdapter = adapter;
    return adapter;
  }

  /**
   * 获取默认适配器类型
   *
   * @description 根据配置获取默认的适配器类型
   *
   * @returns 默认适配器类型
   *
   * @private
   */
  private getDefaultAdapterType(): MessagingAdapterType {
    return this.options.adapter || MessagingAdapterType.RABBITMQ;
  }
}
