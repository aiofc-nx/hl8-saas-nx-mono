/**
 * 创建租户用例单元测试
 */

import { EntityId } from '@hl8/hybrid-archi';
import { CreateTenantUseCase } from './create-tenant.use-case';
import { ITenantAggregateRepository } from '../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantCode } from '../../../domain/tenant/value-objects/tenant-code.vo';
import { TenantDomain } from '../../../domain/tenant/value-objects/tenant-domain.vo';
import { TenantType } from '../../../domain/tenant/value-objects/tenant-type.enum';

describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;
  let mockRepository: jest.Mocked<ITenantAggregateRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByDomain: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      existsByCode: jest.fn(),
      existsByDomain: jest.fn(),
      count: jest.fn(),
    } as any;

    useCase = new CreateTenantUseCase(mockRepository);
  });

  it('应该成功创建新租户', async () => {
    mockRepository.existsByCode.mockResolvedValue(false);
    mockRepository.existsByDomain.mockResolvedValue(false);
    mockRepository.save.mockResolvedValue(undefined);

    const command = {
      code: 'testcorp2024',
      name: 'Test Corporation',
      domain: 'testcorp.example.com',
      type: TenantType.FREE,
      createdBy: 'admin-123',
    };

    const tenantId = await useCase.execute(command);

    expect(tenantId).toBeInstanceOf(EntityId);
    expect(mockRepository.existsByCode).toHaveBeenCalled();
    expect(mockRepository.existsByDomain).toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('应该在租户代码已存在时抛出错误', async () => {
    mockRepository.existsByCode.mockResolvedValue(true);

    const command = {
      code: 'existing',
      name: 'Test',
      domain: 'test.com',
      type: TenantType.FREE,
      createdBy: 'admin',
    };

    await expect(useCase.execute(command)).rejects.toThrow('租户代码');
  });

  it('应该在租户域名已存在时抛出错误', async () => {
    mockRepository.existsByCode.mockResolvedValue(false);
    mockRepository.existsByDomain.mockResolvedValue(true);

    const command = {
      code: 'test',
      name: 'Test',
      domain: 'existing.com',
      type: TenantType.FREE,
      createdBy: 'admin',
    };

    await expect(useCase.execute(command)).rejects.toThrow('租户域名');
  });
});

