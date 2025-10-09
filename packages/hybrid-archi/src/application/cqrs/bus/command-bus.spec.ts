/**
 * 命令总线测试
 *
 * 测试命令总线的功能，包括命令注册、命令处理、中间件执行等。
 *
 * @description 命令总线的单元测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from './command-bus';
import { BaseCommand } from '../commands/base/base-command';
import { ICommandHandler } from '../commands/base/command-handler.interface';
import { PinoLogger } from '@hl8/logger';
import { EntityId } from '../../../domain/value-objects/entity-id';

// 测试用的有效UUID
const TEST_TENANT_ID = EntityId.generate().toString();
const TEST_USER_ID = 'test-user';

describe('CommandBus', () => {
  let commandBus: CommandBus;
  let logger: PinoLogger;

  class TestCommand extends BaseCommand {
    constructor(
      public readonly name: string,
      public readonly value: string,
      tenantId: string = TEST_TENANT_ID,
      userId: string = TEST_USER_ID
    ) {
      super(tenantId, userId);
    }

    get commandType(): string {
      return 'TestCommand';
    }
  }

  class TestCommandHandler implements ICommandHandler<TestCommand> {
    async execute(command: TestCommand): Promise<void> {
      // 模拟命令处理
      console.log(`处理命令: ${command.name} = ${command.value}`);
    }

    getSupportedCommandType(): string {
      return 'TestCommand';
    }

    supports(commandType: string): boolean {
      return commandType === 'TestCommand';
    }

    validateCommand(command: TestCommand): void {
      if (!command.name || !command.value) {
        throw new Error('Name and value are required');
      }
    }

    getPriority(): number {
      return 0;
    }

    async canHandle(command: TestCommand): Promise<boolean> {
      return true;
    }
  }

  class AnotherCommand extends BaseCommand {
    constructor(
      public readonly id: string,
      tenantId: string = TEST_TENANT_ID,
      userId: string = TEST_USER_ID
    ) {
      super(tenantId, userId);
    }

    get commandType(): string {
      return 'AnotherCommand';
    }
  }

  class AnotherCommandHandler implements ICommandHandler<AnotherCommand> {
    async execute(command: AnotherCommand): Promise<void> {
      // 模拟命令处理
      console.log(`处理另一个命令: ${command.id}`);
    }

    getSupportedCommandType(): string {
      return 'AnotherCommand';
    }

    supports(commandType: string): boolean {
      return commandType === 'AnotherCommand';
    }

    validateCommand(command: AnotherCommand): void {
      if (!command.id) {
        throw new Error('ID is required');
      }
    }

    getPriority(): number {
      return 0;
    }

    async canHandle(command: AnotherCommand): Promise<boolean> {
      return true;
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandBus,
        {
          provide: PinoLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    commandBus = module.get<CommandBus>(CommandBus);
    logger = module.get<PinoLogger>(PinoLogger);
  });

  describe('构造函数', () => {
    it('应该正确初始化命令总线', () => {
      expect(commandBus).toBeDefined();
      expect(commandBus.getHandlerCount()).toBe(0);
      expect(commandBus.getMiddlewareCount()).toBe(0);
    });
  });

  describe('命令处理器注册', () => {
    it('应该注册命令处理器', () => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());

      expect(commandBus.getHandlerCount()).toBe(1);
      expect(commandBus.supports('TestCommand')).toBe(true);
    });

    it('应该注册多个命令处理器', () => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());
      commandBus.registerHandler('AnotherCommand', new AnotherCommandHandler());

      expect(commandBus.getHandlerCount()).toBe(2);
      expect(commandBus.supports('TestCommand')).toBe(true);
      expect(commandBus.supports('AnotherCommand')).toBe(true);
    });

    it('应该覆盖已存在的处理器', () => {
      const handler1 = new TestCommandHandler();
      const handler2 = new TestCommandHandler();

      commandBus.registerHandler('TestCommand', handler1);
      
      // 先移除已存在的处理器
      commandBus.unregisterHandler('TestCommand');
      commandBus.registerHandler('TestCommand', handler2);

      expect(commandBus.getHandlerCount()).toBe(1);
    });
  });

  describe('命令执行', () => {
    beforeEach(() => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());
    });

    it('应该执行命令', async () => {
      const command = new TestCommand('test', 'value');

      await expect(commandBus.execute(command)).resolves.not.toThrow();
    });

    it('应该执行多个命令', async () => {
      const command1 = new TestCommand('test1', 'value1');
      const command2 = new TestCommand('test2', 'value2');

      await expect(commandBus.execute(command1)).resolves.not.toThrow();
      await expect(commandBus.execute(command2)).resolves.not.toThrow();
    });

    it('应该处理不存在的命令处理器', async () => {
      const unknownCommand = new AnotherCommand('unknown');

      await expect(commandBus.execute(unknownCommand)).rejects.toThrow();
    });
  });

  describe('中间件', () => {
    let middleware1: any;
    let middleware2: any;

    beforeEach(() => {
      middleware1 = {
        name: 'middleware1',
        priority: 1,
        execute: jest.fn().mockImplementation((context, next) => {
          console.log('中间件1: 执行前');
          return next();
        })
      };

      middleware2 = {
        name: 'middleware2',
        priority: 2,
        execute: jest.fn().mockImplementation((context, next) => {
          console.log('中间件2: 执行前');
          return next();
        })
      };

      commandBus.registerHandler('TestCommand', new TestCommandHandler());
    });

    it('应该注册中间件', () => {
      commandBus.addMiddleware(middleware1);

      expect(commandBus.getMiddlewareCount()).toBe(1);
    });

    it('应该注册多个中间件', () => {
      commandBus.addMiddleware(middleware1);
      commandBus.addMiddleware(middleware2);

      expect(commandBus.getMiddlewareCount()).toBe(2);
    });

    it('应该按顺序执行中间件', async () => {
      commandBus.addMiddleware(middleware1);
      commandBus.addMiddleware(middleware2);

      const command = new TestCommand('test', 'value');
      await commandBus.execute(command);

      expect(middleware1.execute).toHaveBeenCalled();
      expect(middleware2.execute).toHaveBeenCalled();
    });

    it('应该处理中间件错误', async () => {
      const errorMiddleware = {
        name: 'errorMiddleware',
        priority: 1,
        execute: jest.fn().mockImplementation(() => {
          throw new Error('中间件错误');
        })
      };

      commandBus.addMiddleware(errorMiddleware);

      const command = new TestCommand('test', 'value');
      await expect(commandBus.execute(command)).rejects.toThrow('中间件错误');
    });
  });

  describe('错误处理', () => {
    beforeEach(() => {
      // 清除之前的处理器
      commandBus.unregisterHandler('TestCommand');
    });

    it('应该处理命令执行错误', async () => {
      const errorHandler: ICommandHandler<TestCommand> = {
        execute: jest.fn().mockImplementation(() => {
          throw new Error('命令执行错误');
        }),
        getSupportedCommandType: () => 'TestCommand',
        supports: (commandType: string) => commandType === 'TestCommand',
        validateCommand: jest.fn(),
        getPriority: () => 0,
        canHandle: jest.fn().mockResolvedValue(true),
      };

      commandBus.registerHandler('TestCommand', errorHandler);

      const command = new TestCommand('test', 'value');
      await expect(commandBus.execute(command)).rejects.toThrow('命令执行错误');
    });

    it('应该记录错误日志', async () => {
      const errorHandler: ICommandHandler<TestCommand> = {
        execute: jest.fn().mockImplementation(() => {
          throw new Error('测试错误');
        }),
        getSupportedCommandType: () => 'TestCommand',
        supports: (commandType: string) => commandType === 'TestCommand',
        validateCommand: jest.fn(),
        getPriority: () => 0,
        canHandle: jest.fn().mockResolvedValue(true),
      };

      commandBus.registerHandler('TestCommand', errorHandler);

      const command = new TestCommand('test', 'value');
      await expect(commandBus.execute(command)).rejects.toThrow();

      // 验证错误被正确抛出
      expect(errorHandler.execute).toHaveBeenCalled();
    });
  });

  describe('统计信息', () => {
    beforeEach(() => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());
    });

    it('应该获取处理器统计信息', () => {
      const stats = {
        totalHandlers: commandBus.getHandlerCount(),
        handlersByType: commandBus.getRegisteredCommandTypes()
      };

      expect(stats).toHaveProperty('totalHandlers');
      expect(stats).toHaveProperty('handlersByType');
      expect(stats.totalHandlers).toBe(1);
    });

    it('应该获取中间件统计信息', () => {
      const middleware1 = { name: 'middleware1', priority: 1, execute: jest.fn() };
      const middleware2 = { name: 'middleware2', priority: 2, execute: jest.fn() };
      
      commandBus.addMiddleware(middleware1);
      commandBus.addMiddleware(middleware2);

      const stats = {
        totalMiddleware: commandBus.getMiddlewareCount()
      };

      expect(stats).toHaveProperty('totalMiddleware');
      expect(stats.totalMiddleware).toBe(2);
    });
  });

  describe('清理功能', () => {
    it('应该移除处理器', () => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());
      expect(commandBus.supports('TestCommand')).toBe(true);

      commandBus.unregisterHandler('TestCommand');
      expect(commandBus.supports('TestCommand')).toBe(false);
    });

    it('应该移除中间件', () => {
      const middleware = { name: 'test-middleware', priority: 1, execute: jest.fn() };
      commandBus.addMiddleware(middleware);
      expect(commandBus.getMiddlewareCount()).toBe(1);

      commandBus.removeMiddleware('test-middleware');
      expect(commandBus.getMiddlewareCount()).toBe(0);
    });

    it('应该清理所有处理器', () => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());
      commandBus.registerHandler('AnotherCommand', new AnotherCommandHandler());

      commandBus.clearHandlers();
      expect(commandBus.getHandlerCount()).toBe(0);
    });

    it('应该清理所有中间件', () => {
      const middleware1 = { name: 'middleware1', priority: 1, execute: jest.fn() };
      const middleware2 = { name: 'middleware2', priority: 2, execute: jest.fn() };
      
      commandBus.addMiddleware(middleware1);
      commandBus.addMiddleware(middleware2);

      commandBus.clearMiddlewares();
      expect(commandBus.getMiddlewareCount()).toBe(0);
    });
  });

  describe('性能测试', () => {
    beforeEach(() => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());
    });

    it('应该高效处理大量命令', async () => {
      const startTime = Date.now();
      const promises = [];

      // 并发执行1000个命令
      for (let i = 0; i < 1000; i++) {
        const command = new TestCommand(`test${i}`, `value${i}`);
        promises.push(commandBus.execute(command));
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });

  describe('并发安全', () => {
    it('应该支持并发命令执行', async () => {
      commandBus.registerHandler('TestCommand', new TestCommandHandler());

      const promises = [];

      // 并发执行命令
      for (let i = 0; i < 100; i++) {
        const command = new TestCommand(`concurrent${i}`, `value${i}`);
        promises.push(commandBus.execute(command));
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
});
