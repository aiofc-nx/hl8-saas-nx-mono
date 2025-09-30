/**
 * 缓存监控服务
 *
 * @description 提供缓存服务的监控和统计功能
 * 支持性能监控、健康检查、统计信息收集等
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '../cache.service';
import { RedisService } from '../redis.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import {
  CacheStats,
  TenantCacheStats,
  CacheHealthCheck,
  ConnectionInfo,
} from '../types/cache.types';

/**
 * 缓存监控服务
 *
 * @description 提供缓存监控和统计功能
 */
@Injectable()
export class CacheMonitorService {
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    memoryUsage: 0,
    tenantStats: new Map(),
  };

  private readonly healthCheck: CacheHealthCheck = {
    isHealthy: false,
    connectionStatus: 'disconnected',
    latency: 0,
    errorCount: 0,
    lastError: undefined,
    tenantContextAvailable: false,
  };

  constructor(
    private readonly cacheService: CacheService,
    private readonly redisService: RedisService,
    private readonly tenantContextService: TenantContextService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'cache-monitor-service' });
  }

  /**
   * 获取缓存统计信息
   *
   * @description 获取详细的缓存使用统计
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      tenantStats: new Map(this.stats.tenantStats),
    };
  }

  /**
   * 获取租户缓存统计
   *
   * @description 获取指定租户的缓存统计信息
   */
  getTenantStats(tenantId: string): TenantCacheStats | null {
    return this.stats.tenantStats.get(tenantId) || null;
  }

  /**
   * 获取所有租户统计
   *
   * @description 获取所有租户的缓存统计信息
   */
  getAllTenantStats(): Map<string, TenantCacheStats> {
    return new Map(this.stats.tenantStats);
  }

  /**
   * 更新缓存统计
   *
   * @description 更新缓存命中/未命中统计
   */
  updateStats(
    type: 'hit' | 'miss' | 'set' | 'delete',
    tenantId?: string,
    count = 1
  ): void {
    try {
      switch (type) {
        case 'hit':
          this.stats.hits += count;
          break;
        case 'miss':
          this.stats.misses += count;
          break;
        case 'set':
          this.stats.totalKeys += count;
          break;
        case 'delete':
          this.stats.totalKeys = Math.max(0, this.stats.totalKeys - count);
          break;
      }

      // 更新命中率
      const total = this.stats.hits + this.stats.misses;
      this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

      // 更新租户统计
      if (tenantId) {
        this.updateTenantStats(tenantId, type, count);
      }

      this.logger.debug('缓存统计已更新', { type, count, tenantId });
    } catch (error) {
      this.logger.error('更新缓存统计失败', {
        type,
        count,
        tenantId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * 更新租户统计
   *
   * @description 更新指定租户的缓存统计
   */
  private updateTenantStats(
    tenantId: string,
    type: 'hit' | 'miss' | 'set' | 'delete',
    count = 1
  ): void {
    try {
      let tenantStats = this.stats.tenantStats.get(tenantId);
      if (!tenantStats) {
        tenantStats = {
          tenantId,
          hits: 0,
          misses: 0,
          hitRate: 0,
          keyCount: 0,
          memoryUsage: 0,
          lastAccessed: new Date(),
        };
        this.stats.tenantStats.set(tenantId, tenantStats);
      }

      switch (type) {
        case 'hit':
          tenantStats.hits += count;
          break;
        case 'miss':
          tenantStats.misses += count;
          break;
        case 'set':
          tenantStats.keyCount += count;
          break;
        case 'delete':
          tenantStats.keyCount = Math.max(0, tenantStats.keyCount - count);
          break;
      }

      // 更新租户命中率
      const total = tenantStats.hits + tenantStats.misses;
      tenantStats.hitRate = total > 0 ? (tenantStats.hits / total) * 100 : 0;
      tenantStats.lastAccessed = new Date();

      this.logger.debug('租户缓存统计已更新', { tenantId, type, count });
    } catch (error) {
      this.logger.error('更新租户缓存统计失败', {
        tenantId,
        type,
        count,
        error: (error as Error).message,
      });
    }
  }

  /**
   * 获取健康检查状态
   *
   * @description 获取缓存服务的健康状态
   */
  async getHealthCheck(): Promise<CacheHealthCheck> {
    try {
      const startTime = Date.now();

      // 检查Redis连接
      const redisConnected = this.redisService.isHealthy();

      // 检查租户上下文
      const tenantContextAvailable =
        this.tenantContextService.getTenant() !== null;

      // 测试缓存操作
      let testSuccess = false;
      try {
        const testKey = 'health-check-test';
        await this.redisService.set(testKey, 'test', 1);
        const testValue = await this.redisService.get(testKey);
        await this.redisService.delete(testKey);
        testSuccess = testValue === 'test';
      } catch (error) {
        this.healthCheck.errorCount++;
        this.healthCheck.lastError = (error as Error).message;
        this.logger.warn('健康检查测试失败', {
          error: (error as Error).message,
        });
      }

      const latency = Date.now() - startTime;

      this.healthCheck.isHealthy = redisConnected && testSuccess;
      this.healthCheck.connectionStatus = redisConnected
        ? 'connected'
        : 'disconnected';
      this.healthCheck.latency = latency;
      this.healthCheck.tenantContextAvailable = tenantContextAvailable;

      this.logger.debug('健康检查完成', {
        isHealthy: this.healthCheck.isHealthy,
        latency,
        redisConnected,
        tenantContextAvailable,
      });

      return { ...this.healthCheck };
    } catch (error) {
      this.healthCheck.errorCount++;
      this.healthCheck.lastError = (error as Error).message;
      this.healthCheck.isHealthy = false;
      this.healthCheck.connectionStatus = 'disconnected';

      this.logger.error('健康检查失败', { error: (error as Error).message });
      return { ...this.healthCheck };
    }
  }

  /**
   * 获取Redis连接信息
   *
   * @description 获取Redis连接详细信息
   */
  getConnectionInfo(): ConnectionInfo {
    return this.redisService.getConnectionInfo();
  }

  /**
   * 获取Redis统计信息
   *
   * @description 获取Redis服务器统计信息
   */
  async getRedisStats(): Promise<Record<string, any>> {
    try {
      return await this.redisService.getStats();
    } catch (error) {
      this.logger.error('获取Redis统计信息失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取内存使用情况
   *
   * @description 获取Redis内存使用情况
   */
  async getMemoryUsage(): Promise<{
    used: number;
    peak: number;
    ratio: number;
  }> {
    try {
      const stats = await this.getRedisStats();
      const used = parseInt(stats['used_memory'] || '0');
      const peak = parseInt(stats['used_memory_peak'] || '0');
      const ratio = peak > 0 ? (used / peak) * 100 : 0;

      return { used, peak, ratio };
    } catch (error) {
      this.logger.error('获取内存使用情况失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取连接池统计
   *
   * @description 获取Redis连接池统计信息
   */
  getConnectionPoolStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
  } {
    try {
      const redis = this.redisService.getRedis();
      return {
        totalConnections: 1, // Redis单连接
        activeConnections: redis.status === 'ready' ? 1 : 0,
        idleConnections: redis.status === 'ready' ? 0 : 1,
        waitingRequests: 0,
      };
    } catch (error) {
      this.logger.error('获取连接池统计失败', {
        error: (error as Error).message,
      });
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
      };
    }
  }

  /**
   * 获取性能指标
   *
   * @description 获取缓存性能指标
   */
  getPerformanceMetrics(): {
    hitRate: number;
    missRate: number;
    averageLatency: number;
    throughput: number;
    errorRate: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    const missRate = total > 0 ? (this.stats.misses / total) * 100 : 0;
    const errorRate =
      this.healthCheck.errorCount > 0
        ? (this.healthCheck.errorCount /
            (total + this.healthCheck.errorCount)) *
          100
        : 0;

    return {
      hitRate,
      missRate,
      averageLatency: this.healthCheck.latency,
      throughput: total, // 简化计算
      errorRate,
    };
  }

  /**
   * 重置统计信息
   *
   * @description 重置所有统计信息
   */
  resetStats(): void {
    try {
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.hitRate = 0;
      this.stats.totalKeys = 0;
      this.stats.memoryUsage = 0;
      this.stats.tenantStats.clear();

      this.healthCheck.errorCount = 0;
      this.healthCheck.lastError = undefined;

      this.logger.info('缓存统计信息已重置');
    } catch (error) {
      this.logger.error('重置统计信息失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取监控报告
   *
   * @description 获取完整的监控报告
   */
  async getMonitoringReport(): Promise<{
    stats: CacheStats;
    healthCheck: CacheHealthCheck;
    connectionInfo: ConnectionInfo;
    redisStats: Record<string, any>;
    memoryUsage: { used: number; peak: number; ratio: number };
    performanceMetrics: {
      hitRate: number;
      missRate: number;
      averageLatency: number;
      throughput: number;
      errorRate: number;
    };
    connectionPoolStats: {
      totalConnections: number;
      activeConnections: number;
      idleConnections: number;
      waitingRequests: number;
    };
    timestamp: Date;
  }> {
    try {
      const [healthCheck, redisStats, memoryUsage] = await Promise.all([
        this.getHealthCheck(),
        this.getRedisStats(),
        this.getMemoryUsage(),
      ]);

      return {
        stats: this.getStats(),
        healthCheck,
        connectionInfo: this.getConnectionInfo(),
        redisStats,
        memoryUsage,
        performanceMetrics: this.getPerformanceMetrics(),
        connectionPoolStats: this.getConnectionPoolStats(),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('获取监控报告失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
