import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';

/**
 * 租户配置无效异常
 *
 * @description 表示租户配置无效或配置错误的异常
 * 通常用于租户配置验证、配置加载等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 租户配置缺失或为空
 * - 租户配置格式不正确
 * - 租户配置验证失败
 * - 租户配置加载失败
 *
 * ### 响应规则
 * - HTTP状态码：400 Bad Request
 * - 错误码：TENANT_CONFIG_INVALID
 * - 包含配置验证信息
 *
 * ### 使用场景
 * - 租户配置初始化失败
 * - 租户配置验证失败
 * - 租户配置格式错误
 * - 租户配置加载失败
 *
 * @example
 * ```typescript
 * // 租户配置缺失
 * throw new TenantConfigInvalidException(
 *   'Tenant configuration missing',
 *   'The tenant configuration is required but not provided',
 *   { configType: 'isolation' }
 * );
 *
 * // 租户配置格式错误
 * throw new TenantConfigInvalidException(
 *   'Invalid tenant configuration format',
 *   'The tenant configuration format is invalid',
 *   {
 *     config: 'invalid-config',
 *     expectedFormat: 'JSON object with required fields'
 *   }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class TenantConfigInvalidException extends AbstractHttpException {
  /**
   * 创建租户配置无效异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含配置验证信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      'TENANT_CONFIG_INVALID',
      title,
      detail,
      HttpStatus.BAD_REQUEST,
      data,
      'TENANT_CONFIG_INVALID',
      rootCause
    );
  }
}
