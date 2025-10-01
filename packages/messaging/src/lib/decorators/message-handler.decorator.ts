import 'reflect-metadata';
import { DECORATOR_METADATA } from '../constants';

/**
 * 消息处理器装饰器
 *
 * 用于标记消息处理方法的装饰器
 * 支持自动注册消息处理器
 *
 * @description 消息处理器装饰器简化消息处理器的注册
 * 可以通过装饰器自动将方法注册为消息处理器
 *
 * @param topicOrQueue 主题名称或队列名称
 * @param options 处理器选项
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class NotificationService {
 *   @MessageHandler('notifications')
 *   async handleNotification(message: NotificationMessage): Promise<void> {
 *     await this.processNotification(message);
 *   }
 *
 *   @MessageHandler('email.queue', { type: 'queue' })
 *   async handleEmailTask(taskData: EmailTaskData): Promise<void> {
 *     await this.processEmailTask(taskData);
 *   }
 * }
 * ```
 */
export function MessageHandler(
  topicOrQueue: string,
  options?: {
    type?: 'topic' | 'queue';
    adapter?: string;
  }
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 获取现有的消息处理器元数据
    const existingHandlers =
      Reflect.getMetadata('messageHandlers', target.constructor) || [];

    // 添加新的消息处理器
    existingHandlers.push({
      topicOrQueue,
      type: options?.type || 'topic',
      adapter: options?.adapter,
      methodName: propertyKey,
      handler: descriptor.value,
    });

    // 设置元数据
    Reflect.defineMetadata(
      'messageHandlers',
      existingHandlers,
      target.constructor
    );

    return descriptor;
  };
}

/**
 * 获取消息处理器元数据
 *
 * @description 获取类的消息处理器元数据
 *
 * @param target 目标类
 * @returns 消息处理器数组
 */
export function getMessageHandlers(target: object): Array<{
  topicOrQueue: string;
  type: 'topic' | 'queue';
  adapter?: string;
  methodName: string;
  handler: (...args: unknown[]) => unknown;
}> {
  return Reflect.getMetadata(DECORATOR_METADATA.MESSAGE_HANDLERS, target) || [];
}
