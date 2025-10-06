/**
 * 用户注册事件
 *
 * @description 当用户注册时发布的领域事件
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly email: string,
    public readonly username: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'UserRegistered';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      email: this.email,
      username: this.username
    };
  }
}
