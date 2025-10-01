/**
 * 租户数据库类型定义
 *
 * @description 定义多租户数据库相关的类型
 * 包括租户配置、隔离策略、租户统计等
 *
 * @fileoverview 租户数据库类型定义文件
 * @since 1.0.0
 */

import type { IsolationStrategyType } from '../constants';

// ============================================================================
// 租户配置类型 (Tenant Configuration Types)
// ============================================================================

/**
 * 租户配置
 *
 * @description 多租户功能的配置选项
 *
 * ## 业务规则
 *
 * - 必须指定租户隔离策略
 * - 租户数据库前缀必须唯一
 * - 自动创建租户数据库需要足够的权限
 */
export interface TenantConfig {
  /**
   * 是否启用租户隔离
   */
  enableIsolation: boolean;

  /**
   * 租户隔离策略
   */
  isolationStrategy: IsolationStrategyType;

  /**
   * 租户数据库前缀
   *
   * @description 用于生成租户数据库名称
   * @example 'hl8_tenant_' + tenantId
   */
  tenantDatabasePrefix: string;

  /**
   * 是否自动创建租户数据库
   */
  autoCreateTenantDb: boolean;

  /**
   * 是否自动迁移租户数据库
   */
  autoMigrateTenant: boolean;

  /**
   * 租户连接配置
   */
  connectionConfig?: TenantConnectionConfig;
}

/**
 * 租户连接配置
 *
 * @description 租户级别的连接配置
 */
export interface TenantConnectionConfig {
  /**
   * 每个租户的最大连接数
   */
  maxConnectionsPerTenant?: number;

  /**
   * 租户连接空闲超时时间（毫秒）
   */
  idleTimeout?: number;

  /**
   * 租户连接超时时间（毫秒）
   */
  connectionTimeout?: number;
}

// ============================================================================
// 租户隔离策略接口 (Tenant Isolation Strategy Interface)
// ============================================================================

/**
 * 租户隔离策略接口
 *
 * @description 定义租户数据隔离的策略接口
 * 支持数据库级、Schema级、表级三种隔离方式
 *
 * ## 业务规则
 *
 * - 数据库级：每个租户独立数据库（最强隔离）
 * - Schema级：共享数据库，独立Schema（平衡隔离）
 * - 表级：共享数据库和Schema，通过租户ID字段隔离（最弱隔离）
 */
export interface ITenantIsolationStrategy {
  /**
   * 获取租户数据库名称
   *
   * @param tenantId - 租户ID
   * @returns 数据库名称
   */
  getDatabaseName(tenantId: string): string;

  /**
   * 获取租户连接字符串
   *
   * @param tenantId - 租户ID
   * @returns 连接字符串
   */
  getConnectionString(tenantId: string): string;

  /**
   * 判断租户是否需要隔离
   *
   * @param tenantId - 租户ID
   * @returns 是否需要隔离
   */
  shouldIsolateTenant(tenantId: string): boolean;

  /**
   * 获取租户表名
   *
   * @param tenantId - 租户ID
   * @param tableName - 原始表名
   * @returns 租户表名
   */
  getTableName(tenantId: string, tableName: string): string;

  /**
   * 获取租户Schema名称
   *
   * @param tenantId - 租户ID
   * @returns Schema名称
   */
  getSchemaName(tenantId: string): string;

  /**
   * 获取租户连接配置
   *
   * @param tenantId - 租户ID
   * @returns 连接配置
   */
  getTenantConnectionConfig(tenantId: string): Record<string, unknown>;

  /**
   * 创建租户连接
   *
   * @param tenantId - 租户ID
   * @returns 连接实例
   */
  createTenantConnection(tenantId: string): Promise<unknown>;

  /**
   * 关闭租户连接
   *
   * @param tenantId - 租户ID
   */
  closeTenantConnection(tenantId: string): Promise<void>;
}

// ============================================================================
// 租户统计类型 (Tenant Statistics Types)
// ============================================================================

/**
 * 租户数据库统计
 *
 * @description 单个租户的数据库统计信息
 */
export interface TenantDatabaseStats {
  /**
   * 租户ID
   */
  tenantId: string;

  /**
   * 数据库名称
   */
  databaseName: string;

  /**
   * 连接数
   */
  connections: number;

  /**
   * 查询数
   */
  queries: number;

  /**
   * 事务数
   */
  transactions: number;

  /**
   * 数据库大小（字节）
   */
  size: number;

  /**
   * 表数量
   */
  tableCount: number;

  /**
   * 最后活跃时间
   */
  lastActiveAt: Date;

  /**
   * 创建时间
   */
  createdAt: Date;
}

/**
 * 租户迁移信息
 *
 * @description 租户数据库的迁移信息
 */
export interface TenantMigrationInfo {
  /**
   * 租户ID
   */
  tenantId: string;

  /**
   * 当前版本
   */
  currentVersion: string;

  /**
   * 待执行迁移列表
   */
  pendingMigrations: string[];

  /**
   * 已执行迁移列表
   */
  executedMigrations: Array<{
    /**
     * 迁移名称
     */
    name: string;

    /**
     * 执行时间
     */
    executedAt: Date;
  }>;
}
