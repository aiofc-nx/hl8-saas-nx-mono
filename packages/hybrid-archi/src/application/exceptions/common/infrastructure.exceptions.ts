/**
 * 通用基础设施异常类
 *
 * @description 基础设施相关的通用异常类
 * @since 1.0.0
 */

import { ApplicationException } from './application.exception';

/**
 * 基础设施异常
 *
 * @description 当基础设施服务不可用时抛出
 */
export class InfrastructureException extends ApplicationException {
  constructor(service: string, reason: string) {
    super(
      `基础设施服务不可用: ${service} - ${reason}`,
      'INFRASTRUCTURE_UNAVAILABLE',
      {
        service,
        reason,
      }
    );
  }
}

/**
 * 数据库异常
 *
 * @description 当数据库操作失败时抛出
 */
export class DatabaseException extends ApplicationException {
  constructor(operation: string, reason: string) {
    super(`数据库操作失败: ${operation} - ${reason}`, 'DATABASE_ERROR', {
      operation,
      reason,
    });
  }
}

/**
 * 缓存异常
 *
 * @description 当缓存操作失败时抛出
 */
export class CacheException extends ApplicationException {
  constructor(operation: string, reason: string) {
    super(`缓存操作失败: ${operation} - ${reason}`, 'CACHE_ERROR', {
      operation,
      reason,
    });
  }
}

/**
 * 消息队列异常
 *
 * @description 当消息队列操作失败时抛出
 */
export class MessageQueueException extends ApplicationException {
  constructor(operation: string, reason: string) {
    super(`消息队列操作失败: ${operation} - ${reason}`, 'MESSAGE_QUEUE_ERROR', {
      operation,
      reason,
    });
  }
}

/**
 * 外部服务异常
 *
 * @description 当外部服务调用失败时抛出
 */
export class ExternalServiceException extends ApplicationException {
  constructor(service: string, operation: string, reason: string) {
    super(
      `外部服务调用失败: ${service}.${operation} - ${reason}`,
      'EXTERNAL_SERVICE_ERROR',
      {
        service,
        operation,
        reason,
      }
    );
  }
}
