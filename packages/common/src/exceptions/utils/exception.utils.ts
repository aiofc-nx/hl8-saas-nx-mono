import { AbstractHttpException } from '../core/abstract-http.exception';
import { ErrorResponse } from '../vo/error-response.dto';

/**
 * 异常工具类
 *
 * @description 提供异常处理的工具方法
 * 支持异常转换、验证、格式化等功能
 *
 * ## 业务规则
 *
 * ### 异常转换规则
 * - 支持异常到错误响应的转换
 * - 支持异常信息的提取和格式化
 * - 支持异常级别的判断和分类
 *
 * ### 验证规则
 * - 支持异常对象的有效性验证
 * - 支持错误响应的格式验证
 * - 支持异常链的完整性检查
 *
 * ### 格式化规则
 * - 支持异常信息的结构化输出
 * - 支持异常统计和分析
 * - 支持异常报告生成
 *
 * @example
 * ```typescript
 * // 转换异常为错误响应
 * const errorResponse = ExceptionUtils.toErrorResponse(exception, requestId);
 *
 * // 验证异常对象
 * const isValid = ExceptionUtils.isValidException(exception);
 *
 * // 格式化异常信息
 * const formatted = ExceptionUtils.formatExceptionInfo(exception);
 * ```
 *
 * @since 1.0.0
 */
export class ExceptionUtils {
  /**
   * 将异常转换为错误响应
   *
   * @description 将异常对象转换为标准化的错误响应格式
   * 支持自定义消息提供者和文档链接
   *
   * @param exception 异常对象
   * @param requestId 请求实例标识符
   * @param messageProvider 消息提供者
   * @param documentationUrl 文档链接
   * @returns 标准化的错误响应对象
   *
   * @example
   * ```typescript
   * const errorResponse = ExceptionUtils.toErrorResponse(
   *   exception,
   *   'req-123',
   *   messageProvider,
   *   'https://docs.example.com/errors'
   * );
   * ```
   */
  static toErrorResponse(
    exception: AbstractHttpException,
    requestId: string,
    messageProvider?: any,
    documentationUrl?: string,
  ): ErrorResponse {
    return exception.toErrorResponse(requestId, messageProvider, documentationUrl);
  }

  /**
   * 验证异常对象的有效性
   *
   * @description 检查异常对象是否符合基本要求
   * 包括必要的属性和类型检查
   *
   * @param exception 异常对象
   * @returns 异常对象是否有效
   *
   * @example
   * ```typescript
   * const isValid = ExceptionUtils.isValidException(exception);
   * if (!isValid) {
   *   throw new Error('Invalid exception object');
   * }
   * ```
   */
  static isValidException(exception: any): exception is AbstractHttpException {
    return (
      exception &&
      typeof exception === 'object' &&
      typeof exception.errorCode === 'string' &&
      typeof exception.title === 'string' &&
      typeof exception.detail === 'string' &&
      typeof exception.status === 'number' &&
      typeof exception.toErrorResponse === 'function'
    );
  }

  /**
   * 格式化异常信息
   *
   * @description 将异常信息格式化为结构化的对象
   * 包含异常的基本信息、上下文和元数据
   *
   * @param exception 异常对象
   * @returns 格式化的异常信息对象
   *
   * @example
   * ```typescript
   * const formatted = ExceptionUtils.formatExceptionInfo(exception);
   * console.log('Exception info:', formatted);
   * ```
   */
  static formatExceptionInfo(exception: AbstractHttpException): {
    errorCode: string;
    title: string;
    detail: string;
    status: number;
    data?: any;
    rootCause?: any;
    timestamp: string;
  } {
    return {
      errorCode: exception.errorCode,
      title: exception.title,
      detail: exception.detail,
      status: exception.status,
      data: exception.data,
      rootCause: exception.rootCause,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取异常级别
   *
   * @description 根据HTTP状态码确定异常的严重级别
   * 用于日志记录和监控告警
   *
   * @param status HTTP状态码
   * @returns 异常级别
   *
   * @example
   * ```typescript
   * const level = ExceptionUtils.getExceptionLevel(404);
   * // 返回: 'warn'
   * ```
   */
  static getExceptionLevel(status: number): 'error' | 'warn' | 'info' {
    if (status >= 500) {
      return 'error';
    } else if (status >= 400) {
      return 'warn';
    } else {
      return 'info';
    }
  }

  /**
   * 检查是否为客户端错误
   *
   * @description 判断异常是否为客户端错误（4xx状态码）
   * 用于区分客户端错误和服务器错误
   *
   * @param status HTTP状态码
   * @returns 是否为客户端错误
   *
   * @example
   * ```typescript
   * const isClientError = ExceptionUtils.isClientError(400);
   * // 返回: true
   * ```
   */
  static isClientError(status: number): boolean {
    return status >= 400 && status < 500;
  }

  /**
   * 检查是否为服务器错误
   *
   * @description 判断异常是否为服务器错误（5xx状态码）
   * 用于区分服务器错误和客户端错误
   *
   * @param status HTTP状态码
   * @returns 是否为服务器错误
   *
   * @example
   * ```typescript
   * const isServerError = ExceptionUtils.isServerError(500);
   * // 返回: true
   * ```
   */
  static isServerError(status: number): boolean {
    return status >= 500 && status < 600;
  }

  /**
   * 创建异常统计信息
   *
   * @description 创建异常统计信息对象
   * 包含异常数量、级别分布、时间范围等信息
   *
   * @param exceptions 异常列表
   * @returns 异常统计信息
   *
   * @example
   * ```typescript
   * const stats = ExceptionUtils.createExceptionStats(exceptions);
   * console.log('Exception stats:', stats);
   * ```
   */
  static createExceptionStats(exceptions: AbstractHttpException[]): {
    total: number;
    byLevel: Record<string, number>;
    byErrorCode: Record<string, number>;
    byStatus: Record<number, number>;
    timeRange: { start: string; end: string };
  } {
    const stats = {
      total: exceptions.length,
      byLevel: {} as Record<string, number>,
      byErrorCode: {} as Record<string, number>,
      byStatus: {} as Record<number, number>,
      timeRange: { start: '', end: '' },
    };

    if (exceptions.length === 0) {
      return stats;
    }

    // 统计各级别异常数量
    exceptions.forEach(exception => {
      const level = this.getExceptionLevel(exception.status);
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      stats.byErrorCode[exception.errorCode] = (stats.byErrorCode[exception.errorCode] || 0) + 1;
      stats.byStatus[exception.status] = (stats.byStatus[exception.status] || 0) + 1;
    });

    // 设置时间范围
    const timestamps = exceptions.map(() => new Date().toISOString()).sort();
    stats.timeRange.start = timestamps[0];
    stats.timeRange.end = timestamps[timestamps.length - 1];

    return stats;
  }
}
