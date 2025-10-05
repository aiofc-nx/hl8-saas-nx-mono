import { EntityId } from '@hl8/hybrid-archi';
import { TenantType } from '../tenant/value-objects/tenant-type.vo';
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
export class TenantCreatedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly adminId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

/**
 * 租户激活事件
 *
 * @description 当租户被激活时发布的领域事件
 * 表示租户从待激活状态转换为活跃状态
 *
 * @since 1.0.0
 */
export class TenantActivatedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly activatedAt: Date = new Date()
  ) {}
}

/**
 * 租户暂停事件
 *
 * @description 当租户被暂停时发布的领域事件
 * 包含暂停原因和时间戳
 *
 * @since 1.0.0
 */
export class TenantSuspendedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly reason: string,
    public readonly suspendedAt: Date = new Date()
  ) {}
}

/**
 * 租户禁用事件
 *
 * @description 当租户被禁用时发布的领域事件
 * 包含禁用原因和时间戳
 *
 * @since 1.0.0
 */
export class TenantDisabledEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly reason: string,
    public readonly disabledAt: Date = new Date()
  ) {}
}

/**
 * 租户升级事件
 *
 * @description 当租户类型被升级时发布的领域事件
 * 包含升级前后的类型信息
 *
 * @since 1.0.0
 */
export class TenantUpgradedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly fromType: TenantType,
    public readonly toType: TenantType,
    public readonly upgradedAt: Date = new Date()
  ) {}
}

/**
 * 租户名称更新事件
 *
 * @description 当租户名称被更新时发布的领域事件
 * 包含新的名称信息
 *
 * @since 1.0.0
 */
export class TenantNameUpdatedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly newName: string,
    public readonly updatedAt: Date = new Date()
  ) {}
}

/**
 * 租户管理员更新事件
 *
 * @description 当租户管理员被更新时发布的领域事件
 * 包含新的管理员用户ID
 *
 * @since 1.0.0
 */
export class TenantAdminUpdatedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly newAdminId: string,
    public readonly updatedAt: Date = new Date()
  ) {}
}

/**
 * 租户配置更新事件
 *
 * @description 当租户配置被更新时发布的领域事件
 * 包含新的配置信息
 *
 * @since 1.0.0
 */
export class TenantConfigUpdatedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly newConfig: TenantConfig,
    public readonly updatedAt: Date = new Date()
  ) {}
}

/**
 * 租户资源限制更新事件
 *
 * @description 当租户资源限制被更新时发布的领域事件
 * 包含新的资源限制信息
 *
 * @since 1.0.0
 */
export class TenantResourceLimitsUpdatedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly newResourceLimits: ResourceLimits,
    public readonly updatedAt: Date = new Date()
  ) {}
}

/**
 * 租户删除事件
 *
 * @description 当租户被删除时发布的领域事件
 * 包含删除原因和时间戳
 *
 * @since 1.0.0
 */
export class TenantDeletedEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly reason: string,
    public readonly deletedAt: Date = new Date()
  ) {}
}