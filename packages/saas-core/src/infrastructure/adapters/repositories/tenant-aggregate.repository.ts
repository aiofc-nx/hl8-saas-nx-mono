/**
 * 租户聚合根仓储适配器
 *
 * @description 实现租户聚合根仓储接口，使用 MikroORM 持久化
 *
 * @class TenantAggregateRepository
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { EntityId } from '@hl8/hybrid-archi';
import { ITenantAggregateRepository } from '../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantAggregate } from '../../../domain/tenant/aggregates/tenant.aggregate';
import { TenantCode } from '../../../domain/tenant/value-objects/tenant-code.vo';
import { TenantDomain } from '../../../domain/tenant/value-objects/tenant-domain.vo';
import { TenantMapper } from '../../mappers/tenant.mapper';
import { TenantOrmEntity } from '../../persistence/entities/tenant.orm-entity';
import { TenantConfigurationOrmEntity } from '../../persistence/entities/tenant-configuration.orm-entity';

@Injectable()
export class TenantAggregateRepository implements ITenantAggregateRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly mapper: TenantMapper,
  ) {}

  async save(aggregate: TenantAggregate): Promise<void> {
    // 检查实体是否已存在
    const existingTenant = await this.em.findOne(TenantOrmEntity, {
      id: aggregate.id.toString(),
    });

    if (existingTenant) {
      // 更新现有实体：直接修改已追踪实体的属性
      const { tenant: newTenantData, config: newConfigData } = this.mapper.toOrmEntities(aggregate);
      
      // 手动更新租户字段（不创建新对象）
      existingTenant.code = newTenantData.code;
      existingTenant.name = newTenantData.name;
      existingTenant.domain = newTenantData.domain;
      existingTenant.type = newTenantData.type;
      existingTenant.status = newTenantData.status;
      existingTenant.activatedAt = newTenantData.activatedAt;
      existingTenant.trialEndsAt = newTenantData.trialEndsAt;
      existingTenant.deletedAt = newTenantData.deletedAt;
      existingTenant.updatedAt = new Date();
      existingTenant.updatedBy = newTenantData.updatedBy;
      existingTenant.deletedBy = newTenantData.deletedBy;
      existingTenant.version = newTenantData.version;
      
      // 更新配置
      const existingConfig = await this.em.findOne(TenantConfigurationOrmEntity, {
        tenant: { id: aggregate.id.toString() },
      });

      if (existingConfig) {
        existingConfig.maxUsers = newConfigData.maxUsers;
        existingConfig.maxStorageMB = newConfigData.maxStorageMB;
        existingConfig.maxOrganizations = newConfigData.maxOrganizations;
        existingConfig.maxDepartmentLevels = newConfigData.maxDepartmentLevels;
        existingConfig.maxApiCallsPerDay = newConfigData.maxApiCallsPerDay;
        existingConfig.enabledFeatures = newConfigData.enabledFeatures;
        existingConfig.customSettings = newConfigData.customSettings;
        existingConfig.updatedAt = new Date();
        existingConfig.updatedBy = newConfigData.updatedBy;
        existingConfig.version = newConfigData.version;
      } else {
        newConfigData.tenant = existingTenant;
        this.em.persist(newConfigData);
      }
    } else {
      // 创建新实体
      const { tenant, config } = this.mapper.toOrmEntities(aggregate);
      this.em.persist([tenant, config]);
    }

    await this.em.flush();
  }

  async findById(id: EntityId): Promise<TenantAggregate | null> {
    const tenantOrm = await this.em.findOne(TenantOrmEntity, {
      id: id.toString(),
    });

    if (!tenantOrm) {
      return null;
    }

    const configOrm = await this.em.findOne(TenantConfigurationOrmEntity, {
      tenant: { id: id.toString() },
    });

    if (!configOrm) {
      throw new Error(`租户配置不存在: ${id.toString()}`);
    }

    return this.mapper.toDomainAggregate(tenantOrm, configOrm);
  }

  async findByCode(code: TenantCode): Promise<TenantAggregate | null> {
    const tenantOrm = await this.em.findOne(TenantOrmEntity, {
      code: code.value,
    });

    if (!tenantOrm) {
      return null;
    }

    const configOrm = await this.em.findOne(TenantConfigurationOrmEntity, {
      tenant: { id: tenantOrm.id },
    });

    if (!configOrm) {
      throw new Error(`租户配置不存在: ${tenantOrm.id}`);
    }

    return this.mapper.toDomainAggregate(tenantOrm, configOrm);
  }

  async findByDomain(domain: TenantDomain): Promise<TenantAggregate | null> {
    const tenantOrm = await this.em.findOne(TenantOrmEntity, {
      domain: domain.value,
    });

    if (!tenantOrm) {
      return null;
    }

    const configOrm = await this.em.findOne(TenantConfigurationOrmEntity, {
      tenant: { id: tenantOrm.id },
    });

    if (!configOrm) {
      throw new Error(`租户配置不存在: ${tenantOrm.id}`);
    }

    return this.mapper.toDomainAggregate(tenantOrm, configOrm);
  }

  async findAll(offset = 0, limit = 20): Promise<TenantAggregate[]> {
    const tenantOrms = await this.em.find(
      TenantOrmEntity,
      {},
      { offset, limit, orderBy: { createdAt: 'DESC' } },
    );

    const aggregates: TenantAggregate[] = [];
    for (const tenantOrm of tenantOrms) {
      const configOrm = await this.em.findOne(TenantConfigurationOrmEntity, {
        tenant: { id: tenantOrm.id },
      });

      if (configOrm) {
        aggregates.push(this.mapper.toDomainAggregate(tenantOrm, configOrm));
      }
    }

    return aggregates;
  }

  async delete(id: EntityId, deletedBy: string, reason: string): Promise<void> {
    const tenantOrm = await this.em.findOne(TenantOrmEntity, {
      id: id.toString(),
    });

    if (tenantOrm) {
      tenantOrm.deletedAt = new Date();
      tenantOrm.deletedBy = deletedBy;
      await this.em.flush();
    }
  }

  async existsByCode(code: TenantCode): Promise<boolean> {
    const count = await this.em.count(TenantOrmEntity, {
      code: code.value,
    });
    return count > 0;
  }

  async existsByDomain(domain: TenantDomain): Promise<boolean> {
    const count = await this.em.count(TenantOrmEntity, {
      domain: domain.value,
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return await this.em.count(TenantOrmEntity, {});
  }
}

