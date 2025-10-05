/**
 * 用户启用事件
 *
 * 当用户被启用时触发的领域事件。
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';

/**
 * 用户启用事件
 *
 * @description 当用户被启用时触发
 */
export class UserEnabledEvent extends BaseDomainEvent {
  constructor(public readonly userId: UserId) {
    super(EntityId.fromString(userId.value), 1, '');
  }

  public override get eventType(): string {
    return 'UserEnabled';
  }

  public getEventVersion(): number {
    return 1;
  }

  public getEventData(): object {
    return {
      userId: this.userId.value,
      timestamp: this.occurredAt,
    };
  }
}
