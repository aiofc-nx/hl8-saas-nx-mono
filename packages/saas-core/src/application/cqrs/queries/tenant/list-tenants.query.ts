/**
 * 列表租户查询
 *
 * @class ListTenantsQuery
 * @since 1.0.0
 */

export class ListTenantsQuery {
  constructor(
    public readonly offset: number = 0,
    public readonly limit: number = 20,
  ) {}
}

