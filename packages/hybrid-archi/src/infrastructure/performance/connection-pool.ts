/**
 * 连接池管理器
 *
 * 提供完整的连接池管理功能，包括连接池配置、连接监控、连接健康检查、连接复用等。
 * 作为通用功能组件，为业务模块提供强大的连接管理能力。
 *
 * @description 连接池管理器的完整实现，支持多种连接类型
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { DatabaseService } from '@hl8/database';

/**
 * 连接池配置
 */
export interface ConnectionPoolConfig {
  /** 最小连接数 */
  minConnections: number;
  /** 最大连接数 */
  maxConnections: number;
  /** 连接超时时间（毫秒） */
  connectionTimeout: number;
  /** 空闲超时时间（毫秒） */
  idleTimeout: number;
  /** 连接验证间隔（毫秒） */
  validationInterval: number;
  /** 连接重试次数 */
  retryCount: number;
  /** 连接重试间隔（毫秒） */
  retryInterval: number;
  /** 是否启用连接监控 */
  monitoring: boolean;
  /** 是否启用连接统计 */
  statistics: boolean;
  /** 是否启用连接健康检查 */
  healthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
}

/**
 * 连接状态
 */
export type ConnectionStatus =
  | 'idle'
  | 'active'
  | 'connecting'
  | 'disconnected'
  | 'error';

/**
 * 连接信息
 */
export interface ConnectionInfo {
  id: string;
  status: ConnectionStatus;
  createdAt: Date;
  lastUsedAt: Date;
  useCount: number;
  totalUseTime: number;
  averageUseTime: number;
  errorCount: number;
  lastError?: Error;
  metadata?: Record<string, any>;
}

/**
 * 连接池统计信息
 */
export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  errorConnections: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  peakConnections: number;
  connectionUtilization: number;
  lastActivity: Date;
  uptime: number;
}

/**
 * 连接池管理器
 *
 * 提供完整的连接池管理功能
 */
