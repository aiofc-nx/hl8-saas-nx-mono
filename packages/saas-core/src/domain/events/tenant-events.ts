import { EntityId, BaseDomainEvent } from '@hl8/hybrid-archi';
import { TenantType } from '@hl8/hybrid-archi';
import { TenantConfig } from '../tenant/value-objects/tenant-config.vo';
import { ResourceLimits } from '../tenant/value-objects/resource-limits.vo';

/**
 * 租户创建事件
 *
 * @description 当租户被创建时发布的领域事件
 * 包含租户的基本信息和创建上下文
 *
 * @since 1.0.0
 */
export class TenantCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly adminId: string,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantCreated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      code: this.code,
      name: this.name,
      type: this.type,
      adminId: this.adminId
    };
  }
}

/**
 * 租户激活事件
 *
 * @description 当租户被激活时发布的领域事件
 * 表示租户从待激活状态转换为活跃状态
 *
 * @since 1.0.0
 */
export class TenantActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantActivated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString()
    };
  }
}

/**
 * 租户暂停事件
 *
 * @description 当租户被暂停时发布的领域事件
 * 包含暂停原因和时间戳
 *
 * @since 1.0.0
 */
export class TenantSuspendedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantSuspended';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      reason: this.reason
    };
  }
}

/**
 * 租户禁用事件
 *
 * @description 当租户被禁用时发布的领域事件
 * 包含禁用原因和时间戳
 *
 * @since 1.0.0
 */
export class TenantDisabledEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantDisabled';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      reason: this.reason
    };
  }
}

/**
 * 租户升级事件
 *
 * @description 当租户类型被升级时发布的领域事件
 * 包含升级前后的类型信息
 *
 * @since 1.0.0
 */
export class TenantUpgradedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly fromType: TenantType,
    public readonly toType: TenantType,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantUpgraded';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      fromType: this.fromType,
      toType: this.toType
    };
  }
}

/**
 * 租户名称更新事件
 *
 * @description 当租户名称被更新时发布的领域事件
 * 包含新的名称信息
 *
 * @since 1.0.0
 */
export class TenantNameUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly newName: string,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantNameUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      newName: this.newName
    };
  }
}

/**
 * 租户管理员更新事件
 *
 * @description 当租户管理员被更新时发布的领域事件
 * 包含新的管理员用户ID
 *
 * @since 1.0.0
 */
export class TenantAdminUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly newAdminId: string,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantAdminUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      newAdminId: this.newAdminId
    };
  }
}

/**
 * 租户配置更新事件
 *
 * @description 当租户配置被更新时发布的领域事件
 * 包含新的配置信息
 *
 * @since 1.0.0
 */
export class TenantConfigUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly newConfig: TenantConfig,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantConfigUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      newConfig: this.newConfig
    };
  }
}

/**
 * 租户资源限制更新事件
 *
 * @description 当租户资源限制被更新时发布的领域事件
 * 包含新的资源限制信息
 *
 * @since 1.0.0
 */
export class TenantResourceLimitsUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly newResourceLimits: ResourceLimits,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantResourceLimitsUpdated';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      newResourceLimits: this.newResourceLimits
    };
  }
}

/**
 * 租户删除事件
 *
 * @description 当租户被删除时发布的领域事件
 * 包含删除原因和时间戳
 *
 * @since 1.0.0
 */
export class TenantDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantEntityId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(tenantEntityId, 1, tenantId, 1);
  }

  public get eventType(): string {
    return 'TenantDeleted';
  }

  public override get eventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantEntityId.toString(),
      reason: this.reason
    };
  }
}