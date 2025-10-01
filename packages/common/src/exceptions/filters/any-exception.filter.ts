import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorResponse } from '../vo/error-response.dto';
import { AbstractHttpException } from '../core/abstract-http.exception';
import type { ExceptionMessageProvider } from '../config/exception-message.provider';
import { PinoLogger } from '@hl8/logger';
import { ERROR_CODES } from '../../constants';

/** Request 接口定义 */
interface Request {
  id?: string;
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
}

/**
 * 通用异常过滤器
 *
 * @description 捕获所有未处理的异常，提供统一的异常处理机制
 * 集成自定义logger，支持结构化日志记录和错误追踪
 *
 * ## 业务规则
 *
 * ### 异常处理规则
 * - 捕获所有未处理的异常
 * - 转换为标准化的错误响应
 * - 记录详细的错误日志
 * - 支持健康检查异常的特殊处理
 *
 * ### 日志记录规则
 * - 使用结构化日志记录异常信息
 * - 包含请求上下文和错误详情
 * - 支持错误级别分类
 * - 提供错误追踪信息
 *
 * ### 响应格式规则
 * - 遵循RFC7807标准
 * - 支持消息提供者
 * - 包含请求实例标识符
 * - 提供文档链接
 *
 * @example
 * ```typescript
 * // 在应用模块中注册
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_FILTER,
 *       useClass: AnyExceptionFilter,
 *     },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @since 1.0.0
 */
@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  private readonly logger: PinoLogger;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly messageProvider?: ExceptionMessageProvider,
    private readonly documentationUrl?: string,
    injectedLogger?: PinoLogger
  ) {
    this.logger =
      injectedLogger ||
      new PinoLogger({
        destination: {
          type: 'console',
        },
      });
  }

  /**
   * 捕获并处理异常
   *
   * @description 捕获所有异常，转换为标准错误响应并记录日志
   *
   * @param exception 捕获的异常
   * @param host 请求上下文
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // 处理健康检查异常
    if (exception instanceof ServiceUnavailableException) {
      this.logger.warn('Health check failed', {
        exception: exception.message,
        status: 503,
      });
      httpAdapter.reply(response, exception.getResponse(), 503);
      return;
    }

    // 处理自定义HTTP异常
    if (exception instanceof AbstractHttpException) {
      this.handleHttpException(exception, request, response, httpAdapter);
      return;
    }

    // 处理其他异常
    this.handleUnknownException(exception, request, response, httpAdapter);
  }

  /**
   * 处理HTTP异常
   *
   * @description 处理自定义HTTP异常，记录日志并返回标准响应
   *
   * @param exception HTTP异常
   * @param request 请求对象
   * @param response 响应对象
   * @param httpAdapter HTTP适配器
   */
  private handleHttpException(
    exception: AbstractHttpException,
    request: Request,
    response: unknown,
    httpAdapter: {
      reply: (res: unknown, body: unknown, status: number) => void;
    }
  ): void {
    const requestId = request.id || `req-${Date.now()}`;
    const errorResponse = exception.toErrorResponse(
      requestId,
      this.messageProvider,
      this.documentationUrl
    );

    // 记录异常日志
    this.logger.error('HTTP exception occurred', {
      exception: exception.getExceptionInfo(),
      request: {
        id: requestId,
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
      response: {
        status: errorResponse.status,
        errorCode: errorResponse.errorCode,
      },
      rootCause: exception.rootCause,
    });

    httpAdapter.reply(response, errorResponse, errorResponse.status);
  }

  /**
   * 处理未知异常
   *
   * @description 处理未预期的异常，记录详细日志并返回通用错误响应
   *
   * @param exception 未知异常
   * @param request 请求对象
   * @param response 响应对象
   * @param httpAdapter HTTP适配器
   */
  private handleUnknownException(
    exception: unknown,
    request: Request,
    response: unknown,
    httpAdapter: {
      reply: (res: unknown, body: unknown, status: number) => void;
    }
  ): void {
    const requestId = request.id || `req-${Date.now()}`;

    // 创建通用错误响应
    const errorResponse: ErrorResponse = {
      type: this.documentationUrl || 'about:blank',
      title:
        this.messageProvider?.getMessage(ERROR_CODES.INTERNAL_ERROR, 'title') ||
        'Internal Server Error',
      detail:
        this.messageProvider?.getMessage(
          ERROR_CODES.INTERNAL_ERROR,
          'detail'
        ) || 'An unexpected error occurred',
      status: 500,
      instance: requestId,
      errorCode: ERROR_CODES.INTERNAL_ERROR,
    };

    // 记录详细异常日志
    this.logger.error('Unexpected exception occurred', {
      exception: {
        name:
          exception instanceof Error ? exception.constructor.name : 'Unknown',
        message:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      },
      request: {
        id: requestId,
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
      },
      response: {
        status: errorResponse.status,
        errorCode: errorResponse.errorCode,
      },
    });

    httpAdapter.reply(response, errorResponse, errorResponse.status);
  }
}
