/**
 * 仓储基础设施导出
 *
 * @description 导出仓储相关的基础接口和工具
 * @since 1.0.0
 */

// 基础仓储接口
export {
  IRepository,
  IRepositoryQueryOptions,
  IPaginatedResult,
  BaseRepositoryError,
  ConcurrencyError,
  EntityNotFoundError,
  ValidationError,
} from './base-repository.interface';

// 聚合根仓储接口
export {
  IAggregateRepository,
  IAggregateSnapshot,
  IEventStoreRepository,
  IReadModelRepository,
} from './base-aggregate-repository.interface';

// 重新导出常用类型
export type { EntityId } from '../../value-objects/entity-id';
export type { IAggregateRoot } from '../../aggregates/base/aggregate-root.interface';
export type { BaseDomainEvent } from '../../events/base/base-domain-event';
