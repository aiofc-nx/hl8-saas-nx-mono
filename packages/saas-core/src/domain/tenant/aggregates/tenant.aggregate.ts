import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus } from '@hl8/hybrid-archi';
import { TenantType } from '@hl8/hybrid-archi';
import { TenantConfig } from '../value-objects/tenant-config.vo';
import { ResourceLimits } from '../value-objects/resource-limits.vo';
import { TenantCreatedEvent } from '../../events/tenant-events';

/**
 * 租户聚合根
 *
 * @description 租户聚合的管理者，负责协调内部实体操作
 * 实现聚合根的管理职责：管理聚合一致性边界、协调内部实体操作、发布领域事件、验证业务规则
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理聚合一致性边界：确保租户聚合内数据一致性
 * - 协调内部实体操作：通过指令模式协调租户实体
 * - 发布领域事件：管理事件的生命周期
 * - 验证业务规则：确保业务规则的正确执行
 *
 * ### 指令模式实现
 * - 聚合根发出指令 → 实体执行指令 → 返回执行结果
 * - 聚合根不直接操作实体属性，而是调用实体的业务方法
 * - 实体执行具体业务逻辑，聚合根负责协调和事件发布
 *
 * @example
 * ```typescript
 * // 创建租户聚合根
 * const tenantAggregate = TenantAggregate.create(
 *   tenantId,
 *   'TENANT001',
 *   '示例租户',
 *   TenantType.BASIC,
 *   'admin-user-id'
 * );
 * 
 * // 激活租户（聚合根协调实体）
 * tenantAggregate.activate();
 * 
 * // 获取租户实体
 * const tenant = tenantAggregate.getTenant();
 * ```
 *
 * @since 1.0.0
 */
