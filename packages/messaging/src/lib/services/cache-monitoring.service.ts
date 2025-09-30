import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { MessagingCacheConfig } from '../types/messaging.types';

/**
 * 缓存监控和指标收集服务
 *
 * @description 专门负责监控和收集所有缓存相关的性能指标
 * 提供缓存健康状态检查、性能指标收集、告警管理等功能
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class CacheHealthService {
 *   constructor(
 *     private readonly cacheMonitoring: CacheMonitoringService
 *   ) {}
 *
 *   async checkCacheHealth() {
 *     return await this.cacheMonitoring.getOverallHealthStatus();
 *   }
 * }
 * ```
 */
@Injectable()
export class CacheMonitoringService {
  private readonly logger = new PinoLogger();
  private readonly keyPrefix: string;
  private readonly monitoringInterval: number = 60000; // 1分钟
  private monitoringTimer?: NodeJS.Timeout;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly cacheConfig: MessagingCacheConfig
  ) {
    this.logger.setContext({ requestId: 'cache-monitoring-service' });
    this.keyPrefix =
      this.cacheConfig.keyPrefix || 'hl8:messaging:cache:monitoring:';
  }

  /**
   * 启动缓存监控
   *
   * @description 启动定时监控，收集缓存性能指标
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringTimer) {
      this.logger.warn('缓存监控已在运行中');
      return;
    }

    this.logger.info('启动缓存监控服务');

    this.monitoringTimer = setInterval(async () => {
      try {
        await this.collectCacheMetrics();
      } catch (error) {
        this.logger.error('收集缓存指标失败', {
          error: (error as Error).message,
        });
      }
    }, this.monitoringInterval);

    this.logger.info('缓存监控服务已启动', {
      interval: this.monitoringInterval,
    });
  }

  /**
   * 停止缓存监控
   *
   * @description 停止定时监控服务
   */
  async stopMonitoring(): Promise<void> {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
      this.logger.info('缓存监控服务已停止');
    }
  }

  /**
   * 收集缓存指标
   *
   * @description 收集所有缓存相关的性能指标
   */
  async collectCacheMetrics(): Promise<CacheMetrics> {
    try {
      const timestamp = Date.now();
      const tenantId = this.tenantContextService.getTenant();

      const metrics: CacheMetrics = {
        timestamp,
        tenantId: tenantId || undefined,
        cacheStats: await this.getCacheStats(),
        memoryUsage: await this.getMemoryUsage(),
        operationCounts: await this.getOperationCounts(),
        errorRates: await this.getErrorRates(),
        hitRates: await this.getHitRates(),
        latencyMetrics: await this.getLatencyMetrics(),
        connectionStatus: await this.getConnectionStatus(),
      };

      // 存储指标到缓存
      await this.storeMetrics(metrics);

      this.logger.debug('缓存指标收集完成', {
        timestamp,
        tenantId: tenantId || undefined,
        cacheStats: metrics.cacheStats,
      });

      return metrics;
    } catch (error) {
      this.logger.error('收集缓存指标失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取缓存健康状态
   *
   * @description 检查缓存系统的整体健康状态
   */
  async getOverallHealthStatus(): Promise<CacheHealthStatus> {
    try {
      const timestamp = Date.now();
      const tenantId = this.tenantContextService.getTenant();

      // 检查各个组件的健康状态
      const healthChecks = await Promise.allSettled([
        this.checkCacheConnectionHealth(),
        this.checkMemoryHealth(),
        this.checkPerformanceHealth(),
        this.checkErrorRateHealth(),
      ]);

      const connectionHealth =
        healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : false;
      const memoryHealth =
        healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : false;
      const performanceHealth =
        healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : false;
      const errorRateHealth =
        healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : false;

      const overallHealth =
        connectionHealth &&
        memoryHealth &&
        performanceHealth &&
        errorRateHealth;

      const status: CacheHealthStatus = {
        timestamp,
        tenantId: tenantId || undefined,
        overallHealth,
        components: {
          connection: connectionHealth,
          memory: memoryHealth,
          performance: performanceHealth,
          errorRate: errorRateHealth,
        },
        issues: this.identifyIssues({
          connection: connectionHealth,
          memory: memoryHealth,
          performance: performanceHealth,
          errorRate: errorRateHealth,
        }),
        recommendations: this.generateRecommendations({
          connection: connectionHealth,
          memory: memoryHealth,
          performance: performanceHealth,
          errorRate: errorRateHealth,
        }),
      };

      this.logger.info('缓存健康状态检查完成', {
        overallHealth,
        issues: status.issues.length,
        recommendations: status.recommendations.length,
      });

      return status;
    } catch (error) {
      this.logger.error('获取缓存健康状态失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取缓存性能报告
   *
   * @description 生成详细的缓存性能报告
   */
  async getPerformanceReport(
    timeRange = 3600000
  ): Promise<CachePerformanceReport> {
    try {
      const timestamp = Date.now();
      const tenantId = this.tenantContextService.getTenant();

      // 获取历史指标数据
      const historicalMetrics = await this.getHistoricalMetrics(timeRange);

      const report: CachePerformanceReport = {
        timestamp,
        tenantId: tenantId || undefined,
        timeRange,
        summary: {
          avgHitRate: this.calculateAverageHitRate(historicalMetrics),
          avgLatency: this.calculateAverageLatency(historicalMetrics),
          totalOperations: this.calculateTotalOperations(historicalMetrics),
          errorRate: this.calculateErrorRate(historicalMetrics),
          memoryEfficiency: this.calculateMemoryEfficiency(historicalMetrics),
        },
        trends: {
          hitRateTrend: this.analyzeHitRateTrend(historicalMetrics),
          latencyTrend: this.analyzeLatencyTrend(historicalMetrics),
          memoryTrend: this.analyzeMemoryTrend(historicalMetrics),
          operationTrend: this.analyzeOperationTrend(historicalMetrics),
        },
        recommendations:
          this.generatePerformanceRecommendations(historicalMetrics),
        detailedMetrics: historicalMetrics,
      };

      this.logger.info('缓存性能报告生成完成', {
        timeRange,
        avgHitRate: report.summary.avgHitRate,
        avgLatency: report.summary.avgLatency,
        totalOperations: report.summary.totalOperations,
      });

      return report;
    } catch (error) {
      this.logger.error('获取缓存性能报告失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取缓存统计信息
   */
  private async getCacheStats(): Promise<CacheStats> {
    try {
      // 获取缓存键的数量
      const pattern = await this.generateCacheKeyPattern();
      const keys = await this.cacheService.keys(pattern);

      return {
        totalKeys: keys.length,
        memoryUsage: await this.getMemoryUsage(),
        connectionStatus: await this.getConnectionStatus(),
      };
    } catch (error) {
      this.logger.warn('获取缓存统计失败', {
        error: (error as Error).message,
      });
      return {
        totalKeys: 0,
        memoryUsage: {
          used: 0,
          available: 0,
          percentage: 0,
          total: 0,
          external: 0,
          rss: 0,
        },
        connectionStatus: false,
      };
    }
  }

  /**
   * 获取内存使用情况
   */
  private async getMemoryUsage(): Promise<MemoryUsage> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const availableMemory = totalMemory - usedMemory;
      const percentage = (usedMemory / totalMemory) * 100;

      return {
        used: usedMemory,
        available: availableMemory,
        total: totalMemory,
        percentage: Math.round(percentage * 100) / 100,
        external: memUsage.external,
        rss: memUsage.rss,
      };
    } catch (error) {
      this.logger.warn('获取内存使用情况失败', {
        error: (error as Error).message,
      });
      return {
        used: 0,
        available: 0,
        total: 0,
        percentage: 0,
        external: 0,
        rss: 0,
      };
    }
  }

  /**
   * 获取操作计数
   */
  private async getOperationCounts(): Promise<OperationCounts> {
    try {
      const statsKey = await this.generateStatsKey('operation_counts');
      const counts = (await this.cacheService.get<OperationCounts>(
        statsKey
      )) || {
        reads: 0,
        writes: 0,
        deletes: 0,
        hits: 0,
        misses: 0,
      };

      return counts;
    } catch (error) {
      this.logger.warn('获取操作计数失败', {
        error: (error as Error).message,
      });
      return {
        reads: 0,
        writes: 0,
        deletes: 0,
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * 获取错误率
   */
  private async getErrorRates(): Promise<ErrorRates> {
    try {
      const statsKey = await this.generateStatsKey('error_rates');
      const rates = (await this.cacheService.get<ErrorRates>(statsKey)) || {
        connectionErrors: 0,
        timeoutErrors: 0,
        memoryErrors: 0,
        operationErrors: 0,
        totalErrors: 0,
      };

      return rates;
    } catch (error) {
      this.logger.warn('获取错误率失败', {
        error: (error as Error).message,
      });
      return {
        connectionErrors: 0,
        timeoutErrors: 0,
        memoryErrors: 0,
        operationErrors: 0,
        totalErrors: 0,
      };
    }
  }

  /**
   * 获取命中率
   */
  private async getHitRates(): Promise<HitRates> {
    try {
      const operationCounts = await this.getOperationCounts();
      const totalReads = operationCounts.reads;
      const hits = operationCounts.hits;
      const misses = operationCounts.misses;

      const hitRate = totalReads > 0 ? hits / totalReads : 0;
      const missRate = totalReads > 0 ? misses / totalReads : 0;

      return {
        hitRate: Math.round(hitRate * 10000) / 100, // 百分比，保留2位小数
        missRate: Math.round(missRate * 10000) / 100,
        totalReads,
        hits,
        misses,
      };
    } catch (error) {
      this.logger.warn('获取命中率失败', {
        error: (error as Error).message,
      });
      return {
        hitRate: 0,
        missRate: 0,
        totalReads: 0,
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * 获取延迟指标
   */
  private async getLatencyMetrics(): Promise<LatencyMetrics> {
    try {
      const statsKey = await this.generateStatsKey('latency_metrics');
      const metrics = (await this.cacheService.get<LatencyMetrics>(
        statsKey
      )) || {
        avgReadLatency: 0,
        avgWriteLatency: 0,
        avgDeleteLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
      };

      return metrics;
    } catch (error) {
      this.logger.warn('获取延迟指标失败', {
        error: (error as Error).message,
      });
      return {
        avgReadLatency: 0,
        avgWriteLatency: 0,
        avgDeleteLatency: 0,
        maxLatency: 0,
        minLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
      };
    }
  }

  /**
   * 获取连接状态
   */
  private async getConnectionStatus(): Promise<boolean> {
    try {
      // 尝试执行一个简单的操作来检查连接状态
      const testKey = await this.generateTestKey();
      await this.cacheService.set(testKey, 'test', 1);
      await this.cacheService.get(testKey);
      await this.cacheService.delete(testKey);
      return true;
    } catch (error) {
      this.logger.warn('缓存连接检查失败', {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * 存储指标到缓存
   */
  private async storeMetrics(metrics: CacheMetrics): Promise<void> {
    try {
      const key = await this.generateMetricsKey(metrics.timestamp);
      await this.cacheService.set(key, metrics, 3600); // 保存1小时
    } catch (error) {
      this.logger.warn('存储缓存指标失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 获取历史指标
   */
  private async getHistoricalMetrics(
    timeRange: number
  ): Promise<CacheMetrics[]> {
    try {
      const endTime = Date.now();
      const startTime = endTime - timeRange;
      const pattern = await this.generateMetricsPattern();
      const keys = await this.cacheService.keys(pattern);

      const metrics: CacheMetrics[] = [];
      for (const key of keys) {
        try {
          const metricsData = await this.cacheService.get<CacheMetrics>(key);
          if (metricsData && metricsData.timestamp >= startTime) {
            metrics.push(metricsData);
          }
        } catch (error) {
          // 忽略单个指标的读取错误
        }
      }

      return metrics.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      this.logger.warn('获取历史指标失败', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  // 健康检查方法
  private async checkCacheConnectionHealth(): Promise<boolean> {
    return await this.getConnectionStatus();
  }

  private async checkMemoryHealth(): Promise<boolean> {
    const memoryUsage = await this.getMemoryUsage();
    return memoryUsage.percentage < 90; // 内存使用率低于90%认为健康
  }

  private async checkPerformanceHealth(): Promise<boolean> {
    const latencyMetrics = await this.getLatencyMetrics();
    return latencyMetrics.avgReadLatency < 100; // 平均读取延迟低于100ms认为健康
  }

  private async checkErrorRateHealth(): Promise<boolean> {
    const errorRates = await this.getErrorRates();
    return errorRates.totalErrors < 10; // 总错误数少于10个认为健康
  }

  // 问题识别和推荐生成方法
  private identifyIssues(components: unknown): string[] {
    const issues: string[] = [];

    if (!(components as any).connection) {
      issues.push('缓存连接不可用');
    }
    if (!(components as any).memory) {
      issues.push('内存使用率过高');
    }
    if (!(components as any).performance) {
      issues.push('缓存性能下降');
    }
    if (!(components as any).errorRate) {
      issues.push('错误率过高');
    }

    return issues;
  }

  private generateRecommendations(components: unknown): string[] {
    const recommendations: string[] = [];

    if (!(components as any).connection) {
      recommendations.push('检查Redis连接配置和网络状态');
    }
    if (!(components as any).memory) {
      recommendations.push('考虑增加内存或清理过期缓存数据');
    }
    if (!(components as any).performance) {
      recommendations.push('优化缓存键设计或增加缓存服务器');
    }
    if (!(components as any).errorRate) {
      recommendations.push('检查应用程序逻辑和缓存操作');
    }

    return recommendations;
  }

  private generatePerformanceRecommendations(
    metrics: CacheMetrics[]
  ): string[] {
    const recommendations: string[] = [];
    const avgHitRate = this.calculateAverageHitRate(metrics);
    const avgLatency = this.calculateAverageLatency(metrics);

    if (avgHitRate < 0.8) {
      recommendations.push('缓存命中率较低，建议优化缓存策略');
    }
    if (avgLatency > 50) {
      recommendations.push('缓存延迟较高，建议检查网络和服务器性能');
    }

    return recommendations;
  }

  // 计算方法
  private calculateAverageHitRate(metrics: CacheMetrics[]): number {
    if (metrics.length === 0) return 0;
    const totalHitRate = metrics.reduce(
      (sum, m) => sum + m.hitRates.hitRate,
      0
    );
    return totalHitRate / metrics.length;
  }

  private calculateAverageLatency(metrics: CacheMetrics[]): number {
    if (metrics.length === 0) return 0;
    const totalLatency = metrics.reduce(
      (sum, m) => sum + m.latencyMetrics.avgReadLatency,
      0
    );
    return totalLatency / metrics.length;
  }

  private calculateTotalOperations(metrics: CacheMetrics[]): number {
    return metrics.reduce(
      (sum, m) => sum + m.operationCounts.reads + m.operationCounts.writes,
      0
    );
  }

  private calculateErrorRate(metrics: CacheMetrics[]): number {
    if (metrics.length === 0) return 0;
    const totalErrors = metrics.reduce(
      (sum, m) => sum + m.errorRates.totalErrors,
      0
    );
    const totalOperations = this.calculateTotalOperations(metrics);
    return totalOperations > 0 ? totalErrors / totalOperations : 0;
  }

  private calculateMemoryEfficiency(metrics: CacheMetrics[]): number {
    if (metrics.length === 0) return 0;
    const totalMemory = metrics.reduce(
      (sum, m) => sum + m.memoryUsage.total,
      0
    );
    const totalUsed = metrics.reduce((sum, m) => sum + m.memoryUsage.used, 0);
    return totalMemory > 0 ? totalUsed / totalMemory : 0;
  }

  // 趋势分析方法
  private analyzeHitRateTrend(
    metrics: CacheMetrics[]
  ): 'improving' | 'stable' | 'degrading' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-3);
    const older = metrics.slice(0, -3);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = this.calculateAverageHitRate(recent);
    const olderAvg = this.calculateAverageHitRate(older);

    const diff = recentAvg - olderAvg;
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'degrading';
    return 'stable';
  }

  private analyzeLatencyTrend(
    metrics: CacheMetrics[]
  ): 'improving' | 'stable' | 'degrading' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-3);
    const older = metrics.slice(0, -3);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = this.calculateAverageLatency(recent);
    const olderAvg = this.calculateAverageLatency(older);

    const diff = recentAvg - olderAvg;
    if (diff < -10) return 'improving';
    if (diff > 10) return 'degrading';
    return 'stable';
  }

  private analyzeMemoryTrend(
    metrics: CacheMetrics[]
  ): 'increasing' | 'stable' | 'decreasing' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-3);
    const older = metrics.slice(0, -3);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg =
      recent.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) /
      older.length;

    const diff = recentAvg - olderAvg;
    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  }

  private analyzeOperationTrend(
    metrics: CacheMetrics[]
  ): 'increasing' | 'stable' | 'decreasing' {
    if (metrics.length < 2) return 'stable';

    const recent = metrics.slice(-3);
    const older = metrics.slice(0, -3);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentOps = recent.reduce(
      (sum, m) => sum + m.operationCounts.reads + m.operationCounts.writes,
      0
    );
    const olderOps = older.reduce(
      (sum, m) => sum + m.operationCounts.reads + m.operationCounts.writes,
      0
    );

    const diff = recentOps - olderOps;
    if (diff > 100) return 'increasing';
    if (diff < -100) return 'decreasing';
    return 'stable';
  }

  // 键生成方法
  private async generateCacheKeyPattern(): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}*`,
        this.tenantContextService.getTenant() || 'default'
      );
    } catch (error) {
      return `${this.keyPrefix}*`;
    }
  }

  private async generateStatsKey(type: string): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}stats:${type}`,
        this.tenantContextService.getTenant() || 'default'
      );
    } catch (error) {
      return `${this.keyPrefix}stats:${type}`;
    }
  }

  private async generateMetricsKey(timestamp: number): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}metrics:${timestamp}`,
        this.tenantContextService.getTenant() || 'default'
      );
    } catch (error) {
      return `${this.keyPrefix}metrics:${timestamp}`;
    }
  }

  private async generateMetricsPattern(): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}metrics:*`,
        this.tenantContextService.getTenant() || 'default'
      );
    } catch (error) {
      return `${this.keyPrefix}metrics:*`;
    }
  }

  private async generateTestKey(): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}test:${Date.now()}`,
        this.tenantContextService.getTenant() || 'default'
      );
    } catch (error) {
      return `${this.keyPrefix}test:${Date.now()}`;
    }
  }
}

// 类型定义
interface CacheMetrics {
  timestamp: number;
  tenantId?: string;
  cacheStats: CacheStats;
  memoryUsage: MemoryUsage;
  operationCounts: OperationCounts;
  errorRates: ErrorRates;
  hitRates: HitRates;
  latencyMetrics: LatencyMetrics;
  connectionStatus: boolean;
}

interface CacheStats {
  totalKeys: number;
  memoryUsage: MemoryUsage;
  connectionStatus: boolean;
}

interface MemoryUsage {
  used: number;
  available: number;
  total: number;
  percentage: number;
  external: number;
  rss: number;
}

interface OperationCounts {
  reads: number;
  writes: number;
  deletes: number;
  hits: number;
  misses: number;
}

interface ErrorRates {
  connectionErrors: number;
  timeoutErrors: number;
  memoryErrors: number;
  operationErrors: number;
  totalErrors: number;
}

interface HitRates {
  hitRate: number;
  missRate: number;
  totalReads: number;
  hits: number;
  misses: number;
}

interface LatencyMetrics {
  avgReadLatency: number;
  avgWriteLatency: number;
  avgDeleteLatency: number;
  maxLatency: number;
  minLatency: number;
  p95Latency: number;
  p99Latency: number;
}

interface CacheHealthStatus {
  timestamp: number;
  tenantId?: string;
  overallHealth: boolean;
  components: {
    connection: boolean;
    memory: boolean;
    performance: boolean;
    errorRate: boolean;
  };
  issues: string[];
  recommendations: string[];
}

interface CachePerformanceReport {
  timestamp: number;
  tenantId?: string;
  timeRange: number;
  summary: {
    avgHitRate: number;
    avgLatency: number;
    totalOperations: number;
    errorRate: number;
    memoryEfficiency: number;
  };
  trends: {
    hitRateTrend: 'improving' | 'stable' | 'degrading';
    latencyTrend: 'improving' | 'stable' | 'degrading';
    memoryTrend: 'increasing' | 'stable' | 'decreasing';
    operationTrend: 'increasing' | 'stable' | 'decreasing';
  };
  recommendations: string[];
  detailedMetrics: CacheMetrics[];
}
