/**
 * 连接管理类型定义
 *
 * @description 定义数据库连接管理相关的类型
 * 包括连接配置、连接池配置、连接统计等
 *
 * @fileoverview 数据库连接管理类型定义文件
 * @since 1.0.0
 */

import type { DatabaseType } from '../constants';

// ============================================================================
// PostgreSQL 配置类型 (PostgreSQL Configuration Types)
// ============================================================================

/**
 * PostgreSQL 配置
 *
 * @description PostgreSQL 数据库的连接配置
 */
export interface PostgresConfig {
  /**
   * 数据库主机地址
   */
  host: string;

  /**
   * 数据库端口
   */
  port: number;

  /**
   * 用户名
   */
  username: string;

  /**
   * 密码
   */
  password: string;

  /**
   * 数据库名称
   */
  database: string;

  /**
   * 是否启用 SSL
   */
  ssl?: boolean;

  /**
   * 连接池大小
   */
  poolSize?: number;

  /**
   * 其他选项
   */
  options?: Record<string, unknown>;
}

// ============================================================================
// MongoDB 配置类型 (MongoDB Configuration Types)
// ============================================================================

/**
 * MongoDB 配置
 *
 * @description MongoDB 数据库的连接配置
 */
export interface MongoConfig {
  /**
   * MongoDB 连接 URI
   */
  uri: string;

  /**
   * 数据库名称
   */
  database: string;

  /**
   * MongoDB 客户端选项
   */
  options?: Record<string, unknown>;
}

// ============================================================================
// 连接池配置类型 (Connection Pool Configuration Types)
// ============================================================================

/**
 * 连接池配置
 *
 * @description 数据库连接池的配置选项
 */
export interface ConnectionPoolConfig {
  /**
   * PostgreSQL 连接池配置
   */
  postgres?: {
    /**
     * 最小连接数
     */
    min: number;

    /**
     * 最大连接数
     */
    max: number;

    /**
     * 空闲超时时间（毫秒）
     */
    idleTimeoutMillis: number;

    /**
     * 连接超时时间（毫秒）
     */
    connectionTimeoutMillis: number;

    /**
     * 获取连接超时时间（毫秒）
     */
    acquireTimeoutMillis: number;
  };

  /**
   * MongoDB 连接池配置
   */
  mongodb?: {
    /**
     * 最小连接池大小
     */
    minPoolSize: number;

    /**
     * 最大连接池大小
     */
    maxPoolSize: number;

    /**
     * 最大空闲时间（毫秒）
     */
    maxIdleTimeMS: number;

    /**
     * 连接超时时间（毫秒）
     */
    connectTimeoutMS: number;

    /**
     * 服务器选择超时时间（毫秒）
     */
    serverSelectionTimeoutMS: number;
  };

  /**
   * 租户连接池配置
   */
  tenant?: {
    /**
     * 最大租户数量
     */
    maxTenants: number;

    /**
     * 每个租户的连接限制
     */
    tenantConnectionLimit: number;

    /**
     * 租户空闲超时时间（毫秒）
     */
    tenantIdleTimeout: number;
  };
}

// ============================================================================
// 连接统计类型 (Connection Statistics Types)
// ============================================================================

/**
 * 连接统计信息
 *
 * @description 数据库连接的统计信息
 */
export interface ConnectionStats {
  /**
   * 数据库类型
   */
  type: DatabaseType;

  /**
   * 总连接数
   */
  total: number;

  /**
   * 活跃连接数
   */
  active: number;

  /**
   * 空闲连接数
   */
  idle: number;

  /**
   * 等待连接数
   */
  waiting: number;

  /**
   * 连接池大小
   */
  poolSize: number;

  /**
   * 平均连接时间（毫秒）
   */
  averageConnectionTime: number;

  /**
   * 最大连接数（峰值）
   */
  maxConnections: number;
}

/**
 * 连接池统计
 *
 * @description 连接池的详细统计信息
 */
export interface PoolStats {
  /**
   * 池大小
   */
  size: number;

  /**
   * 可用连接数
   */
  available: number;

  /**
   * 使用中的连接数
   */
  inUse: number;

  /**
   * 等待队列长度
   */
  waitingQueue: number;

  /**
   * 创建的总连接数
   */
  totalCreated: number;

  /**
   * 销毁的总连接数
   */
  totalDestroyed: number;

  /**
   * 连接错误数
   */
  errors: number;
}

// ============================================================================
// 连接配置类型 (Connection Configuration Types)
// ============================================================================

/**
 * 连接配置
 *
 * @description 数据库连接的配置选项
 */
export interface ConnectionConfig {
  /**
   * 数据库类型
   */
  type: DatabaseType;

  /**
   * 主机地址
   */
  host: string;

  /**
   * 端口号
   */
  port: number;

  /**
   * 数据库名称
   */
  database: string;

  /**
   * 用户名
   */
  username?: string;

  /**
   * 密码
   */
  password?: string;

  /**
   * 是否启用 SSL
   */
  ssl?: boolean;

  /**
   * 连接超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 其他选项
   */
  options?: Record<string, unknown>;
}
