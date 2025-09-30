import { Test, TestingModule } from '@nestjs/testing';
import { MessagingModule } from './messaging.module';
import { MessagingService } from './messaging.service';
import { MessageDeduplicationService } from './services/message-deduplication.service';
import { ConsumerStateService } from './services/consumer-state.service';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';

/**
 * 缓存集成测试
 *
 * @description 验证消息队列模块与缓存模块的集成是否正常工作
 */
describe('MessagingCacheIntegration', () => {
  let messagingService: MessagingService;
  let deduplicationService: MessageDeduplicationService;
  let consumerStateService: ConsumerStateService;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      mdelete: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      keys: jest.fn(),
      clearTenantCache: jest.fn(),
      getCurrentTenant: jest.fn(),
      hasTenantContext: jest.fn(),
      updateTenantStats: jest.fn(),
      getHealthStatus: jest.fn(),
    };

    const mockTenantContextService = {
      getTenant: jest.fn().mockReturnValue('test-tenant'),
      setTenant: jest.fn(),
      getUser: jest.fn(),
      setUser: jest.fn(),
      setRequestId: jest.fn(),
      getRequestId: jest.fn(),
      setContext: jest.fn(),
      getContext: jest.fn(),
      deleteContext: jest.fn(),
      hasContext: jest.fn(),
      getAllContext: jest.fn(),
      clear: jest.fn(),
      runWithContext: jest.fn(),
      runWithTenant: jest.fn(),
      runWithUser: jest.fn(),
      hasUserContext: jest.fn(),
      hasRequestContext: jest.fn(),
      getContextSummary: jest.fn(),
      validateContext: jest.fn(),
    };

    const mockTenantIsolationService = {
      getTenantKey: jest
        .fn()
        .mockImplementation((key: string, tenantId: string) => {
          return Promise.resolve(`tenant:${tenantId}:${key}`);
        }),
      getTenantKeys: jest.fn(),
      getCurrentTenant: jest.fn(),
      clearTenantCache: jest.fn(),
      getTenantStats: jest.fn(),
      listTenantKeys: jest.fn(),
      getTenantNamespace: jest.fn(),
      isolateData: jest.fn(),
      extractTenantData: jest.fn(),
      validateTenantAccess: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MessagingModule.forRoot({
          adapter: 'memory', // 使用内存适配器进行测试
          cache: {
            enableMessageDeduplication: true,
            enableConsumerStateCache: true,
            cacheTTL: {
              messageDedup: 300,
              consumerState: 3600,
            },
            keyPrefix: 'test:messaging:cache:',
          },
        }),
      ],
      providers: [
        { provide: CacheService, useValue: mockCacheService },
        { provide: TenantContextService, useValue: mockTenantContextService },
        {
          provide: TenantIsolationService,
          useValue: mockTenantIsolationService,
        },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    messagingService = module.get<MessagingService>(MessagingService);
    deduplicationService = module.get<MessageDeduplicationService>(
      MessageDeduplicationService
    );
    consumerStateService =
      module.get<ConsumerStateService>(ConsumerStateService);
    cacheService = module.get(CacheService);
  });

  describe('缓存服务注入', () => {
    it('应该正确注入缓存服务', () => {
      expect(messagingService).toBeDefined();
      expect(deduplicationService).toBeDefined();
      expect(consumerStateService).toBeDefined();
      expect(cacheService).toBeDefined();
    });
  });

  describe('消息去重功能', () => {
    it('应该检测重复消息', async () => {
      const message = { id: 'msg-123', content: 'test message' };

      // 第一次检查 - 不是重复消息
      cacheService.get.mockResolvedValueOnce(null);
      const firstCheck = await deduplicationService.isDuplicate(message);
      expect(firstCheck).toBe(false);

      // 标记为已处理
      cacheService.set.mockResolvedValue(undefined);
      await deduplicationService.markAsProcessed(message);

      // 第二次检查 - 是重复消息
      cacheService.get.mockResolvedValueOnce(true);
      const secondCheck = await deduplicationService.isDuplicate(message);
      expect(secondCheck).toBe(true);
    });

    it('应该支持批量去重检查', async () => {
      const messages = [
        { id: 'msg-1', content: 'message 1' },
        { id: 'msg-2', content: 'message 2' },
        { id: 'msg-1', content: 'message 1' }, // 重复
      ];

      cacheService.get
        .mockResolvedValueOnce(null) // msg-1 first time
        .mockResolvedValueOnce(null) // msg-2
        .mockResolvedValueOnce(true); // msg-1 second time (duplicate)

      const duplicateIndexes = await deduplicationService.checkBatchDuplicate(
        messages
      );

      expect(duplicateIndexes).toEqual([2]);
    });
  });

  describe('消费者状态管理', () => {
    it('应该创建和管理消费者状态', async () => {
      const consumerId = 'consumer-123';
      const queueName = 'test-queue';

      // 创建消费者状态
      cacheService.set.mockResolvedValue(undefined);
      const state = await consumerStateService.createConsumerState(
        consumerId,
        queueName
      );

      expect(state.consumerId).toBe(consumerId);
      expect(state.queueName).toBe(queueName);
      expect(state.status).toBe('active');

      // 获取消费者状态
      cacheService.get.mockResolvedValue(state);
      const retrievedState = await consumerStateService.getConsumerState(
        consumerId
      );

      expect(retrievedState).toEqual(state);
    });

    it('应该更新处理状态', async () => {
      const consumerId = 'consumer-123';
      const queueName = 'test-queue';
      const messageId = 'msg-456';

      const existingState = {
        consumerId,
        queueName,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'test-tenant',
        totalProcessedMessages: 5,
      };

      cacheService.get.mockResolvedValue(existingState);
      cacheService.set.mockResolvedValue(undefined);

      await consumerStateService.updateProcessedState(
        consumerId,
        queueName,
        messageId
      );

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('test:messaging:cache:'),
        expect.objectContaining({
          lastProcessedMessageId: messageId,
          totalProcessedMessages: 6,
        }),
        3600
      );
    });

    it('应该更新错误状态', async () => {
      const consumerId = 'consumer-123';
      const errorMessage = 'Processing failed';

      const existingState = {
        consumerId,
        queueName: 'test-queue',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'test-tenant',
      };

      cacheService.get.mockResolvedValue(existingState);
      cacheService.set.mockResolvedValue(undefined);

      await consumerStateService.updateErrorState(consumerId, errorMessage);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('test:messaging:cache:'),
        expect.objectContaining({
          lastError: errorMessage,
          status: 'error',
        }),
        3600
      );
    });
  });

  describe('租户隔离', () => {
    it('应该为不同租户生成不同的缓存键', async () => {
      const message = { id: 'msg-123', content: 'test message' };

      // 模拟租户A
      cacheService.get.mockResolvedValue(null);
      await deduplicationService.isDuplicate(message);

      // 验证缓存键包含租户信息
      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('tenant:test-tenant:')
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理缓存服务错误', async () => {
      const message = { id: 'msg-123', content: 'test message' };
      cacheService.get.mockRejectedValue(new Error('Cache service error'));

      // 去重检查失败时应该返回false（安全策略）
      const result = await deduplicationService.isDuplicate(message);
      expect(result).toBe(false);
    });

    it('应该处理消费者状态错误', async () => {
      const consumerId = 'consumer-123';
      const _queueName = 'test-queue';
      cacheService.get.mockRejectedValue(new Error('Cache service error'));

      const result = await consumerStateService.getConsumerState(consumerId);
      expect(result).toBeNull();
    });
  });
});
