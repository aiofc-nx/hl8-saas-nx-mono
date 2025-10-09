/**
 * 列表租户查询处理器
 *
 * @class ListTenantsHandler
 * @since 1.0.0
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListTenantsQuery } from './list-tenants.query';
import { ITenantAggregateRepository } from '../../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantAggregate } from '../../../../domain/tenant/aggregates/tenant.aggregate';

@QueryHandler(ListTenantsQuery)
export class ListTenantsHandler
  implements IQueryHandler<ListTenantsQuery, TenantAggregate[]>
{
  constructor(private readonly repository: ITenantAggregateRepository) {}

  async execute(query: ListTenantsQuery): Promise<TenantAggregate[]> {
    return await this.repository.findAll(query.offset, query.limit);
  }
}

