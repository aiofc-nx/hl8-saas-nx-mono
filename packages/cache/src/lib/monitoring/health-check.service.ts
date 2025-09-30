/**
 * 健康检查服务
 *
 * @description 提供缓存服务的健康检查功能
 * 支持连接检查、性能检查、依赖检查等
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheMonitorService } from './cache-monitor.service';
import { RedisService } from '../redis.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import { HealthCheck } from '../types/cache.types';

/**
 * 健康检查配置
 */
export interface HealthCheckConfig {
  /** 检查间隔（毫秒） */
  interval: number;

  /** 超时时间（毫秒） */
  timeout: number;

  /** 重试次数 */
  retryCount: number;

  /** 启用自动检查 */
  enableAutoCheck: boolean;

  /** 启用详细日志 */
  enableVerboseLogging: boolean;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  duration: number;
  checks: Map<string, HealthCheck>;
  summary: string;
  recommendations: string[];
}

/**
 * 健康检查服务
 *
 * @description 提供缓存服务的健康检查功能
 */
@Injectable()
export class HealthCheckService {
  private readonly config: HealthCheckConfig = {
    interval: 30000, // 30秒
    timeout: 5000, // 5秒
    retryCount: 3,
    enableAutoCheck: true,
    enableVerboseLogging: false,
  };

  private autoCheckInterval?: NodeJS.Timeout;
  private lastHealthCheck?: HealthCheckResult;

