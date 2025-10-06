/**
 * 租户升级事件
 *
 * @description 当租户类型升级时发布的领域事件
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { TenantType } from '@hl8/hybrid-archi';

export class TenantUpgradedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly oldType: TenantType,
    public readonly newType: TenantType
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantUpgraded';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      oldType: this.oldType,
      newType: this.newType
    };
  }
}
