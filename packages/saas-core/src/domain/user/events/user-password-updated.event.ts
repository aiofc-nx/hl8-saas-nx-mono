import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserPasswordUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserPasswordUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {};
  }
}
