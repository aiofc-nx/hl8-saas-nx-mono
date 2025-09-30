import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from '@hl8/common';

/**
 * 多层级上下文无效异常
 *
 * @description 表示多层级上下文无效或层级关系错误的异常
 * 通常用于多层级数据隔离、层级验证等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 多层级上下文缺失或为空
 * - 层级关系验证失败
 * - 层级上下文格式不正确
 * - 层级权限检查失败
 *
 * ### 响应规则
 * - HTTP状态码：400 Bad Request
 * - 错误码：MULTI_LEVEL_CONTEXT_INVALID
 * - 包含层级验证信息
 *
 * ### 使用场景
 * - 多层级上下文初始化失败
 * - 层级关系验证失败
 * - 层级上下文配置错误
 * - 层级权限检查失败
 *
 * @example
 * ```typescript
 * // 层级关系验证失败
 * throw new MultiLevelContextInvalidException(
 *   'Invalid hierarchy relationship',
 *   'The hierarchy relationship between organization and department is invalid',
 *   { organizationId: 'org-123', departmentId: 'dept-456' }
 * );
 *
 * // 多层级上下文缺失
 * throw new MultiLevelContextInvalidException(
 *   'Multi-level context missing',
 *   'The multi-level context is required but not provided',
 *   { requiredLevel: 'organization' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class MultiLevelContextInvalidException extends AbstractHttpException {
  /**
   * 创建多层级上下文无效异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含层级验证信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      'MULTI_LEVEL_CONTEXT_INVALID',
      title,
      detail,
      HttpStatus.BAD_REQUEST,
      data,
      'MULTI_LEVEL_CONTEXT_INVALID',
      rootCause
    );
  }
}
