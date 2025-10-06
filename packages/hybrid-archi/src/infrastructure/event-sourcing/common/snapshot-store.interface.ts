/**
 * 通用快照存储接口
 *
 * @description 快照存储的通用接口定义，支持事件溯源优化
 * @since 1.0.0
 */

/**
 * 快照数据接口
 *
 * @description 快照数据的结构定义
 */
export interface Snapshot {
  aggregateId: string;
  version: number;
  timestamp: Date;
  data: unknown;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 快照存储接口
 *
 * @description 快照存储的通用接口定义，支持事件溯源优化
 *
 * ## 业务规则
 *
 * ### 快照保存规则
 * - 保存聚合根的快照
 * - 支持版本控制
 * - 支持租户隔离
 * - 支持元数据存储
 *
 * ### 快照查询规则
 * - 获取最新快照
 * - 按版本获取快照
 * - 支持快照清理
 * - 支持快照统计
 *
 * ### 性能优化规则
 * - 支持快照压缩
 * - 支持快照加密
 * - 支持快照备份
 * - 支持快照恢复
 */
export interface ISnapshotStore {
  /**
   * 保存快照
   *
   * @description 保存聚合根的快照数据
   * @param aggregateId - 聚合ID
   * @param snapshot - 快照数据
   * @param version - 快照版本
   * @returns 保存结果
   */
  saveSnapshot(
    aggregateId: string,
    snapshot: unknown,
    version: number
  ): Promise<void>;

  /**
   * 获取快照
   *
   * @description 获取指定版本的快照
   * @param aggregateId - 聚合ID
   * @param version - 快照版本
   * @returns 快照数据
   */
  getSnapshot(aggregateId: string, version: number): Promise<Snapshot | null>;

  /**
   * 获取最新快照
   *
   * @description 获取聚合的最新快照
   * @param aggregateId - 聚合ID
   * @returns 最新快照
   */
  getLatestSnapshot(aggregateId: string): Promise<Snapshot | null>;

  /**
   * 删除快照
   *
   * @description 删除指定版本的快照或所有快照
   * @param aggregateId - 聚合ID
   * @param version - 快照版本（可选）
   * @returns 删除结果
   */
  deleteSnapshot(aggregateId: string, version?: number): Promise<void>;

  /**
   * 清理旧快照
   *
   * @description 清理聚合的旧快照，保留指定数量的快照
   * @param aggregateId - 聚合ID
   * @param retainCount - 保留数量
   * @returns 清理结果
   */
  cleanupOldSnapshots(aggregateId: string, retainCount: number): Promise<void>;

  /**
   * 检查快照是否存在
   *
   * @description 检查指定版本的快照是否存在
   * @param aggregateId - 聚合ID
   * @param version - 快照版本（可选）
   * @returns 是否存在
   */
  exists(aggregateId: string, version?: number): Promise<boolean>;

  /**
   * 获取快照统计信息
   *
   * @description 获取快照存储的统计信息
   * @returns 统计信息
   */
  getStats(): Promise<SnapshotStoreStats>;
}

/**
 * 快照存储统计信息接口
 */
export interface SnapshotStoreStats {
  totalSnapshots: number;
  totalAggregates: number;
  averageSnapshotsPerAggregate: number;
  oldestSnapshot: Date;
  newestSnapshot: Date;
  storageSize: number;
  compressionRatio: number;
}

/**
 * 快照存储配置接口
 */
export interface SnapshotStoreConfig {
  provider: 'postgresql' | 'mysql' | 'mongodb' | 'inmemory';
  connectionString?: string;
  tableName?: string;
  compression?: boolean;
  encryption?: boolean;
  retentionPolicy?: {
    maxSnapshotsPerAggregate: number;
    maxAge: number;
    cleanupInterval: number;
  };
  backup?: {
    enabled: boolean;
    interval: number;
    retention: number;
  };
}
