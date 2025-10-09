/**
 * 用户激活事件
 *
 * @class UserActivatedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserActivatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'UserActivated';
  }
}

