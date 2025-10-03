/**
 * 数据库管理器
 *
 * 提供数据库的统一管理和协调能力。
 * 作为通用功能组件，支持数据库的生命周期管理和依赖注入。
 *
 * @description 数据库管理器实现数据库的统一管理
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@hl8/database';
import { PinoLogger } from '@hl8/logger';
import {
  DatabaseAdapter,
  IDatabaseConfig,
  DatabaseType,
} from './database.adapter';
import { DatabaseFactory, IDatabaseRegistration } from './database.factory';

/**
 * 数据库管理器配置
 */
export interface IDatabaseManagerConfig {
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  /** 数据库最大年龄（毫秒） */
  maxDatabaseAge: number;
  /** 是否启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
  /** 是否启用统计收集 */
  enableStatistics: boolean;
  /** 统计收集间隔（毫秒） */
  statisticsInterval: number;
  /** 是否启用自动连接 */
  enableAutoConnect: boolean;
  /** 连接重试次数 */
  connectionRetryCount: number;
  /** 连接重试间隔（毫秒） */
  connectionRetryInterval: number;
}

/**
 * 数据库管理器
 *
 * 提供数据库的统一管理和协调
 */
@Injectable()
export class DatabaseManager {
  private readonly config: IDatabaseManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private statisticsTimer?: NodeJS.Timeout;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: PinoLogger,
    private readonly databaseFactory: DatabaseFactory,
    config: Partial<IDatabaseManagerConfig> = {}
  ) {
    this.config = {
      enableAutoCleanup: config.enableAutoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60 * 60 * 1000, // 1小时
      maxDatabaseAge: config.maxDatabaseAge ?? 24 * 60 * 60 * 1000, // 24小时
      enableHealthCheck: config.enableHealthCheck ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 5 * 60 * 1000, // 5分钟
      enableStatistics: config.enableStatistics ?? true,
      statisticsInterval: config.statisticsInterval ?? 10 * 60 * 1000, // 10分钟
      enableAutoConnect: config.enableAutoConnect ?? true,
      connectionRetryCount: config.connectionRetryCount ?? 3,
      connectionRetryInterval: config.connectionRetryInterval ?? 5000, // 5秒
    };

    this.initialize();
  }

  /**
   * 创建数据库
   *
   * @param databaseName - 数据库名称
   * @param databaseType - 数据库类型
   * @param config - 数据库配置
   * @returns 数据库实例
   */
  createDatabase(
    databaseName: string,
    databaseType: DatabaseType,
    config: Partial<IDatabaseConfig> = {}
  ): DatabaseAdapter {
    this.logger.debug(`创建数据库: ${databaseName}`, {
      databaseType,
      config,
    });

    const database = this.databaseFactory.createDatabase(
      databaseName,
      databaseType,
      config
    );

    // 自动连接
    if (this.config.enableAutoConnect) {
      this.connectDatabaseWithRetry(databaseName);
    }

    return database;
  }

  /**
   * 获取数据库
   *
   * @param databaseName - 数据库名称
   * @returns 数据库实例
   */
  getDatabase(databaseName: string): DatabaseAdapter | null {
    return this.databaseFactory.getDatabase(databaseName);
  }

  /**
   * 获取或创建数据库
   *
   * @param databaseName - 数据库名称
   * @param databaseType - 数据库类型
   * @param config - 数据库配置
   * @returns 数据库实例
   */
  getOrCreateDatabase(
    databaseName: string,
    databaseType: DatabaseType,
    config: Partial<IDatabaseConfig> = {}
  ): DatabaseAdapter {
    return this.databaseFactory.getOrCreateDatabase(
      databaseName,
      databaseType,
      config
    );
  }

  /**
   * 销毁数据库
   *
   * @param databaseName - 数据库名称
   */
  async destroyDatabase(databaseName: string): Promise<void> {
    this.logger.debug(`销毁数据库: ${databaseName}`);
    await this.databaseFactory.destroyDatabase(databaseName);
  }

  /**
   * 获取所有数据库
   *
   * @returns 数据库注册信息列表
   */
  getAllDatabases(): IDatabaseRegistration[] {
    return this.databaseFactory.getAllDatabases();
  }

  /**
   * 获取数据库注册信息
   *
   * @param databaseName - 数据库名称
   * @returns 数据库注册信息
   */
  getDatabaseRegistration(databaseName: string): IDatabaseRegistration | null {
    return this.databaseFactory.getDatabaseRegistration(databaseName);
  }

  /**
   * 更新数据库配置
   *
   * @param databaseName - 数据库名称
   * @param config - 新配置
   */
  updateDatabaseConfiguration(
    databaseName: string,
    config: Partial<IDatabaseConfig>
  ): void {
    this.logger.debug(`更新数据库配置: ${databaseName}`, { config });
    this.databaseFactory.updateDatabaseConfiguration(databaseName, config);
  }

  /**
   * 获取数据库统计信息
   *
   * @returns 数据库统计信息
   */
  getDatabaseStatistics(): {
    totalDatabases: number;
    activeDatabases: number;
    databaseTypes: Record<string, number>;
    averageAge: number;
    oldestDatabase: string | null;
    newestDatabase: string | null;
    connectedDatabases: number;
  } {
    return this.databaseFactory.getDatabaseStatistics();
  }

  /**
   * 健康检查所有数据库
   *
   * @returns 健康检查结果
   */
  async healthCheckAllDatabases(): Promise<Record<string, any>> {
    this.logger.debug('开始健康检查所有数据库');
    return await this.databaseFactory.healthCheckAllDatabases();
  }

  /**
   * 清理过期数据库
   *
   * @returns 清理的数据库数量
   */
  async cleanupExpiredDatabases(): Promise<number> {
    this.logger.debug('开始清理过期数据库');
    return await this.databaseFactory.cleanupExpiredDatabases(
      this.config.maxDatabaseAge
    );
  }

  /**
   * 获取所有数据库统计信息
   *
   * @returns 所有数据库的统计信息
   */
  async getAllDatabaseStatistics(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const databases = this.getAllDatabases();

    for (const database of databases) {
      if (database.instance) {
        try {
          const stats = database.instance.getDatabaseStatistics();
          results[database.databaseName] = {
            databaseName: database.databaseName,
            databaseType: database.databaseType,
            statistics: stats,
            createdAt: database.createdAt,
            lastAccessedAt: database.lastAccessedAt,
            connected: database.connected,
          };
        } catch (error) {
          results[database.databaseName] = {
            databaseName: database.databaseName,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    }

    return results;
  }

  /**
   * 重置所有数据库统计信息
   */
  async resetAllDatabaseStatistics(): Promise<void> {
    const databases = this.getAllDatabases();

    for (const database of databases) {
      if (database.instance) {
        database.instance.resetStatistics();
      }
    }

    this.logger.debug(`重置所有数据库统计信息: ${databases.length}`, {
      databaseCount: databases.length,
    });
  }

  /**
   * 连接数据库
   *
   * @param databaseName - 数据库名称
   */
  async connectDatabase(databaseName: string): Promise<void> {
    this.logger.debug(`连接数据库: ${databaseName}`);
    await this.databaseFactory.connectDatabase(databaseName);
  }

  /**
   * 断开数据库连接
   *
   * @param databaseName - 数据库名称
   */
  async disconnectDatabase(databaseName: string): Promise<void> {
    this.logger.debug(`断开数据库连接: ${databaseName}`);
    await this.databaseFactory.disconnectDatabase(databaseName);
  }

  /**
   * 连接所有数据库
   */
  async connectAllDatabases(): Promise<void> {
    const databases = this.getAllDatabases();

    for (const database of databases) {
      try {
        await this.connectDatabase(database.databaseName);
      } catch (error) {
        this.logger.error(`连接数据库失败: ${database.databaseName}`, error);
      }
    }

    this.logger.debug(`连接所有数据库完成: ${databases.length}`, {
      databaseCount: databases.length,
    });
  }

  /**
   * 断开所有数据库连接
   */
  async disconnectAllDatabases(): Promise<void> {
    const databases = this.getAllDatabases();

    for (const database of databases) {
      try {
        await this.disconnectDatabase(database.databaseName);
      } catch (error) {
        this.logger.error(
          `断开数据库连接失败: ${database.databaseName}`,
          error
        );
      }
    }

    this.logger.debug(`断开所有数据库连接完成: ${databases.length}`, {
      databaseCount: databases.length,
    });
  }

  /**
   * 获取管理器状态
   *
   * @returns 管理器状态
   */
  getManagerStatus(): {
    config: IDatabaseManagerConfig;
    statistics: any;
    healthy: boolean;
    timestamp: Date;
  } {
    const statistics = this.getDatabaseStatistics();
    const healthy = statistics.totalDatabases > 0;

    return {
      config: { ...this.config },
      statistics,
      healthy,
      timestamp: new Date(),
    };
  }

  /**
   * 启动管理器
   */
  start(): void {
    this.logger.info('启动数据库管理器');

    // 启动自动清理
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    // 启动健康检查
    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }

    // 启动统计收集
    if (this.config.enableStatistics) {
      this.startStatisticsCollection();
    }
  }

  /**
   * 停止管理器
   */
  stop(): void {
    this.logger.info('停止数据库管理器');

    // 停止自动清理
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // 停止健康检查
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // 停止统计收集
    if (this.statisticsTimer) {
      clearInterval(this.statisticsTimer);
      this.statisticsTimer = undefined;
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logger.info('销毁数据库管理器');

    // 停止管理器
    this.stop();

    // 断开所有数据库连接
    await this.disconnectAllDatabases();

    // 销毁所有数据库
    const databases = this.getAllDatabases();
    for (const database of databases) {
      await this.destroyDatabase(database.databaseName);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化管理器
   */
  private initialize(): void {
    this.logger.debug('初始化数据库管理器', {
      config: this.config,
    });
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        const cleanedCount = await this.cleanupExpiredDatabases();
        if (cleanedCount > 0) {
          this.logger.debug(`自动清理完成: ${cleanedCount} 个数据库`);
        }
      } catch (error) {
        this.logger.error('自动清理失败', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthResults = await this.healthCheckAllDatabases();
        const unhealthyDatabases = Object.entries(healthResults).filter(
          ([, result]) => !result.healthy
        );

        if (unhealthyDatabases.length > 0) {
          this.logger.warn('发现不健康的数据库', {
            unhealthyDatabases: unhealthyDatabases.map(([name]) => name),
          });
        }
      } catch (error) {
        this.logger.error('健康检查失败', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * 启动统计收集
   */
  private startStatisticsCollection(): void {
    this.statisticsTimer = setInterval(async () => {
      try {
        const allStats = await this.getAllDatabaseStatistics();
        this.logger.debug('数据库统计信息收集完成', {
          databaseCount: Object.keys(allStats).length,
          statistics: allStats,
        });
      } catch (error) {
        this.logger.error('统计收集失败', error);
      }
    }, this.config.statisticsInterval);
  }

  /**
   * 带重试的数据库连接
   */
  private async connectDatabaseWithRetry(databaseName: string): Promise<void> {
    let retryCount = 0;

    while (retryCount < this.config.connectionRetryCount) {
      try {
        await this.connectDatabase(databaseName);
        this.logger.debug(`数据库连接成功: ${databaseName}`);
        return;
      } catch (error) {
        retryCount++;
        this.logger.warn(
          `数据库连接失败，重试 ${retryCount}/${this.config.connectionRetryCount}: ${databaseName}`,
          error
        );

        if (retryCount < this.config.connectionRetryCount) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.connectionRetryInterval)
          );
        }
      }
    }

    this.logger.error(`数据库连接最终失败: ${databaseName}`);
  }
}
