/**
 * 用户聚合根仓储接口
 *
 * @interface IUserAggregateRepository
 * @since 1.0.0
 */

import { UserAggregate } from '../aggregates/user.aggregate';
import { Username, Email, EntityId } from '@hl8/hybrid-archi';

export interface IUserAggregateRepository {
  save(aggregate: UserAggregate): Promise<void>;
  findById(id: EntityId): Promise<UserAggregate | null>;
  findByUsername(username: Username): Promise<UserAggregate | null>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  findAll(offset?: number, limit?: number): Promise<UserAggregate[]>;
  delete(id: EntityId, deletedBy: string, reason: string): Promise<void>;
  existsByUsername(username: Username): Promise<boolean>;
  existsByEmail(email: Email): Promise<boolean>;
  count(): Promise<number>;
}

