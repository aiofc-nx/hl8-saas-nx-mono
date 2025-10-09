/**
 * 租户聚合根仓储适配器单元测试
 */

import { EntityManager } from '@mikro-orm/core';
import { TenantAggregateRepository } from './tenant-aggregate.repository';
import { TenantMapper } from '../../mappers/tenant.mapper';

describe('TenantAggregateRepository', () => {
  let repository: TenantAggregateRepository;
  let mockEm: jest.Mocked<EntityManager>;
  let mapper: TenantMapper;

  beforeEach(() => {
    mockEm = {
      transactional: jest.fn(),
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      flush: jest.fn(),
    } as any;

    mapper = new TenantMapper();
    repository = new TenantAggregateRepository(mockEm, mapper);
  });

  it('应该定义仓储', () => {
    expect(repository).toBeDefined();
  });

  // TODO: 添加更多测试
});

