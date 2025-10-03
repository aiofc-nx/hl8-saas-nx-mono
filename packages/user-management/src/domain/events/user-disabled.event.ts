/**
 * 用户禁用事件
 *
 * 当用户被禁用时触发的领域事件。
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';

/**
 * 用户禁用事件
 *
 * @description 当用户被禁用时触发
 */
export class UserDisabledEvent extends BaseDomainEvent {
  constructor(public readonly userId: UserId) {
    super(EntityId.fromString(userId.value), 1, '');
  }

  public override get eventType(): string {
    return 'UserDisabled';
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
