import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';

/**
 * 多层级数据隔离失败异常
 *
 * @description 表示多层级数据隔离操作失败的异常
 * 通常用于多层级数据隔离、层级数据访问控制等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 多层级隔离策略执行失败
 * - 层级隔离键生成失败
 * - 多层级数据隔离验证失败
 * - 层级隔离配置错误
 *
 * ### 响应规则
 * - HTTP状态码：500 Internal Server Error
 * - 错误码：MULTI_LEVEL_ISOLATION_FAILED
 * - 包含层级隔离操作信息
 *
 * ### 使用场景
 * - 多层级数据隔离策略执行失败
 * - 层级隔离键生成错误
 * - 多层级数据隔离验证失败
 * - 层级隔离配置加载失败
 *
 * @example
 * ```typescript
 * // 多层级数据隔离策略失败
 * throw new MultiLevelIsolationFailedException(
 *   'Multi-level data isolation failed',
 *   'Failed to isolate data for multi-level context',
 *   {
 *     tenantId: 'tenant-123',
 *     organizationId: 'org-456',
 *     operation: 'isolate'
 *   }
 * );
 *
 * // 层级隔离键生成失败
 * throw new MultiLevelIsolationFailedException(
 *   'Multi-level isolation key generation failed',
 *   'Failed to generate isolation key for multi-level data access',
 *   {
 *     key: 'user:123',
 *     tenantId: 'tenant-456',
 *     organizationId: 'org-789'
 *   }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class MultiLevelIsolationFailedException extends AbstractHttpException {
  /**
   * 创建多层级数据隔离失败异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含层级隔离操作信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      'MULTI_LEVEL_ISOLATION_FAILED',
      title,
      detail,
      HttpStatus.INTERNAL_SERVER_ERROR,
      data,
      'MULTI_LEVEL_ISOLATION_FAILED',
      rootCause
    );
  }
}
