/**
 * 数据库查询异常
 *
 * @description 数据库查询失败时抛出的异常
 * @since 1.0.0
 */

import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';
import { ERROR_CODES } from '../constants';

/**
 * 数据库查询异常类
 *
 * @description 当数据库查询失败时抛出此异常
 *
 * ## 业务规则
 *
 * - 查询失败时记录SQL语句和参数
 * - 包含查询超时信息
 * - 支持慢查询警告
 *
 * @example
 * ```typescript
 * throw new DatabaseQueryException(
 *   'SQL查询执行失败',
 *   { sql: 'SELECT * FROM users', error: 'syntax error' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class DatabaseQueryException extends AbstractHttpException {
  constructor(
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: Error
  ) {
    super(
      ERROR_CODES.QUERY_FAILED,
      '数据库查询失败',
      detail,
      HttpStatus.INTERNAL_SERVER_ERROR,
      data,
      ERROR_CODES.QUERY_FAILED,
      rootCause
    );
  }
}
