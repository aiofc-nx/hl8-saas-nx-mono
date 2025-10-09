/**
 * 用户注册事件
 *
 * @class UserRegisteredEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly username: string,
    public readonly email: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'UserRegistered';
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      username: this.username,
      email: this.email,
    };
  }
}

