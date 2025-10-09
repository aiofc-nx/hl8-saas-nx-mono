/**
 * 租户聚合根
 *
 * @description 租户聚合根，管理租户的完整生命周期和一致性边界
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理租户实体的生命周期
 * - 协调租户配置的变更
 * - 发布租户领域事件
 * - 验证租户业务规则
 * - 维护一致性边界
 *
 * ### 一致性边界
 * - 租户实体（Tenant）
 * - 租户配置（TenantConfiguration）
 * - 所有变更必须通过聚合根
 *
 * ### 租户上下文
 * - 继承自 TenantAwareAggregateRoot
 * - 自动验证租户上下文
 * - 简化租户事件发布
 * - 记录租户操作日志
 *
 * @example
 * ```typescript
 * // 创建租户聚合根
 * const aggregate = TenantAggregate.create(
 *   EntityId.generate(),
 *   TenantCode.create('acme2024'),
 *   'Acme Corporation',
 *   TenantDomain.create('acme.example.com'),
 *   TenantType.FREE,
 *   { createdBy: 'system' }
 * );
 *
 * // 升级租户
 * aggregate.upgrade(TenantType.BASIC, 'admin-123');
 *
 * // 激活租户
 * aggregate.activate('admin-123');
 * ```
 *
 * @class TenantAggregate
 * @since 1.0.0
 */

import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { TenantStatus } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { Tenant } from '../entities/tenant.entity';
import { TenantConfiguration } from '../entities/tenant-configuration.entity';
import { TenantCode } from '../value-objects/tenant-code.vo';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { TenantQuota } from '../value-objects/tenant-quota.vo';
import { TenantType } from '../value-objects/tenant-type.enum';

/**
 * 租户聚合根
 *
 * @class TenantAggregate
 * @extends {TenantAwareAggregateRoot}
 */
export class TenantAggregate extends TenantAwareAggregateRoot {
  /**
   * 构造函数
   *
   * @param {EntityId} id - 聚合根ID
   * @param {Tenant} tenant - 租户实体
   * @param {TenantConfiguration} configuration - 租户配置
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @param {PinoLogger} [logger] - 日志记录器
   */
  constructor(
    id: EntityId,
    private _tenant: Tenant,
    private _configuration: TenantConfiguration,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
  }

