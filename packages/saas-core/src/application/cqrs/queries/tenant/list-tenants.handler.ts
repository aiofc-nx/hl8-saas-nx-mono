/**
 * 列表租户查询处理器
 *
 * @class ListTenantsHandler
 * @since 1.0.0
 */

import { QueryHandler, IQueryHandler } from '@hl8/hybrid-archi';
import { ListTenantsQuery } from './list-tenants.query';
import { ITenantAggregateRepository } from '../../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantAggregate } from '../../../../domain/tenant/aggregates/tenant.aggregate';

// @QueryHandler('ListTenantsQuery') // TODO: 修复装饰器类型问题
export class ListTenantsHandler
  implements IQueryHandler<ListTenantsQuery, TenantAggregate[]>
{
  constructor(private readonly repository: ITenantAggregateRepository) {}

  async execute(query: ListTenantsQuery): Promise<TenantAggregate[]> {
    const offset = (query.page - 1) * query.pageSize;
    return await this.repository.findAll(offset, query.pageSize);
  }
}

