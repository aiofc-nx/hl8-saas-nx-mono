/**
 * 用户登录事件
 *
 * @class UserLoginEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserLoginEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly ip: string,
    public readonly userAgent: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  public toJSON(): object {
    return {
      ...super.toJSON(),
      ip: this.ip,
      userAgent: this.userAgent,
    };
  }
}

