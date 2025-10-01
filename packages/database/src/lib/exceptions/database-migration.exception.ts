/**
 * 数据库迁移异常
 *
 * @description 数据库迁移失败时抛出的异常
 * @since 1.0.0
 */

import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';
import { ERROR_CODES } from '../constants';

/**
 * 数据库迁移异常类
 *
 * @description 当数据库迁移失败时抛出此异常
 *
 * ## 业务规则
 *
 * - 迁移失败时必须回滚已执行的迁移
 * - 记录迁移失败的详细信息
 * - 包含迁移版本和脚本信息
 * - 防止数据库结构不一致
 *
 * @example
 * ```typescript
 * throw new DatabaseMigrationException(
 *   '迁移脚本执行失败',
 *   { migration: '001_initial_schema', version: '1.0.0' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class DatabaseMigrationException extends AbstractHttpException {
  constructor(
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: Error
  ) {
    super(
      ERROR_CODES.MIGRATION_FAILED,
      '数据库迁移失败',
      detail,
      HttpStatus.INTERNAL_SERVER_ERROR,
      data,
      ERROR_CODES.MIGRATION_FAILED,
      rootCause
    );
  }
}
