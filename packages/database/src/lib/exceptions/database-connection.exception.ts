/**
 * 数据库连接异常
 *
 * @description 数据库连接失败时抛出的异常
 * @since 1.0.0
 */

import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';
import { ERROR_CODES } from '../constants';

/**
 * 数据库连接异常类
 *
 * @description 当数据库连接失败时抛出此异常
 *
 * ## 业务规则
 *
 * - 连接失败时记录详细的错误信息
 * - 包含数据库类型和主机信息
 * - 支持重试机制的错误处理
 *
 * @example
 * ```typescript
 * throw new DatabaseConnectionException(
 *   '数据库连接失败',
 *   { host: 'localhost', port: 5432, type: 'postgresql' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class DatabaseConnectionException extends AbstractHttpException {
  constructor(
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: Error
  ) {
    super(
      ERROR_CODES.CONNECTION_FAILED,
      '数据库连接失败',
      detail,
      HttpStatus.SERVICE_UNAVAILABLE,
      data,
      ERROR_CODES.CONNECTION_FAILED,
      rootCause
    );
  }
}
