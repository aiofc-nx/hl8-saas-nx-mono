import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class OrganizationCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly code: string,
    public readonly name: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'OrganizationCreated';
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      code: this.code,
      name: this.name,
    };
  }
}

