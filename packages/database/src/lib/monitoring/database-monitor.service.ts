/**
 * 数据库监控服务
 *
 * @description 提供数据库性能监控、健康检查、统计收集等功能
 * 支持连接监控、查询监控、慢查询追踪等
 *
 * @fileoverview 数据库监控服务实现文件
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { DI_TOKENS, DATABASE_DEFAULTS } from '../constants';
import type {
  IDatabaseMonitor,
  DatabaseModuleOptions,
  ConnectionStatsInfo,
  QueryStatsInfo,
  SlowQuery,
  HealthStatus,
  MemoryUsage,
  DiskUsage,
  CPUUsage,
} from '../types';
import { ConnectionManager } from '../connection.manager';

/**
 * 数据库监控服务类
 *
 * @description 提供数据库的全面监控功能
 * 包括连接监控、查询性能监控、健康检查、资源使用监控等
 *
 * ## 业务规则
 *
 * ### 监控收集规则
 * - 定期收集数据库统计信息
 * - 记录所有慢查询
 * - 监控连接池使用情况
 * - 追踪事务执行情况
 *
 * ### 健康检查规则
 * - 定期执行数据库健康检查
 * - 检查数据库连接状态
 * - 检查查询响应时间
 * - 检查资源使用情况
 *
 * ### 告警触发规则
 * - 连接池使用率超过阈值时告警
 * - 慢查询超过阈值时告警
 * - 数据库响应超时时告警
 * - 资源使用超限时告警
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class HealthCheckService {
 *   constructor(private readonly dbMonitor: DatabaseMonitorService) {}
 *
 *   async checkDatabase() {
 *     const health = await this.dbMonitor.healthCheck();
 *     const slowQueries = await this.dbMonitor.getSlowQueries(1000);
 *
 *     return { health, slowQueries };
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class DatabaseMonitorService implements IDatabaseMonitor {
  /**
   * 慢查询记录
   */
  private readonly slowQueries: SlowQuery[] = [];

  /**
   * 查询统计
   */
  private readonly queryStats = {
    total: 0,
    successful: 0,
    failed: 0,
    slow: 0,
    totalTime: 0,
    slowestTime: 0,
  };

  constructor(
    @Inject(DI_TOKENS.MODULE_OPTIONS)
    private readonly options: DatabaseModuleOptions,
    private readonly connectionManager: ConnectionManager,
    private readonly logger: PinoLogger
  ) {
    this.logger.info('DatabaseMonitorService initialized');

    // 如果启用统计，启动定期收集
    if (this.options.monitoring?.enableStats) {
      this.startStatsCollection();
    }
  }

  /**
   * 获取连接统计信息
   *
   * @description 获取数据库连接的统计信息
   *
   * @returns 连接统计
   *
   * @example
   * ```typescript
   * const stats = await monitor.getConnectionStats();
   * console.log(`Active: ${stats.active}, Idle: ${stats.idle}`);
   * ```
   */
  async getConnectionStats(): Promise<ConnectionStatsInfo> {
    try {
      const connectionStats = this.connectionManager.getConnectionStats();

      return {
        total: connectionStats.total,
        active: connectionStats.active,
        idle: connectionStats.idle,
        waiting: connectionStats.waiting,
        averageConnectionTime: connectionStats.averageConnectionTime,
        peakConnections: connectionStats.maxConnections,
      };
    } catch (error) {
      this.logger.error('Failed to get connection stats', { error });
      throw error;
    }
  }

  /**
   * 获取租户连接统计
   *
   * @description 获取指定租户的连接统计信息
   *
   * @param tenantId - 租户ID
   * @returns 租户连接统计
   *
   * @example
   * ```typescript
   * const stats = await monitor.getTenantConnectionStats('tenant-123');
   * ```
   */
  async getTenantConnectionStats(
    tenantId: string
  ): Promise<ConnectionStatsInfo> {
    try {
      // 实际实现需要从租户连接获取统计
      return {
        total: 1,
        active: 1,
        idle: 0,
        waiting: 0,
        averageConnectionTime: 0,
        peakConnections: 1,
      };
    } catch (error) {
      this.logger.error('Failed to get tenant connection stats', {
        tenantId,
        error,
      });
      throw error;
    }
  }

  /**
   * 获取查询统计信息
   *
   * @description 获取数据库查询的统计信息
   *
   * @returns 查询统计
   *
   * @example
   * ```typescript
   * const stats = await monitor.getQueryStats();
   * console.log(`QPS: ${stats.qps}, Average: ${stats.averageTime}ms`);
   * ```
   */
  async getQueryStats(): Promise<QueryStatsInfo> {
    return {
      total: this.queryStats.total,
      successful: this.queryStats.successful,
      failed: this.queryStats.failed,
      slow: this.queryStats.slow,
      averageTime:
        this.queryStats.total > 0
          ? this.queryStats.totalTime / this.queryStats.total
          : 0,
      slowestTime: this.queryStats.slowestTime,
      qps: 0, // 需要计算每秒查询数
    };
  }

  /**
   * 获取慢查询列表
   *
   * @description 获取超过指定阈值的慢查询
   *
   * @param threshold - 时间阈值（毫秒）
   * @returns 慢查询列表
   *
   * @example
   * ```typescript
   * const slowQueries = await monitor.getSlowQueries(1000);
   * slowQueries.forEach(q => console.log(q.sql, q.executionTime));
   * ```
   */
  async getSlowQueries(threshold: number): Promise<SlowQuery[]> {
    return this.slowQueries.filter((q) => q.executionTime >= threshold);
  }

  /**
   * 执行健康检查
   *
   * @description 检查数据库的健康状态
   *
   * @returns 健康状态
   *
   * @example
   * ```typescript
   * const health = await monitor.healthCheck();
   * if (health.status === 'healthy') {
   *   console.log('Database is healthy');
   * }
   * ```
   */
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const isConnected = this.connectionManager.isConnected();
      const responseTime = Date.now() - startTime;

      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        checkedAt: new Date(),
        connection: isConnected,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        checkedAt: new Date(),
        connection: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行租户健康检查
   *
   * @description 检查指定租户数据库的健康状态
   *
   * @param tenantId - 租户ID
   * @returns 租户健康状态
   *
   * @example
   * ```typescript
   * const health = await monitor.tenantHealthCheck('tenant-123');
   * ```
   */
  async tenantHealthCheck(tenantId: string): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const connection = await this.connectionManager.getTenantConnection(
        tenantId
      );
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        checkedAt: new Date(),
        connection: !!connection,
        responseTime,
        details: { tenantId },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        checkedAt: new Date(),
        connection: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        details: { tenantId },
      };
    }
  }

  /**
   * 获取内存使用情况
   *
   * @description 获取数据库的内存使用信息
   *
   * @returns 内存使用信息
   */
  async getMemoryUsage(): Promise<MemoryUsage> {
    // 实际实现需要查询数据库的内存使用情况
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;

    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }

  /**
   * 获取磁盘使用情况
   *
   * @description 获取数据库的磁盘使用信息
   *
   * @returns 磁盘使用信息
   */
  async getDiskUsage(): Promise<DiskUsage> {
    // 实际实现需要查询数据库的磁盘使用情况
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }

  /**
   * 获取CPU使用情况
   *
   * @description 获取数据库的CPU使用信息
   *
   * @returns CPU使用信息
   */
  async getCPUUsage(): Promise<CPUUsage> {
    // 实际实现需要查询数据库的CPU使用情况
    return {
      percentage: 0,
      cores: require('os').cpus().length,
      load: require('os').loadavg(),
    };
  }

  /**
   * 记录慢查询
   *
   * @description 记录执行时间超过阈值的查询
   *
   * @param query - 慢查询信息
   * @internal
   */
  recordSlowQuery(query: SlowQuery): void {
    const threshold =
      this.options.monitoring?.slowQueryThreshold ||
      DATABASE_DEFAULTS.SLOW_QUERY_THRESHOLD;

    if (query.executionTime >= threshold) {
      this.slowQueries.push(query);
      this.queryStats.slow++;

      this.logger.warn('Slow query detected', {
        sql: query.sql,
        executionTime: query.executionTime,
        threshold,
      });

      // 限制慢查询记录数量
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }
    }
  }

  /**
   * 记录查询统计
   *
   * @description 更新查询统计信息
   *
   * @param executionTime - 执行时间
   * @param success - 是否成功
   * @internal
   */
  recordQuery(executionTime: number, success: boolean): void {
    this.queryStats.total++;
    this.queryStats.totalTime += executionTime;

    if (success) {
      this.queryStats.successful++;
    } else {
      this.queryStats.failed++;
    }

    if (executionTime > this.queryStats.slowestTime) {
      this.queryStats.slowestTime = executionTime;
    }
  }

  /**
   * 启动统计收集
   *
   * @description 定期收集数据库统计信息
   * @private
   */
  private startStatsCollection(): void {
    const interval = this.options.monitoring?.statsInterval || 60000;

    setInterval(async () => {
      try {
        const connectionStats = await this.getConnectionStats();
        const queryStats = await this.getQueryStats();

        this.logger.debug('Database statistics collected', {
          connections: connectionStats,
          queries: queryStats,
        });
      } catch (error) {
        this.logger.error('Failed to collect database statistics', { error });
      }
    }, interval);
  }
}
