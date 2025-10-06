/**
 * 租户名称更新事件
 *
 * @description 当租户名称更新时发布的领域事件
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class TenantNameUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly newName: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantNameUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      newName: this.newName
    };
  }
}
