import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorResponse } from '../vo/error-response.dto';
import { AbstractHttpException } from '../core/abstract-http.exception';
import type { ExceptionMessageProvider } from '../config/exception-message.provider';
import { PinoLogger } from '@hl8/logger';

/** Request 接口定义 */
interface Request {
  id?: string;
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
}

/**
 * HTTP异常过滤器
 *
 * @description 专门处理HTTP异常的过滤器
 * 支持NestJS内置HTTP异常和自定义HTTP异常的统一处理
 *
 * ## 业务规则
 *
 * ### 异常处理规则
 * - 处理NestJS内置HTTP异常
 * - 处理自定义AbstractHttpException
 * - 转换为标准错误响应格式
 * - 记录结构化错误日志
 *
 * ### 日志记录规则
 * - 记录HTTP异常的基本信息
 * - 包含请求上下文和响应信息
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
 *       useClass: HttpExceptionFilter,
 *     },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @since 1.0.0
 */
@Catch(HttpException, AbstractHttpException)
export class HttpExceptionFilter implements ExceptionFilter {
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
   * 捕获并处理HTTP异常
   *
   * @description 捕获HTTP异常，转换为标准错误响应并记录日志
   *
   * @param exception HTTP异常
   * @param host 请求上下文
   */
  catch(
    exception: HttpException | AbstractHttpException,
    host: ArgumentsHost
  ): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // 处理自定义HTTP异常
    if (exception instanceof AbstractHttpException) {
      this.handleAbstractHttpException(
        exception,
        request,
        response,
        httpAdapter
      );
      return;
    }

    // 处理NestJS内置HTTP异常
    this.handleNestHttpException(exception, request, response, httpAdapter);
  }

  /**
   * 处理自定义HTTP异常
   *
   * @description 处理AbstractHttpException，记录日志并返回标准响应
   *
   * @param exception 自定义HTTP异常
   * @param request 请求对象
   * @param response 响应对象
   * @param httpAdapter HTTP适配器
   */
  private handleAbstractHttpException(
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
    this.logger.error('Custom HTTP exception occurred', {
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
   * 处理NestJS内置HTTP异常
   *
   * @description 处理NestJS内置HTTP异常，转换为标准格式并记录日志
   *
   * @param exception NestJS HTTP异常
   * @param request 请求对象
   * @param response 响应对象
   * @param httpAdapter HTTP适配器
   */
  private handleNestHttpException(
    exception: HttpException,
    request: Request,
    response: unknown,
    httpAdapter: {
      reply: (res: unknown, body: unknown, status: number) => void;
    }
  ): void {
    const requestId = request.id || `req-${Date.now()}`;
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 创建标准错误响应
    const errorResponse: ErrorResponse = {
      type: this.documentationUrl || 'about:blank',
      title:
        this.messageProvider?.getMessage(exception.name, 'title') ||
        exception.name,
      detail:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any)?.message || exception.message,
      status,
      instance: requestId,
      errorCode: exception.name,
      data:
        typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
    };

    // 记录异常日志
    this.logger.error('NestJS HTTP exception occurred', {
      exception: {
        name: exception.constructor.name,
        message: exception.message,
        status,
        response: exceptionResponse,
      },
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
    });

    httpAdapter.reply(response, errorResponse, errorResponse.status);
  }
}
