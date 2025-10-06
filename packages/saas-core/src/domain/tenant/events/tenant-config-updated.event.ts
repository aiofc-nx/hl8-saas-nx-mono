/**
 * 租户配置更新事件
 *
 * @description 当租户配置更新时发布的领域事件
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { TenantConfig } from '../value-objects/tenant-config.vo';

export class TenantConfigUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly newConfig: TenantConfig
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantConfigUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      newConfig: this.newConfig.getAllConfig()
    };
  }
}
