/**
 * 升级租户用例单元测试
 *
 * @description 测试租户类型升级的业务逻辑
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { UpgradeTenantUseCase, IUpgradeTenantCommand } from './upgrade-tenant.use-case';
import { ITenantAggregateRepository } from '../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantAggregate } from '../../../domain/tenant/aggregates/tenant.aggregate';
import { TenantType } from '../../../domain/tenant/value-objects/tenant-type.enum';

describe('UpgradeTenantUseCase', () => {
  let useCase: UpgradeTenantUseCase;
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
      upgrade: jest.fn(),
      getType: jest.fn(),
    } as any;

    useCase = new UpgradeTenantUseCase(mockRepository);
  });

  describe('成功场景', () => {
    it('应该成功升级租户类型', async () => {
      mockRepository.findById.mockResolvedValue(mockAggregate);
      mockAggregate.getType.mockReturnValue(TenantType.FREE);
      mockRepository.save.mockResolvedValue(undefined);

      const command: IUpgradeTenantCommand = {
        tenantId: mockAggregate.id.toString(),
        targetType: TenantType.BASIC,
        upgradedBy: 'admin-123',
      };

      await useCase.execute(command);

      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockAggregate.upgrade).toHaveBeenCalledWith(TenantType.BASIC, 'admin-123');
      expect(mockRepository.save).toHaveBeenCalledWith(mockAggregate);
    });

    it('应该支持跨级升级', async () => {
      mockRepository.findById.mockResolvedValue(mockAggregate);
      mockAggregate.getType.mockReturnValue(TenantType.FREE);
      mockRepository.save.mockResolvedValue(undefined);

      const command: IUpgradeTenantCommand = {
        tenantId: mockAggregate.id.toString(),
        targetType: TenantType.ENTERPRISE, // 跨级升级
        upgradedBy: 'admin-123',
      };

      await useCase.execute(command);

      expect(mockAggregate.upgrade).toHaveBeenCalledWith(TenantType.ENTERPRISE, 'admin-123');
    });
  });

  describe('失败场景', () => {
    it('应该在租户不存在时抛出错误', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const validUuid = EntityId.generate().toString();
      const command: IUpgradeTenantCommand = {
        tenantId: validUuid,
        targetType: TenantType.BASIC,
        upgradedBy: 'admin-123',
      };

      await expect(useCase.execute(command)).rejects.toThrow('租户不存在');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('应该在租户 ID 格式无效时抛出错误', async () => {
      const command: IUpgradeTenantCommand = {
        tenantId: 'invalid-uuid',
        targetType: TenantType.BASIC,
        upgradedBy: 'admin-123',
      };

      await expect(useCase.execute(command)).rejects.toThrow();
    });
  });
});

