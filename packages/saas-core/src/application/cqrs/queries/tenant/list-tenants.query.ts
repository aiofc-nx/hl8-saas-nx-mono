/**
 * 列表租户查询
 *
 * @class ListTenantsQuery
 * @since 1.0.0
 */

import { CqrsBaseQuery } from '@hl8/hybrid-archi';

export class ListTenantsQuery extends CqrsBaseQuery {
  constructor(
    tenantId: string,
    userId: string,
    page = 1,
    pageSize = 20,
  ) {
    super(tenantId, userId, page, pageSize);
  }

  get queryType(): string {
    return 'ListTenantsQuery';
  }

  protected createCopyWithSortRules(sortRules: any[]): this {
    const copy = new ListTenantsQuery(
      this.tenantId,
      this.userId,
      this.page,
      this.pageSize,
    );
    return copy as this;
  }
}

