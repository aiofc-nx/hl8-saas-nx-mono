/**
 * 注册用户用例单元测试
 *
 * @description 测试用户注册的业务逻辑
 *
 * @since 1.0.0
 */

import { EntityId, Username, Email, PhoneNumber } from '@hl8/hybrid-archi';
import { RegisterUserUseCase, IRegisterUserCommand } from './register-user.use-case';
import { IUserAggregateRepository } from '../../../domain/user/repositories/user-aggregate.repository.interface';
import { UserAggregate } from '../../../domain/user/aggregates/user.aggregate';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockRepository: jest.Mocked<IUserAggregateRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      existsByUsername: jest.fn(),
      existsByEmail: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
    } as any;

    useCase = new RegisterUserUseCase(mockRepository);
  });

  describe('成功场景', () => {
    it('应该成功注册新用户', async () => {
      mockRepository.existsByUsername.mockResolvedValue(false);
      mockRepository.existsByEmail.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(undefined);

      const command: IRegisterUserCommand = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        phoneNumber: '13800138000',
      };

      const userId = await useCase.execute(command);

      expect(userId).toBeInstanceOf(EntityId);
      expect(mockRepository.existsByUsername).toHaveBeenCalled();
      expect(mockRepository.existsByEmail).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('应该支持不提供手机号的注册', async () => {
      mockRepository.existsByUsername.mockResolvedValue(false);
      mockRepository.existsByEmail.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(undefined);

      const command: IRegisterUserCommand = {
        username: 'usernophone',
        email: 'nophone@example.com',
        password: 'Password123',
      };

      const userId = await useCase.execute(command);

      expect(userId).toBeInstanceOf(EntityId);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('失败场景', () => {
    it('应该在用户名已存在时抛出错误', async () => {
      mockRepository.existsByUsername.mockResolvedValue(true);

      const command: IRegisterUserCommand = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'Password123',
      };

      await expect(useCase.execute(command)).rejects.toThrow('用户名');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('应该在邮箱已被注册时抛出错误', async () => {
      mockRepository.existsByUsername.mockResolvedValue(false);
      mockRepository.existsByEmail.mockResolvedValue(true);

      const command: IRegisterUserCommand = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'Password123',
      };

      await expect(useCase.execute(command)).rejects.toThrow('邮箱');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('应该在用户名格式无效时抛出错误', async () => {
      const command: IRegisterUserCommand = {
        username: 'ab', // 太短
        email: 'test@example.com',
        password: 'Password123',
      };

      await expect(useCase.execute(command)).rejects.toThrow();
    });

    it('应该在邮箱格式无效时抛出错误', async () => {
      const command: IRegisterUserCommand = {
        username: 'testuser',
        email: 'invalid-email', // 无效邮箱
        password: 'Password123',
      };

      await expect(useCase.execute(command)).rejects.toThrow();
    });
  });
});

