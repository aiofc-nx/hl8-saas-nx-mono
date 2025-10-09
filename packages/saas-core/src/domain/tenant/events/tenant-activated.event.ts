/**
 * 租户激活事件
 *
 * @description 当租户从试用状态转为活跃状态时发布的领域事件
 *
 * ## 业务规则
 *
 * ### 事件触发时机
 * - 试用租户被激活
 * - 过期租户被重新激活
 * - 暂停租户被恢复
 *
 * ### 事件用途
 * - 通知租户状态变更
 * - 触发激活通知邮件
 * - 更新监控指标
 * - 记录审计日志
 *
 * @class TenantActivatedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { TenantStatus } from '@hl8/hybrid-archi';

/**
 * 租户激活事件
 *
 * @class TenantActivatedEvent
 * @extends {BaseDomainEvent}
 */
export class TenantActivatedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param {EntityId} aggregateId - 聚合根ID（租户ID）
   * @param {number} version - 聚合根版本号
   * @param {EntityId} tenantId - 租户ID
   * @param {TenantStatus} previousStatus - 之前的状态
   */
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly previousStatus: TenantStatus,
  ) {
    super(aggregateId, version, tenantId);
  }

  /**
   * 转换为 JSON
   *
   * @returns {object} 事件数据对象
   */
  public toJSON(): object {
    return {
      ...super.toJSON(),
      previousStatus: this.previousStatus,
      newStatus: TenantStatus.ACTIVE,
    };
  }
}

