/**
 * 缓存统计服务
 *
 * @description 提供缓存统计信息的收集、分析和报告功能
 * 支持实时统计、历史统计、趋势分析等
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheMonitorService } from './cache-monitor.service';
import { CacheStats, TenantCacheStats } from '../types/cache.types';

/**
 * 统计时间窗口
 */
export interface StatsTimeWindow {
  start: Date;
  end: Date;
  duration: number; // 毫秒
}

/**
 * 统计摘要
 */
export interface StatsSummary {
  totalHits: number;
  totalMisses: number;
  averageHitRate: number;
  peakHitRate: number;
  totalKeys: number;
  averageLatency: number;
  peakLatency: number;
  errorCount: number;
  uptime: number;
}

/**
 * 租户统计摘要
 */
export interface TenantStatsSummary {
  tenantId: string;
  totalHits: number;
  totalMisses: number;
  averageHitRate: number;
  totalKeys: number;
  lastAccessed: Date;
  activeTime: number; // 活跃时间（毫秒）
}

/**
 * 趋势分析
 */
export interface TrendAnalysis {
  hitRateTrend: 'increasing' | 'decreasing' | 'stable';
  latencyTrend: 'increasing' | 'decreasing' | 'stable';
  keyCountTrend: 'increasing' | 'decreasing' | 'stable';
  errorTrend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-1
}

/**
 * 缓存统计服务
 *
 * @description 提供缓存统计信息的收集和分析功能
 */
@Injectable()
export class CacheStatsService {
  private readonly statsHistory: Array<{
    timestamp: Date;
    stats: CacheStats;
  }> = [];

  private readonly maxHistorySize = 1000; // 最大历史记录数
  private readonly startTime = Date.now();

