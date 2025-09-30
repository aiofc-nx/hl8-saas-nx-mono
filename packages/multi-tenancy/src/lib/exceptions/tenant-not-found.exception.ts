import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';

/**
 * 租户未找到异常
 *
 * @description 表示请求的租户不存在或无法访问的异常
 * 通常用于租户验证、租户上下文设置等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 请求的租户ID不存在
 * - 租户已被禁用或删除
 * - 租户访问权限不足
 * - 租户ID格式无效
 *
 * ### 响应规则
 * - HTTP状态码：404 Not Found
 * - 错误码：TENANT_NOT_FOUND
 * - 包含租户标识信息
 *
 * ### 使用场景
 * - 租户上下文验证失败
 * - 租户ID解析错误
 * - 租户权限检查失败
 * - 租户配置加载失败
 *
 * @example
 * ```typescript
 * // 租户不存在
 * throw new TenantNotFoundException(
 *   'Tenant not found',
 *   'The tenant with the specified ID does not exist',
 *   { tenantId: 'tenant-123' }
 * );
 *
 * // 租户已被禁用
 * throw new TenantNotFoundException(
 *   'Tenant disabled',
 *   'The tenant has been disabled and is no longer accessible',
 *   { tenantId: 'tenant-456', status: 'disabled' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class TenantNotFoundException extends AbstractHttpException {
  /**
   * 创建租户未找到异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含租户标识信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      'TENANT_NOT_FOUND',
      title,
      detail,
      HttpStatus.NOT_FOUND,
      data,
      'TENANT_NOT_FOUND',
      rootCause
    );
  }
}
