/**
 * 用户分配到租户事件
 *
 * 当用户被分配到租户时触发的领域事件。
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';
// 临时使用string类型，后续可以创建TenantId值对象
type TenantId = string;

/**
 * 用户分配到租户事件
 *
 * @description 当用户被分配到租户时触发
 */
export class UserAssignedToTenantEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    private readonly _eventTenantId: TenantId
  ) {
    super(EntityId.fromString(userId.value), 1, _eventTenantId);
  }

  /**
   * 获取租户ID
   *
   * @description 重写基类的tenantId getter
   * @returns 租户ID
   */
  public override get tenantId(): string {
    return this._eventTenantId;
  }

  public override get eventType(): string {
    return 'UserAssignedToTenant';
  }

  public getEventVersion(): number {
    return 1;
  }

  public getEventData(): object {
    return {
      userId: this.userId.value,
      tenantId: this.tenantId,
      timestamp: this.occurredAt,
    };
  }
}
