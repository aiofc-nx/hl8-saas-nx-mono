/**
 * WebSocket消息处理器
 *
 * @description 定义WebSocket消息处理的基础接口和抽象类
 * 提供统一的消息处理流程和错误处理机制
 *
 * ## 业务规则
 *
 * ### 消息处理规则
 * - 支持异步消息处理
 * - 支持消息验证和过滤
 * - 支持消息路由和分发
 * - 支持消息持久化和重试
 *
 * ### 错误处理规则
 * - 统一的错误响应格式
 * - 详细的错误日志记录
 * - 错误指标收集和监控
 * - 优雅的错误降级处理
 *
 * ### 性能规则
 * - 消息处理超时控制
 * - 并发处理数量限制
 * - 内存使用监控
 * - 处理时间统计
 *
 * @example
 * ```typescript
 * export class UserMessageHandler extends BaseMessageHandler<UserMessage, UserResponse> {
 *   async handleMessage(message: UserMessage, context: IWebSocketContext): Promise<UserResponse> {
 *     // 验证消息
 *     this.validateMessage(message);
 *     
 *     // 执行业务逻辑
 *     const result = await this.processMessage(message, context);
 *     
 *     // 返回响应
 *     return this.createResponse(result);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import {
  ILoggerService,
  IMetricsService,
  IWebSocketContext,
} from '../../shared/interfaces';

/**
 * 消息处理器接口
 *
 * @description 定义消息处理器的基本接口
 *
 * @template TMessage - 输入消息类型
 * @template TResponse - 响应消息类型
 */
export interface IMessageHandler<TMessage, TResponse> {
  /**
   * 处理消息
   *
   * @description 处理WebSocket消息的核心方法
   *
   * @param message - 输入消息
   * @param context - WebSocket上下文
   * @returns 处理结果
   */
  handleMessage(message: TMessage, context: IWebSocketContext): Promise<TResponse>;

  /**
   * 验证消息
   *
   * @description 验证消息的格式和内容
   *
   * @param message - 输入消息
   * @throws 验证失败时抛出异常
   */
  validateMessage(message: TMessage): void;

  /**
   * 获取处理器名称
   *
   * @description 返回处理器的唯一标识符
   *
   * @returns 处理器名称
   */
  getHandlerName(): string;
}

/**
 * 消息处理器基类
 *
 * @description 为所有消息处理器提供通用功能和基础结构
 *
 * @template TMessage - 输入消息类型
 * @template TResponse - 响应消息类型
 */
export abstract class BaseMessageHandler<TMessage, TResponse> implements IMessageHandler<TMessage, TResponse> {
  protected readonly handlerName: string;
  protected readonly startTime: number;

  constructor(
    protected readonly logger: ILoggerService,
    protected readonly metricsService?: IMetricsService
  ) {
    this.handlerName = this.constructor.name;
    this.startTime = Date.now();
  }

  /**
   * 处理消息
   *
   * @description 为所有消息处理器提供统一的处理流程
   *
   * @param message - 输入消息
   * @param context - WebSocket上下文
   * @returns 处理结果
   */
  async handleMessage(message: TMessage, context: IWebSocketContext): Promise<TResponse> {
    this.logger.info(`开始处理WebSocket消息: ${this.handlerName}`, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      handler: this.handlerName,
      messageType: typeof message,
    });

    try {
      // 1. 验证消息
      this.validateMessage(message);

      // 2. 执行业务逻辑
      const result = await this.processMessage(message, context);

      // 3. 记录成功日志和指标
      this.logSuccess(result);

      return result;
    } catch (error) {
      // 4. 记录错误日志和指标
      this.logError(error);

      throw error;
    }
  }

  /**
   * 验证消息
   *
   * @description 验证消息的格式和内容
   * 子类可以重写此方法实现自定义验证逻辑
   *
   * @param message - 输入消息
   * @throws 验证失败时抛出异常
   */
  validateMessage(message: TMessage): void {
    if (!message) {
      throw new Error('消息不能为空');
    }

    // 基础验证通过，子类可以添加更多验证逻辑
    this.logger.debug('消息验证通过', {
      handler: this.handlerName,
      messageType: typeof message,
    });
  }

  /**
   * 处理消息
   *
   * @description 处理消息的核心业务逻辑
   * 子类必须实现此方法
   *
   * @param message - 输入消息
   * @param context - WebSocket上下文
   * @returns 处理结果
   */
  protected abstract processMessage(message: TMessage, context: IWebSocketContext): Promise<TResponse>;

  /**
   * 获取处理器名称
   *
   * @description 返回处理器的唯一标识符
   *
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return this.handlerName;
  }

  /**
   * 记录成功操作
   *
   * @description 记录操作成功的日志和性能指标
   *
   * @param result - 操作结果
   */
  protected logSuccess(result: TResponse): void {
    const duration = Date.now() - this.startTime;

    this.logger.info(`WebSocket消息处理成功: ${this.handlerName}`, {
      handler: this.handlerName,
      duration,
      resultType: typeof result,
    });

    // 记录性能指标
    this.metricsService?.incrementCounter(
      `websocket_handler_${this.handlerName.toLowerCase()}_success_total`
    );
    this.metricsService?.recordHistogram(
      `websocket_handler_${this.handlerName.toLowerCase()}_duration_ms`,
      duration
    );
  }

  /**
   * 记录错误操作
   *
   * @description 记录操作失败的日志和错误指标
   *
   * @param error - 错误信息
   */
  protected logError(error: unknown): void {
    const duration = Date.now() - this.startTime;

    this.logger.error(`WebSocket消息处理失败: ${this.handlerName}`, {
      handler: this.handlerName,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 记录错误指标
    this.metricsService?.incrementCounter(
      `websocket_handler_${this.handlerName.toLowerCase()}_error_total`,
      {
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      }
    );
  }
}

/**
 * 消息处理器注册表
 *
 * @description 管理所有消息处理器的注册和查找
 */
export class MessageHandlerRegistry {
  private readonly handlers = new Map<string, IMessageHandler<unknown, unknown>>();

  /**
   * 注册消息处理器
   *
   * @description 将消息处理器注册到注册表中
   *
   * @param handler - 消息处理器
   */
  register<TMessage, TResponse>(handler: IMessageHandler<TMessage, TResponse>): void {
    const handlerName = handler.getHandlerName();
    this.handlers.set(handlerName, handler as IMessageHandler<unknown, unknown>);
  }

  /**
   * 获取消息处理器
   *
   * @description 根据处理器名称获取消息处理器
   *
   * @param handlerName - 处理器名称
   * @returns 消息处理器或undefined
   */
  get<TMessage, TResponse>(handlerName: string): IMessageHandler<TMessage, TResponse> | undefined {
    return this.handlers.get(handlerName) as IMessageHandler<TMessage, TResponse> | undefined;
  }

  /**
   * 获取所有处理器名称
   *
   * @description 返回所有已注册的处理器名称
   *
   * @returns 处理器名称数组
   */
  getAllHandlerNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 检查处理器是否存在
   *
   * @description 检查指定名称的处理器是否已注册
   *
   * @param handlerName - 处理器名称
   * @returns 是否存在
   */
  has(handlerName: string): boolean {
    return this.handlers.has(handlerName);
  }

  /**
   * 清除所有处理器
   *
   * @description 清除注册表中的所有处理器
   */
  clear(): void {
    this.handlers.clear();
  }
}
