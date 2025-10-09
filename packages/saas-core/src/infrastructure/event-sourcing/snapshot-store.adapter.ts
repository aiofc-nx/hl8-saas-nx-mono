/**
 * 快照存储适配器
 *
 * @description 聚合根快照的存储和管理
 *
 * ## 业务规则
 *
 * ### 快照策略
 * - 每100个事件创建一次快照
 * - 快照包含聚合根的完整状态
 * - 快照用于加速聚合根重建
 *
 * ### 快照管理
 * - 保留最近N个快照（默认3个）
 * - 自动清理过期快照
 * - 快照与事件版本号关联
 *
 * ### 性能优化
 * - 快照缓存（可选）
 * - 压缩大型快照
 * - 异步创建快照
 *
 * @module infrastructure/event-sourcing
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

/**
 * 快照记录接口
 *
 * @interface ISnapshotRecord
 */
export interface ISnapshotRecord {
  /** 快照ID */
  id: string;
  /** 聚合根类型 */
  aggregateType: string;
  /** 聚合根ID */
  aggregateId: string;
  /** 快照数据（JSON） */
  snapshotData: Record<string, any>;
  /** 快照版本号 */
  version: number;
  /** 租户ID */
  tenantId: string;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 快照配置
 *
 * @interface ISnapshotConfig
 */
export interface ISnapshotConfig {
  /** 快照间隔（事件数） */
  snapshotInterval: number;
  /** 保留快照数量 */
  retainCount: number;
  /** 是否启用压缩 */
  enableCompression: boolean;
  /** 是否启用缓存 */
  enableCache: boolean;
}

/**
 * 默认快照配置
 *
 * @constant
 */
const DEFAULT_SNAPSHOT_CONFIG: ISnapshotConfig = {
  snapshotInterval: 100,
  retainCount: 3,
  enableCompression: false,
  enableCache: true,
};

/**
 * 快照存储适配器
 *
 * @class SnapshotStoreAdapter
 * @description 提供快照的创建、读取和管理功能
 */
@Injectable()
export class SnapshotStoreAdapter {
  private config: ISnapshotConfig;

  constructor(
    private readonly em: EntityManager,
    config?: Partial<ISnapshotConfig>,
  ) {
    this.config = { ...DEFAULT_SNAPSHOT_CONFIG, ...config };
  }

  /**
   * 创建快照
   *
   * @description 将聚合根的当前状态保存为快照
   *
   * ## 业务规则
   * 1. 验证版本号
   * 2. 序列化聚合根状态
   * 3. 保存快照记录
   * 4. 清理过期快照
   *
   * @async
   * @param {string} streamId - 事件流ID
   * @param {any} aggregateState - 聚合根状态
   * @param {number} version - 版本号
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * const streamId = 'tenant-123';
   * const state = tenant.toSnapshot();
   * await snapshotStore.createSnapshot(streamId, state, 100);
   * ```
   */
  public async createSnapshot(
    streamId: string,
    aggregateState: any,
    version: number,
  ): Promise<void> {
    // 验证是否需要创建快照
    if (!this.shouldCreateSnapshot(version)) {
      return;
    }

    // 提取租户ID
    const tenantId = aggregateState.tenantId?.toString() || '';

    // 准备快照记录
    const record: ISnapshotRecord = {
      id: this.generateSnapshotId(),
      aggregateType: this.extractAggregateType(streamId),
      aggregateId: this.extractAggregateId(streamId),
      snapshotData: this.serializeState(aggregateState),
      version,
      tenantId,
      createdAt: new Date(),
    };

    // 保存快照
    await this.em.nativeInsert('snapshot_store', record);

    // 异步清理过期快照
    setImmediate(() => {
      this.cleanupOldSnapshots(streamId).catch(err => {
        console.error('快照清理失败:', err);
      });
    });
  }

  /**
   * 获取最新快照
   *
   * @description 读取指定聚合根的最新快照
   *
   * @async
   * @param {string} streamId - 事件流ID
   * @returns {Promise<ISnapshotRecord | null>} 快照记录或null
   *
   * @example
   * ```typescript
   * const snapshot = await snapshotStore.getSnapshot('tenant-123');
   * if (snapshot) {
   *   // 从快照重建聚合根
   *   tenant = Tenant.fromSnapshot(snapshot.snapshotData);
   * }
   * ```
   */
  public async getSnapshot(streamId: string): Promise<ISnapshotRecord | null> {
    const record = await this.em.findOne<ISnapshotRecord>(
      'snapshot_store',
      {
        aggregateType: this.extractAggregateType(streamId),
        aggregateId: this.extractAggregateId(streamId),
      },
      {
        orderBy: { version: 'DESC' },
        limit: 1,
      },
    );

    return record || null;
  }

