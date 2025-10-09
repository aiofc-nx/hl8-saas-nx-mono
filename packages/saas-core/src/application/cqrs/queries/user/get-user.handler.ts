import { QueryHandler, IQueryHandler } from '@hl8/hybrid-archi';
import { GetUserQuery } from './get-user.query';
import { IUserAggregateRepository } from '../../../../domain/user/repositories/user-aggregate.repository.interface';
import { UserAggregate } from '../../../../domain/user/aggregates/user.aggregate';
import { EntityId } from '@hl8/hybrid-archi';

// @QueryHandler('GetUserQuery') // TODO: 修复装饰器类型问题
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserAggregate | null> {
  constructor(private readonly repository: IUserAggregateRepository) {}

  async execute(query: GetUserQuery): Promise<UserAggregate | null> {
    const userId = EntityId.fromString(query.targetUserId);
    return await this.repository.findById(userId);
  }
}

