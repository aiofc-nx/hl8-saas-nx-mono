/**
 * 用户禁用事件
 *
 * @class UserDisabledEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserDisabledEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly reason: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'UserDisabled';
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      reason: this.reason,
    };
  }
}

