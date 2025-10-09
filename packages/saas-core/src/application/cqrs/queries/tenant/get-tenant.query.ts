/**
 * 获取租户查询
 *
 * @class GetTenantQuery
 * @since 1.0.0
 */

import { CqrsBaseQuery } from '@hl8/hybrid-archi';

export class GetTenantQuery extends CqrsBaseQuery {
  constructor(
    tenantId: string,
    userId: string,
    public readonly targetTenantId: string,
  ) {
    super(tenantId, userId);
  }

  get queryType(): string {
    return 'GetTenantQuery';
  }

  protected createCopyWithSortRules(sortRules: any[]): this {
    const copy = new GetTenantQuery(
      this.tenantId,
      this.userId,
      this.targetTenantId,
    );
    return copy as this;
  }
}

