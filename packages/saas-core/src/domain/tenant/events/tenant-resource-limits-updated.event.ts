/**
 * 租户资源限制更新事件
 *
 * @description 当租户资源限制更新时发布的领域事件
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { ResourceLimits } from '../value-objects/resource-limits.vo';

export class TenantResourceLimitsUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly newResourceLimits: ResourceLimits
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantResourceLimitsUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      newResourceLimits: this.newResourceLimits.getAllLimits()
    };
  }
}
