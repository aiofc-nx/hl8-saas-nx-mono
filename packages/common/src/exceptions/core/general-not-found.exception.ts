import { HttpStatus } from '@nestjs/common';
import { AbstractHttpException } from './abstract-http.exception';

/**
 * 通用资源未找到异常
 *
 * @description 表示请求的资源不存在或无法访问的异常
 * 通常用于实体查询、文件访问、API端点等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 请求的资源不存在
 * - 资源已被删除
 * - 资源访问权限不足
 * - 资源ID无效
 *
 * ### 响应规则
 * - HTTP状态码：404 Not Found
 * - 错误码：NOT_FOUND
 * - 包含资源标识信息
 *
 * ### 使用场景
 * - 用户查询不存在的用户
 * - 文件下载文件不存在
 * - API端点不存在
 * - 数据库记录不存在
 *
 * @example
 * ```typescript
 * // 用户不存在
 * throw new GeneralNotFoundException(
 *   'User not found',
 *   'The user with the specified ID does not exist',
 *   { userId: 'user-123' }
 * );
 *
 * // 文件不存在
 * throw new GeneralNotFoundException(
 *   'File not found',
 *   'The requested file does not exist',
 *   { fileName: 'document.pdf' }
 * );
 * ```
 *
 * @since 1.0.0
 */
export class GeneralNotFoundException extends AbstractHttpException {
  /**
   * 创建资源未找到异常
   *
   * @param title 错误标题
   * @param detail 错误详情
   * @param data 附加数据，包含资源标识信息
   * @param rootCause 根本原因
   */
  constructor(
    title: string,
    detail: string,
    data?: Record<string, any>,
    rootCause?: unknown,
  ) {
    super(
      'NOT_FOUND',
      title,
      detail,
      HttpStatus.NOT_FOUND,
      data,
      'NOT_FOUND',
      rootCause,
    );
  }
}
