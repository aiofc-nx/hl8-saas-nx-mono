/**
 * 租户映射器
 *
 * @description 负责领域模型和 ORM 实体之间的双向转换
 *
 * ## 映射职责
 * - 领域模型 → ORM 实体（toPersistence）
 * - ORM 实体 → 领域模型（toDomain）
 * - 保持两层分离，互不依赖
 *
 * @class TenantMapper
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '@hl8/hybrid-archi';
import { TenantStatus } from '@hl8/hybrid-archi';
import { TenantAggregate } from '../../domain/tenant/aggregates/tenant.aggregate';
import { Tenant } from '../../domain/tenant/entities/tenant.entity';
import { TenantConfiguration } from '../../domain/tenant/entities/tenant-configuration.entity';
import { TenantCode } from '../../domain/tenant/value-objects/tenant-code.vo';
import { TenantDomain } from '../../domain/tenant/value-objects/tenant-domain.vo';
import { TenantQuota } from '../../domain/tenant/value-objects/tenant-quota.vo';
import { TenantType } from '../../domain/tenant/value-objects/tenant-type.enum';
import { TenantOrmEntity } from '../persistence/entities/tenant.orm-entity';
import { TenantConfigurationOrmEntity } from '../persistence/entities/tenant-configuration.orm-entity';

@Injectable()
export class TenantMapper {
  /**
   * 将聚合根转换为 ORM 实体
   *
   * @param {TenantAggregate} aggregate - 租户聚合根
   * @returns {{ tenant: TenantOrmEntity; config: TenantConfigurationOrmEntity }} ORM 实体对象
   */
  toOrmEntities(aggregate: TenantAggregate): {
    tenant: TenantOrmEntity;
    config: TenantConfigurationOrmEntity;
  } {
    const tenant = aggregate.getTenant();
    const config = aggregate.getConfiguration();

    const tenantOrm = new TenantOrmEntity();
    tenantOrm.id = tenant.id.toString();
    tenantOrm.code = tenant.getCode().value;
    tenantOrm.name = tenant.getName();
    tenantOrm.domain = tenant.getDomain().value;
    tenantOrm.type = tenant.getType();
    tenantOrm.status = tenant.getStatus();
    tenantOrm.trialEndsAt = tenant.getTrialEndsAt() || undefined;
    tenantOrm.activatedAt = tenant.getActivatedAt() || undefined;
    tenantOrm.tenantId = tenant.tenantId.toString();
    tenantOrm.createdAt = tenant.createdAt;
    tenantOrm.updatedAt = tenant.updatedAt;
    tenantOrm.deletedAt = tenant.deletedAt || undefined;
    tenantOrm.createdBy = tenant.createdBy;
    tenantOrm.updatedBy = tenant.updatedBy;
    tenantOrm.deletedBy = tenant.deletedBy || undefined;
    tenantOrm.version = tenant.version;

    const configOrm = new TenantConfigurationOrmEntity();
    configOrm.id = config.id.toString();
    configOrm.tenant = tenantOrm; // 设置关联的租户实体
    configOrm.maxUsers = config.getQuota().maxUsers;
    configOrm.maxStorageMB = config.getQuota().maxStorageMB;
    configOrm.maxOrganizations = config.getQuota().maxOrganizations;
    configOrm.maxDepartmentLevels = config.getQuota().maxDepartmentLevels;
    configOrm.maxApiCallsPerDay = config.getQuota().maxApiCallsPerDay;
    configOrm.enabledFeatures = config.getEnabledFeatures();
    configOrm.customSettings = config.getCustomSettings();
    configOrm.createdAt = config.createdAt;
    configOrm.updatedAt = config.updatedAt;
    configOrm.createdBy = config.createdBy;
    configOrm.updatedBy = config.updatedBy;
    configOrm.version = config.version;

    return { tenant: tenantOrm, config: configOrm };
  }

  /**
   * 将 ORM 实体转换为聚合根
   *
   * @param {TenantOrmEntity} tenantOrm - 租户 ORM 实体
   * @param {TenantConfigurationOrmEntity} configOrm - 配置 ORM 实体
   * @returns {TenantAggregate} 租户聚合根
   */
  toDomainAggregate(
    tenantOrm: TenantOrmEntity,
    configOrm: TenantConfigurationOrmEntity,
  ): TenantAggregate {
    const tenant = new Tenant(
      EntityId.fromString(tenantOrm.id),
      TenantCode.create(tenantOrm.code),
      tenantOrm.name,
      TenantDomain.create(tenantOrm.domain),
      tenantOrm.type as TenantType,
      tenantOrm.status as TenantStatus,
      tenantOrm.trialEndsAt || null,
      tenantOrm.activatedAt || null,
      {
        createdBy: tenantOrm.createdBy,
        updatedBy: tenantOrm.updatedBy,
        tenantId: EntityId.fromString(tenantOrm.tenantId),
        version: tenantOrm.version,
      },
    );

    const quota = TenantQuota.create({
      maxUsers: configOrm.maxUsers,
      maxStorageMB: configOrm.maxStorageMB,
      maxOrganizations: configOrm.maxOrganizations,
      maxDepartmentLevels: configOrm.maxDepartmentLevels,
      maxApiCallsPerDay: configOrm.maxApiCallsPerDay,
    });

    const configuration = new TenantConfiguration(
      EntityId.fromString(configOrm.id),
      quota,
      configOrm.enabledFeatures,
      configOrm.customSettings || {},
      {
        createdBy: configOrm.createdBy,
        updatedBy: configOrm.updatedBy,
        tenantId: EntityId.fromString(configOrm.tenant.id),
        version: configOrm.version,
      },
    );

    return new TenantAggregate(
      EntityId.fromString(tenantOrm.id),
      tenant,
      configuration,
      {
        createdBy: tenantOrm.createdBy,
        updatedBy: tenantOrm.updatedBy,
        tenantId: EntityId.fromString(tenantOrm.tenantId),
        version: tenantOrm.version,
      },
    );
  }
}

