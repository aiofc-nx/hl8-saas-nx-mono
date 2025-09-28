/**
 * 异常消息提供者接口
 *
 * @description 提供异常消息的基本支持
 * 支持消息获取、参数替换等功能
 *
 * ## 业务规则
 *
 * ### 消息获取规则
 * - 支持通过错误码获取消息
 * - 支持消息参数替换和格式化
 * - 支持默认消息回退机制
 *
 * ### 扩展性规则
 * - 支持自定义消息提供者实现
 * - 支持消息来源多样化（文件、数据库、API等）
 * - 支持消息版本管理和更新
 *
 * @example
 * ```typescript
 * // 实现消息提供者
 * class CustomMessageProvider implements ExceptionMessageProvider {
 *   getMessage(errorCode: string, messageType: 'title' | 'detail'): string | undefined {
 *     const messages = {
 *       'USER_NOT_FOUND': {
 *         title: 'User Not Found',
 *         detail: 'The user with ID "{userId}" does not exist'
 *       }
 *     };
 *     return messages[errorCode]?.[messageType];
 *   }
 * }
 *
 * // 使用消息提供者
 * const provider = new CustomMessageProvider();
 * const title = provider.getMessage('USER_NOT_FOUND', 'title');
 * const detail = provider.getMessage('USER_NOT_FOUND', 'detail');
 * ```
 *
 * @since 1.0.0
 */
export interface ExceptionMessageProvider {
  /**
   * 获取异常消息
   *
   * @description 根据错误码和消息类型获取消息
   * 支持消息参数替换和格式化
   *
   * @param errorCode 错误码
   * @param messageType 消息类型（title或detail）
   * @param params 消息参数，用于参数替换
   * @returns 消息，如果未找到则返回undefined
   *
   * @example
   * ```typescript
   * const message = provider.getMessage('USER_NOT_FOUND', 'detail', { userId: 'user-123' });
   * // 返回: "The user with ID "user-123" does not exist"
   * ```
   */
  getMessage(
    errorCode: string,
    messageType: 'title' | 'detail',
    params?: Record<string, any>,
  ): string | undefined;

  /**
   * 检查消息是否存在
   *
   * @description 检查指定错误码和消息类型的消息是否存在
   *
   * @param errorCode 错误码
   * @param messageType 消息类型
   * @returns 消息是否存在
   */
  hasMessage(errorCode: string, messageType: 'title' | 'detail'): boolean;

  /**
   * 获取所有可用的错误码
   *
   * @description 返回所有可用的错误码列表
   *
   * @returns 错误码数组
   */
  getAvailableErrorCodes(): string[];
}

/**
 * 默认异常消息提供者
 *
 * @description 提供默认的异常消息，支持基本的消息获取功能
 * 当没有配置自定义消息提供者时使用
 *
 * @example
 * ```typescript
 * const provider = new DefaultExceptionMessageProvider();
 * const title = provider.getMessage('USER_NOT_FOUND', 'title');
 * ```
 *
 * @since 1.0.0
 */
export class DefaultExceptionMessageProvider implements ExceptionMessageProvider {
  private readonly messages: Record<string, { title: string; detail: string }> = {
    // 通用错误消息
    INTERNAL_ERROR: {
      title: 'Internal Server Error',
      detail: '处理您的请求时发生意外错误',
    },
    BAD_REQUEST: {
      title: 'Bad Request',
      detail: '请求无效或格式错误',
    },
    UNAUTHORIZED: {
      title: 'Unauthorized',
      detail: '访问此资源需要身份验证',
    },
    FORBIDDEN: {
      title: 'Forbidden',
      detail: '您没有权限访问此资源',
    },
    NOT_FOUND: {
      title: 'Not Found',
      detail: '未找到请求的资源',
    },
    CONFLICT: {
      title: 'Conflict',
      detail: '请求与资源的当前状态冲突',
    },
    UNPROCESSABLE_ENTITY: {
      title: 'Unprocessable Entity',
      detail: '由于验证错误，无法处理请求',
    },
    SERVICE_UNAVAILABLE: {
      title: 'Service Unavailable',
      detail: '服务暂时不可用',
    },
  };

  /**
   * 获取异常消息
   *
   * @param errorCode 错误码
   * @param messageType 消息类型
   * @param params 消息参数
   * @returns 消息
   */
  getMessage(
    errorCode: string,
    messageType: 'title' | 'detail',
    params?: Record<string, any>,
  ): string | undefined {
    const message = this.messages[errorCode]?.[messageType];
    if (!message) {
      return undefined;
    }

    // 简单的参数替换
    if (params) {
      return message.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key]?.toString() || match;
      });
    }

    return message;
  }

  /**
   * 检查消息是否存在
   *
   * @param errorCode 错误码
   * @param messageType 消息类型
   * @returns 消息是否存在
   */
  hasMessage(errorCode: string, messageType: 'title' | 'detail'): boolean {
    return !!this.messages[errorCode]?.[messageType];
  }

  /**
   * 获取所有可用的错误码
   *
   * @returns 错误码数组
   */
  getAvailableErrorCodes(): string[] {
    return Object.keys(this.messages);
  }
}