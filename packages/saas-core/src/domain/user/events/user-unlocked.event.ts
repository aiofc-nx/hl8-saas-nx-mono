import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserUnlockedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserUnlocked';
  }

  public override get eventData(): Record<string, unknown> {
    return {};
  }
}
