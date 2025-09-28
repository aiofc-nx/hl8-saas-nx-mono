import { ErrorResponse } from '../vo/error-response.dto';
import { ExceptionMessageProvider } from '../config/exception-message.provider';

/**
 * 抽象HTTP异常基类
 *
 * @description 所有HTTP异常的基类，提供统一的异常处理机制
 * 支持自定义错误码、根本原因追踪、消息提供者等功能
 *
 * ## 业务规则
 *
 * ### 异常创建规则
 * - 每个异常必须包含标题、详情和HTTP状态码
 * - 支持可选的错误码用于客户端错误识别
 * - 支持根本原因追踪用于调试和问题定位
 * - 支持附加数据用于客户端错误处理
 *
 * ### 消息处理规则
 * - 支持通过消息提供者获取消息
 * - 支持消息参数替换和格式化
 * - 支持默认消息回退机制
 *
 * ### 错误响应规则
 * - 转换为标准化的错误响应格式
 * - 包含请求实例标识符
 * - 支持文档链接配置
 * - 遵循RFC7807标准
 *
 * @template ADDITIONAL_DATA 附加数据类型
 *
 * @example
 * ```typescript
 * // 创建自定义异常
 * export class UserNotFoundException extends AbstractHttpException {
 *   constructor(userId: string) {
 *     super(
 *       'USER_NOT_FOUND',
 *       'User not found',
 *       'The user with the specified ID does not exist',
 *       HttpStatus.NOT_FOUND,
 *       { userId },
 *       'USER_NOT_FOUND',
 *       new Error('User not found in database')
 *     );
 *   }
 * }
 *
 * // 使用异常
 * const exception = new UserNotFoundException('user-123');
 * const errorResponse = exception.toErrorResponse('req-456');
 * ```
 *
 * @since 1.0.0
 */
export abstract class AbstractHttpException<ADDITIONAL_DATA extends object = object> {
  /**
   * 创建HTTP异常实例
   *
   * @param errorCode 错误码，用于客户端识别错误类型
   * @param title 错误标题，简短描述
   * @param detail 错误详情，详细描述
   * @param status HTTP状态码
   * @param data 附加数据，用于客户端错误处理
   * @param messageKey 消息键，用于获取本地化消息
   * @param rootCause 根本原因，用于调试和问题定位
   */
  constructor(
    public readonly errorCode: string,
    public readonly title: string,
    public readonly detail: string,
    public readonly status: number,
    public readonly data?: ADDITIONAL_DATA | ADDITIONAL_DATA[],
    public readonly messageKey?: string,
    public readonly rootCause?: unknown,
  ) {}

  /**
   * 转换为标准错误响应格式
   *
   * @description 将异常转换为符合RFC7807标准的错误响应
   * 支持消息提供者、文档链接、请求实例标识符等
   *
   * @param requestId 请求实例标识符
   * @param messageProvider 消息提供者，用于获取消息
   * @param documentationUrl 文档链接URL
   * @returns 标准化的错误响应对象
   *
   * @example
   * ```typescript
   * const exception = new UserNotFoundException('user-123');
   * const response = exception.toErrorResponse(
   *   'req-456',
   *   messageProvider,
   *   'https://docs.example.com/errors'
   * );
   * ```
   */
  toErrorResponse(
    requestId: string,
    messageProvider?: ExceptionMessageProvider,
    documentationUrl?: string,
  ): ErrorResponse {
    // 获取消息提供者的消息，如果没有则使用默认消息
    const finalTitle = messageProvider?.getMessage(this.messageKey || this.errorCode, 'title') || this.title;
    const finalDetail = messageProvider?.getMessage(this.messageKey || this.errorCode, 'detail') || this.detail;

    return {
      type: documentationUrl || 'about:blank',
      title: finalTitle,
      detail: finalDetail,
      status: this.status,
      instance: requestId,
      errorCode: this.errorCode,
      data: this.data,
    } satisfies ErrorResponse;
  }

  /**
   * 获取预设的HTTP头部值
   *
   * @description 返回异常相关的HTTP头部信息
   * 子类可以重写此方法以提供特定的头部信息
   *
   * @returns HTTP头部键值对
   */
  getPresetHeadersValues(): Record<string, string> {
    return {};
  }

  /**
   * 获取异常的基本信息
   *
   * @description 返回异常的基本信息，用于日志记录和调试
   *
   * @returns 异常基本信息对象
   */
  getExceptionInfo(): {
    errorCode: string;
    status: number;
    title: string;
    detail: string;
    hasData: boolean;
    hasRootCause: boolean;
  } {
    return {
      errorCode: this.errorCode,
      status: this.status,
      title: this.title,
      detail: this.detail,
      hasData: !!this.data,
      hasRootCause: !!this.rootCause,
    };
  }
}