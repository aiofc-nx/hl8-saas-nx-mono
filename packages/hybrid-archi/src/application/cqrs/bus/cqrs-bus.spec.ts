/**
 * CQRSBus 测试
 *
 * @description 测试统一CQRS总线的功能
 * @since 1.0.0
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CQRSBus } from './cqrs-bus';
import { CommandBus } from './command-bus';
import { QueryBus } from './query-bus';
import { EventBus } from './event-bus';
import { BaseCommand } from '../commands/base/base-command';
import { BaseQuery, IQueryResult } from '../queries/base/base-query';
import { BaseDomainEvent } from '../../../domain/events/base/base-domain-event';
import { EntityId } from '../../../domain/value-objects/entity-id';

// 测试用的有效UUID
const TEST_TENANT_ID = EntityId.generate().toString();
const TEST_USER_ID = 'test-user';

/**
 * 测试命令类
 */
class TestCommand extends BaseCommand {
  constructor(public readonly data: string, tenantId: string, userId: string) {
    super(tenantId, userId);
  }

  get commandType(): string {
    return 'TestCommand';
  }

  override get commandData(): Record<string, unknown> {
    return { data: this.data };
  }
}

/**
 * 测试查询类
 */
class TestQuery extends BaseQuery {
  constructor(
    public readonly filter: string,
    tenantId: string,
    userId: string,
    page = 1,
    pageSize = 10
  ) {
    super(tenantId, userId, page, pageSize);
  }

  get queryType(): string {
    return 'TestQuery';
  }

  override get queryData(): Record<string, unknown> {
    return { filter: this.filter };
  }

  protected createCopyWithSortRules(): this {
    return this;
  }
}

/**
 * 测试查询结果类
 */
class TestQueryResult implements IQueryResult {
  constructor(private readonly data: unknown[]) {}

  getData(): unknown[] {
    return this.data;
  }

  getPaginationInfo() {
    return {
      page: 1,
      pageSize: 10,
      totalCount: this.data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  getTotalCount(): number {
    return this.data.length;
  }

  hasData(): boolean {
    return this.data.length > 0;
  }

  toJSON(): Record<string, unknown> {
    return { data: this.data };
  }
}

/**
 * 测试事件类
 */
class TestEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: EntityId,
    public readonly data: string
  ) {
    super(aggregateId, aggregateVersion, tenantId);
  }

  get eventType(): string {
    return 'TestEvent';
  }

  override get eventData(): Record<string, unknown> {
    return { data: this.data };
  }
}

