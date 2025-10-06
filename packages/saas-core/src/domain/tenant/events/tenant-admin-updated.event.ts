/**
 * 租户管理员更新事件
 *
 * @description 当租户管理员更新时发布的领域事件
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class TenantAdminUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly newAdminId: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantAdminUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      newAdminId: this.newAdminId
    };
  }
}
