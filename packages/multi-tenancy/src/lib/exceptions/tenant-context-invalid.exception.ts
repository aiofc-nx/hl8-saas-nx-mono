import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';

/**
 * 租户上下文无效异常
 *
 * @description 表示租户上下文无效或配置错误的异常
 * 通常用于租户上下文验证、上下文设置等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 租户上下文缺失或为空
 * - 租户上下文格式不正确
 * - 租户上下文配置错误
 * - 租户上下文超时或过期
 *
 * ### 响应规则
 * - HTTP状态码：400 Bad Request
 * - 错误码：TENANT_CONTEXT_INVALID
 * - 包含上下文验证信息
 *
 * ### 使用场景
 * - 租户上下文初始化失败
 * - 租户上下文验证失败
 * - 租户上下文配置错误
 * - 租户上下文超时处理
 *
 * @example
 * ```typescript
 * // 租户上下文缺失
 * throw new TenantContextInvalidException(
 *   'Tenant context missing',
 *   'The tenant context is required but not provided',
 *   { contextType: 'tenant-id' }
 * );
 *
 * // 租户上下文格式错误
 * throw new TenantContextInvalidException(
 *   'Invalid tenant context format',
 *   'The tenant context format is invalid',
 *   { context: 'invalid-format', expectedFormat: 'tenant:org:dept:user' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class TenantContextInvalidException extends AbstractHttpException {
  /**
   * 创建租户上下文无效异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含上下文验证信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      'TENANT_CONTEXT_INVALID',
      title,
      detail,
      HttpStatus.BAD_REQUEST,
      data,
      'TENANT_CONTEXT_INVALID',
      rootCause
    );
  }
}
