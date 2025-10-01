/**
 * 租户未找到异常
 *
 * @description 租户数据库未找到时抛出的异常
 * @since 1.0.0
 */

import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';
import { ERROR_CODES } from '../constants';

/**
 * 租户未找到异常类
 *
 * @description 当租户数据库或租户连接未找到时抛出此异常
 *
 * ## 业务规则
 *
 * - 租户ID必须存在且有效
 * - 租户数据库必须已创建
 * - 租户连接必须已初始化
 *
 * @example
 * ```typescript
 * throw new TenantNotFoundException(
 *   '租户数据库未找到',
 *   { tenantId: 'tenant-123' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class TenantNotFoundException extends AbstractHttpException {
  constructor(
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: Error
  ) {
    super(
      ERROR_CODES.TENANT_NOT_FOUND,
      '租户未找到',
      detail,
      HttpStatus.NOT_FOUND,
      data,
      ERROR_CODES.TENANT_NOT_FOUND,
      rootCause
    );
  }
}