  /**
   * 获取指定版本的快照
   *
   * @description 读取指定版本或之前最近的快照
   *
   * @async
   * @param {string} streamId - 事件流ID
   * @param {number} version - 版本号
   * @returns {Promise<ISnapshotRecord | null>} 快照记录或null
   */
  public async getSnapshotAtVersion(
    streamId: string,
    version: number,
  ): Promise<ISnapshotRecord | null> {
    const record = await this.em.findOne<ISnapshotRecord>(
      'snapshot_store',
      {
        aggregateType: this.extractAggregateType(streamId),
        aggregateId: this.extractAggregateId(streamId),
        version: { $lte: version },
      },
      {
        orderBy: { version: 'DESC' },
        limit: 1,
      },
    );

    return record || null;
  }

  /**
   * 检查是否应该创建快照
   *
   * @description 根据配置的快照间隔判断
   *
   * @private
   * @param {number} version - 当前版本号
   * @returns {boolean} 是否应该创建快照
   */
  private shouldCreateSnapshot(version: number): boolean {
    return version % this.config.snapshotInterval === 0;
  }

  /**
   * 清理过期快照
   *
   * @description 保留最近N个快照，删除旧快照
   *
   * @private
   * @async
   * @param {string} streamId - 事件流ID
   * @returns {Promise<void>}
   */
  private async cleanupOldSnapshots(streamId: string): Promise<void> {
    const allSnapshots = await this.em.find<ISnapshotRecord>(
      'snapshot_store',
      {
        aggregateType: this.extractAggregateType(streamId),
        aggregateId: this.extractAggregateId(streamId),
      },
      {
        orderBy: { version: 'DESC' },
      },
    );

    // 保留最近的N个快照
    const snapshotsToDelete = allSnapshots.slice(this.config.retainCount);

    if (snapshotsToDelete.length > 0) {
      const idsToDelete = snapshotsToDelete.map(s => s.id);
      await this.em.nativeDelete('snapshot_store', {
        id: { $in: idsToDelete },
      });
    }
  }

  /**
   * 生成快照ID
   *
   * @private
   * @returns {string} 快照ID
   */
  private generateSnapshotId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从流ID提取聚合根类型
   *
   * @private
   * @param {string} streamId - 事件流ID
   * @returns {string} 聚合根类型
   */
  private extractAggregateType(streamId: string): string {
    return streamId.split('-')[0];
  }

  /**
   * 从流ID提取聚合根ID
   *
   * @private
   * @param {string} streamId - 事件流ID
   * @returns {string} 聚合根ID
   */
  private extractAggregateId(streamId: string): string {
    return streamId.substring(streamId.indexOf('-') + 1);
  }

  /**
   * 序列化聚合根状态
   *
   * @private
   * @param {any} state - 聚合根状态
   * @returns {Record<string, any>} 序列化后的状态
   */
  private serializeState(state: any): Record<string, any> {
    if (typeof state.toSnapshot === 'function') {
      return state.toSnapshot();
    }
    if (typeof state.toJSON === 'function') {
      return state.toJSON();
    }
    return state;
  }

  /**
   * 获取快照统计信息
   *
   * @description 获取指定聚合根的快照统计
   *
   * @async
   * @param {string} streamId - 事件流ID
   * @returns {Promise<{ count: number; latestVersion: number }>} 统计信息
   */
  public async getSnapshotStats(
    streamId: string,
  ): Promise<{ count: number; latestVersion: number }> {
    const snapshots = await this.em.find<ISnapshotRecord>(
      'snapshot_store',
      {
        aggregateType: this.extractAggregateType(streamId),
        aggregateId: this.extractAggregateId(streamId),
      },
      {
        orderBy: { version: 'DESC' },
      },
    );

    return {
      count: snapshots.length,
      latestVersion: snapshots[0]?.version || 0,
    };
  }
}

