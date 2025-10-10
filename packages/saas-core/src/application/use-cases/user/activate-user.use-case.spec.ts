/**
 * 激活用户用例单元测试
 *
 * @description 测试用户激活的业务逻辑
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { ActivateUserUseCase, IActivateUserCommand } from './activate-user.use-case';
import { IUserAggregateRepository } from '../../../domain/user/repositories/user-aggregate.repository.interface';
import { UserAggregate } from '../../../domain/user/aggregates/user.aggregate';

describe('ActivateUserUseCase', () => {
  let useCase: ActivateUserUseCase;
  let mockRepository: jest.Mocked<IUserAggregateRepository>;
  let mockAggregate: jest.Mocked<UserAggregate>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      existsByUsername: jest.fn(),
      existsByEmail: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    } as any;

    mockAggregate = {
      id: EntityId.generate(),
      verifyEmail: jest.fn(),
    } as any;

    useCase = new ActivateUserUseCase(mockRepository);
  });

  describe('成功场景', () => {
    it('应该成功激活用户', async () => {
      mockRepository.findById.mockResolvedValue(mockAggregate);
      mockRepository.save.mockResolvedValue(undefined);

      const command: IActivateUserCommand = {
        userId: mockAggregate.id.toString(),
        activatedBy: 'admin-123',
      };

      await useCase.execute(command);

      expect(mockRepository.findById).toHaveBeenCalled();
      expect(mockAggregate.verifyEmail).toHaveBeenCalledWith('admin-123');
      expect(mockRepository.save).toHaveBeenCalledWith(mockAggregate);
    });
  });

  describe('失败场景', () => {
    it('应该在用户不存在时抛出错误', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const validUuid = EntityId.generate().toString();
      const command: IActivateUserCommand = {
        userId: validUuid,
        activatedBy: 'admin-123',
      };

      await expect(useCase.execute(command)).rejects.toThrow('用户不存在');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('应该在用户 ID 格式无效时抛出错误', async () => {
      const command: IActivateUserCommand = {
        userId: 'invalid-uuid',
        activatedBy: 'admin-123',
      };

      await expect(useCase.execute(command)).rejects.toThrow();
    });
  });
});

