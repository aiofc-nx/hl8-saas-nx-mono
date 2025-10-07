/**
 * 事件监控器
 *
 * 提供完整的事件监控功能，包括事件统计、性能监控、错误追踪等。
 * 作为通用功能组件，为业务模块提供强大的事件监控能力。
 *
 * @description 事件监控的完整实现，支持实时监控和告警
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
// import { BaseDomainEvent } from '@hl8/hybrid-archi/domain/events/base/base-domain-event';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';

/**
 * 事件监控统计信息
 */
export interface EventMonitorStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByTenant: Record<string, number>;
  averageProcessingTime: number;
  errorRate: number;
  successRate: number;
  lastEventTime: Date;
  peakEventsPerSecond: number;
  currentEventsPerSecond: number;
}

/**
 * 事件处理性能指标
 */
export interface EventPerformanceMetrics {
  eventType: string;
  totalProcessed: number;
  averageProcessingTime: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  errorCount: number;
  successCount: number;
  lastProcessedAt: Date;
}

/**
 * 事件告警配置
 */
export interface EventAlertConfig {
  enabled: boolean;
  errorRateThreshold: number;
  processingTimeThreshold: number;
  eventsPerSecondThreshold: number;
  alertChannels: string[];
}

/**
 * 事件监控器
 *
 * 提供完整的事件监控功能
 */
@Injectable()
export class EventMonitor {
  private readonly stats: EventMonitorStats = {
    totalEvents: 0,
    eventsByType: {},
    eventsByTenant: {},
    averageProcessingTime: 0,
    errorRate: 0,
    successRate: 100,
    lastEventTime: new Date(),
    peakEventsPerSecond: 0,
    currentEventsPerSecond: 0,
  };

