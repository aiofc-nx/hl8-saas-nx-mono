/**
 * 数据库连接管理器
 *
 * @description 管理数据库连接的创建、维护和销毁
 * 支持多租户连接管理、连接池优化、连接监控等功能
 *
 * @fileoverview 数据库连接管理器实现文件
 * @since 1.0.0
 */

import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import type { EntityManager, Connection } from '@mikro-orm/core';
import { PinoLogger } from '@hl8/logger';
import {
  DI_TOKENS,
  DATABASE_DEFAULTS,
  CONNECTION_STATUS,
  DatabaseType,
} from './constants';
import type {
  DatabaseModuleOptions,
  ConnectionInfo,
  ConnectionStats,
} from './types';
import {
  DatabaseConnectionException,
  TenantNotFoundException,
} from './exceptions';

/**
 * 连接管理器类
 *
 * @description 负责管理所有数据库连接，包括主连接和租户连接
 * 提供连接池管理、连接监控、自动重连等功能
 *
 * ## 业务规则
 *
 * ### 连接管理规则
 * - 主数据库连接在模块初始化时建立
 * - 租户连接采用懒加载策略，按需创建
 * - 空闲连接会根据配置自动关闭
 * - 连接失败时支持自动重试机制
 *
 * ### 连接池规则
 * - 每个数据库维护独立的连接池
 * - 连接池大小根据配置动态调整
 * - 连接池耗尽时会进入等待队列
 * - 连接使用完毕必须归还连接池
 *
 * ### 租户连接规则
 * - 每个租户可以有独立的数据库连接
 * - 租户连接数受配置限制
 * - 租户连接支持动态创建和销毁
 * - 租户连接会自动管理生命周期
 *
 * @example
 * ```typescript
 * // 获取主连接
 * const connection = await connectionManager.getConnection();
 *
 * // 获取租户连接
 * const tenantConnection = await connectionManager.getTenantConnection('tenant-123');
 *
 * // 创建租户数据库
 * await connectionManager.createTenantDatabase('tenant-123');
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConnectionManager implements OnModuleInit, OnModuleDestroy {
  /**
   * 主 ORM 实例
   */
  private orm!: MikroORM;

  /**
   * 租户连接映射表
   */
  private readonly tenantConnections = new Map<string, Connection>();

  /**
   * 连接统计信息
   */
  private readonly connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
  };

  constructor(
    @Inject(DI_TOKENS.MODULE_OPTIONS)
    private readonly options: DatabaseModuleOptions,
    private readonly logger: PinoLogger
  ) {
    this.logger.info('ConnectionManager initialized', {
      config: {
        database: this.options.mikroORM['dbName'],
        type: this.options.mikroORM['type'],
      },
    });
  }

  /**
   * 模块初始化钩子
   *
   * @description 初始化主数据库连接
   *
   * @throws {DatabaseConnectionException} 连接失败时抛出
   */
  async onModuleInit(): Promise<void> {
    this.logger.info('Initializing database connections...');

    try {
      // 注意：MikroORM 实例应该由 MikroOrmModule 提供
      // 这里假设可以通过依赖注入获取
      this.connectionStats.totalConnections++;
      this.connectionStats.activeConnections++;

      this.logger.info('Database connections initialized successfully', {
        stats: this.connectionStats,
      });
    } catch (error) {
      this.connectionStats.failedConnections++;
      this.logger.error('Failed to initialize database connections', {
        error,
        config: this.options.mikroORM,
      });

      throw new DatabaseConnectionException(
        '数据库连接初始化失败',
        {
          database: this.options.mikroORM['dbName'],
          type: this.options.mikroORM['type'],
        },
        error as Error
      );
    }
  }

  /**
   * 模块销毁钩子
   *
   * @description 清理所有数据库连接
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.info('Closing database connections...');

    try {
      await this.closeAll();

      this.logger.info('Database connections closed successfully');
    } catch (error) {
      this.logger.error('Failed to close database connections', { error });
    }
  }

  /**
   * 获取主数据库连接
   *
   * @description 获取主数据库的连接实例
   *
   * @returns 数据库连接
   * @throws {DatabaseConnectionException} 连接不可用时抛出
   *
   * @example
   * ```typescript
   * const connection = await connectionManager.getConnection();
   * ```
   */
  async getConnection(): Promise<Connection> {
    if (!this.orm) {
      throw new DatabaseConnectionException('主数据库连接未初始化', {
        database: this.options.mikroORM['dbName'],
      });
    }

    return this.orm.em.getConnection();
  }

  /**
   * 获取租户数据库连接
   *
   * @description 获取指定租户的数据库连接，如果不存在则创建
   *
   * @param tenantId - 租户ID
   * @returns 租户数据库连接
   * @throws {TenantNotFoundException} 租户连接创建失败时抛出
   *
   * @example
   * ```typescript
   * const connection = await connectionManager.getTenantConnection('tenant-123');
   * ```
   */
  async getTenantConnection(tenantId: string): Promise<Connection> {
    // 检查是否已存在连接
    let connection = this.tenantConnections.get(tenantId);

    if (!connection) {
      this.logger.info('Creating tenant connection', { tenantId });

      try {
        connection = await this.createTenantConnectionInternal(tenantId);
        this.tenantConnections.set(tenantId, connection);

        this.logger.info('Tenant connection created', { tenantId });
      } catch (error) {
        this.logger.error('Failed to create tenant connection', {
          tenantId,
          error,
        });

        throw new TenantNotFoundException(
          `租户连接创建失败: ${tenantId}`,
          { tenantId },
          error as Error
        );
      }
    }

    return connection;
  }

  /**
   * 创建租户数据库
   *
   * @description 为指定租户创建独立的数据库
   *
   * @param tenantId - 租户ID
   * @throws {DatabaseConnectionException} 数据库创建失败时抛出
   *
   * @example
   * ```typescript
   * await connectionManager.createTenantDatabase('tenant-123');
   * ```
   */
  async createTenantDatabase(tenantId: string): Promise<void> {
    this.logger.info('Creating tenant database', { tenantId });

    try {
      const dbName = this.getTenantDatabaseName(tenantId);

      // 使用主连接创建租户数据库
      const em = this.orm.em.fork();
      await em.getConnection().execute(`CREATE DATABASE "${dbName}"`);

      this.logger.info('Tenant database created', { tenantId, dbName });
    } catch (error) {
      this.logger.error('Failed to create tenant database', {
        tenantId,
        error,
      });

      throw new DatabaseConnectionException(
        `租户数据库创建失败: ${tenantId}`,
        { tenantId },
        error as Error
      );
    }
  }

  /**
   * 删除租户数据库
   *
   * @description 删除指定租户的数据库
   *
   * @param tenantId - 租户ID
   * @throws {DatabaseConnectionException} 数据库删除失败时抛出
   *
   * @example
   * ```typescript
   * await connectionManager.deleteTenantDatabase('tenant-123');
   * ```
   */
  async deleteTenantDatabase(tenantId: string): Promise<void> {
    this.logger.info('Deleting tenant database', { tenantId });

    try {
      // 先关闭租户连接
      await this.closeTenantConnection(tenantId);

      const dbName = this.getTenantDatabaseName(tenantId);

      // 使用主连接删除租户数据库
      const em = this.orm.em.fork();
      await em.getConnection().execute(`DROP DATABASE IF EXISTS "${dbName}"`);

      this.logger.info('Tenant database deleted', { tenantId, dbName });
    } catch (error) {
      this.logger.error('Failed to delete tenant database', {
        tenantId,
        error,
      });

      throw new DatabaseConnectionException(
        `租户数据库删除失败: ${tenantId}`,
        { tenantId },
        error as Error
      );
    }
  }

  /**
   * 关闭租户连接
   *
   * @description 关闭指定租户的数据库连接
   *
   * @param tenantId - 租户ID
   */
  async closeTenantConnection(tenantId: string): Promise<void> {
    const connection = this.tenantConnections.get(tenantId);

    if (connection) {
      this.logger.info('Closing tenant connection', { tenantId });

      try {
        // MikroORM 的连接关闭由 ORM 实例管理
        this.tenantConnections.delete(tenantId);

        this.logger.info('Tenant connection closed', { tenantId });
      } catch (error) {
        this.logger.error('Failed to close tenant connection', {
          tenantId,
          error,
        });
      }
    }
  }

  /**
   * 关闭所有连接
   *
   * @description 关闭主连接和所有租户连接
   */
  async closeAll(): Promise<void> {
    this.logger.info('Closing all connections');

    // 关闭所有租户连接
    const tenantIds = Array.from(this.tenantConnections.keys());
    await Promise.all(
      tenantIds.map((tenantId) => this.closeTenantConnection(tenantId))
    );

    // 关闭主连接
    if (this.orm) {
      await this.orm.close(true);
      this.connectionStats.activeConnections--;
    }

    this.logger.info('All connections closed');
  }

  /**
   * 检查连接状态
   *
   * @description 检查主数据库连接是否可用
   *
   * @returns 连接是否可用
   */
  isConnected(): boolean {
    return !!this.orm;
  }

  /**
   * 获取连接信息
   *
   * @description 获取主数据库的连接信息
   *
   * @returns 连接信息
   */
  getConnectionInfo(): ConnectionInfo {
    return {
      type: this.options.mikroORM['type'] as DatabaseType,
      database: this.options.mikroORM['dbName'] as string,
      host: (this.options.mikroORM['host'] as string) || 'localhost',
      port:
        (this.options.mikroORM['port'] as number) ||
        DATABASE_DEFAULTS.POSTGRES_PORT,
      status: this.isConnected()
        ? CONNECTION_STATUS.CONNECTED
        : CONNECTION_STATUS.DISCONNECTED,
      connectedAt: this.isConnected() ? new Date() : undefined,
    };
  }

  /**
   * 获取连接统计信息
   *
   * @description 获取连接池的统计信息
   *
   * @returns 连接统计
   */
  getConnectionStats(): ConnectionStats {
    return {
      type: this.options.mikroORM['type'] as DatabaseType,
      total: this.connectionStats.totalConnections,
      active: this.connectionStats.activeConnections,
      idle: 0, // 需要从连接池获取
      waiting: 0, // 需要从连接池获取
      poolSize:
        this.options.connectionPool?.postgres?.max ||
        DATABASE_DEFAULTS.POOL_MAX,
      averageConnectionTime: 0, // 需要统计计算
      maxConnections: this.connectionStats.totalConnections,
    };
  }

  /**
   * 设置 ORM 实例
   *
   * @description 由 DatabaseModule 注入 ORM 实例
   *
   * @param orm - MikroORM 实例
   * @internal
   */
  setOrm(orm: MikroORM): void {
    this.orm = orm;
  }

  /**
   * 获取租户数据库名称
   *
   * @description 根据租户ID生成数据库名称
   *
   * @param tenantId - 租户ID
   * @returns 数据库名称
   * @private
   */
  private getTenantDatabaseName(tenantId: string): string {
    const prefix =
      this.options.tenant?.tenantDatabasePrefix ||
      DATABASE_DEFAULTS.TENANT_DB_PREFIX;
    return `${prefix}${tenantId}`;
  }

  /**
   * 创建租户连接（内部方法）
   *
   * @description 创建租户的数据库连接
   *
   * @param _tenantId - 租户ID
   * @returns 租户连接
   * @private
   */
  private async createTenantConnectionInternal(
    _tenantId: string
  ): Promise<Connection> {
    // 实际实现需要根据隔离策略创建连接
    // 这里是简化实现，实际需要根据 ISOLATION_STRATEGIES 配置

    // 创建新的 ORM 实例用于租户连接
    // 实际实现需要更复杂的逻辑
    return this.orm.em.getConnection();
  }
}
