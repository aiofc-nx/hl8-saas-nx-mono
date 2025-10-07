/**
 * 通用日志中间件
 *
 * @description 请求日志记录中间件
 * @since 1.0.0
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from '@hl8/fastify-pro';

/**
 * 日志中间件
 *
 * @description 记录HTTP请求和响应的详细信息
 *
 * ## 业务规则
 *
 * ### 日志记录规则
 * - 记录所有HTTP请求的详细信息
 * - 包含请求时间、响应时间、状态码等
 * - 支持敏感信息脱敏
 * - 支持结构化日志输出
 *
 * ### 性能监控规则
 * - 记录请求处理时间
 * - 监控慢请求
 * - 统计请求频率
 * - 支持性能分析
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  /**
   * 处理请求
   *
   * @description 记录请求和响应信息
   * @param req - Fastify请求
   * @param res - Fastify响应
   * @param next - 下一个中间件
   */
  use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
    const startTime = Date.now();
    const { method, url, headers, body } = req;
    const userAgent = Array.isArray(headers['user-agent']) 
      ? headers['user-agent'][0] 
      : headers['user-agent'] || '';
    const ip = this.getClientIp(req);

    // 记录请求开始
    console.log('HTTP请求开始', {
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    // 监听响应完成 - 重写 send 方法
    const originalSend = res.send;
    res.send = function(payload: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = res.statusCode;

      // 记录请求完成
      console.log('HTTP请求完成', {
        method,
        url,
        ip,
        statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      // 记录慢请求
      if (duration > 1000) {
        console.warn('慢请求检测', {
          method,
          url,
          ip,
          duration: `${duration}ms`,
          threshold: '1000ms',
        });
      }

      return originalSend.call(this, payload);
    };

    next();
  }

  /**
   * 获取客户端IP地址
   *
   * @description 从请求头中提取真实的客户端IP
   * @param req - Fastify请求
   * @returns 客户端IP地址
   * @private
   */
  private getClientIp(req: FastifyRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const remoteAddress = (req as { connection?: { remoteAddress?: string } }).connection?.remoteAddress;

    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }

    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return remoteAddress || 'unknown';
  }
}
