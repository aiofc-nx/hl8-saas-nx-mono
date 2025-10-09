/**
 * 列表租户查询
 *
 * @class ListTenantsQuery
 * @since 1.0.0
 */

export class ListTenantsQuery {
  constructor(
    public readonly offset = 0,
    public readonly limit = 20,
  ) {}
}

