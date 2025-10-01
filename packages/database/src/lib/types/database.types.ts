/**
 * 数据库核心类型定义
 *
 * @description 定义数据库模块的核心类型
 * 包括服务接口、配置选项、操作结果等
 *
 * @fileoverview 数据库模块核心类型定义文件
 * @since 1.0.0
 */

import type { EntityManager, Connection } from '@mikro-orm/core';
import type {
  DatabaseType,
  IsolationLevelType,
  ConnectionStatusType,
} from '../constants';
import type {
  PostgresConfig,
  MongoConfig,
  ConnectionPoolConfig,
} from './connection.types';
import type { TenantConfig } from './tenant.types';
import type { MigrationConfig } from './migration.types';
import type { MonitoringConfig } from './monitoring.types';

// ============================================================================
// 数据库服务接口 (Database Service Interfaces)
// ============================================================================

/**
 * 数据库服务接口
 *
 * @description 定义数据库服务的核心操作接口
 * 提供基础数据库操作、事务管理、连接管理等功能
 *
 * ## 业务规则
 *
 * - 所有查询操作必须通过 EntityManager 执行
 * - 事务操作必须保证原子性
 * - 连接必须在使用后正确释放
 * - 支持多数据库类型切换
 *
 * @since 1.0.0
 */
export interface IDatabaseService {
  /**
   * 获取数据库连接
   *
   * @returns 数据库连接实例
   */
  getConnection(): Promise<Connection>;

  /**
   * 获取实体管理器
   *
   * @returns 实体管理器实例
   */
  getEntityManager(): Promise<EntityManager>;

  /**
   * 执行SQL查询
   *
   * @param sql - SQL查询语句
   * @param params - 查询参数
   * @returns 查询结果
   */
  executeQuery<T>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * 执行原生SQL
   *
   * @param sql - SQL语句
   * @param params - 参数
   * @returns 执行结果
   */
  executeRaw<T>(sql: string, params?: unknown[]): Promise<T>;

  /**
   * 执行事务
   *
   * @param callback - 事务回调函数
   * @returns 事务执行结果
   */
  executeTransaction<T>(
    callback: (em: EntityManager) => Promise<T>
  ): Promise<T>;

  /**
   * 开始事务
   *
   * @returns 事务实体管理器
   */
  beginTransaction(): Promise<EntityManager>;

  /**
   * 提交事务
   *
   * @param em - 实体管理器
   */
  commitTransaction(em: EntityManager): Promise<void>;

  /**
   * 回滚事务
   *
   * @param em - 实体管理器
   */
  rollbackTransaction(em: EntityManager): Promise<void>;

  /**
   * 关闭连接
   */
  close(): Promise<void>;

  /**
   * 检查连接状态
   *
   * @returns 是否已连接
   */
  isConnected(): boolean;

  /**
   * 获取连接信息
   *
   * @returns 连接信息
   */
  getConnectionInfo(): ConnectionInfo;
}

/**
 * 多租户数据库服务接口
 *
 * @description 扩展基础数据库服务，提供多租户数据隔离和管理功能
 * 支持租户级别的数据库操作、事务管理、数据库创建等
 *
 * ## 业务规则
 *
 * - 每个租户的数据必须完全隔离
 * - 租户数据库操作必须验证租户ID
 * - 支持动态创建和删除租户数据库
 * - 租户连接必须独立管理
 *
 * @since 1.0.0
 */
export interface ITenantDatabaseService extends IDatabaseService {
  /**
   * 获取租户数据库连接
   *
   * @param tenantId - 租户ID
   * @returns 租户数据库连接
   */
  getTenantConnection(tenantId: string): Promise<Connection>;

  /**
   * 获取租户实体管理器
   *
   * @param tenantId - 租户ID
   * @returns 租户实体管理器
   */
  getTenantEntityManager(tenantId: string): Promise<EntityManager>;

