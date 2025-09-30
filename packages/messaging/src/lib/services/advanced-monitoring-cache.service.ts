import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { MessagingCacheConfig } from '../types/messaging.types';

/**
 * 高级监控缓存服务
 *
 * @description 提供消息队列的高级监控指标缓存和分析功能
 * 包括性能指标、错误分析、趋势预测、告警阈值管理等企业级监控功能
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MonitoringService {
 *   constructor(
 *     private readonly monitoringCache: AdvancedMonitoringCacheService
 *   ) {}
 *
 *   async recordMessageMetrics(message: unknown, processingTime: number) {
 *     await this.monitoringCache.recordMessageProcessed(message, processingTime);
 *   }
 * }
 * ```
 */
@Injectable()
export class AdvancedMonitoringCacheService {
  private readonly logger = new PinoLogger();
  private readonly cacheTTL: number;
  private readonly keyPrefix: string;
  private readonly metricsRetentionDays: number = 7;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly cacheConfig: MessagingCacheConfig
  ) {
    this.logger.setContext({ requestId: 'advanced-monitoring-cache-service' });
    this.cacheTTL = this.cacheConfig.cacheTTL?.stats || 60; // 默认1分钟
    this.keyPrefix =
      this.cacheConfig.keyPrefix || 'hl8:messaging:cache:monitoring:';
  }

  /**
   * 记录消息处理指标
   *
   * @description 记录消息处理的性能指标，包括处理时间、大小、状态等
   *
   * @param messageId 消息ID
   * @param processingTime 处理时间（毫秒）
   * @param messageSize 消息大小（字节）
   * @param status 处理状态
   * @param tenantId 租户ID（可选）
   */
  async recordMessageProcessed(
    messageId: string,
    processingTime: number,
    messageSize = 0,
    status: 'success' | 'failed' | 'retry' = 'success',
    tenantId?: string
  ): Promise<void> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const timestamp = Date.now();
      const timeSlot = this.getTimeSlot(timestamp);

      // 记录实时指标
      await this.updateRealtimeMetrics(currentTenantId || 'default', timeSlot, {
        messagesProcessed: 1,
        totalProcessingTime: processingTime,
        totalMessageSize: messageSize,
        successCount: status === 'success' ? 1 : 0,
        failureCount: status === 'failed' ? 1 : 0,
        retryCount: status === 'retry' ? 1 : 0,
      });

      // 记录历史指标
      await this.updateHistoricalMetrics(
        currentTenantId || 'default',
        timeSlot,
        {
          messageId,
          processingTime,
          messageSize,
          status,
          timestamp,
        }
      );

      this.logger.debug('消息处理指标已记录', {
        messageId,
        tenantId: currentTenantId || undefined,
        processingTime,
        status,
        timeSlot,
      });
    } catch (error) {
      this.logger.error('记录消息处理指标失败', {
        error: (error as Error).message,
        messageId,
        processingTime,
        status,
      });
    }
  }

  /**
   * 记录队列性能指标
   *
   * @description 记录队列的深度、吞吐量、延迟等性能指标
   *
   * @param queueName 队列名称
   * @param metrics 队列指标
   * @param tenantId 租户ID（可选）
   */
  async recordQueueMetrics(
    queueName: string,
    metrics: QueueMetrics,
    tenantId?: string
  ): Promise<void> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const timestamp = Date.now();
      const timeSlot = this.getTimeSlot(timestamp);

      // 记录队列实时指标
      await this.updateQueueRealtimeMetrics(
        currentTenantId || 'default',
        queueName,
        timeSlot,
        metrics
      );

      // 记录队列历史指标
      await this.updateQueueHistoricalMetrics(
        currentTenantId || 'default',
        queueName,
        timeSlot,
        metrics
      );

      this.logger.debug('队列性能指标已记录', {
        queueName,
        tenantId: currentTenantId || undefined,
        metrics,
        timeSlot,
      });
    } catch (error) {
      this.logger.error('记录队列性能指标失败', {
        error: (error as Error).message,
        queueName,
        metrics,
      });
    }
  }

  /**
   * 记录错误指标
   *
   * @description 记录错误类型、频率、影响等错误分析指标
   *
   * @param error 错误信息
   * @param context 错误上下文
   * @param tenantId 租户ID（可选）
   */
  async recordErrorMetrics(
    error: Error,
    context: ErrorContext,
    tenantId?: string
  ): Promise<void> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const timestamp = Date.now();
      const timeSlot = this.getTimeSlot(timestamp);

      const errorMetrics: ErrorMetrics = {
        errorType: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        context,
        tenantId: currentTenantId || undefined,
        timestamp,
        severity: this.calculateErrorSeverity(error, context),
      };

      // 记录错误实时指标
      await this.updateErrorRealtimeMetrics(
        currentTenantId || 'default',
        timeSlot,
        errorMetrics
      );

      // 记录错误历史
      await this.updateErrorHistoricalMetrics(
        currentTenantId || 'default',
        timeSlot,
        errorMetrics
      );

      this.logger.warn('错误指标已记录', {
        tenantId: currentTenantId || undefined,
        errorType: error.name,
        severity: errorMetrics.severity,
        timeSlot,
      });
    } catch (cacheError) {
      this.logger.error('记录错误指标失败', {
        error: (cacheError as Error).message,
        originalError: error.message,
        context,
      });
    }
  }

  /**
   * 获取实时监控指标
   *
   * @description 获取当前的实时监控指标
   *
   * @param tenantId 租户ID（可选）
   * @param timeRange 时间范围（分钟）
   * @returns 实时监控指标
   */
  async getRealtimeMetrics(
    tenantId?: string,
    timeRange = 5
  ): Promise<RealtimeMetrics> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const now = Date.now();
      const metrics: RealtimeMetrics = {
        tenantId: currentTenantId || undefined,
        timeRange,
        timestamp: now,
        messagesProcessed: 0,
        avgProcessingTime: 0,
        throughput: 0,
        errorRate: 0,
        queueDepths: {},
        topErrors: [],
        performanceTrend: 'stable',
      };

      // 收集时间范围内的指标
      const timeSlots = this.getTimeSlotsInRange(now, timeRange);
      for (const timeSlot of timeSlots) {
        const slotMetrics = await this.getRealtimeMetricsForSlot(
          currentTenantId || 'default',
          timeSlot
        );
        if (slotMetrics) {
          this.mergeRealtimeMetrics(metrics, slotMetrics);
        }
      }

      // 计算派生指标
      this.calculateDerivedMetrics(metrics);

      this.logger.debug('实时监控指标已获取', {
        tenantId: currentTenantId || undefined,
        timeRange,
        metricsCount: timeSlots.length,
      });

      return metrics;
    } catch (error) {
      this.logger.error('获取实时监控指标失败', {
        error: (error as Error).message,
        tenantId,
        timeRange,
      });
      throw error;
    }
  }

  /**
   * 获取历史趋势分析
   *
   * @description 获取历史数据并进行趋势分析
   *
   * @param tenantId 租户ID（可选）
   * @param timeRange 时间范围（小时）
   * @param granularity 数据粒度（分钟）
   * @returns 历史趋势分析
   */
  async getHistoricalTrends(
    tenantId?: string,
    timeRange = 24,
    granularity = 15
  ): Promise<HistoricalTrends> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const now = Date.now();

      const trends: HistoricalTrends = {
        tenantId: currentTenantId || undefined,
        timeRange,
        granularity,
        timestamp: now,
        dataPoints: [],
        trends: {
          throughput: 'stable',
          latency: 'stable',
          errorRate: 'stable',
        },
        predictions: {
          nextHourThroughput: 0,
          nextHourLatency: 0,
          nextHourErrorRate: 0,
        },
      };

      // 收集历史数据点
      const timeSlots = this.getTimeSlotsInRange(
        now,
        timeRange * 60,
        granularity
      );
      for (const timeSlot of timeSlots) {
        const dataPoint = await this.getHistoricalDataPoint(
          currentTenantId || 'default',
          timeSlot
        );
        if (dataPoint) {
          trends.dataPoints.push(dataPoint);
        }
      }

      // 分析趋势
      trends.trends = this.analyzeTrends(trends.dataPoints);

      // 生成预测
      trends.predictions = this.generatePredictions(trends.dataPoints);

      this.logger.debug('历史趋势分析已生成', {
        tenantId: currentTenantId || undefined,
        timeRange,
        dataPointsCount: trends.dataPoints.length,
        trends: trends.trends,
      });

      return trends;
    } catch (error) {
      this.logger.error('获取历史趋势分析失败', {
        error: (error as Error).message,
        tenantId,
        timeRange,
      });
      throw error;
    }
  }

  /**
   * 获取告警状态
   *
   * @description 检查当前监控指标是否触发告警阈值
   *
   * @param tenantId 租户ID（可选）
   * @param thresholds 告警阈值配置（可选）
   * @returns 告警状态
   */
  async getAlertStatus(
    tenantId?: string,
    thresholds?: AlertThresholds
  ): Promise<AlertStatus> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const defaultThresholds = this.getDefaultAlertThresholds();
      const activeThresholds = { ...defaultThresholds, ...thresholds };

      const realtimeMetrics = await this.getRealtimeMetrics(
        currentTenantId || 'default'
      );

      const alerts: Alert[] = [];

      // 检查吞吐量告警
      if (realtimeMetrics.throughput > activeThresholds.maxThroughput) {
        alerts.push({
          type: 'throughput',
          severity: 'high',
          message: `吞吐量过高: ${realtimeMetrics.throughput.toFixed(
            2
          )} 消息/秒`,
          threshold: activeThresholds.maxThroughput,
          current: realtimeMetrics.throughput,
          timestamp: new Date().toISOString(),
        });
      }

      // 检查延迟告警
      if (realtimeMetrics.avgProcessingTime > activeThresholds.maxLatency) {
        alerts.push({
          type: 'latency',
          severity: 'medium',
          message: `处理延迟过高: ${realtimeMetrics.avgProcessingTime.toFixed(
            2
          )} 毫秒`,
          threshold: activeThresholds.maxLatency,
          current: realtimeMetrics.avgProcessingTime,
          timestamp: new Date().toISOString(),
        });
      }

      // 检查错误率告警
      if (realtimeMetrics.errorRate > activeThresholds.maxErrorRate) {
        alerts.push({
          type: 'error_rate',
          severity: 'high',
          message: `错误率过高: ${(realtimeMetrics.errorRate * 100).toFixed(
            2
          )}%`,
          threshold: activeThresholds.maxErrorRate,
          current: realtimeMetrics.errorRate,
          timestamp: new Date().toISOString(),
        });
      }

      const alertStatus: AlertStatus = {
        tenantId: currentTenantId || undefined,
        timestamp: new Date().toISOString(),
        isHealthy: alerts.length === 0,
        activeAlerts: alerts,
        alertCount: alerts.length,
        severity: this.calculateOverallSeverity(alerts),
      };

      this.logger.info('告警状态检查完成', {
        tenantId: currentTenantId || undefined,
        isHealthy: alertStatus.isHealthy,
        alertCount: alerts.length,
        severity: alertStatus.severity,
      });

      return alertStatus;
    } catch (error) {
      this.logger.error('获取告警状态失败', {
        error: (error as Error).message,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 清理过期监控数据
   *
   * @description 清理超过保留期的监控数据
   *
   * @param tenantId 租户ID（可选）
   * @returns 清理结果
   */
  async cleanupExpiredMetrics(tenantId?: string): Promise<CleanupResult> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const cutoffTime =
        Date.now() - this.metricsRetentionDays * 24 * 60 * 60 * 1000;

      // 清理实时指标
      const realtimePattern = await this.generateRealtimeMetricsPattern(
        currentTenantId || 'default'
      );
      const realtimeKeys = await this.cacheService.keys(realtimePattern);

      let cleanedRealtime = 0;
      for (const key of realtimeKeys) {
        const timestamp = this.extractTimestampFromKey(key);
        if (timestamp < cutoffTime) {
          await this.cacheService.delete(key);
          cleanedRealtime++;
        }
      }

      // 清理历史指标
      const historicalPattern = await this.generateHistoricalMetricsPattern(
        currentTenantId || 'default'
      );
      const historicalKeys = await this.cacheService.keys(historicalPattern);

      let cleanedHistorical = 0;
      for (const key of historicalKeys) {
        const timestamp = this.extractTimestampFromKey(key);
        if (timestamp < cutoffTime) {
          await this.cacheService.delete(key);
          cleanedHistorical++;
        }
      }

      const result: CleanupResult = {
        tenantId: currentTenantId || undefined,
        cutoffTime: new Date(cutoffTime).toISOString(),
        realtimeKeysCleaned: cleanedRealtime,
        historicalKeysCleaned: cleanedHistorical,
        totalKeysCleaned: cleanedRealtime + cleanedHistorical,
      };

      this.logger.info('过期监控数据清理完成', result);

      return result;
    } catch (error) {
      this.logger.error('清理过期监控数据失败', {
        error: (error as Error).message,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 更新实时指标
   */
  private async updateRealtimeMetrics(
    tenantId: string,
    timeSlot: number,
    metrics: Partial<RealtimeMetrics>
  ): Promise<void> {
    try {
      const key = await this.generateRealtimeMetricsKey(tenantId, timeSlot);
      const existing = await this.cacheService.get<RealtimeMetrics>(key);

      const updated = existing
        ? {
            ...existing,
            messagesProcessed:
              (existing.messagesProcessed || 0) +
              (metrics.messagesProcessed || 0),
            totalProcessingTime:
              (existing.totalProcessingTime || 0) +
              (metrics.totalProcessingTime || 0),
            totalMessageSize:
              (existing.totalMessageSize || 0) +
              (metrics.totalMessageSize || 0),
            successCount:
              (existing.successCount || 0) + (metrics.successCount || 0),
            failureCount:
              (existing.failureCount || 0) + (metrics.failureCount || 0),
            retryCount: (existing.retryCount || 0) + (metrics.retryCount || 0),
            timestamp: Date.now(),
          }
        : {
            tenantId,
            timeSlot,
            timestamp: Date.now(),
            ...metrics,
            messagesProcessed: metrics.messagesProcessed || 0,
            totalProcessingTime: metrics.totalProcessingTime || 0,
            totalMessageSize: metrics.totalMessageSize || 0,
            successCount: metrics.successCount || 0,
            failureCount: metrics.failureCount || 0,
            retryCount: metrics.retryCount || 0,
          };

      await this.cacheService.set(key, updated, this.cacheTTL);
    } catch (error) {
      this.logger.warn('更新实时指标失败', {
        error: (error as Error).message,
        tenantId,
        timeSlot,
      });
    }
  }

  /**
   * 更新历史指标
   */
  private async updateHistoricalMetrics(
    tenantId: string,
    timeSlot: number,
    metrics: HistoricalDataPoint
  ): Promise<void> {
    try {
      const key = await this.generateHistoricalMetricsKey(tenantId, timeSlot);
      const existing =
        (await this.cacheService.get<HistoricalDataPoint[]>(key)) || [];

      existing.push(metrics);

      // 保持每个时间槽最多100个数据点
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }

      await this.cacheService.set(key, existing, this.cacheTTL * 60); // 历史数据保存更久
    } catch (error) {
      this.logger.warn('更新历史指标失败', {
        error: (error as Error).message,
        tenantId,
        timeSlot,
      });
    }
  }

  /**
   * 更新队列实时指标
   */
  private async updateQueueRealtimeMetrics(
    tenantId: string,
    queueName: string,
    timeSlot: number,
    metrics: QueueMetrics
  ): Promise<void> {
    try {
      const key = await this.generateQueueMetricsKey(
        tenantId,
        queueName,
        timeSlot
      );
      await this.cacheService.set(
        key,
        {
          ...metrics,
          timestamp: Date.now(),
          timeSlot,
        },
        this.cacheTTL
      );
    } catch (error) {
      this.logger.warn('更新队列实时指标失败', {
        error: (error as Error).message,
        tenantId,
        queueName,
        timeSlot,
      });
    }
  }

  /**
   * 更新队列历史指标
   */
  private async updateQueueHistoricalMetrics(
    tenantId: string,
    queueName: string,
    timeSlot: number,
    metrics: QueueMetrics
  ): Promise<void> {
    try {
      const key = await this.generateQueueHistoricalKey(
        tenantId,
        queueName,
        timeSlot
      );
      const existing = (await this.cacheService.get<QueueMetrics[]>(key)) || [];

      existing.push({
        ...metrics,
        timestamp: Date.now(),
        timeSlot,
      });

      if (existing.length > 50) {
        existing.splice(0, existing.length - 50);
      }

      await this.cacheService.set(key, existing, this.cacheTTL * 60);
    } catch (error) {
      this.logger.warn('更新队列历史指标失败', {
        error: (error as Error).message,
        tenantId,
        queueName,
        timeSlot,
      });
    }
  }

  /**
   * 更新错误实时指标
   */
  private async updateErrorRealtimeMetrics(
    tenantId: string,
    timeSlot: number,
    errorMetrics: ErrorMetrics
  ): Promise<void> {
    try {
      const key = await this.generateErrorMetricsKey(tenantId, timeSlot);
      const existing = (await this.cacheService.get<ErrorMetrics[]>(key)) || [];

      existing.push(errorMetrics);

      // 保持最近100个错误
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }

      await this.cacheService.set(key, existing, this.cacheTTL * 10); // 错误数据保存10分钟
    } catch (error) {
      this.logger.warn('更新错误实时指标失败', {
        error: (error as Error).message,
        tenantId,
        timeSlot,
      });
    }
  }

  /**
   * 更新错误历史指标
   */
  private async updateErrorHistoricalMetrics(
    tenantId: string,
    timeSlot: number,
    errorMetrics: ErrorMetrics
  ): Promise<void> {
    try {
      const key = await this.generateErrorHistoricalKey(tenantId, timeSlot);
      const existing = (await this.cacheService.get<ErrorMetrics[]>(key)) || [];

      existing.push(errorMetrics);

      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }

      await this.cacheService.set(key, existing, this.cacheTTL * 1440); // 错误历史保存24小时
    } catch (error) {
      this.logger.warn('更新错误历史指标失败', {
        error: (error as Error).message,
        tenantId,
        timeSlot,
      });
    }
  }

  /**
   * 获取时间槽
   */
  private getTimeSlot(timestamp: number): number {
    return Math.floor(timestamp / (this.cacheTTL * 1000));
  }

  /**
   * 获取时间范围内的所有时间槽
   */
  private getTimeSlotsInRange(
    now: number,
    timeRangeMinutes: number,
    granularityMinutes?: number
  ): number[] {
    const granularity = granularityMinutes || this.cacheTTL / 60;
    const slots: number[] = [];
    const endSlot = this.getTimeSlot(now);
    const startSlot = this.getTimeSlot(now - timeRangeMinutes * 60 * 1000);

    for (let slot = startSlot; slot <= endSlot; slot++) {
      slots.push(slot);
    }

    return slots;
  }

  /**
   * 生成缓存键
   */
  private async generateRealtimeMetricsKey(
    tenantId: string,
    timeSlot: number
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}realtime:${timeSlot}`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:realtime:${timeSlot}`;
    }
  }

  private async generateHistoricalMetricsKey(
    tenantId: string,
    timeSlot: number
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}historical:${timeSlot}`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:historical:${timeSlot}`;
    }
  }

  private async generateQueueMetricsKey(
    tenantId: string,
    queueName: string,
    timeSlot: number
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}queue:${queueName}:${timeSlot}`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:queue:${queueName}:${timeSlot}`;
    }
  }

  private async generateQueueHistoricalKey(
    tenantId: string,
    queueName: string,
    timeSlot: number
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}queue-historical:${queueName}:${timeSlot}`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:queue-historical:${queueName}:${timeSlot}`;
    }
  }

  private async generateErrorMetricsKey(
    tenantId: string,
    timeSlot: number
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}errors:${timeSlot}`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:errors:${timeSlot}`;
    }
  }

  private async generateErrorHistoricalKey(
    tenantId: string,
    timeSlot: number
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}errors-historical:${timeSlot}`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:errors-historical:${timeSlot}`;
    }
  }

  private async generateRealtimeMetricsPattern(
    tenantId: string
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}realtime:*`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:realtime:*`;
    }
  }

  private async generateHistoricalMetricsPattern(
    tenantId: string
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}historical:*`,
        tenantId
      );
    } catch (error) {
      return `${this.keyPrefix}${tenantId}:historical:*`;
    }
  }

  private extractTimestampFromKey(key: string): number {
    const match = key.match(/:(\d+)$/);
    return match ? parseInt(match[1]) * (this.cacheTTL * 1000) : 0;
  }

  // 其他辅助方法的实现...
  private async getRealtimeMetricsForSlot(
    tenantId: string,
    timeSlot: number
  ): Promise<RealtimeMetrics | null> {
    const key = await this.generateRealtimeMetricsKey(tenantId, timeSlot);
    return await this.cacheService.get<RealtimeMetrics>(key);
  }

  private async getHistoricalDataPoint(
    tenantId: string,
    timeSlot: number
  ): Promise<HistoricalDataPoint | null> {
    const key = await this.generateHistoricalMetricsKey(tenantId, timeSlot);
    const data = await this.cacheService.get<HistoricalDataPoint[]>(key);
    return data && data.length > 0 ? data[data.length - 1] : null;
  }

  private mergeRealtimeMetrics(
    target: RealtimeMetrics,
    source: RealtimeMetrics
  ): void {
    target.messagesProcessed += source.messagesProcessed || 0;
    target.totalProcessingTime =
      (target.totalProcessingTime || 0) + (source.totalProcessingTime || 0);
    target.totalMessageSize =
      (target.totalMessageSize || 0) + (source.totalMessageSize || 0);
    target.successCount =
      (target.successCount || 0) + (source.successCount || 0);
    target.failureCount =
      (target.failureCount || 0) + (source.failureCount || 0);
    target.retryCount = (target.retryCount || 0) + (source.retryCount || 0);
  }

  private calculateDerivedMetrics(metrics: RealtimeMetrics): void {
    if (metrics.messagesProcessed > 0) {
      metrics.avgProcessingTime =
        (metrics.totalProcessingTime || 0) / metrics.messagesProcessed;
      metrics.throughput = metrics.messagesProcessed / (metrics.timeRange || 1);
      metrics.errorRate =
        (metrics.failureCount || 0) / metrics.messagesProcessed;
    }
  }

  private calculateErrorSeverity(
    error: Error,
    context: ErrorContext
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 简化的严重程度计算逻辑
    if (error.name === 'ValidationError') return 'low';
    if (error.name === 'ConnectionError') return 'high';
    if (error.name === 'AuthenticationError') return 'critical';
    return 'medium';
  }

  private getDefaultAlertThresholds(): AlertThresholds {
    return {
      maxThroughput: 1000,
      maxLatency: 5000,
      maxErrorRate: 0.05,
      maxQueueDepth: 10000,
    };
  }

  private calculateOverallSeverity(
    alerts: Alert[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (alerts.some((a) => a.severity === 'critical')) return 'critical';
    if (alerts.some((a) => a.severity === 'high')) return 'high';
    if (alerts.some((a) => a.severity === 'medium')) return 'medium';
    return 'low';
  }

  private analyzeTrends(dataPoints: HistoricalDataPoint[]): TrendAnalysis {
    // 简化的趋势分析逻辑
    return {
      throughput: 'stable',
      latency: 'stable',
      errorRate: 'stable',
    };
  }

  private generatePredictions(dataPoints: HistoricalDataPoint[]): Predictions {
    // 简化的预测逻辑
    return {
      nextHourThroughput: 100,
      nextHourLatency: 1000,
      nextHourErrorRate: 0.01,
    };
  }
}

// 类型定义
interface RealtimeMetrics {
  tenantId?: string;
  timeRange?: number;
  timestamp: number;
  messagesProcessed: number;
  avgProcessingTime: number;
  throughput: number;
  errorRate: number;
  queueDepths: Record<string, number>;
  topErrors: ErrorMetrics[];
  performanceTrend: 'improving' | 'stable' | 'degrading';
  totalProcessingTime?: number;
  totalMessageSize?: number;
  successCount?: number;
  failureCount?: number;
  retryCount?: number;
}

interface QueueMetrics {
  queueName: string;
  depth: number;
  throughput: number;
  avgLatency: number;
  consumerCount: number;
  timestamp: number;
  timeSlot?: number;
}

interface ErrorMetrics {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context: ErrorContext;
  tenantId?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorContext {
  messageId?: string;
  queueName?: string;
  consumerId?: string;
  retryCount?: number;
  additionalInfo?: Record<string, any>;
}

interface HistoricalDataPoint {
  messageId?: string;
  processingTime: number;
  messageSize: number;
  status: 'success' | 'failed' | 'retry';
  timestamp: number;
  timeSlot?: number;
}

interface HistoricalTrends {
  tenantId?: string;
  timeRange: number;
  granularity: number;
  timestamp: number;
  dataPoints: HistoricalDataPoint[];
  trends: TrendAnalysis;
  predictions: Predictions;
}

interface TrendAnalysis {
  throughput: 'increasing' | 'stable' | 'decreasing';
  latency: 'increasing' | 'stable' | 'decreasing';
  errorRate: 'increasing' | 'stable' | 'decreasing';
}

interface Predictions {
  nextHourThroughput: number;
  nextHourLatency: number;
  nextHourErrorRate: number;
}

interface AlertThresholds {
  maxThroughput: number;
  maxLatency: number;
  maxErrorRate: number;
  maxQueueDepth: number;
}

interface Alert {
  type: 'throughput' | 'latency' | 'error_rate' | 'queue_depth';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  current: number;
  timestamp: string;
}

interface AlertStatus {
  tenantId?: string;
  timestamp: string;
  isHealthy: boolean;
  activeAlerts: Alert[];
  alertCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CleanupResult {
  tenantId?: string;
  cutoffTime: string;
  realtimeKeysCleaned: number;
  historicalKeysCleaned: number;
  totalKeysCleaned: number;
}
