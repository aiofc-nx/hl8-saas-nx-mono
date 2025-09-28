import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 通用错误请求异常
 *
 * @description 表示客户端请求格式错误或参数无效的异常
 * 通常用于参数验证失败、请求格式错误等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 请求参数格式错误
 * - 必填参数缺失
 * - 参数类型不匹配
 * - 参数值超出允许范围
 *
 * ### 响应规则
 * - HTTP状态码：400 Bad Request
 * - 错误码：BAD_REQUEST
 * - 包含详细的参数错误信息
 *
 * ### 使用场景
 * - API参数验证失败
 * - 请求体格式错误
 * - 查询参数无效
 * - 文件上传格式错误
 *
 * @example
 * ```typescript
 * // 参数验证失败
 * throw new GeneralBadRequestException(
 *   'Invalid email format',
 *   'The email address must be a valid email format',
 *   { field: 'email', value: 'invalid-email' }
 * );
 *
 * // 必填参数缺失
 * throw new GeneralBadRequestException(
 *   'Missing required parameter',
 *   'The "userId" parameter is required',
 *   { missingField: 'userId' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class GeneralBadRequestException extends AbstractHttpException {
  /**
   * 创建错误请求异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含具体的错误信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, any>,
    rootCause?: unknown,
  ) {
    super(
      'BAD_REQUEST',
      title,
      detail,
      HttpStatus.BAD_REQUEST,
      data,
      'BAD_REQUEST',
      rootCause,
    );
  }
}
