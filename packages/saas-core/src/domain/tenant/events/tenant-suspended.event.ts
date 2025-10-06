/**
 * 租户暂停事件
 *
 * @description 当租户被暂停时发布的领域事件
 * 表示租户从活跃状态变为暂停状态
 *
 * ## 业务规则
 *
 * ### 事件触发条件
 * - 租户状态从 ACTIVE 变为 SUSPENDED
 * - 暂停原因必须提供
 * - 暂停操作必须由授权用户执行
 *
 * @example
 * ```typescript
 * // 在聚合根中发布事件
 * this.addDomainEvent(new TenantSuspendedEvent(this.tenantId, reason));
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

/**
 * 租户暂停事件
 *
 * @description 租户暂停时发布的领域事件
 */
export class TenantSuspendedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param aggregateId - 租户聚合根ID
   * @param aggregateVersion - 聚合根版本
   * @param tenantId - 租户ID（用于多租户隔离）
   * @param reason - 暂停原因
   */
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly reason: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  /**
   * 获取事件类型
   *
   * @returns 事件类型
   */
  public get eventType(): string {
    return 'TenantSuspended';
  }

  /**
   * 获取事件数据
   *
   * @returns 事件数据对象
   */
  public override get eventData(): Record<string, unknown> {
    return {
      reason: this.reason
    };
  }
}
