/**
 * 租户暂停事件
 *
 * @description 当租户被暂停时发布的领域事件
 *
 * ## 业务规则
 *
 * ### 事件触发时机
 * - 租户因违规被暂停
 * - 租户因欠费被暂停
 * - 租户主动申请暂停
 *
 * ### 事件用途
 * - 通知租户暂停原因
 * - 发送暂停通知邮件
 * - 触发服务访问限制
 * - 记录审计日志
 *
 * @class TenantSuspendedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

/**
 * 租户暂停事件
 *
 * @class TenantSuspendedEvent
 * @extends {BaseDomainEvent}
 */
export class TenantSuspendedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param {EntityId} aggregateId - 聚合根ID（租户ID）
   * @param {number} version - 聚合根版本号
   * @param {EntityId} tenantId - 租户ID
   * @param {string} reason - 暂停原因
   */
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly reason: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'TenantSuspended';
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
    };
  }
}

