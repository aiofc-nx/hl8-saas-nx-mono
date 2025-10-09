import { CqrsBaseQuery } from '@hl8/hybrid-archi';

export class GetUserQuery extends CqrsBaseQuery {
  constructor(
    tenantId: string,
    userId: string,
    public readonly targetUserId: string,
  ) {
    super(tenantId, userId);
  }

  get queryType(): string {
    return 'GetUserQuery';
  }

  protected createCopyWithSortRules(sortRules: any[]): this {
    const copy = new GetUserQuery(
      this.tenantId,
      this.userId,
      this.targetUserId,
    );
    return copy as this;
  }
}