describe('CQRSBus', () => {
  let cqrsBus: CQRSBus;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let eventBus: EventBus;

  beforeEach(async () => {
    const mockUseCaseRegistry = {
      register: jest.fn(),
      get: jest.fn(),
      has: jest.fn(),
      getRegisteredUseCases: jest.fn().mockReturnValue([]),
      getByType: jest.fn().mockReturnValue(new Map()),
    };
    const mockProjectorManager = {
      register: jest.fn(),
      projectEvent: jest.fn().mockResolvedValue(undefined),
      projectEvents: jest.fn().mockResolvedValue(undefined),
      rebuildAllReadModels: jest.fn().mockResolvedValue(undefined),
      getProjectors: jest.fn().mockReturnValue([]),
      getAllProjectors: jest.fn().mockReturnValue([]),
      hasProjector: jest.fn().mockReturnValue(false),
      removeProjector: jest.fn(),
      clear: jest.fn(),
      getProjectorStats: jest.fn().mockReturnValue({}),
      setProjectorEnabled: jest.fn(),
      executeProjector: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandBus,
        QueryBus,
        EventBus,
        {
          provide: CQRSBus,
          useFactory: (commandBus: CommandBus, queryBus: QueryBus, eventBus: EventBus) =>
            new CQRSBus(commandBus, queryBus, eventBus, mockUseCaseRegistry, mockProjectorManager),
          inject: [CommandBus, QueryBus, EventBus],
        },
      ],
    }).compile();

    cqrsBus = module.get<CQRSBus>(CQRSBus);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    eventBus = module.get<EventBus>(EventBus);
  });

  describe('初始化', () => {
    it('应该正确初始化CQRS总线', () => {
      expect(cqrsBus).toBeDefined();
      expect(cqrsBus.commandBus).toBe(commandBus);
      expect(cqrsBus.queryBus).toBe(queryBus);
      expect(cqrsBus.eventBus).toBe(eventBus);
      expect(cqrsBus.isInitialized).toBe(false);
    });

    it('应该能够初始化总线', async () => {
      await cqrsBus.initialize();
      expect(cqrsBus.isInitialized).toBe(true);
    });

    it('应该防止重复初始化', async () => {
      await cqrsBus.initialize();
      expect(cqrsBus.isInitialized).toBe(true);

      await expect(cqrsBus.initialize()).rejects.toThrow(
        'CQRS Bus is already initialized'
      );
    });
  });

  describe('命令执行', () => {
    it('应该能够执行命令', async () => {
      await cqrsBus.initialize();

      // 注册命令处理器
      const executedCommands: TestCommand[] = [];
      commandBus.registerHandler('TestCommand', {
        async execute(command: TestCommand) {
          executedCommands.push(command);
        },
        getSupportedCommandType: () => 'TestCommand',
        supports: (type) => type === 'TestCommand',
        validateCommand: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
      });

      const command = new TestCommand('test-data', TEST_TENANT_ID, 'user-1');
      await cqrsBus.executeCommand(command);

      expect(executedCommands).toHaveLength(1);
      expect(executedCommands[0]).toBe(command);
    });

    it('应该在未初始化时拒绝执行命令', async () => {
      const command = new TestCommand('test-data', TEST_TENANT_ID, 'user-1');

      await expect(cqrsBus.executeCommand(command)).rejects.toThrow(
        'CQRS Bus is not initialized. Call initialize() first.'
      );
    });
  });

  describe('查询执行', () => {
    it('应该能够执行查询', async () => {
      await cqrsBus.initialize();

      // 注册查询处理器
      const executedQueries: TestQuery[] = [];
      queryBus.registerHandler('TestQuery', {
        async execute(query: TestQuery) {
          executedQueries.push(query);
          return new TestQueryResult([{ id: 1, name: 'test' }]);
        },
        getSupportedQueryType: () => 'TestQuery',
        supports: (type) => type === 'TestQuery',
        validateQuery: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        generateCacheKey: () => 'test-key',
        getCacheExpiration: () => 300,
      });

      const query = new TestQuery('test-filter', TEST_TENANT_ID, 'user-1');
      const result = await cqrsBus.executeQuery<TestQuery, TestQueryResult>(
        query
      );

      expect(executedQueries).toHaveLength(1);
      expect(executedQueries[0]).toBe(query);
      expect(result).toBeInstanceOf(TestQueryResult);
    });

    it('应该在未初始化时拒绝执行查询', async () => {
      const query = new TestQuery('test-filter', TEST_TENANT_ID, 'user-1');

      await expect(cqrsBus.executeQuery(query)).rejects.toThrow(
        'CQRS Bus is not initialized. Call initialize() first.'
      );
    });
  });

  describe('事件发布', () => {
    it('应该能够发布事件', async () => {
      await cqrsBus.initialize();

      // 注册事件处理器
      const handledEvents: TestEvent[] = [];
      eventBus.registerHandler('TestEvent', {
        async handle(event: TestEvent) {
          handledEvents.push(event);
        },
        getSupportedEventType: () => 'TestEvent',
        supports: (type) => type === 'TestEvent',
        validateEvent: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        getMaxRetries: () => 3,
        getRetryDelay: () => 1000,
        async shouldIgnore() {
          return false;
        },
        async handleFailure() {
          // 测试用的空处理函数
        },
        async isEventProcessed() {
          return false;
        },
        async markEventAsProcessed() {
          // 测试用的空处理函数
        },
      });

      const aggregateId = EntityId.generate();
      const event = new TestEvent(aggregateId, 1, EntityId.generate(), 'test-data');
      await cqrsBus.publishEvent(event);

      expect(handledEvents).toHaveLength(1);
      expect(handledEvents[0]).toBe(event);
    });

    it('应该能够批量发布事件', async () => {
      await cqrsBus.initialize();

      // 注册事件处理器
      const handledEvents: TestEvent[] = [];
      eventBus.registerHandler('TestEvent', {
        async handle(event: TestEvent) {
          handledEvents.push(event);
        },
        getSupportedEventType: () => 'TestEvent',
        supports: (type) => type === 'TestEvent',
        validateEvent: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        getMaxRetries: () => 3,
        getRetryDelay: () => 1000,
        async shouldIgnore() {
          return false;
        },
        async handleFailure() {
          // 测试用的空处理函数
        },
        async isEventProcessed() {
          return false;
        },
        async markEventAsProcessed() {
          // 测试用的空处理函数
        },
      });

      const aggregateId = EntityId.generate();
      const events = [
        new TestEvent(aggregateId, 1, EntityId.generate(), 'data1'),
        new TestEvent(aggregateId, 2, EntityId.generate(), 'data2'),
        new TestEvent(aggregateId, 3, EntityId.generate(), 'data3'),
      ];

      await cqrsBus.publishEvents(events);

      expect(handledEvents).toHaveLength(3);
      expect(handledEvents).toEqual(events);
    });

    it('应该在未初始化时拒绝发布事件', async () => {
      const aggregateId = EntityId.generate();
      const event = new TestEvent(aggregateId, 1, EntityId.generate(), 'test-data');

      await expect(cqrsBus.publishEvent(event)).rejects.toThrow(
        'CQRS Bus is not initialized. Call initialize() first.'
      );
    });
  });

  describe('关闭操作', () => {
    it('应该能够关闭总线', async () => {
      await cqrsBus.initialize();
      expect(cqrsBus.isInitialized).toBe(true);

      await cqrsBus.shutdown();
      expect(cqrsBus.isInitialized).toBe(false);
    });

    it('应该防止在未初始化时关闭', async () => {
      await expect(cqrsBus.shutdown()).rejects.toThrow(
        'CQRS Bus is not initialized'
      );
    });
  });

  describe('健康检查', () => {
    it('应该在初始化后返回健康状态', async () => {
      await cqrsBus.initialize();
      const isHealthy = await cqrsBus.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('应该在未初始化时返回不健康状态', async () => {
      const isHealthy = await cqrsBus.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('统计信息', () => {
    it('应该返回正确的统计信息', async () => {
      await cqrsBus.initialize();

      // 注册一些处理器
      commandBus.registerHandler('TestCommand', {
        async execute() {
          return Promise.resolve();
        },
        getSupportedCommandType: () => 'TestCommand',
        supports: () => true,
        validateCommand: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
      });

      queryBus.registerHandler('TestQuery', {
        async execute() {
          return new TestQueryResult([]);
        },
        getSupportedQueryType: () => 'TestQuery',
        supports: () => true,
        validateQuery: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        generateCacheKey: () => 'test',
        getCacheExpiration: () => 300,
      });

      eventBus.registerHandler('TestEvent', {
        async handle() {
          return Promise.resolve();
        },
        getSupportedEventType: () => 'TestEvent',
        supports: () => true,
        validateEvent: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        getMaxRetries: () => 3,
        getRetryDelay: () => 1000,
        async shouldIgnore() {
          return false;
        },
        async handleFailure() {
          // 测试用的空处理函数
        },
        async isEventProcessed() {
          return false;
        },
        async markEventAsProcessed() {
          // 测试用的空处理函数
        },
      });

      const stats = cqrsBus.getStatistics();

      expect(stats.commandBus.registeredHandlers).toBe(1);
      expect(stats.queryBus.registeredHandlers).toBe(1);
      expect(stats.eventBus.registeredHandlers).toBe(1);
      expect(stats.overall.totalHandlers).toBe(3);
      expect(stats.overall.isInitialized).toBe(true);
    });
  });

  describe('支持检查', () => {
    it('应该能够检查命令支持', async () => {
      await cqrsBus.initialize();

      commandBus.registerHandler('TestCommand', {
        async execute() {
          return Promise.resolve();
        },
        getSupportedCommandType: () => 'TestCommand',
        supports: (type) => type === 'TestCommand',
        validateCommand: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
      });

      expect(cqrsBus.supportsCommand('TestCommand')).toBe(true);
      expect(cqrsBus.supportsCommand('NonExistentCommand')).toBe(false);
    });

    it('应该能够检查查询支持', async () => {
      await cqrsBus.initialize();

      queryBus.registerHandler('TestQuery', {
        async execute() {
          return new TestQueryResult([]);
        },
        getSupportedQueryType: () => 'TestQuery',
        supports: (type) => type === 'TestQuery',
        validateQuery: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        generateCacheKey: () => 'test',
        getCacheExpiration: () => 300,
      });

      expect(cqrsBus.supportsQuery('TestQuery')).toBe(true);
      expect(cqrsBus.supportsQuery('NonExistentQuery')).toBe(false);
    });

    it('应该能够检查事件支持', async () => {
      await cqrsBus.initialize();

      eventBus.registerHandler('TestEvent', {
        async handle() {
          return Promise.resolve();
        },
        getSupportedEventType: () => 'TestEvent',
        supports: (type) => type === 'TestEvent',
        validateEvent: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        getMaxRetries: () => 3,
        getRetryDelay: () => 1000,
        async shouldIgnore() {
          return false;
        },
        async handleFailure() {
          // 测试用的空处理函数
        },
        async isEventProcessed() {
          return false;
        },
        async markEventAsProcessed() {
          // 测试用的空处理函数
        },
      });

      expect(cqrsBus.supportsEvent('TestEvent')).toBe(true);
      expect(cqrsBus.supportsEvent('NonExistentEvent')).toBe(false);
    });
  });

  describe('类型获取', () => {
    it('应该能够获取支持的命令类型', async () => {
      await cqrsBus.initialize();

      commandBus.registerHandler('Command1', {
        async execute() {
          return Promise.resolve();
        },
        getSupportedCommandType: () => 'Command1',
        supports: () => true,
        validateCommand: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
      });

      commandBus.registerHandler('Command2', {
        async execute() {
          return Promise.resolve();
        },
        getSupportedCommandType: () => 'Command2',
        supports: () => true,
        validateCommand: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
      });

      const types = cqrsBus.getSupportedCommandTypes();
      expect(types).toContain('Command1');
      expect(types).toContain('Command2');
    });

    it('应该能够获取支持的查询类型', async () => {
      await cqrsBus.initialize();

      queryBus.registerHandler('Query1', {
        async execute() {
          return new TestQueryResult([]);
        },
        getSupportedQueryType: () => 'Query1',
        supports: () => true,
        validateQuery: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        generateCacheKey: () => 'test',
        getCacheExpiration: () => 300,
      });

      const types = cqrsBus.getSupportedQueryTypes();
      expect(types).toContain('Query1');
    });

    it('应该能够获取支持的事件类型', async () => {
      await cqrsBus.initialize();

      eventBus.registerHandler('Event1', {
        async handle() {
          return Promise.resolve();
        },
        getSupportedEventType: () => 'Event1',
        supports: () => true,
        validateEvent: () => {
          // 测试用的空验证函数
        },
        getPriority: () => 0,
        async canHandle() {
          return true;
        },
        getMaxRetries: () => 3,
        getRetryDelay: () => 1000,
        async shouldIgnore() {
          return false;
        },
        async handleFailure() {
          // 测试用的空处理函数
        },
        async isEventProcessed() {
          return false;
        },
        async markEventAsProcessed() {
          // 测试用的空处理函数
        },
      });

      const types = cqrsBus.getSupportedEventTypes();
      expect(types).toContain('Event1');
    });
  });
});
