/**
 * 租户删除事件
 *
 * @description 当租户被删除时发布的领域事件
 *
 * ## 业务规则
 *
 * ### 事件触发时机
 * - 租户被软删除
 * - 删除原因已记录
 * - 数据保留期开始计时
 *
 * ### 事件用途
 * - 通知租户删除
 * - 触发数据归档流程
 * - 启动数据保留计时器（30天）
 * - 记录删除审计日志
 *
 * @class TenantDeletedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

/**
 * 租户删除事件
 *
 * @class TenantDeletedEvent
 * @extends {BaseDomainEvent}
 */
export class TenantDeletedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param {EntityId} aggregateId - 聚合根ID（租户ID）
   * @param {number} version - 聚合根版本号
   * @param {EntityId} tenantId - 租户ID
   * @param {string} reason - 删除原因
   * @param {string} deletedBy - 删除人ID
   */
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly reason: string,
    public readonly deletedBy: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'TenantDeleted';
  }

  /**
   * 转换为 JSON
   *
   * @returns {object} 事件数据对象
   */
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      reason: this.reason,
      deletedBy: this.deletedBy,
    };
  }
}

