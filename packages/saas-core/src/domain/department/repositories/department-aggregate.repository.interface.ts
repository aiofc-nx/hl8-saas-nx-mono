import { DepartmentAggregate } from '../aggregates/department.aggregate';
import { EntityId } from '@hl8/hybrid-archi';

export interface IDepartmentAggregateRepository {
  save(aggregate: DepartmentAggregate): Promise<void>;
  findById(id: EntityId): Promise<DepartmentAggregate | null>;
  findAll(offset?: number, limit?: number): Promise<DepartmentAggregate[]>;
  delete(id: EntityId, deletedBy: string, reason: string): Promise<void>;
  count(): Promise<number>;
}

