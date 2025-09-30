import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { MessagingMonitor } from './messaging-monitor.service';
import { MessagingService } from '../messaging.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import { HealthStatus, HealthCheck } from '../types/messaging.types';

/**
 * 消息队列健康检查服务
 *
 * 提供消息队列的全面健康检查功能
 *
 * @description 健康检查服务提供消息队列的全面健康检查
 * 包括连接检查、租户上下文检查、性能检查等
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class HealthController {
 *   constructor(private readonly healthCheckService: HealthCheckService) {}
 *
 *   @Get('health')
 *   async getHealth(): Promise<HealthCheck[]> {
 *     return await this.healthCheckService.performHealthChecks();
 *   }
 * }
 * ```
 */
@Injectable()
export class HealthCheckService {
  constructor(
    private readonly monitor: MessagingMonitor,
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'health-check-service' });
  }

  /**
   * 执行健康检查
   *
   * @description 执行全面的健康检查
   *
   * @returns 健康检查结果数组
   */
  async performHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    try {
      // 连接健康检查
      checks.push(await this.checkConnection());

      // 租户上下文健康检查
      checks.push(await this.checkTenantContext());

      // 消息队列健康检查
      checks.push(await this.checkMessagingQueue());

      // 监控健康检查
      checks.push(await this.checkMonitoring());

      return checks;
    } catch (error) {
      this.logger.error('健康检查执行失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 检查连接
   *
   * @description 检查消息队列连接状态
   *
   * @returns 连接健康检查结果
   *
   * @private
   */
  private async checkConnection(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const isConnected = this.messagingService.isConnected();
      const connectionInfo = this.messagingService.getConnectionInfo();

      const duration = Date.now() - startTime;

      return {
        status: isConnected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        checkedAt: new Date(),
        duration,
        result: {
          connected: isConnected,
          connectionInfo,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        status: HealthStatus.UNHEALTHY,
        checkedAt: new Date(),
        duration,
        result: {
          connected: false,
          error: (error as Error).message,
        },
        error: (error as Error).message,
      };
    }
  }

  /**
   * 检查租户上下文
   *
   * @description 检查租户上下文服务状态
   *
   * @returns 租户上下文健康检查结果
   *
   * @private
   */
  private async checkTenantContext(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const hasContext = this.tenantContextService.getTenant() !== null;
      const currentTenant = this.tenantContextService.getTenant();

      const duration = Date.now() - startTime;

      return {
        status: HealthStatus.HEALTHY,
        checkedAt: new Date(),
        duration,
        result: {
          hasTenantContext: hasContext,
          currentTenant,
          contextServiceAvailable: true,
        },
        tenantId: currentTenant || undefined,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        status: HealthStatus.UNHEALTHY,
        checkedAt: new Date(),
        duration,
        result: {
          hasTenantContext: false,
          currentTenant: null,
          contextServiceAvailable: false,
          error: (error as Error).message,
        },
        error: (error as Error).message,
      };
    }
  }

  /**
   * 检查消息队列
   *
   * @description 检查消息队列服务状态
   *
   * @returns 消息队列健康检查结果
   *
   * @private
   */
  private async checkMessagingQueue(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const isConnected = this.messagingService.isConnected();
      const connectionInfo = this.messagingService.getConnectionInfo();
      const hasTenantContext = this.messagingService.hasTenantContext();

      const duration = Date.now() - startTime;

      let status = HealthStatus.HEALTHY;
      if (!isConnected) {
        status = HealthStatus.UNHEALTHY;
      }

      return {
        status,
        checkedAt: new Date(),
        duration,
        result: {
          messagingServiceConnected: isConnected,
          connectionInfo,
          hasTenantContext,
          tenantId: this.messagingService.getCurrentTenant(),
        },
        tenantId: this.messagingService.getCurrentTenant() || undefined,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        status: HealthStatus.UNHEALTHY,
        checkedAt: new Date(),
        duration,
        result: {
          messagingServiceConnected: false,
          error: (error as Error).message,
        },
        error: (error as Error).message,
      };
    }
  }

  /**
   * 检查监控
   *
   * @description 检查监控服务状态
   *
   * @returns 监控健康检查结果
   *
   * @private
   */
  private async checkMonitoring(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const healthStatus = await this.monitor.healthCheck();

      const duration = Date.now() - startTime;

      return {
        status: healthStatus,
        checkedAt: new Date(),
        duration,
        result: {
          monitoringServiceAvailable: true,
          overallHealth: healthStatus,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        status: HealthStatus.UNHEALTHY,
        checkedAt: new Date(),
        duration,
        result: {
          monitoringServiceAvailable: false,
          error: (error as Error).message,
        },
        error: (error as Error).message,
      };
    }
  }
}
