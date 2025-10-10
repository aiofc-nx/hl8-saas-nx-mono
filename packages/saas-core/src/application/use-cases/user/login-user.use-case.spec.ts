/**
 * 用户登录用例单元测试
 *
 * @description 测试用户登录的业务逻辑
 *
 * @since 1.0.0
 */

import { EntityId, Email } from '@hl8/hybrid-archi';
import { LoginUserUseCase, ILoginUserCommand } from './login-user.use-case';
import { IUserAggregateRepository } from '../../../domain/user/repositories/user-aggregate.repository.interface';
import { UserAggregate } from '../../../domain/user/aggregates/user.aggregate';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
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
      authenticate: jest.fn(),
      recordLogin: jest.fn(),
      recordFailedLogin: jest.fn(),
    } as any;

    useCase = new LoginUserUseCase(mockRepository);
  });

  describe('成功场景', () => {
    it('应该在提供正确凭据时成功登录', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockAggregate);
      mockAggregate.authenticate.mockReturnValue(true);

      const command: ILoginUserCommand = {
        email: 'user@example.com',
        password: 'CorrectPassword123',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await useCase.execute(command);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('accessToken');
      expect(mockAggregate.authenticate).toHaveBeenCalledWith('CorrectPassword123');
      expect(mockAggregate.recordLogin).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('失败场景', () => {
    it('应该在用户不存在时抛出错误', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const command: ILoginUserCommand = {
        email: 'nonexistent@example.com',
        password: 'Password123',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      await expect(useCase.execute(command)).rejects.toThrow('用户名或密码错误');
    });

    it('应该在密码错误时抛出错误并记录失败', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockAggregate);
      mockAggregate.authenticate.mockReturnValue(false);

      const command: ILoginUserCommand = {
        email: 'user@example.com',
        password: 'WrongPassword',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      await expect(useCase.execute(command)).rejects.toThrow('用户名或密码错误');
      expect(mockAggregate.recordFailedLogin).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('应该在邮箱格式无效时抛出错误', async () => {
      const command: ILoginUserCommand = {
        email: 'invalid-email',
        password: 'Password123',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      await expect(useCase.execute(command)).rejects.toThrow();
    });
  });
});

