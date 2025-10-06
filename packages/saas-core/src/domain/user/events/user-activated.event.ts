import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserActivatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserActivated';
  }

  public override get eventData(): Record<string, unknown> {
    return {};
  }
}
