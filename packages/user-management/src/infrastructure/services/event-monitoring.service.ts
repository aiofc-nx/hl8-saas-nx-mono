/**
 * 事件监控服务
 *
 * @description 事件监控服务，提供事件处理的监控和指标
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@hl8/hybrid-archi';

/**
 * 事件指标接口
 *
 * @description 事件处理的指标数据
 */
export interface EventMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  eventsPerSecond: number;
  eventsByType: Record<string, number>;
  eventsByTenant: Record<string, number>;
  lastProcessedAt?: Date;
}

/**
 * 处理统计接口
 *
 * @description 事件处理的统计信息
 */
export interface ProcessingStats {
  successRate: number;
  failureRate: number;
  averageLatency: number;
  throughput: number;
  errorRate: number;
  retryRate: number;
}

/**
 * 健康状态接口
 *
 * @description 事件处理的健康状态
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastCheck: Date;
  issues: string[];
}

/**
 * 事件监控服务
 *
 * @description 事件监控服务，提供事件处理的监控和指标
 *
 * ## 业务规则
 *
 * ### 监控职责
 * - 收集事件处理指标
 * - 监控系统健康状态
 * - 提供性能分析
 * - 支持告警和通知
 *
 * ### 指标收集
 * - 事件处理数量
 * - 处理时间统计
 * - 错误率统计
 * - 吞吐量统计
 */
@Injectable()
export class EventMonitoringService {
  private metrics: EventMetrics = {
    totalEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    averageProcessingTime: 0,
    eventsPerSecond: 0,
    eventsByType: {},
    eventsByTenant: {},
  };

  private processingTimes: number[] = [];
  private lastResetTime = Date.now();

  constructor() // TODO: 注入其他依赖
  // private readonly logger: ILoggerService,
  // private readonly alertService: IAlertService
  {}