  constructor(
    private readonly monitorService: CacheMonitorService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'cache-stats-service' });
  }

  /**
   * 记录统计快照
   *
   * @description 记录当前统计信息的快照
   */
  recordStatsSnapshot(): void {
    try {
      const stats = this.monitorService.getStats();
      this.statsHistory.push({
        timestamp: new Date(),
        stats: { ...stats, tenantStats: new Map(stats.tenantStats) },
      });

      // 保持历史记录大小
      if (this.statsHistory.length > this.maxHistorySize) {
        this.statsHistory.shift();
      }

      this.logger.debug('统计快照已记录', {
        historySize: this.statsHistory.length,
      });
    } catch (error) {
      this.logger.error('记录统计快照失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 获取统计摘要
   *
   * @description 获取指定时间窗口的统计摘要
   */
  getStatsSummary(timeWindow?: StatsTimeWindow): StatsSummary {
    try {
      const window = timeWindow || this.getDefaultTimeWindow();
      const relevantStats = this.getStatsInTimeWindow(window);

      if (relevantStats.length === 0) {
        return this.getEmptyStatsSummary();
      }

      const totalHits = relevantStats.reduce(
        (sum, entry) => sum + entry.stats.hits,
        0
      );
      const totalMisses = relevantStats.reduce(
        (sum, entry) => sum + entry.stats.misses,
        0
      );
      const totalKeys = relevantStats.reduce(
        (sum, entry) => sum + entry.stats.totalKeys,
        0
      );
      // const totalRequests = totalHits + totalMisses; // 暂时未使用

      const hitRates = relevantStats.map((entry) => entry.stats.hitRate);
      const averageHitRate =
        hitRates.reduce((sum, rate) => sum + rate, 0) / hitRates.length;
      const peakHitRate = Math.max(...hitRates);

      const latencies = relevantStats.map((entry) => entry.stats.memoryUsage); // 简化处理
      const averageLatency =
        latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
      const peakLatency = Math.max(...latencies);

      const uptime = Date.now() - this.startTime;

      return {
        totalHits,
        totalMisses,
        averageHitRate,
        peakHitRate,
        totalKeys,
        averageLatency,
        peakLatency,
        errorCount: 0, // 需要从健康检查获取
        uptime,
      };
    } catch (error) {
      this.logger.error('获取统计摘要失败', {
        error: (error as Error).message,
      });
      return this.getEmptyStatsSummary();
    }
  }

  /**
   * 获取租户统计摘要
   *
   * @description 获取指定租户的统计摘要
   */
  getTenantStatsSummary(
    tenantId: string,
    timeWindow?: StatsTimeWindow
  ): TenantStatsSummary | null {
    try {
      const window = timeWindow || this.getDefaultTimeWindow();
      const relevantStats = this.getStatsInTimeWindow(window);

      if (relevantStats.length === 0) {
        return null;
      }

      const tenantStats = relevantStats
        .map((entry) => entry.stats.tenantStats.get(tenantId))
        .filter(Boolean) as TenantCacheStats[];

      if (tenantStats.length === 0) {
        return null;
      }

      const totalHits = tenantStats.reduce((sum, stats) => sum + stats.hits, 0);
      const totalMisses = tenantStats.reduce(
        (sum, stats) => sum + stats.misses,
        0
      );
      const totalKeys = tenantStats.reduce(
        (sum, stats) => sum + stats.keyCount,
        0
      );

      const hitRates = tenantStats.map((stats) => stats.hitRate);
      const averageHitRate =
        hitRates.reduce((sum, rate) => sum + rate, 0) / hitRates.length;

      const lastAccessed = tenantStats[tenantStats.length - 1].lastAccessed;
      const activeTime = window.duration;

      return {
        tenantId,
        totalHits,
        totalMisses,
        averageHitRate,
        totalKeys,
        lastAccessed,
        activeTime,
      };
    } catch (error) {
      this.logger.error('获取租户统计摘要失败', {
        tenantId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 获取所有租户统计摘要
   *
   * @description 获取所有租户的统计摘要
   */
  getAllTenantStatsSummary(timeWindow?: StatsTimeWindow): TenantStatsSummary[] {
    try {
      const window = timeWindow || this.getDefaultTimeWindow();
      const relevantStats = this.getStatsInTimeWindow(window);

      if (relevantStats.length === 0) {
        return [];
      }

      // 收集所有租户ID
      const tenantIds = new Set<string>();
      relevantStats.forEach((entry) => {
        entry.stats.tenantStats.forEach((_, tenantId) => {
          tenantIds.add(tenantId);
        });
      });

      // 为每个租户生成统计摘要
      return Array.from(tenantIds)
        .map((tenantId) => this.getTenantStatsSummary(tenantId, window))
        .filter(Boolean) as TenantStatsSummary[];
    } catch (error) {
      this.logger.error('获取所有租户统计摘要失败', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * 获取趋势分析
   *
   * @description 分析缓存使用趋势
   */
  getTrendAnalysis(timeWindow?: StatsTimeWindow): TrendAnalysis {
    try {
      const window = timeWindow || this.getDefaultTimeWindow();
      const relevantStats = this.getStatsInTimeWindow(window);

      if (relevantStats.length < 2) {
        return {
          hitRateTrend: 'stable',
          latencyTrend: 'stable',
          keyCountTrend: 'stable',
          errorTrend: 'stable',
          confidence: 0,
        };
      }

      const hitRateTrend = this.analyzeTrend(
        relevantStats.map((entry) => entry.stats.hitRate)
      );

      const latencyTrend = this.analyzeTrend(
        relevantStats.map((entry) => entry.stats.memoryUsage)
      );

      const keyCountTrend = this.analyzeTrend(
        relevantStats.map((entry) => entry.stats.totalKeys)
      );

      const errorTrend = this.analyzeTrend(
        relevantStats.map(() => 0) // 简化处理
      );

      const confidence = Math.min(1, relevantStats.length / 10); // 基于样本数量

      return {
        hitRateTrend,
        latencyTrend,
        keyCountTrend,
        errorTrend,
        confidence,
      };
    } catch (error) {
      this.logger.error('获取趋势分析失败', {
        error: (error as Error).message,
      });
      return {
        hitRateTrend: 'stable',
        latencyTrend: 'stable',
        keyCountTrend: 'stable',
        errorTrend: 'stable',
        confidence: 0,
      };
    }
  }

  /**
   * 获取历史统计
   *
   * @description 获取指定时间窗口的历史统计
   */
  getHistoricalStats(timeWindow?: StatsTimeWindow): Array<{
    timestamp: Date;
    stats: CacheStats;
  }> {
    try {
      const window = timeWindow || this.getDefaultTimeWindow();
      return this.getStatsInTimeWindow(window);
    } catch (error) {
      this.logger.error('获取历史统计失败', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * 清除历史统计
   *
   * @description 清除指定时间窗口的历史统计
   */
  clearHistoricalStats(timeWindow?: StatsTimeWindow): void {
    try {
      if (timeWindow) {
        const startIndex = this.statsHistory.findIndex(
          (entry) => entry.timestamp >= timeWindow.start
        );
        const endIndex = this.statsHistory.findIndex(
          (entry) => entry.timestamp > timeWindow.end
        );

        if (startIndex !== -1) {
          const deleteCount =
            endIndex === -1
              ? this.statsHistory.length - startIndex
              : endIndex - startIndex;
          this.statsHistory.splice(startIndex, deleteCount);
        }
      } else {
        this.statsHistory.length = 0;
      }

      this.logger.info('历史统计已清除', {
        remainingEntries: this.statsHistory.length,
      });
    } catch (error) {
      this.logger.error('清除历史统计失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 获取时间窗口内的统计
   *
   * @description 获取指定时间窗口内的统计记录
   */
  private getStatsInTimeWindow(window: StatsTimeWindow): Array<{
    timestamp: Date;
    stats: CacheStats;
  }> {
    return this.statsHistory.filter(
      (entry) =>
        entry.timestamp >= window.start && entry.timestamp <= window.end
    );
  }

  /**
   * 获取默认时间窗口
   *
   * @description 获取默认的统计时间窗口（最近1小时）
   */
  private getDefaultTimeWindow(): StatsTimeWindow {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return {
      start: oneHourAgo,
      end: now,
      duration: 60 * 60 * 1000,
    };
  }

  /**
   * 分析趋势
   *
   * @description 分析数值序列的趋势
   */
  private analyzeTrend(
    values: number[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;

    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * 获取空统计摘要
   *
   * @description 获取空的统计摘要
   */
  private getEmptyStatsSummary(): StatsSummary {
    return {
      totalHits: 0,
      totalMisses: 0,
      averageHitRate: 0,
      peakHitRate: 0,
      totalKeys: 0,
      averageLatency: 0,
      peakLatency: 0,
      errorCount: 0,
      uptime: Date.now() - this.startTime,
    };
  }
}
