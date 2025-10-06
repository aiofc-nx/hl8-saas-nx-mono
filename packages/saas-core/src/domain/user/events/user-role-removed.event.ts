import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserRole } from '@hl8/hybrid-archi';

export class UserRoleRemovedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly role: UserRole
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRoleRemoved';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      role: this.role
    };
  }
}
