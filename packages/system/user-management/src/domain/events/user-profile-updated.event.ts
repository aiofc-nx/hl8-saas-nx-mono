/**
 * 用户配置文件更新事件
 *
 * 当用户配置文件更新时触发的领域事件。
 *
 * @description 用户配置文件更新事件是用户聚合根发布的重要领域事件。
 * 当用户更新个人信息时，聚合根会发布此事件。
 * 事件包含配置文件更新的上下文信息。
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';
import { UserProfile } from '../value-objects/user-profile.vo';

/**
 * 用户配置文件更新事件
 *
 * @description 当用户配置文件更新时触发
 */
export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly profile: UserProfile
  ) {
    super(EntityId.fromString(userId.value), 1, '');
  }

  public override get eventType(): string {
    return 'UserProfileUpdated';
  }

  public getEventVersion(): number {
    return 1;
  }

  public getEventData(): object {
    return {
      userId: this.userId.value,
      profile: this.profile.toJSON(),
      timestamp: this.occurredAt,
    };
  }
}
