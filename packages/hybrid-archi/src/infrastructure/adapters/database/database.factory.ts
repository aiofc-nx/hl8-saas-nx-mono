/**
 * 数据库工厂
 *
 * 提供数据库适配器的动态创建和管理能力。
 * 作为通用功能组件，支持数据库的生命周期管理。
 *
 * @description 数据库工厂实现数据库适配器的动态创建和管理
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

/**
 * 数据库注册信息
 */
export interface IDatabaseRegistration {
  /** 数据库名称 */
  databaseName: string;
  /** 数据库类型 */
  databaseType: DatabaseType;
  /** 数据库配置 */
  config: IDatabaseConfig;
  /** 数据库实例 */
  instance?: DatabaseAdapter;
  /** 是否已初始化 */
  initialized: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后访问时间 */
  lastAccessedAt: Date;
  /** 连接状态 */
  connected: boolean;
}

/**
 * 数据库工厂
 *
 * 提供数据库适配器的动态创建和管理
 */
@Injectable()
export class DatabaseFactory {
  private readonly databases = new Map<string, IDatabaseRegistration>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: PinoLogger
  ) {}

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
    // 检查数据库是否已存在
    if (this.databases.has(databaseName)) {
      const registration = this.databases.get(databaseName)!;
      registration.lastAccessedAt = new Date();
      return registration.instance!;
    }

    // 创建数据库实例
    const database = new DatabaseAdapter(
      this.databaseService,
      this.logger,
      config
    );

    // 注册数据库
    const registration: IDatabaseRegistration = {
      databaseName,
      databaseType,
      config: {
        enablePostgreSQL: config.enablePostgreSQL ?? true,
        enableMongoDB: config.enableMongoDB ?? true,
        enableTransaction: config.enableTransaction ?? true,
        enableConnectionPool: config.enableConnectionPool ?? true,
        poolSize: config.poolSize ?? 10,
        enableQueryCache: config.enableQueryCache ?? true,
        queryCacheTtl: config.queryCacheTtl ?? 300,
        enableQueryLogging: config.enableQueryLogging ?? true,
        enableSlowQueryMonitoring: config.enableSlowQueryMonitoring ?? true,
        slowQueryThreshold: config.slowQueryThreshold ?? 1000,
        enableMigration: config.enableMigration ?? true,
        enableBackup: config.enableBackup ?? true,
      },
      instance: database,
      initialized: true,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      connected: false,
    };

    this.databases.set(databaseName, registration);

    this.logger.debug(`创建数据库: ${databaseName}`, {
      databaseType,
      config: registration.config,
    });

    return database;
  }

  /**
   * 获取数据库
   *
   * @param databaseName - 数据库名称
   * @returns 数据库实例
   */
  getDatabase(databaseName: string): DatabaseAdapter | null {
    const registration = this.databases.get(databaseName);
    if (!registration) {
      return null;
    }

    registration.lastAccessedAt = new Date();
    return registration.instance!;
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
    const existingDatabase = this.getDatabase(databaseName);
    if (existingDatabase) {
      return existingDatabase;
    }

    return this.createDatabase(databaseName, databaseType, config);
  }

  /**
   * 销毁数据库
   *
   * @param databaseName - 数据库名称
   */
  async destroyDatabase(databaseName: string): Promise<void> {
    const registration = this.databases.get(databaseName);
    if (!registration) {
      return;
    }

    try {
      // 清理数据库资源
      if (registration.instance) {
        registration.instance.clearQueryCache();
      }

      // 移除数据库注册
      this.databases.delete(databaseName);

      this.logger.debug(`销毁数据库: ${databaseName}`);
    } catch (error) {
      this.logger.error(`销毁数据库失败: ${databaseName}`, error);
      throw error;
    }
  }

  /**
   * 获取所有数据库
   *
   * @returns 数据库注册信息列表
   */
  getAllDatabases(): IDatabaseRegistration[] {
    return Array.from(this.databases.values());
  }

  /**
   * 获取数据库注册信息
   *
   * @param databaseName - 数据库名称
   * @returns 数据库注册信息
   */
  getDatabaseRegistration(databaseName: string): IDatabaseRegistration | null {
    return this.databases.get(databaseName) || null;
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
    const registration = this.databases.get(databaseName);
    if (!registration) {
      throw new Error(`数据库不存在: ${databaseName}`);
    }

    Object.assign(registration.config, config);

    this.logger.debug(`更新数据库配置: ${databaseName}`, {
      config: registration.config,
    });
  }

  /**
   * 清理过期数据库
   *
   * @param maxAge - 最大年龄（毫秒）
   * @returns 清理的数据库数量
   */
  async cleanupExpiredDatabases(
    maxAge: number = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const now = new Date();
    const expiredDatabases: string[] = [];

    for (const [databaseName, registration] of this.databases) {
      const age = now.getTime() - registration.lastAccessedAt.getTime();
      if (age > maxAge) {
        expiredDatabases.push(databaseName);
      }
    }

    for (const databaseName of expiredDatabases) {
      await this.destroyDatabase(databaseName);
    }

    this.logger.debug(`清理过期数据库: ${expiredDatabases.length}`, {
      expiredDatabases,
    });

    return expiredDatabases.length;
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
    const databases = Array.from(this.databases.values());
    const now = new Date();

    const databaseTypes: Record<string, number> = {};
    let totalAge = 0;
    let oldestDatabase: string | null = null;
    let newestDatabase: string | null = null;
    let oldestAge = 0;
    let newestAge = Infinity;
    let connectedDatabases = 0;

    for (const database of databases) {
      // 统计数据库类型
      databaseTypes[database.databaseType] =
        (databaseTypes[database.databaseType] || 0) + 1;

      // 计算年龄
      const age = now.getTime() - database.createdAt.getTime();
      totalAge += age;

      // 找到最老的数据库
      if (age > oldestAge) {
        oldestAge = age;
        oldestDatabase = database.databaseName;
      }

      // 找到最新的数据库
      if (age < newestAge) {
        newestAge = age;
        newestDatabase = database.databaseName;
      }

      // 统计连接状态
      if (database.connected) {
        connectedDatabases++;
      }
    }

    return {
      totalDatabases: databases.length,
      activeDatabases: databases.filter((d) => d.initialized).length,
      databaseTypes,
      averageAge: databases.length > 0 ? totalAge / databases.length : 0,
      oldestDatabase,
      newestDatabase,
      connectedDatabases,
    };
  }

  /**
   * 健康检查所有数据库
   *
   * @returns 健康检查结果
   */
  async healthCheckAllDatabases(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [databaseName, registration] of this.databases) {
      try {
        const isHealthy = await this.checkDatabaseHealth(
          databaseName,
          registration.instance!
        );
        results[databaseName] = {
          healthy: isHealthy,
          status: isHealthy ? 'healthy' : 'unhealthy',
          databaseName,
          databaseType: registration.databaseType,
          createdAt: registration.createdAt,
          lastAccessedAt: registration.lastAccessedAt,
          connected: registration.connected,
        };
      } catch (error) {
        results[databaseName] = {
          healthy: false,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          databaseName,
        };
      }
    }

    return results;
  }

  /**
   * 连接数据库
   *
   * @param databaseName - 数据库名称
   */
  async connectDatabase(databaseName: string): Promise<void> {
    const registration = this.databases.get(databaseName);
    if (!registration) {
      throw new Error(`数据库不存在: ${databaseName}`);
    }

    try {
      // 这里应该实现实际的数据库连接逻辑
      // 目前只是标记为已连接
      registration.connected = true;

      this.logger.debug(`数据库连接成功: ${databaseName}`);
    } catch (error) {
      this.logger.error(`数据库连接失败: ${databaseName}`, error);
      throw error;
    }
  }

  /**
   * 断开数据库连接
   *
   * @param databaseName - 数据库名称
   */
  async disconnectDatabase(databaseName: string): Promise<void> {
    const registration = this.databases.get(databaseName);
    if (!registration) {
      return;
    }

    try {
      // 这里应该实现实际的数据库断开连接逻辑
      // 目前只是标记为未连接
      registration.connected = false;

      this.logger.debug(`数据库断开连接: ${databaseName}`);
    } catch (error) {
      this.logger.error(`数据库断开连接失败: ${databaseName}`, error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 检查数据库健康状态
   */
  private async checkDatabaseHealth(
    databaseName: string,
    instance: DatabaseAdapter
  ): Promise<boolean> {
    try {
      // 检查数据库是否可用
      const testQuery = 'SELECT 1 as test';
      const result = await instance.query(testQuery);

      return result.length > 0 && (result[0] as { test: number }).test === 1;
    } catch {
      return false;
    }
  }
}