export class TenantAggregate extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建租户聚合根实例
   * 聚合根包含租户实体，通过指令模式协调实体操作
   *
   * @param tenantId - 租户ID
   * @param tenant - 租户实体
   */
  constructor(
    private readonly _tenantId: EntityId,
    private readonly tenant: Tenant
  ) {
    super(_tenantId, { createdBy: 'system' });
  }

  /**
   * 获取租户ID
   *
   * @returns 租户ID
   */
  public getTenantId(): EntityId {
    return this._tenantId;
  }

  /**
   * 创建租户聚合根
   *
   * @description 工厂方法，创建新的租户聚合根
   * 根据租户类型创建默认配置和资源限制
   *
   * @param id - 租户ID
   * @param code - 租户代码
   * @param name - 租户名称
   * @param type - 租户类型
   * @param adminId - 管理员用户ID
   * @returns 租户聚合根实例
   *
   * @example
   * ```typescript
   * const tenantAggregate = TenantAggregate.create(
   *   tenantId,
   *   'TENANT001',
   *   '示例租户',
   *   TenantType.BASIC,
   *   'admin-user-id'
   * );
   * ```
   *
   * @since 1.0.0
   */
  public static create(
    id: EntityId,
    code: string,
    name: string,
    type: TenantType,
    adminId: string
  ): TenantAggregate {
    // 1. 创建默认配置
    const config = TenantAggregate.createDefaultConfig(type);
    
    // 2. 创建默认资源限制
    const resourceLimits = TenantAggregate.createDefaultResourceLimits(type);

    // 3. 创建租户实体
    const tenant = new Tenant(
      id,
      code,
      name,
      type,
      TenantStatus.PENDING,
      adminId,
      config,
      resourceLimits
    );

    // 4. 创建聚合根
    const aggregate = new TenantAggregate(id, tenant);
    
    // 5. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new TenantCreatedEvent(
      id,
      code,
      name,
      type,
      adminId,
      id.toString() // tenantIdParam
    ));

    return aggregate;
  }

  /**
   * 激活租户
   *
   * @description 聚合根协调内部实体执行激活操作
   * 指令模式：聚合根发出指令给实体，实体执行具体业务逻辑
   *
   * @example
   * ```typescript
   * tenantAggregate.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.activate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantActivatedEvent(
      this._tenantId,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 暂停租户
   *
   * @description 聚合根协调内部实体执行暂停操作
   *
   * @param reason - 暂停原因
   *
   * @example
   * ```typescript
   * tenantAggregate.suspend('违反服务条款');
   * ```
   *
   * @since 1.0.0
   */
  public suspend(reason: string): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.suspend(reason);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantSuspendedEvent(
      this._tenantId,
      reason,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 禁用租户
   *
   * @description 聚合根协调内部实体执行禁用操作
   *
   * @param reason - 禁用原因
   *
   * @example
   * ```typescript
   * tenantAggregate.disable('账户违规');
   * ```
   *
   * @since 1.0.0
   */
  public disable(reason: string): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.disable(reason);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantDisabledEvent(
      this._tenantId,
      reason,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 升级租户
   *
   * @description 聚合根协调内部实体执行升级操作
   *
   * @param newType - 新的租户类型
   *
   * @example
   * ```typescript
   * tenantAggregate.upgrade(TenantType.PROFESSIONAL);
   * ```
   *
   * @since 1.0.0
   */
  public upgrade(newType: TenantType): void {
    const currentType = this.tenant.getType();
    
    // 创建新配置和资源限制
    const newConfig = TenantAggregate.createDefaultConfig(newType);
    const newResourceLimits = TenantAggregate.createDefaultResourceLimits(newType);

    // 指令模式：聚合根发出指令给实体
    this.tenant.upgrade(newType, newConfig, newResourceLimits);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantUpgradedEvent(
      this._tenantId,
      currentType,
      newType,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 更新租户名称
   *
   * @description 聚合根协调内部实体执行名称更新操作
   *
   * @param newName - 新的租户名称
   *
   * @example
   * ```typescript
   * tenantAggregate.updateName('新的租户名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.updateName(newName);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantNameUpdatedEvent(
      this._tenantId,
      newName,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 更新管理员
   *
   * @description 聚合根协调内部实体执行管理员更新操作
   *
   * @param newAdminId - 新的管理员用户ID
   *
   * @example
   * ```typescript
   * tenantAggregate.updateAdmin('new-admin-user-id');
   * ```
   *
   * @since 1.0.0
   */
  public updateAdmin(newAdminId: string): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.updateAdmin(newAdminId);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantAdminUpdatedEvent(
      this._tenantId,
      newAdminId,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 更新配置
   *
   * @description 聚合根协调内部实体执行配置更新操作
   *
   * @param newConfig - 新的配置
   *
   * @example
   * ```typescript
   * tenantAggregate.updateConfig(newTenantConfig);
   * ```
   *
   * @since 1.0.0
   */
  public updateConfig(newConfig: TenantConfig): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.updateConfig(newConfig);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantConfigUpdatedEvent(
      this._tenantId,
      newConfig,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 更新资源限制
   *
   * @description 聚合根协调内部实体执行资源限制更新操作
   *
   * @param newResourceLimits - 新的资源限制
   *
   * @example
   * ```typescript
   * tenantAggregate.updateResourceLimits(newResourceLimits);
   * ```
   *
   * @since 1.0.0
   */
  public updateResourceLimits(newResourceLimits: ResourceLimits): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.updateResourceLimits(newResourceLimits);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantResourceLimitsUpdatedEvent(
      this._tenantId,
      newResourceLimits,
      this._tenantId.toString() // tenantIdParam
    ));
  }

  /**
   * 获取租户实体
   *
   * @description 聚合根管理内部实体访问
   * 外部只能通过聚合根访问内部实体
   *
   * @returns 租户实体
   *
   * @example
   * ```typescript
   * const tenant = tenantAggregate.getTenant();
   * const canUse = tenant.canUseFeature('basic_user_management');
   * ```
   *
   * @since 1.0.0
   */
  public getTenant(): Tenant {
    return this.tenant;
  }


  /**
   * 创建默认配置
   *
   * @description 根据租户类型创建默认配置
   *
   * @param type - 租户类型
   * @returns 默认配置
   *
   * @since 1.0.0
   */
  private static createDefaultConfig(type: TenantType): TenantConfig {
    const features = TenantTypeUtils.getFeatures(type);
    
    return TenantConfig.create({
      features,
      theme: 'default',
      branding: {
        brandName: '默认租户',
        brandDescription: '系统默认租户配置'
      },
      settings: {},
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai'
    });
  }

  /**
   * 创建默认资源限制
   *
   * @description 根据租户类型创建默认资源限制
   *
   * @param type - 租户类型
   * @returns 默认资源限制
   *
   * @since 1.0.0
   */
  private static createDefaultResourceLimits(type: TenantType): ResourceLimits {
    const limits = TenantAggregate.getDefaultLimitsByType(type);
    return ResourceLimits.create(limits);
  }

  /**
   * 根据类型获取默认限制
   *
   * @description 获取不同租户类型的默认资源限制
   *
   * @param type - 租户类型
   * @returns 资源限制配置
   *
   * @since 1.0.0
   */
  private static getDefaultLimitsByType(type: TenantType): import('../value-objects/resource-limits.vo').ResourceLimitsProps {
    const defaultLimits: Record<TenantType, import('../value-objects/resource-limits.vo').ResourceLimitsProps> = {
      [TenantType.FREE]: {
        maxUsers: 5,
        maxStorage: 1,
        maxOrganizations: 2,
        maxDepartments: 5,
        maxApiCalls: 1000,
        maxDataTransfer: 5
      },
      [TenantType.BASIC]: {
        maxUsers: 50,
        maxStorage: 10,
        maxOrganizations: 10,
        maxDepartments: 50,
        maxApiCalls: 10000,
        maxDataTransfer: 50
      },
      [TenantType.PROFESSIONAL]: {
        maxUsers: 200,
        maxStorage: 100,
        maxOrganizations: 50,
        maxDepartments: 200,
        maxApiCalls: 100000,
        maxDataTransfer: 500
      },
      [TenantType.ENTERPRISE]: {
        maxUsers: -1,
        maxStorage: -1,
        maxOrganizations: -1,
        maxDepartments: -1,
        maxApiCalls: -1,
        maxDataTransfer: -1
      },
      [TenantType.CUSTOM]: {
        maxUsers: -1,
        maxStorage: -1,
        maxOrganizations: -1,
        maxDepartments: -1,
        maxApiCalls: -1,
        maxDataTransfer: -1
      },
      [TenantType.PERSONAL]: {
        maxUsers: 1,
        maxStorage: 2,
        maxOrganizations: 1,
        maxDepartments: 3,
        maxApiCalls: 5000,
        maxDataTransfer: 10
      },
      [TenantType.TEAM]: {
        maxUsers: 20,
        maxStorage: 20,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 50000,
        maxDataTransfer: 100
      },
      [TenantType.COMMUNITY]: {
        maxUsers: 100,
        maxStorage: 50,
        maxOrganizations: 10,
        maxDepartments: 50,
        maxApiCalls: 200000,
        maxDataTransfer: 200
      }
    };

    return defaultLimits[type];
  }
}

// 导入必要的依赖
import { TenantTypeUtils } from '@hl8/hybrid-archi';
import { TenantActivatedEvent, TenantSuspendedEvent, TenantDisabledEvent, TenantUpgradedEvent, TenantNameUpdatedEvent, TenantAdminUpdatedEvent, TenantConfigUpdatedEvent, TenantResourceLimitsUpdatedEvent } from '../../events/tenant-events';