  /**
   * 创建租户聚合根
   *
   * @description 工厂方法，创建新的租户聚合根
   *
   * ## 业务流程
   * 1. 创建租户实体（试用状态）
   * 2. 根据租户类型创建配置和配额
   * 3. 设置默认启用功能
   * 4. 创建聚合根
   * 5. 发布租户创建事件
   *
   * @static
   * @param {EntityId} id - 聚合根ID
   * @param {TenantCode} code - 租户代码
   * @param {string} name - 租户名称
   * @param {TenantDomain} domain - 租户域名
   * @param {TenantType} type - 租户类型
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @returns {TenantAggregate} 租户聚合根
   */
  public static create(
    id: EntityId,
    code: TenantCode,
    name: string,
    domain: TenantDomain,
    type: TenantType,
    auditInfo: IPartialAuditInfo,
  ): TenantAggregate {
    // 创建租户实体
    const tenant = Tenant.create(id, code, name, domain, type, auditInfo);

    // 根据租户类型创建配额
    const quota = TenantQuota.fromTenantType(type);

    // 创建配置
    const enabledFeatures = this.getDefaultFeaturesForType(type);
    const configuration = TenantConfiguration.create(
      EntityId.generate(),
      quota,
      enabledFeatures,
      auditInfo,
    );

    // 创建聚合根
    const aggregate = new TenantAggregate(
      id,
      tenant,
      configuration,
      auditInfo,
    );

    // 发布租户创建事件
    // 注意：实际的事件将在实现事件类后添加
    // aggregate.publishTenantEvent((id, version, tenantId) =>
    //   new TenantCreatedEvent(id, version, tenantId, code, name, type)
    // );

    // 记录租户创建日志
    aggregate.logTenantOperation('租户已创建', {
      code: code.value,
      name,
      type,
    });

    return aggregate;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * 获取租户实体
   *
   * @returns {Tenant}
   */
  public getTenant(): Tenant {
    return this._tenant;
  }

  /**
   * 获取租户配置
   *
   * @returns {TenantConfiguration}
   */
  public getConfiguration(): TenantConfiguration {
    return this._configuration;
  }

  /**
   * 获取租户代码
   *
   * @returns {TenantCode}
   */
  public getCode(): TenantCode {
    return this._tenant.getCode();
  }

  /**
   * 获取租户名称
   *
   * @returns {string}
   */
  public getName(): string {
    return this._tenant.getName();
  }

  /**
   * 获取租户类型
   *
   * @returns {TenantType}
   */
  public getType(): TenantType {
    return this._tenant.getType();
  }

  /**
   * 获取租户状态
   *
   * @returns {TenantStatus}
   */
  public getStatus(): TenantStatus {
    return this._tenant.getStatus();
  }

  // ============================================================================
  // 业务方法
  // ============================================================================

  /**
   * 更新租户名称
   *
   * @description 修改租户的显示名称
   *
   * @param {string} name - 新名称
   * @param {string} updatedBy - 更新人ID
   */
  public updateName(name: string, updatedBy: string): void {
    // 验证租户上下文
    this.ensureTenantContext();

    // 执行业务逻辑
    this._tenant.updateName(name, updatedBy);

    // 发布事件
    // this.publishTenantEvent((id, version, tenantId) =>
    //   new TenantNameUpdatedEvent(id, version, tenantId, name)
    // );

    // 记录操作
    this.logTenantOperation('租户名称已更新', {
      newName: name,
      updatedBy,
    });
  }

  /**
   * 升级租户
   *
   * @description 将租户升级到更高级别的类型
   *
   * ## 业务规则
   * 1. 验证升级路径是否允许
   * 2. 更新租户类型
   * 3. 更新配额配置
   * 4. 发布升级事件
   *
   * @param {TenantType} newType - 新的租户类型
   * @param {string} updatedBy - 更新人ID
   * @throws {Error} 当升级路径不允许时抛出错误
   */
  public upgrade(newType: TenantType, updatedBy: string): void {
    // 验证租户上下文
    this.ensureTenantContext();

    const currentType = this._tenant.getType();

    // 验证升级路径
    this.validateUpgradePath(currentType, newType);

    // 更新租户类型
    this._tenant.updateType(newType, updatedBy);

    // 更新配额
    const newQuota = TenantQuota.fromTenantType(newType);
    this._configuration.updateQuota(newQuota, updatedBy);

    // 更新启用功能
    const newFeatures = TenantAggregate.getDefaultFeaturesForType(newType);
    newFeatures.forEach(feature => {
      this._configuration.enableFeature(feature, updatedBy);
    });

    // 发布升级事件
    // this.publishTenantEvent((id, version, tenantId) =>
    //   new TenantUpgradedEvent(id, version, tenantId, currentType, newType)
    // );

    // 记录操作
    this.logTenantOperation('租户已升级', {
      fromType: currentType,
      toType: newType,
      updatedBy,
    });
  }

  /**
   * 降级租户
   *
   * @description 将租户降级到较低级别的类型
   *
   * ## 业务规则
   * 1. 验证降级路径是否允许
   * 2. 验证现有数据是否超出新配额
   * 3. 更新租户类型和配额
   * 4. 发布降级事件
   *
   * @param {TenantType} newType - 新的租户类型
   * @param {string} updatedBy - 更新人ID
   * @throws {Error} 当降级路径不允许或数据超限时抛出错误
   */
  public downgrade(newType: TenantType, updatedBy: string): void {
    // 验证租户上下文
    this.ensureTenantContext();

    const currentType = this._tenant.getType();

    // 验证降级路径
    this.validateDowngradePath(currentType, newType);

    // 注意：实际降级时需要验证现有数据是否超出新配额
    // 这需要在应用层通过用例来完成

    // 更新租户类型
    this._tenant.updateType(newType, updatedBy);

    // 更新配额
    const newQuota = TenantQuota.fromTenantType(newType);
    this._configuration.updateQuota(newQuota, updatedBy);

    // 发布降级事件
    // this.publishTenantEvent((id, version, tenantId) =>
    //   new TenantDowngradedEvent(id, version, tenantId, currentType, newType)
    // );

    // 记录操作
    this.logTenantOperation('租户已降级', {
      fromType: currentType,
      toType: newType,
      updatedBy,
    });
  }

  /**
   * 激活租户
   *
   * @description 将试用租户转为活跃状态
   *
   * @param {string} updatedBy - 更新人ID
   */
  public activate(updatedBy: string): void {
    // 验证租户上下文
    this.ensureTenantContext();

    // 激活租户
    this._tenant.activate(updatedBy);

    // 发布激活事件
    // this.publishTenantEvent((id, version, tenantId) =>
    //   new TenantActivatedEvent(id, version, tenantId)
    // );

    // 记录操作
    this.logTenantOperation('租户已激活', { updatedBy });
  }

  /**
   * 暂停租户
   *
   * @description 临时暂停租户的服务访问
   *
   * @param {string} reason - 暂停原因
   * @param {string} updatedBy - 更新人ID
   */
  public suspend(reason: string, updatedBy: string): void {
    // 验证租户上下文
    this.ensureTenantContext();

    // 暂停租户
    this._tenant.suspend(reason, updatedBy);

    // 发布暂停事件
    // this.publishTenantEvent((id, version, tenantId) =>
    //   new TenantSuspendedEvent(id, version, tenantId, reason)
    // );

    // 记录操作
    this.logTenantOperation('租户已暂停', { reason, updatedBy });
  }

  /**
   * 恢复租户
   *
   * @description 从暂停状态恢复为活跃状态
   *
   * @param {string} updatedBy - 更新人ID
   */
  public resume(updatedBy: string): void {
    // 验证租户上下文
    this.ensureTenantContext();

    // 恢复租户
    this._tenant.resume(updatedBy);

    // 发布恢复事件（重用激活事件）
    // this.publishTenantEvent((id, version, tenantId) =>
    //   new TenantActivatedEvent(id, version, tenantId)
    // );

    // 记录操作
    this.logTenantOperation('租户已恢复', { updatedBy });
  }

  // ============================================================================
  // 配置管理
  // ============================================================================

  /**
   * 更新配额
   *
   * @description 直接更新租户配额（用于定制版租户）
   *
   * @param {TenantQuota} quota - 新的配额
   * @param {string} updatedBy - 更新人ID
   */
  public updateQuota(quota: TenantQuota, updatedBy: string): void {
    // 验证租户上下文
    this.ensureTenantContext();

    // 更新配额
    this._configuration.updateQuota(quota, updatedBy);

    // 记录操作
    this.logTenantOperation('租户配额已更新', {
      quota: quota.toJSON(),
      updatedBy,
    });
  }

  /**
   * 启用功能
   *
   * @param {string} feature - 功能标识
   * @param {string} updatedBy - 更新人ID
   */
  public enableFeature(feature: string, updatedBy: string): void {
    this.ensureTenantContext();
    this._configuration.enableFeature(feature, updatedBy);
    this.logTenantOperation('功能已启用', { feature, updatedBy });
  }

  /**
   * 禁用功能
   *
   * @param {string} feature - 功能标识
   * @param {string} updatedBy - 更新人ID
   */
  public disableFeature(feature: string, updatedBy: string): void {
    this.ensureTenantContext();
    this._configuration.disableFeature(feature, updatedBy);
    this.logTenantOperation('功能已禁用', { feature, updatedBy });
  }

  // ============================================================================
  // 查询方法
  // ============================================================================

  /**
   * 检查租户是否活跃
   *
   * @returns {boolean}
   */
  public isActive(): boolean {
    return this._tenant.isActive();
  }

  /**
   * 检查功能是否启用
   *
   * @param {string} feature - 功能标识
   * @returns {boolean}
   */
  public isFeatureEnabled(feature: string): boolean {
    return this._configuration.isFeatureEnabled(feature);
  }

  /**
   * 检查用户配额是否已达到
   *
   * @param {number} currentUserCount - 当前用户数
   * @returns {boolean}
   */
  public isUserQuotaReached(currentUserCount: number): boolean {
    return this._configuration.isUserQuotaReached(currentUserCount);
  }

  // ============================================================================
  // 验证方法
  // ============================================================================

  /**
   * 验证升级路径
   *
   * @private
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} newType - 新类型
   * @throws {Error} 当升级路径不允许时抛出错误
   */
  private validateUpgradePath(currentType: TenantType, newType: TenantType): void {
    const hierarchy = [
      TenantType.FREE,
      TenantType.BASIC,
      TenantType.PROFESSIONAL,
      TenantType.ENTERPRISE,
      TenantType.CUSTOM,
    ];

    const currentIndex = hierarchy.indexOf(currentType);
    const newIndex = hierarchy.indexOf(newType);

    if (newIndex <= currentIndex) {
      throw new Error(`不支持从 ${currentType} 升级到 ${newType}`);
    }
  }

  /**
   * 验证降级路径
   *
   * @private
   * @param {TenantType} currentType - 当前类型
   * @param {TenantType} newType - 新类型
   * @throws {Error} 当降级路径不允许时抛出错误
   */
  private validateDowngradePath(currentType: TenantType, newType: TenantType): void {
    const hierarchy = [
      TenantType.FREE,
      TenantType.BASIC,
      TenantType.PROFESSIONAL,
      TenantType.ENTERPRISE,
      TenantType.CUSTOM,
    ];

    const currentIndex = hierarchy.indexOf(currentType);
    const newIndex = hierarchy.indexOf(newType);

    if (newIndex >= currentIndex) {
      throw new Error(`不支持从 ${currentType} 降级到 ${newType}`);
    }
  }

  /**
   * 获取租户类型的默认功能
   *
   * @private
   * @static
   * @param {TenantType} type - 租户类型
   * @returns {string[]} 默认功能列表
   */
  private static getDefaultFeaturesForType(type: TenantType): string[] {
    const featureMap: Record<TenantType, string[]> = {
      [TenantType.FREE]: ['basic_features'],
      [TenantType.BASIC]: ['basic_features', 'advanced_auth'],
      [TenantType.PROFESSIONAL]: [
        'basic_features',
        'advanced_auth',
        'advanced_reporting',
        'api_access',
      ],
      [TenantType.ENTERPRISE]: [
        'basic_features',
        'advanced_auth',
        'advanced_reporting',
        'api_access',
        'sso',
        'audit_logs',
      ],
      [TenantType.CUSTOM]: [
        'basic_features',
        'advanced_auth',
        'advanced_reporting',
        'api_access',
        'sso',
        'audit_logs',
        'custom_branding',
        'dedicated_support',
      ],
    };

    return featureMap[type] || ['basic_features'];
  }

  /**
   * 转换为纯对象
   *
   * @returns {object} 聚合根数据对象
   */
  public toObject(): object {
    return {
      id: this.id.toString(),
      tenant: this._tenant.toObject(),
      configuration: this._configuration.toObject(),
      version: this.version,
    };
  }
}