  private readonly performanceMetrics = new Map<
    string,
    EventPerformanceMetrics
  >();
  private readonly processingTimes: number[] = [];
  private readonly errorCounts = new Map<string, number>();
  private readonly successCounts = new Map<string, number>();

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    @Inject('EventAlertConfig') private readonly alertConfig: EventAlertConfig
  ) {}

  /**
   * 记录事件开始处理
   *
   * @description 记录事件开始处理的时间戳
   * @param event - 领域事件
   * @returns 处理ID
   */
  recordEventStart(event: any): string {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();

    // 缓存处理开始时间
    this.cacheService.set(
      `event:processing:${processingId}`,
      JSON.stringify({ startTime, eventType: event.eventType }),
      300 // 5分钟TTL
    );

    return processingId;
  }

  /**
   * 记录事件处理完成
   *
   * @description 记录事件处理完成，计算处理时间
   * @param processingId - 处理ID
   * @param success - 是否成功
   * @param error - 错误信息（如果有）
   */
  recordEventComplete(
    processingId: string,
    success: boolean,
    error?: Error
  ): void {
    try {
      const cached = this.cacheService.get(`event:processing:${processingId}`);
      if (!cached) {
        this.logger.warn('未找到处理记录', { processingId });
        return;
      }

      const processingData = JSON.parse(cached as unknown as string);
      const processingTime = Date.now() - processingData.startTime;
      const eventType = processingData.eventType;

      // 更新统计信息
      this.updateStats(eventType, processingTime, success);

      // 更新性能指标
      this.updatePerformanceMetrics(eventType, processingTime, success);

      // 检查告警条件
      this.checkAlerts(eventType, processingTime, success, error);

      // 清理缓存
      this.cacheService.delete(`event:processing:${processingId}`);

      this.logger.debug('事件处理完成', {
        processingId,
        eventType,
        processingTime,
        success,
      });
    } catch (error) {
      this.logger.error('记录事件处理完成失败', error, { processingId });
    }
  }

  /**
   * 记录事件错误
   *
   * @description 记录事件处理过程中的错误
   * @param event - 领域事件
   * @param error - 错误信息
   */
  recordEventError(event: any, error: Error): void {
    const eventType = event.eventType;
    const errorCount = this.errorCounts.get(eventType) || 0;
    this.errorCounts.set(eventType, errorCount + 1);

    this.logger.error('事件处理错误', error, {
      eventType,
      eventId: event.eventId.toString(),
      aggregateId: event.aggregateId.toString(),
      tenantId: event.tenantId,
    });

    // 检查错误率告警
    this.checkErrorRateAlert(eventType);
  }

  /**
   * 获取事件统计信息
   *
   * @description 获取当前的事件统计信息
   * @returns 统计信息
   */
  getStats(): EventMonitorStats {
    return { ...this.stats };
  }

  /**
   * 获取性能指标
   *
   * @description 获取指定事件类型的性能指标
   * @param eventType - 事件类型
   * @returns 性能指标
   */
  getPerformanceMetrics(eventType: string): EventPerformanceMetrics | null {
    return this.performanceMetrics.get(eventType) || null;
  }

  /**
   * 获取所有性能指标
   *
   * @description 获取所有事件类型的性能指标
   * @returns 性能指标映射
   */
  getAllPerformanceMetrics(): Map<string, EventPerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * 重置统计信息
   *
   * @description 重置所有统计信息
   */
  resetStats(): void {
    this.stats.totalEvents = 0;
    this.stats.eventsByType = {};
    this.stats.eventsByTenant = {};
    this.stats.averageProcessingTime = 0;
    this.stats.errorRate = 0;
    this.stats.successRate = 100;
    this.stats.lastEventTime = new Date();
    this.stats.peakEventsPerSecond = 0;
    this.stats.currentEventsPerSecond = 0;

    this.performanceMetrics.clear();
    this.processingTimes.length = 0;
    this.errorCounts.clear();
    this.successCounts.clear();

    this.logger.info('事件监控统计信息已重置');
  }

  /**
   * 设置告警配置
   *
   * @description 更新告警配置
   * @param config - 告警配置
   */
  setAlertConfig(config: EventAlertConfig): void {
    this.alertConfig.enabled = config.enabled;
    this.alertConfig.errorRateThreshold = config.errorRateThreshold;
    this.alertConfig.processingTimeThreshold = config.processingTimeThreshold;
    this.alertConfig.eventsPerSecondThreshold = config.eventsPerSecondThreshold;
    this.alertConfig.alertChannels = config.alertChannels;

    this.logger.info('事件监控告警配置已更新', { config });
  }

  // ==================== 私有方法 ====================

  /**
   * 生成处理ID
   */
  private generateProcessingId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新统计信息
   */
  private updateStats(
    eventType: string,
    processingTime: number,
    success: boolean
  ): void {
    // 更新总数
    this.stats.totalEvents++;

    // 更新事件类型统计
    this.stats.eventsByType[eventType] =
      (this.stats.eventsByType[eventType] || 0) + 1;

    // 更新处理时间
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift(); // 保持最近1000个处理时间
    }

    // 计算平均处理时间
    this.stats.averageProcessingTime =
      this.processingTimes.reduce((sum, time) => sum + time, 0) /
      this.processingTimes.length;

    // 更新错误率
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    this.stats.errorRate = (totalErrors / this.stats.totalEvents) * 100;
    this.stats.successRate = 100 - this.stats.errorRate;

    // 更新最后事件时间
    this.stats.lastEventTime = new Date();

    // 计算当前事件处理速率
    this.calculateCurrentEventsPerSecond();
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(
    eventType: string,
    processingTime: number,
    success: boolean
  ): void {
    let metrics = this.performanceMetrics.get(eventType);
    if (!metrics) {
      metrics = {
        eventType,
        totalProcessed: 0,
        averageProcessingTime: 0,
        minProcessingTime: Infinity,
        maxProcessingTime: 0,
        errorCount: 0,
        successCount: 0,
        lastProcessedAt: new Date(),
      };
    }

    metrics.totalProcessed++;
    metrics.lastProcessedAt = new Date();

    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }

    // 更新处理时间统计
    metrics.minProcessingTime = Math.min(
      metrics.minProcessingTime,
      processingTime
    );
    metrics.maxProcessingTime = Math.max(
      metrics.maxProcessingTime,
      processingTime
    );
    metrics.averageProcessingTime =
      (metrics.averageProcessingTime * (metrics.totalProcessed - 1) +
        processingTime) /
      metrics.totalProcessed;

    this.performanceMetrics.set(eventType, metrics);
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(
    eventType: string,
    processingTime: number,
    success: boolean,
    error?: Error
  ): void {
    if (!this.alertConfig.enabled) {
      return;
    }

    // 检查处理时间告警
    if (processingTime > this.alertConfig.processingTimeThreshold) {
      this.triggerAlert('processing_time', {
        eventType,
        processingTime,
        threshold: this.alertConfig.processingTimeThreshold,
      });
    }

    // 检查错误率告警
    if (!success) {
      this.checkErrorRateAlert(eventType);
    }

    // 检查事件处理速率告警
    if (
      this.stats.currentEventsPerSecond >
      this.alertConfig.eventsPerSecondThreshold
    ) {
      this.triggerAlert('high_event_rate', {
        currentRate: this.stats.currentEventsPerSecond,
        threshold: this.alertConfig.eventsPerSecondThreshold,
      });
    }
  }

  /**
   * 检查错误率告警
   */
  private checkErrorRateAlert(eventType: string): void {
    const metrics = this.performanceMetrics.get(eventType);
    if (!metrics) {
      return;
    }

    const errorRate = (metrics.errorCount / metrics.totalProcessed) * 100;
    if (errorRate > this.alertConfig.errorRateThreshold) {
      this.triggerAlert('high_error_rate', {
        eventType,
        errorRate,
        threshold: this.alertConfig.errorRateThreshold,
        totalProcessed: metrics.totalProcessed,
        errorCount: metrics.errorCount,
      });
    }
  }

  /**
   * 触发告警
   */
  private triggerAlert(alertType: string, data: any): void {
    this.logger.warn('事件监控告警', {
      alertType,
      data,
      timestamp: new Date(),
    });

    // 这里可以集成具体的告警系统
    // 例如：发送邮件、短信、Slack通知等
    console.log(`事件监控告警: ${alertType}`, data);
  }

  /**
   * 计算当前事件处理速率
   */
  private calculateCurrentEventsPerSecond(): void {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // 这里应该实现更精确的速率计算
    // 实际实现中会使用滑动窗口算法
    this.stats.currentEventsPerSecond = this.stats.totalEvents;

    if (this.stats.currentEventsPerSecond > this.stats.peakEventsPerSecond) {
      this.stats.peakEventsPerSecond = this.stats.currentEventsPerSecond;
    }
  }
}
