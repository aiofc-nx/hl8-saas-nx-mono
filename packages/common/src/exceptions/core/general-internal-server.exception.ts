import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';
import { ERROR_CODES } from '../../constants';

/**
 * 通用内部服务器错误异常
 *
 * @description 表示服务器内部错误，无法完成请求处理的异常
 * 通常用于未预期的系统错误、第三方服务错误等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 服务器内部错误
 * - 数据库连接失败
 * - 第三方服务不可用
 * - 系统资源不足
 * - 未处理的异常
 *
 * ### 响应规则
 * - HTTP状态码：500 Internal Server Error
 * - 错误码：INTERNAL_ERROR
 * - 不暴露敏感的系统信息
 *
 * ### 使用场景
 * - 数据库操作失败
 * - 外部API调用失败
 * - 系统资源不足
 * - 未预期的程序错误
 *
 * @example
 * ```typescript
 * // 数据库操作失败
 * throw new GeneralInternalServerException(
 *   'Database operation failed',
 *   'Unable to save user data to database',
 *   { operation: 'createUser', table: 'users' },
 *   originalError
 * );
 *
 * // 第三方服务错误
 * throw new GeneralInternalServerException(
 *   'External service error',
 *   'Payment service is temporarily unavailable',
 *   { service: 'payment', endpoint: '/api/payments' },
 *   serviceError
 * );
 * ```
 *
 * @since 1.0.0
 */
export class GeneralInternalServerException extends AbstractHttpException {
  /**
   * 创建内部服务器错误异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含错误上下文信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      ERROR_CODES.INTERNAL_ERROR,
      title,
      detail,
      HttpStatus.INTERNAL_SERVER_ERROR,
      data,
      ERROR_CODES.INTERNAL_ERROR,
      rootCause
    );
  }
}
