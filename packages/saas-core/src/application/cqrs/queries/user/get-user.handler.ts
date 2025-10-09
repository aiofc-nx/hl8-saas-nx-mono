import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetUserQuery } from './get-user.query';
import { IUserAggregateRepository } from '../../../../domain/user/repositories/user-aggregate.repository.interface';
import { UserAggregate } from '../../../../domain/user/aggregates/user.aggregate';
import { EntityId } from '@hl8/hybrid-archi';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserAggregate | null> {
  constructor(private readonly repository: IUserAggregateRepository) {}

  async execute(query: GetUserQuery): Promise<UserAggregate | null> {
    const userId = EntityId.fromString(query.userId);
    return await this.repository.findById(userId);
  }
}

