/**
 * 租户禁用事件
 *
 * @description 当租户被禁用时发布的领域事件
 * 表示租户从活跃状态变为禁用状态
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class TenantDisabledEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly reason: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantDisabled';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      reason: this.reason
    };
  }
}
