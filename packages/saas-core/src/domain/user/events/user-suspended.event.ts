import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserSuspendedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly reason: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserSuspended';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      reason: this.reason
    };
  }
}
