import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserProfile } from '../value-objects/user-profile.vo';

export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly newProfile: UserProfile
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserProfileUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      newProfile: this.newProfile.getAllProfile()
    };
  }
}
