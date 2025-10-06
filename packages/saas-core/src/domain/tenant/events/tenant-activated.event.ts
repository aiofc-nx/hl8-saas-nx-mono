/**
 * 租户激活事件
 *
 * @description 当租户被激活时发布的领域事件
 * 表示租户从待激活状态变为活跃状态
 *
 * ## 业务规则
 *
 * ### 事件触发条件
 * - 租户状态从 PENDING 变为 ACTIVE
 * - 租户激活验证通过
 * - 租户资源分配完成
 *
 * @example
 * ```typescript
 * // 在聚合根中发布事件
 * this.addDomainEvent(new TenantActivatedEvent(this.tenantId));
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

/**
 * 租户激活事件
 *
 * @description 租户激活时发布的领域事件
 */
export class TenantActivatedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param aggregateId - 租户聚合根ID
   * @param aggregateVersion - 聚合根版本
   * @param tenantId - 租户ID（用于多租户隔离）
   */
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  /**
   * 获取事件类型
   *
   * @returns 事件类型
   */
  public get eventType(): string {
    return 'TenantActivated';
  }

  /**
   * 获取事件数据
   *
   * @returns 事件数据对象
   */
  public override get eventData(): Record<string, unknown> {
    return {};
  }
}
