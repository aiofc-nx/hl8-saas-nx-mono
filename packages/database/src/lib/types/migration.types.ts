/**
 * 迁移管理类型定义
 *
 * @description 定义数据库迁移相关的类型
 * 包括迁移配置、迁移状态、迁移信息等
 *
 * @fileoverview 数据库迁移类型定义文件
 * @since 1.0.0
 */

import type { MigrationStatusType } from '../constants';

// ============================================================================
// 迁移配置类型 (Migration Configuration Types)
// ============================================================================

/**
 * 迁移配置
 *
 * @description 数据库迁移的配置选项
 */
export interface MigrationConfig {
  /**
   * 是否启用自动迁移
   */
  enableAutoMigration: boolean;

  /**
   * 迁移文件路径
   */
  migrationPath: string;

  /**
   * 租户迁移文件路径
   */
  tenantMigrationPath: string;

  /**
   * 是否在启动时运行迁移
   */
  runMigrationsOnStartup: boolean;

  /**
   * 迁移表名称
   */
  tableName?: string;

  /**
   * 迁移锁超时时间（毫秒）
   */
  lockTimeout?: number;
}

// ============================================================================
// 迁移服务接口 (Migration Service Interface)
// ============================================================================

/**
 * 迁移服务接口
 *
 * @description 定义数据库迁移服务的操作接口
 *
 * ## 业务规则
 *
 * - 迁移必须按版本顺序执行
 * - 回滚操作必须验证版本依赖
 * - 租户迁移必须在租户数据库上执行
 * - 迁移失败必须记录详细日志
 */
export interface IMigrationService {
  /**
   * 运行所有待执行迁移
   */
  runMigrations(): Promise<void>;

  /**
   * 运行租户迁移
   *
   * @param tenantId - 租户ID
   */
  runTenantMigrations(tenantId: string): Promise<void>;

  /**
   * 生成迁移文件
   *
   * @param name - 迁移名称
   * @returns 生成的迁移文件路径
   */
  generateMigration(name: string): Promise<string>;

  /**
   * 回滚迁移
   *
   * @param version - 迁移版本
   */
  rollbackMigration(version: string): Promise<void>;

  /**
   * 回滚租户迁移
   *
   * @param tenantId - 租户ID
   * @param version - 迁移版本
   */
  rollbackTenantMigration(tenantId: string, version: string): Promise<void>;

  /**
   * 获取迁移状态
   *
   * @returns 迁移状态信息
   */
  getMigrationStatus(): Promise<MigrationStatus>;

  /**
   * 获取租户迁移状态
   *
   * @param tenantId - 租户ID
   * @returns 租户迁移状态
   */
  getTenantMigrationStatus(tenantId: string): Promise<MigrationStatus>;

  /**
   * 列出所有迁移
   *
   * @returns 迁移信息列表
   */
  listMigrations(): Promise<MigrationInfo[]>;

  /**
   * 列出租户迁移
   *
   * @param tenantId - 租户ID
   * @returns 租户迁移信息列表
   */
  listTenantMigrations(tenantId: string): Promise<MigrationInfo[]>;
}

// ============================================================================
// 迁移状态类型 (Migration Status Types)
// ============================================================================

/**
 * 迁移状态
 *
 * @description 数据库迁移的状态信息
 */
export interface MigrationStatus {
  /**
   * 当前数据库版本
   */
  currentVersion: string;

  /**
   * 最新可用版本
   */
  latestVersion: string;

  /**
   * 待执行迁移数量
   */
  pendingCount: number;

  /**
   * 已执行迁移数量
   */
  executedCount: number;

  /**
   * 迁移状态
   */
  status: MigrationStatusType;

  /**
   * 最后迁移时间
   */
  lastMigrationAt?: Date;
}

/**
 * 迁移信息
 *
 * @description 单个迁移的详细信息
 */
export interface MigrationInfo {
  /**
   * 迁移名称
   */
  name: string;

  /**
   * 迁移版本
   */
  version: string;

  /**
   * 迁移状态
   */
  status: MigrationStatusType;

  /**
   * 执行时间
   */
  executedAt?: Date;

  /**
   * 执行耗时（毫秒）
   */
  duration?: number;

  /**
   * 错误信息
   */
  error?: string;
}
