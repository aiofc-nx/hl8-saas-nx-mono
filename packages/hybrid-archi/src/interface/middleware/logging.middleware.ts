/**
 * 日志中间件
 *
 * @description 为接口层提供统一的日志记录功能
 * 支持请求日志、响应日志、错误日志等
 *
 * @since 1.0.0
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ILoggerService } from '../shared/interfaces';

/**
 * 日志中间件
 *
 * @description 实现请求和响应的日志记录
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: ILoggerService) {}

  /**
   * 中间件处理
   *
   * @description 记录请求和响应日志
   *
   * @param req - HTTP请求
   * @param res - HTTP响应
   * @param next - 下一个中间件
   */
  use(req: { [key: string]: unknown }, res: { [key: string]: unknown }, next: () => void): void {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // 设置请求ID
    req['requestId'] = requestId;

    // 记录请求日志
    this.logger.info('HTTP请求开始', {
      requestId,
      method: req['method'],
      url: req['url'],
      userAgent: (req['headers'] as { 'user-agent'?: string })?.['user-agent'],
      ip: req['ip'],
      timestamp: new Date(),
    });

    // 监听响应完成
    (res as { on: (event: string, callback: () => void) => void })['on']('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res['statusCode'];

      // 记录响应日志
      this.logger.info('HTTP请求完成', {
        requestId,
        method: req['method'],
        url: req['url'],
        statusCode,
        duration,
        timestamp: new Date(),
      });
    });

    next();
  }

  /**
   * 生成请求ID
   *
   * @description 为每个请求生成唯一标识符
   *
   * @returns 请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
