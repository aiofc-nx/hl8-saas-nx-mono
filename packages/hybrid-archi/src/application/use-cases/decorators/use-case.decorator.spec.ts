/**
 * UseCase装饰器单元测试
 *
 * @description 测试UseCase装饰器的功能和行为
 * @since 1.0.0
 */

import {
  UseCase,
  UseCaseType,
  getUseCaseMetadata,
  isUseCase,
  IUseCaseOptions,
} from './use-case.decorator';

describe('UseCase装饰器', () => {
  describe('基本装饰功能', () => {
    it('应该能够装饰用例类', () => {
      // Arrange & Act
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      // Assert
      expect(TestUseCaseClass).toBeDefined();
    });

    it('应该存储用例元数据', () => {
      // Arrange & Act
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      const metadata = getUseCaseMetadata(TestUseCaseClass);

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('TestUseCase');
      expect(metadata?.description).toBe('测试用例');
      expect(metadata?.type).toBe('command');
    });

    it('应该设置默认值', () => {
      // Arrange & Act
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      const metadata = getUseCaseMetadata(TestUseCaseClass);

      // Assert
      expect(metadata?.version).toBe('1.0.0');
      expect(metadata?.permissions).toEqual([]);
      expect(metadata?.category).toBe('general');
      expect(metadata?.tags).toEqual([]);
      expect(metadata?.critical).toBe(false);
      expect(metadata?.monitored).toBe(true);
    });
  });

  describe('配置选项', () => {
    it('应该支持完整的配置选项', () => {
      // Arrange & Act
      @UseCase({
        name: 'CompleteUseCase',
        description: '完整配置的用例',
        type: 'command',
        version: '2.0.0',
        permissions: ['admin', 'write'],
        category: 'test-category',
        tags: ['test', 'example'],
        critical: true,
        monitored: true,
        cache: {
          enabled: true,
          ttl: 600,
          keyPrefix: 'test',
        },
        timeout: {
          execution: 5000,
          alertOnTimeout: true,
        },
      })
      class CompleteUseCaseClass {}

      const metadata = getUseCaseMetadata(CompleteUseCaseClass);

      // Assert
      expect(metadata?.name).toBe('CompleteUseCase');
      expect(metadata?.version).toBe('2.0.0');
      expect(metadata?.permissions).toEqual(['admin', 'write']);
      expect(metadata?.category).toBe('test-category');
      expect(metadata?.tags).toEqual(['test', 'example']);
      expect(metadata?.critical).toBe(true);
      expect(metadata?.cache.enabled).toBe(true);
      expect(metadata?.cache.ttl).toBe(600);
      expect(metadata?.timeout.execution).toBe(5000);
    });

    it('应该支持query类型用例', () => {
      // Arrange & Act
      @UseCase({
        name: 'QueryUseCase',
        description: '查询用例',
        type: 'query',
      })
      class QueryUseCaseClass {}

      const metadata = getUseCaseMetadata(QueryUseCaseClass);

      // Assert
      expect(metadata?.type).toBe('query');
    });

    it('应该支持command类型用例', () => {
      // Arrange & Act
      @UseCase({
        name: 'CommandUseCase',
        description: '命令用例',
        type: 'command',
      })
      class CommandUseCaseClass {}

      const metadata = getUseCaseMetadata(CommandUseCaseClass);

      // Assert
      expect(metadata?.type).toBe('command');
    });
  });

  describe('配置验证', () => {
    it('应该在名称为空时抛出异常', () => {
      // Act & Assert
      expect(() => {
        @UseCase({
          name: '',
          description: '测试用例',
          type: 'command',
        })
        class InvalidUseCaseClass {}
      }).toThrow('用例名称不能为空');
    });

    it('应该在描述为空时抛出异常', () => {
      // Act & Assert
      expect(() => {
        @UseCase({
          name: 'TestUseCase',
          description: '',
          type: 'command',
        })
        class InvalidUseCaseClass {}
      }).toThrow('用例描述不能为空');
    });

    it('应该在类型无效时抛出异常', () => {
      // Act & Assert
      expect(() => {
        @UseCase({
          name: 'TestUseCase',
          description: '测试用例',
          type: 'invalid' as any,
        })
        class InvalidUseCaseClass {}
      }).toThrow('用例类型必须是');
    });

    it('应该在权限不是数组时抛出异常', () => {
      // Act & Assert
      expect(() => {
        @UseCase({
          name: 'TestUseCase',
          description: '测试用例',
          type: 'command',
          permissions: 'invalid' as any,
        })
        class InvalidUseCaseClass {}
      }).toThrow('用例权限必须是字符串数组');
    });

    it('应该在超时时间为负数时抛出异常', () => {
      // Act & Assert
      expect(() => {
        @UseCase({
          name: 'TestUseCase',
          description: '测试用例',
          type: 'command',
          timeout: {
            execution: -1000,
          },
        })
        class InvalidUseCaseClass {}
      }).toThrow('用例超时时间必须是正整数');
    });

    it('应该在缓存TTL为负数时抛出异常', () => {
      // Act & Assert
      expect(() => {
        @UseCase({
          name: 'TestUseCase',
          description: '测试用例',
          type: 'query',
          cache: {
            enabled: true,
            ttl: -100,
          },
        })
        class InvalidUseCaseClass {}
      }).toThrow('缓存TTL必须是正整数');
    });
  });

  describe('getUseCaseMetadata', () => {
    it('应该能够从类获取元数据', () => {
      // Arrange
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      // Act
      const metadata = getUseCaseMetadata(TestUseCaseClass);

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('TestUseCase');
    });

    it('应该能够从实例获取元数据', () => {
      // Arrange
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      const instance = new TestUseCaseClass();

      // Act
      const metadata = getUseCaseMetadata(instance);

      // Assert
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('TestUseCase');
    });

    it('应该在未装饰的类上返回undefined', () => {
      // Arrange
      class NotAUseCaseClass {}

      // Act
      const metadata = getUseCaseMetadata(NotAUseCaseClass);

      // Assert
      expect(metadata).toBeUndefined();
    });
  });

  describe('isUseCase', () => {
    it('应该识别用例类', () => {
      // Arrange
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      // Act
      const result = isUseCase(TestUseCaseClass);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别用例实例', () => {
      // Arrange
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      const instance = new TestUseCaseClass();

      // Act
      const result = isUseCase(instance);

      // Assert
      expect(result).toBe(true);
    });

    it('应该识别非用例类', () => {
      // Arrange
      class NotAUseCaseClass {}

      // Act
      const result = isUseCase(NotAUseCaseClass);

      // Assert
      expect(result).toBe(false);
    });

    it('应该识别普通对象', () => {
      // Arrange
      const notAUseCase = { name: 'test' };

      // Act
      const result = isUseCase(notAUseCase);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('缓存配置', () => {
    it('应该为查询用例设置默认缓存配置', () => {
      // Arrange & Act
      @UseCase({
        name: 'QueryUseCase',
        description: '查询用例',
        type: 'query',
      })
      class QueryUseCaseClass {}

      const metadata = getUseCaseMetadata(QueryUseCaseClass);

      // Assert
      expect(metadata?.cache).toBeDefined();
      expect(metadata?.cache.keyPrefix).toBe('queryusecase');
    });

    it('应该允许自定义缓存配置', () => {
      // Arrange & Act
      @UseCase({
        name: 'QueryUseCase',
        description: '查询用例',
        type: 'query',
        cache: {
          enabled: true,
          ttl: 1800,
          keyPrefix: 'custom',
        },
      })
      class QueryUseCaseClass {}

      const metadata = getUseCaseMetadata(QueryUseCaseClass);

      // Assert
      expect(metadata?.cache.enabled).toBe(true);
      expect(metadata?.cache.ttl).toBe(1800);
      expect(metadata?.cache.keyPrefix).toBe('custom');
    });
  });

  describe('监控配置', () => {
    it('应该默认启用监控', () => {
      // Arrange & Act
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
      })
      class TestUseCaseClass {}

      const metadata = getUseCaseMetadata(TestUseCaseClass);

      // Assert
      expect(metadata?.monitored).toBe(true);
    });

    it('应该允许禁用监控', () => {
      // Arrange & Act
      @UseCase({
        name: 'TestUseCase',
        description: '测试用例',
        type: 'command',
        monitored: false,
      })
      class TestUseCaseClass {}

      const metadata = getUseCaseMetadata(TestUseCaseClass);

      // Assert
      expect(metadata?.monitored).toBe(false);
    });
  });
});

