import 'reflect-metadata';

/**
 * 任务处理器装饰器
 *
 * 用于标记任务处理方法的装饰器
 * 支持自动注册任务处理器
 *
 * @description 任务处理器装饰器简化任务处理器的注册
 * 可以通过装饰器自动将方法注册为任务处理器
 *
 * @param taskName 任务名称
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class EmailService {
 *   @TaskHandler('send-welcome-email')
 *   async handleSendWelcomeEmail(taskData: WelcomeEmailTaskData): Promise<void> {
 *     await this.emailService.sendEmail(taskData.email, 'welcome', taskData);
 *   }
 *
 *   @TaskHandler('send-notification')
 *   async handleSendNotification(taskData: NotificationTaskData): Promise<void> {
 *     await this.notificationService.sendNotification(taskData);
 *   }
 * }
 * ```
 */
export function TaskHandler(taskName: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 获取现有的任务处理器元数据
    const existingHandlers =
      Reflect.getMetadata('taskHandlers', target.constructor) || [];

    // 添加新的任务处理器
    existingHandlers.push({
      taskName,
      methodName: propertyKey,
      handler: descriptor.value,
    });

    // 设置元数据
    Reflect.defineMetadata(
      'taskHandlers',
      existingHandlers,
      target.constructor
    );

    return descriptor;
  };
}

/**
 * 任务处理器元数据键
 */
export const TASK_HANDLERS_METADATA_KEY = 'taskHandlers';

/**
 * 获取任务处理器元数据
 *
 * @description 获取类的任务处理器元数据
 *
 * @param target 目标类
 * @returns 任务处理器数组
 */
export function getTaskHandlers(target: object): Array<{
  taskName: string;
  methodName: string;
  handler: (...args: unknown[]) => unknown;
}> {
  return Reflect.getMetadata(TASK_HANDLERS_METADATA_KEY, target) || [];
}
