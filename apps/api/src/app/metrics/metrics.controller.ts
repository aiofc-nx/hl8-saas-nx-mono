/**
 * 性能指标控制器
 *
 * 提供应用性能指标查询接口，支持多种格式的指标数据输出。
 * 集成系统资源监控和业务指标统计，提供完整的性能监控能力。
 *
 * @description 此控制器提供应用性能指标查询功能。
 * 支持系统资源监控、业务指标统计、性能指标分析等。
 * 提供 Prometheus 格式和 JSON 格式的指标输出。
 *
 * ## 业务规则
 *
 * ### API端点规则
 * - 提供RESTful风格的指标查询接口
 * - 支持多种格式的指标数据输出
 * - 使用标准的HTTP状态码和响应格式
 * - 提供详细的指标数据说明
 *
 * ### 数据格式规则
 * - 支持 Prometheus 格式的指标输出
 * - 支持 JSON 格式的指标输出
 * - 指标数据包含时间戳和标签
 * - 支持指标数据的过滤和排序
 *
 * ### 安全规则
 * - 指标数据不包含敏感信息
 * - 支持访问控制和权限验证
 * - 提供指标数据的缓存和限流
 * - 记录指标查询请求日志
 *
 * ## 业务逻辑流程
 *
 * 1. **接收指标查询请求**：处理来自监控系统的指标查询请求
 * 2. **收集指标数据**：调用指标服务收集系统资源和业务指标
 * 3. **格式化数据**：根据请求格式要求格式化指标数据
 * 4. **返回指标数据**：返回格式化的指标数据
 *
 * @example
 * ```typescript
 * // 指标查询接口示例
 * // GET /api/metrics - 获取所有性能指标（JSON格式）
 * // GET /api/metrics?format=prometheus - 获取Prometheus格式指标
 * // GET /api/metrics/system - 获取系统资源指标
 * // GET /api/metrics/business - 获取业务指标
 * ```
 */

import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';

/**
 * 性能指标控制器
 *
 * @description 提供应用性能指标查询接口
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * 获取性能指标
   *
   * @description 获取应用性能指标数据，支持多种格式输出
   * @param format - 输出格式（json 或 prometheus）
   * @param res - HTTP响应对象
   * @returns 性能指标数据
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /api/metrics
   * GET /api/metrics?format=prometheus
   *
   * // JSON格式响应示例
   * {
   *   "system": {
   *     "cpuUsage": 15.5,
   *     "memory": {
   *       "total": 8589934592,
   *       "used": 4294967296,
   *       "free": 4294967296,
   *       "usage": 50.0
   *     },
   *     "uptime": 3600
   *   },
   *   "business": {
   *     "totalRequests": 1000,
   *     "successfulRequests": 950,
   *     "failedRequests": 50,
   *     "averageResponseTime": 150,
   *     "activeConnections": 25
   *   },
   *   "timestamp": "2024-01-01T00:00:00.000Z"
   * }
   * ```
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMetrics(@Query('format') format = 'json', @Res() res: FastifyReply) {
    if (format === 'prometheus') {
      const prometheusMetrics = this.metricsService.getPrometheusMetrics();
      res.header('Content-Type', 'text/plain; charset=utf-8');
      return res.send(prometheusMetrics);
    }

    // 默认返回 JSON 格式
    const metrics = this.metricsService.getPerformanceMetrics();
    return res.send(metrics);
  }

  /**
   * 获取系统资源指标
   *
   * @description 获取系统资源使用情况指标
   * @returns 系统资源指标数据
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /api/metrics/system
   *
   * // 响应示例
   * {
   *   "cpuUsage": 15.5,
   *   "memory": {
   *     "total": 8589934592,
   *     "used": 4294967296,
   *     "free": 4294967296,
   *     "usage": 50.0
   *   },
   *   "uptime": 3600
   * }
   * ```
   */
  @Get('system')
  @HttpCode(HttpStatus.OK)
  getSystemMetrics() {
    return this.metricsService.getSystemMetrics();
  }

  /**
   * 获取业务指标
   *
   * @description 获取业务操作相关指标
   * @returns 业务指标数据
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /api/metrics/business
   *
   * // 响应示例
   * {
   *   "totalRequests": 1000,
   *   "successfulRequests": 950,
   *   "failedRequests": 50,
   *   "averageResponseTime": 150,
   *   "activeConnections": 25
   * }
   * ```
   */
  @Get('business')
  @HttpCode(HttpStatus.OK)
  getBusinessMetrics() {
    return this.metricsService.getBusinessMetrics();
  }

  /**
   * 获取 Prometheus 格式指标
   *
   * @description 获取 Prometheus 格式的性能指标数据
   * @param res - HTTP响应对象
   * @returns Prometheus 格式的指标数据
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /api/metrics/prometheus
   *
   * // 响应示例（Prometheus格式）
   * # HELP hl8_system_cpu_usage CPU usage percentage
   * # TYPE hl8_system_cpu_usage gauge
   * hl8_system_cpu_usage 15.5
   * # HELP hl8_business_total_requests Total number of requests
   * # TYPE hl8_business_total_requests counter
   * hl8_business_total_requests 1000
   * ```
   */
  @Get('prometheus')
  @HttpCode(HttpStatus.OK)
  getPrometheusMetrics(@Res() res: FastifyReply) {
    const prometheusMetrics = this.metricsService.getPrometheusMetrics();
    res.header('Content-Type', 'text/plain; charset=utf-8');
    return res.send(prometheusMetrics);
  }

  /**
   * 处理拼写错误的 metrics 端点
   *
   * @description 处理 /api/metrice 拼写错误，重定向到正确的 /api/metrics 端点
   * @param res - HTTP响应对象
   * @returns 重定向到正确的 metrics 端点
   */
  @Get('metrice')
  @HttpCode(HttpStatus.MOVED_PERMANENTLY)
  handleMisspelledMetrics(@Res() res: FastifyReply) {
    res.header('Location', '/api/metrics');
    return res.send({
      message: 'Redirecting to correct endpoint: /api/metrics',
    });
  }
}
