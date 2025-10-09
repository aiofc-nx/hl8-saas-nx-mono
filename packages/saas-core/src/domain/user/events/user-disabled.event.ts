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

  public toJSON(): object {
    return {
      ...super.toJSON(),
      reason: this.reason,
    };
  }
}

