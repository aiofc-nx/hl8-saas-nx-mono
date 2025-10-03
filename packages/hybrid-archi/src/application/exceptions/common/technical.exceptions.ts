/**
 * 通用技术异常类
 *
 * @description 技术相关的通用异常类
 * @since 1.0.0
 */

import { ApplicationException } from './application.exception';

/**
 * 并发冲突异常
 *
 * @description 当发生并发冲突时抛出
 */
export class ConcurrencyConflictException extends ApplicationException {
  constructor(
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(`聚合 ${aggregateId} 版本冲突`, 'CONCURRENCY_CONFLICT', {
      aggregateId,
      expectedVersion,
      actualVersion,
    });
  }
}

/**
 * 验证异常
 *
 * @description 当数据验证失败时抛出
 */
export class ValidationException extends ApplicationException {
  constructor(field: string, value: any, rule: string) {
    super(
      `验证失败: ${field} = ${value} 违反规则 ${rule}`,
      'VALIDATION_FAILED',
      {
        field,
        value,
        rule,
      }
    );
  }
}

/**
 * 序列化异常
 *
 * @description 当数据序列化失败时抛出
 */
export class SerializationException extends ApplicationException {
  constructor(dataType: string, reason: string) {
    super(`序列化失败: ${dataType} - ${reason}`, 'SERIALIZATION_FAILED', {
      dataType,
      reason,
    });
  }
}

/**
 * 反序列化异常
 *
 * @description 当数据反序列化失败时抛出
 */
export class DeserializationException extends ApplicationException {
  constructor(dataType: string, reason: string) {
    super(`反序列化失败: ${dataType} - ${reason}`, 'DESERIALIZATION_FAILED', {
      dataType,
      reason,
    });
  }
}

/**
 * 超时异常
 *
 * @description 当操作超时时抛出
 */
export class TimeoutException extends ApplicationException {
  constructor(operation: string, timeoutMs: number) {
    super(`操作超时: ${operation} (${timeoutMs}ms)`, 'OPERATION_TIMEOUT', {
      operation,
      timeoutMs,
    });
  }
}
