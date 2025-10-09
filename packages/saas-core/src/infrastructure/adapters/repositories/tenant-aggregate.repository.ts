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
    const { tenant, config } = this.mapper.toOrmEntities(aggregate);
    
    await this.em.transactional(async (em) => {
      await em.persistAndFlush([tenant, config]);
    });
  }

  async findById(id: EntityId): Promise<TenantAggregate | null> {
    const tenantOrm = await this.em.findOne(TenantOrmEntity, {
      id: id.toString(),
    });

    if (!tenantOrm) {
      return null;
    }

    const configOrm = await this.em.findOne(TenantConfigurationOrmEntity, {
      tenantId: id.toString(),
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
      tenantId: tenantOrm.id,
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
      tenantId: tenantOrm.id,
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
        tenantId: tenantOrm.id,
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

