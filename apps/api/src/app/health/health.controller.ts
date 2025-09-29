/**
 * 健康检查控制器
 *
 * 提供应用健康状态检查接口，支持系统资源监控和业务健康检查。
 * 集成 Fastify-Pro 企业级健康检查服务，提供完整的健康状态报告。
 *
 * @description 此控制器提供应用健康状态检查功能。
 * 支持系统资源监控、数据库连接检查、外部服务检查等。
 * 提供标准化的健康检查响应格式，支持 Kubernetes 等容器编排平台。
 *
 * ## 业务规则
 *
 * ### 健康检查规则
 * - 提供标准化的健康检查响应格式
 * - 支持系统资源状态检查
 * - 支持数据库连接状态检查
 * - 支持外部服务依赖检查
 *
 * ### 响应格式规则
 * - 健康状态：healthy、unhealthy、degraded
 * - 包含时间戳和响应时间
 * - 包含系统资源信息
 * - 包含组件健康状态
 *
 * ### 监控指标规则
 * - 记录健康检查请求次数
 * - 记录健康检查响应时间
 * - 记录系统资源使用情况
 * - 记录错误和异常情况
 *
 * ## 业务逻辑流程
 *
 * 1. **接收健康检查请求**：处理来自监控系统的健康检查请求
 * 2. **执行健康检查**：调用 Fastify-Pro 健康检查服务
 * 3. **收集系统信息**：收集系统资源、数据库状态等信息
 * 4. **生成健康报告**：生成标准化的健康状态报告
 * 5. **返回健康状态**：返回健康检查结果
 *
 * @example
 * ```typescript
 * // 健康检查响应示例
 * {
 *   "status": "healthy",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "responseTime": 15,
 *   "system": {
 *     "uptime": 3600,
 *     "memory": {
 *       "total": 8589934592,
 *       "free": 4294967296,
 *       "used": 4294967296
 *     }
 *   },
 *   "components": {
 *     "database": "healthy",
 *     "cache": "healthy",
 *     "external": "healthy"
 *   }
 * }
 * ```
 */

import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { HealthCheckService } from '@hl8/fastify-pro';

/**
 * 健康检查控制器
 *
 * @description 提供应用健康状态检查接口
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  /**
   * 执行健康检查
   *
   * @description 执行完整的应用健康检查，包括系统资源和组件状态
   * @returns 健康检查结果
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    return await this.healthCheckService.performHealthCheck();
  }

  /**
   * 执行就绪检查
   *
   * @description 检查应用是否准备好接收请求
   * @returns 就绪状态
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async checkReadiness() {
    const healthStatus = await this.healthCheckService.performHealthCheck();

    return {
      status: healthStatus.status === 'healthy' ? 'ready' : 'not-ready',
      timestamp: healthStatus.timestamp,
      responseTime: healthStatus.responseTime,
    };
  }

  /**
   * 执行存活检查
   *
   * @description 检查应用是否存活
   * @returns 存活状态
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  async checkLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
