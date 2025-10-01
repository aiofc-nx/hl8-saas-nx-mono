/**
 * 数据库事务异常
 *
 * @description 数据库事务失败时抛出的异常
 * @since 1.0.0
 */

import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';
import { ERROR_CODES } from '../constants';

/**
 * 数据库事务异常类
 *
 * @description 当数据库事务失败时抛出此异常
 *
 * ## 业务规则
 *
 * - 事务失败时自动回滚
 * - 记录事务开始和失败时间
 * - 包含事务隔离级别信息
 * - 支持嵌套事务的错误处理
 *
 * @example
 * ```typescript
 * throw new DatabaseTransactionException(
 *   '事务提交失败',
 *   { transactionId: 'tx-123', operations: 5 }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class DatabaseTransactionException extends AbstractHttpException {
  constructor(
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: Error
  ) {
    super(
      ERROR_CODES.TRANSACTION_FAILED,
      '数据库事务失败',
      detail,
      HttpStatus.INTERNAL_SERVER_ERROR,
      data,
      ERROR_CODES.TRANSACTION_FAILED,
      rootCause
    );
  }
}