  /**
   * 执行租户SQL查询
   *
   * @param tenantId - 租户ID
   * @param sql - SQL查询语句
   * @param params - 查询参数
   * @returns 查询结果
   */
  executeTenantQuery<T>(
    tenantId: string,
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;

  /**
   * 执行租户事务
   *
   * @param tenantId - 租户ID
   * @param callback - 事务回调函数
   * @returns 事务执行结果
   */
  executeTenantTransaction<T>(
    tenantId: string,
    callback: (em: EntityManager) => Promise<T>
  ): Promise<T>;

  /**
   * 创建租户数据库
   *
   * @param tenantId - 租户ID
   */
  createTenantDatabase(tenantId: string): Promise<void>;

  /**
   * 删除租户数据库
   *
   * @param tenantId - 租户ID
   */
  deleteTenantDatabase(tenantId: string): Promise<void>;

  /**
   * 迁移租户数据库
   *
   * @param tenantId - 租户ID
   */
  migrateTenant(tenantId: string): Promise<void>;

  /**
   * 获取租户连接信息
   *
   * @param tenantId - 租户ID
   * @returns 租户连接信息
   */
  getTenantConnectionInfo(tenantId: string): Promise<ConnectionInfo>;
}

// ============================================================================
// 配置类型 (Configuration Types)
// ============================================================================

/**
 * 数据库模块配置选项
 *
 * @description 数据库模块的完整配置选项
 */
export interface DatabaseModuleOptions {
  /**
   * MikroORM 配置
   */
  mikroORM: MikroORMConfig;

  /**
   * PostgreSQL 配置
   */
  postgres?: PostgresConfig;

  /**
   * MongoDB 配置
   */
  mongodb?: MongoConfig;

  /**
   * 多租户配置
   */
  tenant?: TenantConfig;

  /**
   * 连接池配置
   */
  connectionPool?: ConnectionPoolConfig;

  /**
   * 迁移配置
   */
  migration?: MigrationConfig;

  /**
   * 监控配置
   */
  monitoring?: MonitoringConfig;

  /**
   * 是否全局模块
   */
  global?: boolean;
}

/**
 * MikroORM 配置
 *
 * @description MikroORM 的基础配置选项
 * 兼容 @mikro-orm/nestjs 的配置接口
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MikroORMConfig = Record<string, any>;

// ============================================================================
// 连接信息类型 (Connection Info Types)
// ============================================================================

/**
 * 连接信息
 *
 * @description 数据库连接的详细信息
 */
export interface ConnectionInfo {
  /**
   * 数据库类型
   */
  type: DatabaseType;

  /**
   * 数据库名称
   */
  database: string;

  /**
   * 主机地址
   */
  host: string;

  /**
   * 端口号
   */
  port: number;

  /**
   * 连接状态
   */
  status: ConnectionStatusType;

  /**
   * 连接时间
   */
  connectedAt?: Date;

  /**
   * 租户ID（如果是租户连接）
   */
  tenantId?: string;
}

/**
 * 查询结果
 *
 * @description 数据库查询的结果
 */
export interface QueryResult<T = unknown> {
  /**
   * 查询数据
   */
  data: T[];

  /**
   * 影响的行数
   */
  affectedRows: number;

  /**
   * 查询执行时间（毫秒）
   */
  executionTime: number;
}

/**
 * 事务选项
 *
 * @description 事务的配置选项
 */
export interface TransactionOptions {
  /**
   * 事务隔离级别
   */
  isolation?: IsolationLevelType;

  /**
   * 超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 错误时是否回滚
   */
  rollbackOnError?: boolean;

  /**
   * 是否嵌套事务
   */
  nested?: boolean;
}

/**
 * 数据库统计信息
 *
 * @description 数据库的运行统计信息
 */
export interface DatabaseStats {
  /**
   * 总连接数
   */
  totalConnections: number;

  /**
   * 活跃连接数
   */
  activeConnections: number;

  /**
   * 空闲连接数
   */
  idleConnections: number;

  /**
   * 租户连接分布
   */
  tenantConnections: Map<string, number>;

  /**
   * 总查询数
   */
  totalQueries: number;

  /**
   * 慢查询数
   */
  slowQueries: number;

  /**
   * 失败查询数
   */
  failedQueries: number;

  /**
   * 平均查询时间（毫秒）
   */
  averageQueryTime: number;

  /**
   * 总事务数
   */
  totalTransactions: number;

  /**
   * 已提交事务数
   */
  committedTransactions: number;

  /**
   * 已回滚事务数
   */
  rolledBackTransactions: number;

  /**
   * 平均事务时间（毫秒）
   */
  averageTransactionTime: number;

  /**
   * 总租户数
   */
  totalTenants: number;

  /**
   * 活跃租户数
   */
  activeTenants: number;
}
