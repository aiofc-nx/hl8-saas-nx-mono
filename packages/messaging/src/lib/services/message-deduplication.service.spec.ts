import { Test, TestingModule } from '@nestjs/testing';
import { MessageDeduplicationService } from './message-deduplication.service';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';

describe('MessageDeduplicationService', () => {
  let service: MessageDeduplicationService;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const mockTenantContextService = {
      getTenant: jest.fn().mockReturnValue('tenant-123'),
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
      providers: [
        MessageDeduplicationService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: TenantContextService, useValue: mockTenantContextService },
        {
          provide: TenantIsolationService,
          useValue: mockTenantIsolationService,
        },
        { provide: PinoLogger, useValue: mockLogger },
        {
          provide: 'MessagingCacheConfig',
          useValue: {
            enableMessageDeduplication: true,
            cacheTTL: {
              messageDedup: 300,
            },
            keyPrefix: 'hl8:messaging:dedup:',
          },
        },
      ],
    }).compile();

    service = module.get<MessageDeduplicationService>(
      MessageDeduplicationService
    );
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isDuplicate', () => {
    it('should return false for new message', async () => {
      const message = { id: 'msg-123', content: 'test message' };
      cacheService.get.mockResolvedValue(null);

      const result = await service.isDuplicate(message);

      expect(result).toBe(false);
      expect(cacheService.get).toHaveBeenCalled();
    });

    it('should return true for duplicate message', async () => {
      const message = { id: 'msg-123', content: 'test message' };
      cacheService.get.mockResolvedValue(true);

      const result = await service.isDuplicate(message);

      expect(result).toBe(true);
      expect(cacheService.get).toHaveBeenCalled();
    });
  });

  describe('markAsProcessed', () => {
    it('should mark message as processed', async () => {
      const message = { id: 'msg-123', content: 'test message' };
      cacheService.set.mockResolvedValue(undefined);

      await service.markAsProcessed(message);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('hl8:messaging:dedup:'),
        true,
        300
      );
    });
  });

  describe('checkBatchDuplicate', () => {
    it('should identify duplicate messages in batch', async () => {
      const messages = [
        { id: 'msg-1', content: 'message 1' },
        { id: 'msg-2', content: 'message 2' },
        { id: 'msg-1', content: 'message 1' }, // 重复
      ];

      // 模拟第一个消息是新的，第三个是重复的
      cacheService.get
        .mockResolvedValueOnce(null) // msg-1 first time
        .mockResolvedValueOnce(null) // msg-2
        .mockResolvedValueOnce(true); // msg-1 second time (duplicate)

      const result = await service.checkBatchDuplicate(messages);

      expect(result).toEqual([2]); // 第三个消息（索引2）是重复的
    });
  });
});
