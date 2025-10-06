import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserRole } from '@hl8/hybrid-archi';

export class UserAssignedToTenantEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly assignedTenantId: string,
    public readonly role: UserRole
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserAssignedToTenant';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      assignedTenantId: this.assignedTenantId,
      role: this.role
    };
  }
}
