import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';

/**
 * 租户数据隔离失败异常
 *
 * @description 表示租户数据隔离操作失败的异常
 * 通常用于数据隔离、数据访问控制等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 数据隔离策略执行失败
 * - 隔离键生成失败
 * - 数据隔离验证失败
 * - 隔离配置错误
 *
 * ### 响应规则
 * - HTTP状态码：500 Internal Server Error
 * - 错误码：TENANT_ISOLATION_FAILED
 * - 包含隔离操作信息
 *
 * ### 使用场景
 * - 数据隔离策略执行失败
 * - 隔离键生成错误
 * - 数据隔离验证失败
 * - 隔离配置加载失败
 *
 * @example
 * ```typescript
 * // 数据隔离策略失败
 * throw new TenantIsolationFailedException(
 *   'Data isolation failed',
 *   'Failed to isolate data for tenant',
 *   { tenantId: 'tenant-123', operation: 'isolate' }
 * );
 *
 * // 隔离键生成失败
 * throw new TenantIsolationFailedException(
 *   'Isolation key generation failed',
 *   'Failed to generate isolation key for data access',
 *   { key: 'user:123', tenantId: 'tenant-456' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class TenantIsolationFailedException extends AbstractHttpException {
  /**
   * 创建租户数据隔离失败异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含隔离操作信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      'TENANT_ISOLATION_FAILED',
      title,
      detail,
      HttpStatus.INTERNAL_SERVER_ERROR,
      data,
      'TENANT_ISOLATION_FAILED',
      rootCause
    );
  }
}
