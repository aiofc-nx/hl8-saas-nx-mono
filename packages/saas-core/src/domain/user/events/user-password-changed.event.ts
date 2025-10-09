/**
 * 用户密码修改事件
 *
 * @class UserPasswordChangedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserPasswordChangedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'UserPasswordChanged';
  }
}

