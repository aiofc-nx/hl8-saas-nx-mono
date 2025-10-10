/**
 * 激活租户用例单元测试
 *
 * @description 测试租户激活的业务逻辑
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { ActivateTenantUseCase, IActivateTenantCommand } from './activate-tenant.use-case';
import { ITenantAggregateRepository } from '../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantAggregate } from '../../../domain/tenant/aggregates/tenant.aggregate';

describe('ActivateTenantUseCase', () => {
  let useCase: ActivateTenantUseCase;
  let mockRepository: jest.Mocked<ITenantAggregateRepository>;
  let mockAggregate: jest.Mocked<TenantAggregate>;

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
      exists: jest.fn(),
      count: jest.fn(),
    } as any;

    mockAggregate = {
      id: EntityId.generate(),
      activate: jest.fn(),
    } as any;

    useCase = new ActivateTenantUseCase(mockRepository);
  });

  describe('成功场景', () => {
    it('应该成功激活租户', async () => {
      mockRepository.findById.mockResolvedValue(mockAggregate);
      mockRepository.save.mockResolvedValue(undefined);

      const command: IActivateTenantCommand = {
        tenantId: mockAggregate.id.toString(),
        activatedBy: 'admin-123',
      };

      await useCase.execute(command);

      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockAggregate.activate).toHaveBeenCalledWith('admin-123');
      expect(mockRepository.save).toHaveBeenCalledWith(mockAggregate);
    });
  });

  describe('失败场景', () => {
    it('应该在租户不存在时抛出错误', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const validUuid = EntityId.generate().toString();
      const command: IActivateTenantCommand = {
        tenantId: validUuid,
        activatedBy: 'admin-123',
      };

      await expect(useCase.execute(command)).rejects.toThrow('租户不存在');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('应该在租户 ID 格式无效时抛出错误', async () => {
      const command: IActivateTenantCommand = {
        tenantId: 'invalid-uuid',
        activatedBy: 'admin-123',
      };

      await expect(useCase.execute(command)).rejects.toThrow();
    });
  });
});

