/**
 * 性能监控中间件
 *
 * @description 监控HTTP请求的性能指标，记录请求处理时间，检测慢请求
 * @since 1.1.0
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from '@hl8/fastify-pro';
import { PinoLogger } from '@hl8/logger';

/**
 * 性能监控中间件配置
 */
export interface IPerformanceMiddlewareConfig {
  /** 慢请求阈值（毫秒），默认 1000ms */
  slowRequestThreshold?: number;
  /** 是否启用性能日志，默认 true */
  enablePerformanceLog?: boolean;
  /** 是否启用慢请求告警，默认 true */
  enableSlowRequestWarning?: boolean;
  /** 是否记录请求体大小，默认 false */
  enableRequestSizeLog?: boolean;
}

/**
 * 性能监控中间件
 *
 * @description 监控所有HTTP请求的性能指标
 * 记录请求处理时间、检测慢请求、收集性能数据用于分析
 *
 * ## 业务规则
 *
 * ### 性能监控规则
 * - 记录所有请求的处理时间
 * - 慢请求阈值默认为 1000ms
 * - 慢请求触发告警日志
 * - 支持配置慢请求阈值
 *
 * ### 日志记录规则
 * - 使用 info 级别记录正常请求
 * - 使用 warn 级别记录慢请求
 * - 日志包含请求方法、URL、状态码、处理时间
 * - 支持租户上下文信息（如可用）
 *
 * ### 性能数据规则
 * - 记录请求开始时间
 * - 记录请求结束时间
 * - 计算处理时长（毫秒）
 * - 支持性能分析和统计
 *
 * ## 业务逻辑流程
 *
 * 1. **记录开始时间**：请求到达时记录时间戳
 * 2. **继续处理**：调用下一个中间件或路由处理器
 * 3. **监听响应**：监听响应完成事件
 * 4. **计算时长**：响应完成时计算处理时间
 * 5. **记录日志**：记录性能数据
 * 6. **慢请求告警**：超过阈值时触发告警
 *
 * @example
 * ```typescript
 * // 在 AppModule 中配置
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(PerformanceMiddleware)
 *       .forRoutes('*');  // 应用到所有路由
 *   }
 * }
 *
 * // 日志输出示例
 * // INFO: Request performance: GET /api/users - 245ms [200]
 * // WARN: Slow request detected: GET /api/reports - 1523ms [200]
 * ```
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly config: IPerformanceMiddlewareConfig;

  constructor(
    private readonly logger: PinoLogger,
    config?: IPerformanceMiddlewareConfig
  ) {
    this.logger.setContext({ requestId: 'PerformanceMiddleware' });
    this.config = {
      slowRequestThreshold: config?.slowRequestThreshold || 1000,
      enablePerformanceLog: config?.enablePerformanceLog ?? true,
      enableSlowRequestWarning: config?.enableSlowRequestWarning ?? true,
      enableRequestSizeLog: config?.enableRequestSizeLog ?? false,
    };
  }

  /**
   * 处理请求
   *
   * @description 监控请求性能并记录指标
   *
   * @param req - Fastify 请求对象
   * @param res - Fastify 响应对象
   * @param next - 下一个中间件函数
   */
  use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
    const startTime = Date.now();
    const { method, url } = req;

    // 监听响应完成事件
    res.raw.on('finish', () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = res.statusCode;

      // 构建性能日志数据
      const performanceData: Record<string, unknown> = {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };

      // 添加租户上下文（如可用）
      const tenantId = req['tenantId'];
      if (tenantId) {
        performanceData['tenantId'] = tenantId;
      }

      // 添加用户信息（如可用）
      const user = req['user'];
      if (user?.id) {
        performanceData['userId'] = user.id;
      }

      // 添加请求大小（如启用）
      if (this.config.enableRequestSizeLog && req.headers['content-length']) {
        performanceData['requestSize'] = req.headers['content-length'];
      }

      // 记录性能日志
      if (this.config.enablePerformanceLog) {
        this.logger.info('Request performance', performanceData);
      }

      // 慢请求告警
      const slowThreshold = this.config.slowRequestThreshold;
      if (
        this.config.enableSlowRequestWarning &&
        slowThreshold !== undefined &&
        duration > slowThreshold
      ) {
        this.logger.warn('Slow request detected', {
          ...performanceData,
          threshold: `${slowThreshold}ms`,
          exceededBy: `${duration - slowThreshold}ms`,
        });
      }
    });

    next();
  }
}

