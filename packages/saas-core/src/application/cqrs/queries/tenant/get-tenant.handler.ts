/**
 * 获取租户查询处理器
 *
 * @class GetTenantHandler
 * @since 1.0.0
 */

import { QueryHandler, IQueryHandler } from '@hl8/hybrid-archi';
import { GetTenantQuery } from './get-tenant.query';
import { ITenantAggregateRepository } from '../../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantAggregate } from '../../../../domain/tenant/aggregates/tenant.aggregate';
import { EntityId } from '@hl8/hybrid-archi';

// @QueryHandler('GetTenantQuery') // TODO: 修复装饰器类型问题
export class GetTenantHandler
  implements IQueryHandler<GetTenantQuery, TenantAggregate | null>
{
  constructor(private readonly repository: ITenantAggregateRepository) {}

  async execute(query: GetTenantQuery): Promise<TenantAggregate | null> {
    const tenantId = EntityId.fromString(query.targetTenantId);
    return await this.repository.findById(tenantId);
  }
}