  /**
   * 记录事件处理
   *
   * @description 记录事件处理的相关指标
   * @param event - 处理的事件
   * @param processingTime - 处理时间（毫秒）
   * @param success - 是否成功
   * @returns 记录结果
   */
  async recordEventProcessing(
    event: DomainEvent,
    processingTime: number,
    success: boolean
  ): Promise<void> {
    try {
      // 更新基础指标
      this.metrics.totalEvents++;
      this.processingTimes.push(processingTime);

      if (success) {
        this.metrics.processedEvents++;
      } else {
        this.metrics.failedEvents++;
      }

      // 更新事件类型统计
      const eventType = event.eventType;
      this.metrics.eventsByType[eventType] =
        (this.metrics.eventsByType[eventType] || 0) + 1;

      // 更新租户统计
      const tenantId = event.tenantId || 'default';
      this.metrics.eventsByTenant[tenantId] =
        (this.metrics.eventsByTenant[tenantId] || 0) + 1;

      // 更新平均处理时间
      this.updateAverageProcessingTime();

      // 更新每秒事件数
      this.updateEventsPerSecond();

      // 更新最后处理时间
      this.metrics.lastProcessedAt = new Date();

      console.log('Event processing recorded', {
        eventType,
        processingTime,
        success,
        tenantId,
      });
    } catch (error) {
      console.error('Failed to record event processing', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 跟踪事件指标
   *
   * @description 获取当前的事件处理指标
   * @returns 事件指标
   */
  async trackEventMetrics(): Promise<EventMetrics> {
    try {
      return { ...this.metrics };
    } catch (error) {
      console.error('Failed to track event metrics', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.metrics;
    }
  }

  /**
   * 获取事件处理统计
   *
   * @description 获取事件处理的统计信息
   * @returns 处理统计
   */
  async getEventProcessingStats(): Promise<ProcessingStats> {
    try {
      const totalEvents = this.metrics.totalEvents;
      const processedEvents = this.metrics.processedEvents;
      const failedEvents = this.metrics.failedEvents;

      const stats: ProcessingStats = {
        successRate:
          totalEvents > 0 ? (processedEvents / totalEvents) * 100 : 0,
        failureRate: totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0,
        averageLatency: this.metrics.averageProcessingTime,
        throughput: this.metrics.eventsPerSecond,
        errorRate: totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0,
        retryRate: 0, // TODO: 实现重试率计算
      };

      return stats;
    } catch (error) {
      console.error('Failed to get event processing stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        successRate: 0,
        failureRate: 0,
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        retryRate: 0,
      };
    }
  }

  /**
   * 监控事件健康状态
   *
   * @description 监控事件处理的健康状态
   * @returns 健康状态
   */
  async monitorEventHealth(): Promise<HealthStatus> {
    try {
      const issues: string[] = [];
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      // 检查处理成功率
      const successRate =
        this.metrics.totalEvents > 0
          ? (this.metrics.processedEvents / this.metrics.totalEvents) * 100
          : 100;

      if (successRate < 95) {
        issues.push(`Low success rate: ${successRate.toFixed(2)}%`);
        status = successRate < 90 ? 'unhealthy' : 'degraded';
      }

      // 检查处理时间
      if (this.metrics.averageProcessingTime > 5000) {
        issues.push(
          `High average processing time: ${this.metrics.averageProcessingTime}ms`
        );
        status = 'degraded';
      }

      // 检查吞吐量
      if (this.metrics.eventsPerSecond < 1) {
        issues.push(
          `Low throughput: ${this.metrics.eventsPerSecond} events/sec`
        );
        status = 'degraded';
      }

      // 检查最后处理时间
      if (this.metrics.lastProcessedAt) {
        const timeSinceLastProcess =
          Date.now() - this.metrics.lastProcessedAt.getTime();
        if (timeSinceLastProcess > 300000) {
          // 5分钟
          issues.push('No events processed in the last 5 minutes');
          status = 'degraded';
        }
      }

      const healthStatus: HealthStatus = {
        status,
        message:
          issues.length === 0 ? 'All systems operational' : issues.join('; '),
        lastCheck: new Date(),
        issues,
      };

      // 如果状态不健康，发送告警
      if (status !== 'healthy') {
        await this.sendHealthAlert(healthStatus);
      }

      return healthStatus;
    } catch (error) {
      console.error('Failed to monitor event health', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        status: 'unhealthy',
        message: 'Health check failed',
        lastCheck: new Date(),
        issues: ['Health check service unavailable'],
      };
    }
  }

  /**
   * 重置指标
   *
   * @description 重置所有监控指标
   * @returns 重置结果
   */
  async resetMetrics(): Promise<void> {
    try {
      this.metrics = {
        totalEvents: 0,
        processedEvents: 0,
        failedEvents: 0,
        averageProcessingTime: 0,
        eventsPerSecond: 0,
        eventsByType: {},
        eventsByTenant: {},
      };

      this.processingTimes = [];
      this.lastResetTime = Date.now();

      console.log('Event metrics reset successfully');
    } catch (error) {
      console.error('Failed to reset metrics', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取性能报告
   *
   * @description 生成事件处理的性能报告
   * @returns 性能报告
   */
  async getPerformanceReport(): Promise<{
    summary: EventMetrics;
    stats: ProcessingStats;
    health: HealthStatus;
    recommendations: string[];
  }> {
    try {
      const summary = await this.trackEventMetrics();
      const stats = await this.getEventProcessingStats();
      const health = await this.monitorEventHealth();

      const recommendations: string[] = [];

      // 基于指标生成建议
      if (stats.failureRate > 10) {
        recommendations.push(
          'High failure rate detected. Check error logs and consider implementing retry mechanisms.'
        );
      }

      if (stats.averageLatency > 1000) {
        recommendations.push(
          'High average latency detected. Consider optimizing event handlers or scaling resources.'
        );
      }

      if (stats.throughput < 10) {
        recommendations.push(
          'Low throughput detected. Consider optimizing event processing or increasing concurrency.'
        );
      }

      if (health.status !== 'healthy') {
        recommendations.push(
          'System health issues detected. Review and address the reported issues.'
        );
      }

      return {
        summary,
        stats,
        health,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to generate performance report', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ========== 私有辅助方法 ==========

  /**
   * 更新平均处理时间
   *
   * @description 计算并更新平均处理时间
   * @private
   */
  private updateAverageProcessingTime(): void {
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageProcessingTime = sum / this.processingTimes.length;
    }
  }

  /**
   * 更新每秒事件数
   *
   * @description 计算并更新每秒事件数
   * @private
   */
  private updateEventsPerSecond(): void {
    const now = Date.now();
    const timeDiff = (now - this.lastResetTime) / 1000; // 秒

    if (timeDiff > 0) {
      this.metrics.eventsPerSecond = this.metrics.totalEvents / timeDiff;
    }
  }

  /**
   * 发送健康告警
   *
   * @description 发送健康状态告警
   * @param healthStatus - 健康状态
   * @private
   */
  private async sendHealthAlert(healthStatus: HealthStatus): Promise<void> {
    try {
      // TODO: 实现告警发送逻辑
      console.warn('Event processing health alert', {
        status: healthStatus.status,
        message: healthStatus.message,
        issues: healthStatus.issues,
      });
    } catch (error) {
      console.error('Failed to send health alert', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
