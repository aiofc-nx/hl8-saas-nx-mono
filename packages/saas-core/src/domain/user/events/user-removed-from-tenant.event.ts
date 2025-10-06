import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserRemovedFromTenantEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly removedTenantId: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRemovedFromTenant';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      removedTenantId: this.removedTenantId
    };
  }
}
