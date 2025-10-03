/**
 * 事件相关异常类
 *
 * @description 事件处理相关的异常类定义
 * @since 1.0.0
 */

/**
 * 事件总线异常
 *
 * @description 事件总线操作失败时抛出的异常
 */
export class EventBusException extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'EventBusException';
  }
}

/**
 * 事件处理异常
 *
 * @description 事件处理失败时抛出的异常
 */
export class EventHandlingException extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'EventHandlingException';
  }
}