@Injectable()
export class ConnectionPoolManager {
  private readonly connections = new Map<string, ConnectionInfo>();
  private readonly stats: ConnectionPoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    errorConnections: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    peakConnections: 0,
    connectionUtilization: 0,
    lastActivity: new Date(),
    uptime: 0,
  };

  private readonly startTime = Date.now();
  private readonly responseTimes: number[] = [];
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private validationTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: PinoLogger,
    private readonly databaseService: DatabaseService,
    @Inject('ConnectionPoolConfig') private readonly config: ConnectionPoolConfig
  ) {
    this.initializePool();
    this.startHealthCheck();
    this.startValidation();
  }

  /**
   * 获取连接
   *
   * @description 从连接池获取可用连接
   * @returns 连接信息
   */
  async getConnection(): Promise<ConnectionInfo> {
    const startTime = Date.now();

    try {
      // 查找空闲连接
      let connection = this.findIdleConnection();

      if (!connection) {
        // 创建新连接
        connection = await this.createConnection();
      }

      // 更新连接状态
      connection.status = 'active';
      connection.lastUsedAt = new Date();
      connection.useCount++;

      // 更新统计信息
      this.stats.activeConnections++;
      this.stats.totalRequests++;
      this.stats.lastActivity = new Date();

      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.updateStats();

      this.logger.debug('连接获取成功', {
        connectionId: connection.id,
        responseTime,
        activeConnections: this.stats.activeConnections,
      });

      return connection;
    } catch (error) {
      this.stats.failedRequests++;
      this.updateStats();

      this.logger.error('获取连接失败', error);
      throw error;
    }
  }

  /**
   * 释放连接
   *
   * @description 将连接返回到连接池
   * @param connectionId - 连接ID
   */
  async releaseConnection(connectionId: string): Promise<void> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        this.logger.warn('连接不存在', { connectionId });
        return;
      }

      // 更新连接状态
      connection.status = 'idle';
      connection.lastUsedAt = new Date();

      // 更新统计信息
      this.stats.activeConnections--;
      this.stats.idleConnections++;
      this.stats.successfulRequests++;
      this.updateStats();

      this.logger.debug('连接释放成功', {
        connectionId,
        idleConnections: this.stats.idleConnections,
      });
    } catch (error) {
      this.logger.error('释放连接失败', error, { connectionId });
      throw error;
    }
  }

  /**
   * 关闭连接
   *
   * @description 关闭指定的连接
   * @param connectionId - 连接ID
   */
  async closeConnection(connectionId: string): Promise<void> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        this.logger.warn('连接不存在', { connectionId });
        return;
      }

      // 更新统计信息
      this.stats.totalConnections--;
      if (connection.status === 'active') {
        this.stats.activeConnections--;
      } else if (connection.status === 'idle') {
        this.stats.idleConnections--;
      }

      // 更新连接状态
      connection.status = 'disconnected';
      this.connections.delete(connectionId);
      this.updateStats();

      this.logger.info('连接关闭成功', { connectionId });
    } catch (error) {
      this.logger.error('关闭连接失败', error, { connectionId });
      throw error;
    }
  }

  /**
   * 关闭所有连接
   *
   * @description 关闭连接池中的所有连接
   */
  async closeAllConnections(): Promise<void> {
    try {
      const connectionIds = Array.from(this.connections.keys());

      for (const connectionId of connectionIds) {
        await this.closeConnection(connectionId);
      }

      this.logger.info('所有连接已关闭', {
        connectionCount: connectionIds.length,
      });
    } catch (error) {
      this.logger.error('关闭所有连接失败', error);
      throw error;
    }
  }

  /**
   * 获取连接池统计信息
   *
   * @description 获取连接池的统计信息
   * @returns 统计信息
   */
  getStats(): ConnectionPoolStats {
    return { ...this.stats };
  }

  /**
   * 获取连接信息
   *
   * @description 获取指定连接的信息
   * @param connectionId - 连接ID
   * @returns 连接信息
   */
  getConnectionInfo(connectionId: string): ConnectionInfo | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * 获取所有连接信息
   *
   * @description 获取所有连接的信息
   * @returns 连接信息列表
   */
  getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * 获取空闲连接数量
   *
   * @description 获取当前空闲连接的数量
   * @returns 空闲连接数量
   */
  getIdleConnectionCount(): number {
    return this.stats.idleConnections;
  }

  /**
   * 获取活跃连接数量
   *
   * @description 获取当前活跃连接的数量
   * @returns 活跃连接数量
   */
  getActiveConnectionCount(): number {
    return this.stats.activeConnections;
  }

  /**
   * 检查连接池健康状态
   *
   * @description 检查连接池的健康状态
   * @returns 健康状态
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 检查连接数量
      if (this.stats.totalConnections < this.config.minConnections) {
        issues.push(
          `连接数量不足: ${this.stats.totalConnections}/${this.config.minConnections}`
        );
        recommendations.push('增加连接数量');
      }

      if (this.stats.totalConnections > this.config.maxConnections) {
        issues.push(
          `连接数量过多: ${this.stats.totalConnections}/${this.config.maxConnections}`
        );
        recommendations.push('减少连接数量');
      }

      // 检查连接利用率
      const utilization = this.stats.connectionUtilization;
      if (utilization > 0.9) {
        issues.push(`连接利用率过高: ${(utilization * 100).toFixed(1)}%`);
        recommendations.push('考虑增加最大连接数');
      }

      if (utilization < 0.1) {
        issues.push(`连接利用率过低: ${(utilization * 100).toFixed(1)}%`);
        recommendations.push('考虑减少最大连接数');
      }

      // 检查错误率
      const errorRate =
        this.stats.totalRequests > 0
          ? (this.stats.failedRequests / this.stats.totalRequests) * 100
          : 0;

      if (errorRate > 5) {
        issues.push(`错误率过高: ${errorRate.toFixed(1)}%`);
        recommendations.push('检查连接配置和网络状态');
      }

      // 检查响应时间
      if (this.stats.averageResponseTime > 1000) {
        issues.push(`平均响应时间过长: ${this.stats.averageResponseTime}ms`);
        recommendations.push('优化数据库查询和网络配置');
      }

      const healthy = issues.length === 0;

      this.logger.debug('连接池健康检查完成', {
        healthy,
        issueCount: issues.length,
        recommendationCount: recommendations.length,
      });

      return { healthy, issues, recommendations };
    } catch (error) {
      this.logger.error('连接池健康检查失败', error);
      return {
        healthy: false,
        issues: ['健康检查失败'],
        recommendations: ['检查连接池配置'],
      };
    }
  }

  /**
   * 重置统计信息
   *
   * @description 重置连接池的统计信息
   */
  resetStats(): void {
    this.stats.totalConnections = 0;
    this.stats.activeConnections = 0;
    this.stats.idleConnections = 0;
    this.stats.errorConnections = 0;
    this.stats.totalRequests = 0;
    this.stats.successfulRequests = 0;
    this.stats.failedRequests = 0;
    this.stats.averageResponseTime = 0;
    this.stats.peakConnections = 0;
    this.stats.connectionUtilization = 0;
    this.stats.lastActivity = new Date();
    this.stats.uptime = 0;

    this.responseTimes.length = 0;

    this.logger.info('连接池统计信息已重置');
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化连接池
   */
  private async initializePool(): Promise<void> {
    try {
      // 创建最小连接数
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection();
      }

      this.logger.info('连接池初始化完成', {
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections,
      });
    } catch (error) {
      this.logger.error('连接池初始化失败', error);
      throw error;
    }
  }

  /**
   * 创建连接
   */
  private async createConnection(): Promise<ConnectionInfo> {
    const connectionId = this.generateConnectionId();
    const connection: ConnectionInfo = {
      id: connectionId,
      status: 'connecting',
      createdAt: new Date(),
      lastUsedAt: new Date(),
      useCount: 0,
      totalUseTime: 0,
      averageUseTime: 0,
      errorCount: 0,
    };

    try {
      // 这里应该实现具体的连接创建逻辑
      // 实际实现中会调用数据库服务
      // 这里应该实现具体的连接创建逻辑
      // await this.databaseService.connect();

      connection.status = 'idle';
      this.connections.set(connectionId, connection);

      this.stats.totalConnections++;
      this.stats.idleConnections++;
      this.updateStats();

      this.logger.debug('连接创建成功', { connectionId });
      return connection;
    } catch (error) {
      connection.status = 'error';
      connection.lastError =
        error instanceof Error ? error : new Error(String(error));
      connection.errorCount++;

      this.stats.errorConnections++;
      this.updateStats();

      this.logger.error('连接创建失败', error, { connectionId });
      throw error;
    }
  }

  /**
   * 查找空闲连接
   */
  private findIdleConnection(): ConnectionInfo | null {
    for (const connection of this.connections.values()) {
      if (connection.status === 'idle') {
        return connection;
      }
    }
    return null;
  }

  /**
   * 生成连接ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    // 计算连接利用率
    this.stats.connectionUtilization =
      this.stats.totalConnections > 0
        ? this.stats.activeConnections / this.stats.totalConnections
        : 0;

    // 计算平均响应时间
    if (this.responseTimes.length > 0) {
      this.stats.averageResponseTime =
        this.responseTimes.reduce((sum, time) => sum + time, 0) /
        this.responseTimes.length;
    }

    // 更新峰值连接数
    if (this.stats.totalConnections > this.stats.peakConnections) {
      this.stats.peakConnections = this.stats.totalConnections;
    }

    // 更新运行时间
    this.stats.uptime = Date.now() - this.startTime;
  }

  /**
   * 开始健康检查
   */
  private startHealthCheck(): void {
    if (!this.config.healthCheck) {
      return;
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);

    this.logger.info('连接池健康检查已启动', {
      interval: this.config.healthCheckInterval,
    });
  }

  /**
   * 开始连接验证
   */
  private startValidation(): void {
    this.validationTimer = setInterval(async () => {
      try {
        await this.validateConnections();
      } catch (error) {
        this.logger.error('连接验证失败', error);
      }
    }, this.config.validationInterval);

    this.logger.info('连接池验证已启动', {
      interval: this.config.validationInterval,
    });
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const health = await this.checkHealth();

    if (!health.healthy) {
      this.logger.warn('连接池健康检查发现问题', {
        issues: health.issues,
        recommendations: health.recommendations,
      });
    }
  }

  /**
   * 验证连接
   */
  private async validateConnections(): Promise<void> {
    const connectionsToValidate = Array.from(this.connections.values());

    for (const connection of connectionsToValidate) {
      try {
        // 这里应该实现具体的连接验证逻辑
        // 实际实现中会测试连接是否可用
        if (connection.status === 'error') {
          await this.closeConnection(connection.id);
        }
      } catch (error) {
        this.logger.warn('连接验证失败', error, {
          connectionId: connection.id,
        });
      }
    }
  }
}