  constructor(
    private readonly monitorService: CacheMonitorService,
    private readonly redisService: RedisService,
    private readonly tenantContextService: TenantContextService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'health-check-service' });

    if (this.config.enableAutoCheck) {
      this.startAutoCheck();
    }
  }

  /**
   * 执行健康检查
   *
   * @description 执行完整的健康检查
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = new Map<string, HealthCheck>();
    const recommendations: string[] = [];

    try {
      // Redis连接检查
      const redisCheck = await this.checkRedisConnection();
      checks.set('redis', redisCheck);

      // 缓存操作检查
      const cacheCheck = await this.checkCacheOperations();
      checks.set('cache', cacheCheck);

      // 租户上下文检查
      const contextCheck = await this.checkTenantContext();
      checks.set('context', contextCheck);

      // 性能检查
      const performanceCheck = await this.checkPerformance();
      checks.set('performance', performanceCheck);

      // 内存使用检查
      const memoryCheck = await this.checkMemoryUsage();
      checks.set('memory', memoryCheck);

      // 统计信息检查
      const statsCheck = await this.checkStatistics();
      checks.set('statistics', statsCheck);

      // 确定整体状态
      const status = this.determineOverallStatus(checks);

      // 生成建议
      recommendations.push(...this.generateRecommendations(checks, status));

      // 生成摘要
      const summary = this.generateSummary(checks, status);

      const result: HealthCheckResult = {
        status,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        checks,
        summary,
        recommendations,
      };

      this.lastHealthCheck = result;

      if (this.config.enableVerboseLogging) {
        this.logger.info('健康检查完成', {
          status,
          duration: result.duration,
          checksCount: checks.size,
          recommendationsCount: recommendations.length,
        });
      }

      return result;
    } catch (error) {
      this.logger.error('健康检查失败', { error: (error as Error).message });

      const errorCheck: HealthCheck = {
        name: 'error',
        status: 'unhealthy',
        message: (error as Error).message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      checks.set('error', errorCheck);

      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        checks,
        summary: '健康检查执行失败',
        recommendations: ['检查服务配置和依赖'],
      };
    }
  }

  /**
   * 检查Redis连接
   *
   * @description 检查Redis连接状态
   */
  private async checkRedisConnection(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const isHealthy = this.redisService.isHealthy();
      const connectionInfo = this.redisService.getConnectionInfo();

      return {
        name: 'redis',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy
          ? `Redis连接正常 (${connectionInfo.host}:${connectionInfo.port})`
          : 'Redis连接异常',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        message: `Redis连接检查失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 检查缓存操作
   *
   * @description 检查缓存读写操作
   */
  private async checkCacheOperations(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const testKey = 'health-check-test';
      const testValue = { test: true, timestamp: Date.now() };

      // 测试写入
      await this.redisService.set(testKey, testValue, 10);

      // 测试读取
      const retrieved = await this.redisService.get(testKey);

      // 测试删除
      await this.redisService.delete(testKey);

      const success = retrieved && (retrieved as any).test === true;

      return {
        name: 'cache',
        status: success ? 'healthy' : 'unhealthy',
        message: success ? '缓存操作正常' : '缓存操作异常',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'unhealthy',
        message: `缓存操作检查失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 检查租户上下文
   *
   * @description 检查租户上下文功能
   */
  private async checkTenantContext(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const hasContext = this.tenantContextService.getTenant() !== null;
      const currentTenant = this.tenantContextService.getTenant();

      return {
        name: 'context',
        status: 'healthy',
        message: hasContext
          ? `租户上下文正常 (租户: ${currentTenant})`
          : '租户上下文未设置',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'context',
        status: 'unhealthy',
        message: `租户上下文检查失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 检查性能
   *
   * @description 检查缓存性能指标
   */
  private async checkPerformance(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const performanceMetrics = this.monitorService.getPerformanceMetrics();

      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let message = '性能正常';

      if (performanceMetrics.hitRate < 50) {
        status = 'degraded';
        message = `命中率较低: ${performanceMetrics.hitRate.toFixed(2)}%`;
      }

      if (performanceMetrics.averageLatency > 100) {
        status = status === 'healthy' ? 'degraded' : 'unhealthy';
        message = `${message}, 延迟较高: ${performanceMetrics.averageLatency}ms`;
      }

      if (performanceMetrics.errorRate > 5) {
        status = 'unhealthy';
        message = `错误率过高: ${performanceMetrics.errorRate.toFixed(2)}%`;
      }

      return {
        name: 'performance',
        status,
        message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'performance',
        status: 'unhealthy',
        message: `性能检查失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 检查内存使用
   *
   * @description 检查Redis内存使用情况
   */
  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memoryUsage = await this.monitorService.getMemoryUsage();

      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      let message = '内存使用正常';

      if (memoryUsage.ratio > 80) {
        status = 'degraded';
        message = `内存使用率较高: ${memoryUsage.ratio.toFixed(2)}%`;
      }

      if (memoryUsage.ratio > 95) {
        status = 'unhealthy';
        message = `内存使用率过高: ${memoryUsage.ratio.toFixed(2)}%`;
      }

      return {
        name: 'memory',
        status,
        message: `${message} (${(memoryUsage.used / 1024 / 1024).toFixed(
          2
        )}MB)`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        message: `内存检查失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 检查统计信息
   *
   * @description 检查统计信息收集
   */
  private async checkStatistics(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const stats = this.monitorService.getStats();

      return {
        name: 'statistics',
        status: 'healthy',
        message: `统计信息正常 (命中率: ${stats.hitRate.toFixed(2)}%, 总键数: ${
          stats.totalKeys
        })`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'statistics',
        status: 'unhealthy',
        message: `统计信息检查失败: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 确定整体状态
   *
   * @description 根据各项检查结果确定整体健康状态
   */
  private determineOverallStatus(
    checks: Map<string, HealthCheck>
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Array.from(checks.values()).map((check) => check.status);

    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * 生成建议
   *
   * @description 根据检查结果生成优化建议
   */
  private generateRecommendations(
    checks: Map<string, HealthCheck>,
    status: 'healthy' | 'unhealthy' | 'degraded'
  ): string[] {
    const recommendations: string[] = [];

    checks.forEach((check, name) => {
      switch (name) {
        case 'redis':
          if (check.status === 'unhealthy') {
            recommendations.push('检查Redis服务器状态和网络连接');
          }
          break;

        case 'cache':
          if (check.status === 'unhealthy') {
            recommendations.push('检查缓存配置和权限设置');
          }
          break;

        case 'performance':
          if (check.status === 'degraded') {
            recommendations.push('优化缓存策略，提高命中率');
          } else if (check.status === 'unhealthy') {
            recommendations.push('检查缓存性能瓶颈，考虑扩容');
          }
          break;

        case 'memory':
          if (check.status === 'degraded') {
            recommendations.push('监控内存使用，考虑清理过期缓存');
          } else if (check.status === 'unhealthy') {
            recommendations.push('紧急清理缓存或扩容Redis内存');
          }
          break;
      }
    });

    if (status === 'healthy' && recommendations.length === 0) {
      recommendations.push('系统运行正常，继续保持');
    }

    return recommendations;
  }

  /**
   * 生成摘要
   *
   * @description 生成健康检查摘要
   */
  private generateSummary(
    checks: Map<string, HealthCheck>,
    status: 'healthy' | 'unhealthy' | 'degraded'
  ): string {
    const healthyCount = Array.from(checks.values()).filter(
      (c) => c.status === 'healthy'
    ).length;
    const degradedCount = Array.from(checks.values()).filter(
      (c) => c.status === 'degraded'
    ).length;
    const unhealthyCount = Array.from(checks.values()).filter(
      (c) => c.status === 'unhealthy'
    ).length;

    const totalChecks = checks.size;

    switch (status) {
      case 'healthy':
        return `所有 ${totalChecks} 项检查通过，系统运行正常`;
      case 'degraded':
        return `${healthyCount} 项正常，${degradedCount} 项降级，${unhealthyCount} 项异常，需要关注`;
      case 'unhealthy':
        return `${healthyCount} 项正常，${degradedCount} 项降级，${unhealthyCount} 项异常，需要立即处理`;
      default:
        return '健康检查状态未知';
    }
  }

  /**
   * 启动自动检查
   *
   * @description 启动定期自动健康检查
   */
  private startAutoCheck(): void {
    this.autoCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('自动健康检查失败', {
          error: (error as Error).message,
        });
      }
    }, this.config.interval);

    this.logger.info('自动健康检查已启动', {
      interval: this.config.interval,
    });
  }

  /**
   * 停止自动检查
   *
   * @description 停止定期自动健康检查
   */
  stopAutoCheck(): void {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = undefined;
      this.logger.info('自动健康检查已停止');
    }
  }

  /**
   * 获取最后健康检查结果
   *
   * @description 获取最后一次健康检查的结果
   */
  getLastHealthCheck(): HealthCheckResult | undefined {
    return this.lastHealthCheck;
  }

  /**
   * 更新配置
   *
   * @description 更新健康检查配置
   */
  updateConfig(config: Partial<HealthCheckConfig>): void {
    Object.assign(this.config, config);

    // 重启自动检查
    if (this.config.enableAutoCheck && !this.autoCheckInterval) {
      this.startAutoCheck();
    } else if (!this.config.enableAutoCheck && this.autoCheckInterval) {
      this.stopAutoCheck();
    }

    this.logger.info('健康检查配置已更新', { config });
  }
}
