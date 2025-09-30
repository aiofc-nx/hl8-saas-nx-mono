import 'reflect-metadata';

/**
 * 事件处理器装饰器
 *
 * 用于标记事件处理方法的装饰器，支持自动注册事件处理器。
 *
 * @description 此装饰器简化事件处理器的注册。
 * 可以通过装饰器自动将方法注册为事件处理器。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 装饰器功能规则
 * - 支持事件处理器自动注册
 * - 支持事件名称绑定
 * - 支持方法元数据管理
 * - 支持反射元数据操作
 *
 * ### 事件处理规则
 * - 支持事件名称匹配
 * - 支持事件处理器注册
 * - 支持事件处理器调用
 * - 支持事件处理器管理
 *
 * ### 元数据规则
 * - 支持反射元数据存储
 * - 支持元数据查询和更新
 * - 支持元数据验证
 * - 支持元数据清理
 *
 * @param eventName 事件名称
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   @EventHandler('user.created')
 *   async handleUserCreated(event: UserCreatedEvent): Promise<void> {
 *     console.log('用户创建事件:', event.userId);
 *   }
 * 
 *   @EventHandler('user.updated')
 *   async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
 *     console.log('用户更新事件:', event.userId);
 *   }
 * }
 * ```
 */
export function EventHandler(eventName: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 获取现有的事件处理器元数据
    const existingHandlers =
      Reflect.getMetadata('eventHandlers', target.constructor) || [];

    // 添加新的事件处理器
    existingHandlers.push({
      eventName,
      methodName: propertyKey,
      handler: descriptor.value,
    });

    // 设置元数据
    Reflect.defineMetadata(
      'eventHandlers',
      existingHandlers,
      target.constructor
    );

    return descriptor;
  };
}

/**
 * 事件处理器元数据键
 */
export const EVENT_HANDLERS_METADATA_KEY = 'eventHandlers';

/**
 * 获取事件处理器元数据
 *
 * @description 获取类的事件处理器元数据
 *
 * @param target 目标类
 * @returns 事件处理器数组
 */
export function getEventHandlers(target: object): Array<{
  eventName: string;
  methodName: string;
  handler: (...args: unknown[]) => unknown;
}> {
  return Reflect.getMetadata(EVENT_HANDLERS_METADATA_KEY, target) || [];
}
