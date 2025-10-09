/**
 * BaseUseCase单元测试
 *
 * @description 测试BaseUseCase抽象类的功能和行为
 * @since 1.0.0
 */

import { BaseUseCase } from './base-use-case';
import { IUseCaseContext } from './use-case.interface';
import { PinoLogger } from '@hl8/logger';

// 创建具体的测试用例类
class TestUseCase extends BaseUseCase<TestRequest, TestResponse> {
  constructor(
    permissions: string[] = [],
    logger?: PinoLogger
  ) {
    super('TestUseCase', '测试用例', '1.0.0', permissions, logger);
  }

  protected async executeUseCase(
    request: TestRequest,
    context: IUseCaseContext
  ): Promise<TestResponse> {
    return {
      success: true,
      data: `Processed: ${request.data}`,
      requestId: context.request?.id || '',
    };
  }
}

// 测试请求类型
interface TestRequest {
  data: string;
}

// 测试响应类型
interface TestResponse {
  success: boolean;
  data: string;
  requestId: string;
}

describe('BaseUseCase', () => {
  let useCase: TestUseCase;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(() => {
    // 创建模拟logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    useCase = new TestUseCase([], mockLogger);
  });

  describe('基本属性', () => {
    it('应该能够获取用例名称', () => {
      // Act
      const name = useCase.getUseCaseName();

      // Assert
      expect(name).toBe('TestUseCase');
    });

    it('应该能够获取用例描述', () => {
      // Act
      const description = useCase.getUseCaseDescription();

      // Assert
      expect(description).toBe('测试用例');
    });

    it('应该能够获取用例版本', () => {
      // Act
      const version = useCase.getUseCaseVersion();

      // Assert
      expect(version).toBe('1.0.0');
    });

    it('应该能够获取所需权限', () => {
      // Arrange
      const testCase = new TestUseCase(['read', 'write']);

      // Act
      const permissions = testCase.getRequiredPermissions();

      // Assert
      expect(permissions).toEqual(['read', 'write']);
    });

    it('应该返回权限的副本而不是原始数组', () => {
      // Arrange
      const testCase = new TestUseCase(['read']);

      // Act
      const permissions1 = testCase.getRequiredPermissions();
      const permissions2 = testCase.getRequiredPermissions();

      // Assert
      expect(permissions1).not.toBe(permissions2);
      expect(permissions1).toEqual(permissions2);
    });
  });

  describe('execute', () => {
    it('应该成功执行用例', async () => {
      // Arrange
      const request: TestRequest = { data: 'test data' };

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toBe('Processed: test data');
    });

    it('应该记录开始执行日志', async () => {
      // Arrange
      const request: TestRequest = { data: 'test' };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('started'),
        expect.any(Object)
      );
    });

    it('应该记录成功执行日志', async () => {
      // Arrange
      const request: TestRequest = { data: 'test' };

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('completed successfully'),
        expect.any(Object)
      );
    });

    it('应该在执行失败时记录错误日志', async () => {
      // Arrange
      const errorUseCase = new (class extends BaseUseCase<
        TestRequest,
        TestResponse
      > {
        constructor() {
          super('ErrorUseCase', '错误用例', '1.0.0', [], mockLogger);
        }

        protected async executeUseCase(
          request: TestRequest,
          context: IUseCaseContext
        ): Promise<TestResponse> {
          throw new Error('Execution failed');
        }
      })();

      const request: TestRequest = { data: 'test' };

      // Act & Assert
      await expect(errorUseCase.execute(request)).rejects.toThrow(
        'Execution failed'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('failed'),
        expect.any(Object)
      );
    });
  });

  describe('validateRequest', () => {
    it('应该验证有效的请求', () => {
      // Arrange
      const request: TestRequest = { data: 'valid' };

      // Act & Assert
      expect(() => (useCase as any).validateRequest(request)).not.toThrow();
    });

    it('应该在请求为null时抛出异常', () => {
      // Arrange
      const request = null as any;

      // Act & Assert
      expect(() => (useCase as any).validateRequest(request)).toThrow(
        '请求参数不能为空'
      );
    });

    it('应该在请求为undefined时抛出异常', () => {
      // Arrange
      const request = undefined as any;

      // Act & Assert
      expect(() => (useCase as any).validateRequest(request)).toThrow(
        '请求参数不能为空'
      );
    });
  });

  describe('validatePermissions', () => {
    it('应该通过无权限要求的验证', async () => {
      // Arrange
      const context: IUseCaseContext = {
        request: { id: 'test-id', timestamp: new Date() },
        system: {
          service: 'test',
          version: '1.0.0',
          environment: 'test',
        },
      };

      // Act & Assert
      await expect(
        (useCase as any).validatePermissions(context)
      ).resolves.not.toThrow();
    });

    it('应该验证用户拥有所需权限', async () => {
      // Arrange
      const testCase = new TestUseCase(['read']);
      const context: IUseCaseContext = {
        request: { id: 'test-id', timestamp: new Date() },
        system: {
          service: 'test',
          version: '1.0.0',
          environment: 'test',
        },
        user: {
          id: 'user-1',
          name: 'Test User',
          permissions: ['read', 'write'],
        },
      };

      // Act & Assert
      await expect(
        (testCase as any).validatePermissions(context)
      ).resolves.not.toThrow();
    });

    it('应该在用户缺少必需权限时抛出异常', async () => {
      // Arrange
      const testCase = new TestUseCase(['admin']);
      const context: IUseCaseContext = {
        request: { id: 'test-id', timestamp: new Date() },
        system: {
          service: 'test',
          version: '1.0.0',
          environment: 'test',
        },
        user: {
          id: 'user-1',
          name: 'Test User',
          permissions: ['read'],
        },
      };

      // Act & Assert
      await expect(
        (testCase as any).validatePermissions(context)
      ).rejects.toThrow('权限不足');
    });

    it('应该在没有用户信息但需要权限时抛出异常', async () => {
      // Arrange
      const testCase = new TestUseCase(['read']);
      const context: IUseCaseContext = {
        request: { id: 'test-id', timestamp: new Date() },
        system: {
          service: 'test',
          version: '1.0.0',
          environment: 'test',
        },
      };

      // Act & Assert
      await expect(
        (testCase as any).validatePermissions(context)
      ).rejects.toThrow('用例需要用户身份验证');
    });
  });

  describe('createContext', () => {
    it('应该创建基础执行上下文', () => {
      // Act
      const context = (useCase as any).createContext();

      // Assert
      expect(context).toBeDefined();
      expect(context.request).toBeDefined();
      expect(context.request.id).toBeDefined();
      expect(context.request.timestamp).toBeInstanceOf(Date);
      expect(context.system).toBeDefined();
      expect(context.system.service).toBe('aiofix-saas');
      expect(context.system.version).toBe('1.0.0');
    });

    it('应该为每次执行生成唯一的请求ID', () => {
      // Act
      const context1 = (useCase as any).createContext();
      const context2 = (useCase as any).createContext();

      // Assert
      expect(context1.request.id).not.toBe(context2.request.id);
    });
  });

  describe('异常处理方法', () => {
    it('应该能够抛出验证异常', () => {
      // Act & Assert
      expect(() =>
        (useCase as any).throwValidationError(
          '验证失败',
          ['field1', 'field2'],
          { detail: 'test' }
        )
      ).toThrow();
    });

    it('应该能够抛出权限异常', () => {
      // Act & Assert
      expect(() =>
        (useCase as any).throwPermissionError(
          '权限不足',
          ['admin'],
          ['user'],
          { detail: 'test' }
        )
      ).toThrow();
    });

    it('应该能够抛出业务异常', () => {
      // Act & Assert
      expect(() =>
        (useCase as any).throwBusinessError(
          '业务规则违反',
          'rule-1',
          { detail: 'test' }
        )
      ).toThrow();
    });

    it('应该能够抛出执行异常', () => {
      // Act & Assert
      expect(() =>
        (useCase as any).throwExecutionError(
          '执行失败',
          'operation-1',
          { detail: 'test' }
        )
      ).toThrow();
    });
  });
});

