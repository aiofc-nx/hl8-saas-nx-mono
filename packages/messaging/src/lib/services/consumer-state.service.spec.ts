import { Test, TestingModule } from '@nestjs/testing';
import { ConsumerStateService } from './consumer-state.service';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';

describe('ConsumerStateService', () => {
  let service: ConsumerStateService;
  let cacheService: jest.Mocked<CacheService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let tenantIsolationService: jest.Mocked<TenantIsolationService>;

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
        ConsumerStateService,
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
            enableConsumerStateCache: true,
            cacheTTL: {
              consumerState: 3600,
            },
            keyPrefix: 'hl8:messaging:consumer:',
          },
        },
      ],
    }).compile();

    service = module.get<ConsumerStateService>(ConsumerStateService);
    cacheService = module.get(CacheService);
    tenantContextService = module.get(TenantContextService);
    tenantIsolationService = module.get(TenantIsolationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createConsumerState', () => {
    it('should create new consumer state', async () => {
      const consumerId = 'consumer-123';
      const queueName = 'test-queue';
      cacheService.set.mockResolvedValue(undefined);

      const result = await service.createConsumerState(consumerId, queueName);

      expect(result.consumerId).toBe(consumerId);
      expect(result.queueName).toBe(queueName);
      expect(result.status).toBe('active');
      expect(result.tenantId).toBe('tenant-123');
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('getConsumerState', () => {
    it('should return consumer state if exists', async () => {
      const consumerId = 'consumer-123';
      const mockState = {
        consumerId,
        queueName: 'test-queue',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'tenant-123',
        totalProcessedMessages: 5,
      };
      cacheService.get.mockResolvedValue(mockState);

      const result = await service.getConsumerState(consumerId);

      expect(result).toEqual(mockState);
    });

    it('should return null if state does not exist', async () => {
      const consumerId = 'consumer-123';
      cacheService.get.mockResolvedValue(null);

      const result = await service.getConsumerState(consumerId);

      expect(result).toBeNull();
    });
  });

  describe('updateProcessedState', () => {
    it('should update processed state for existing consumer', async () => {
      const consumerId = 'consumer-123';
      const queueName = 'test-queue';
      const messageId = 'msg-456';
      const existingState = {
        consumerId,
        queueName,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'tenant-123',
        totalProcessedMessages: 5,
      };

      cacheService.get.mockResolvedValue(existingState);
      cacheService.set.mockResolvedValue(undefined);

      await service.updateProcessedState(consumerId, queueName, messageId);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('hl8:messaging:consumer:'),
        expect.objectContaining({
          lastProcessedMessageId: messageId,
          totalProcessedMessages: 6,
          status: 'active',
        }),
        3600
      );
    });

    it('should create new state if consumer does not exist', async () => {
      const consumerId = 'consumer-123';
      const queueName = 'test-queue';
      const messageId = 'msg-456';

      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue(undefined);

      await service.updateProcessedState(consumerId, queueName, messageId);

      // 应该调用两次set：一次创建状态，一次更新状态
      expect(cacheService.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateErrorState', () => {
    it('should update error state', async () => {
      const consumerId = 'consumer-123';
      const errorMessage = 'Processing failed';
      const existingState = {
        consumerId,
        queueName: 'test-queue',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'tenant-123',
      };

      cacheService.get.mockResolvedValue(existingState);
      cacheService.set.mockResolvedValue(undefined);

      await service.updateErrorState(consumerId, errorMessage);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('hl8:messaging:consumer:'),
        expect.objectContaining({
          lastError: errorMessage,
          status: 'error',
        }),
        3600
      );
    });
  });

  describe('updateConsumerStatus', () => {
    it('should update consumer status', async () => {
      const consumerId = 'consumer-123';
      const newStatus = 'paused' as const;
      const existingState = {
        consumerId,
        queueName: 'test-queue',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'tenant-123',
      };

      cacheService.get.mockResolvedValue(existingState);
      cacheService.set.mockResolvedValue(undefined);

      await service.updateConsumerStatus(consumerId, newStatus);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('hl8:messaging:consumer:'),
        expect.objectContaining({
          status: newStatus,
        }),
        3600
      );
    });
  });

  describe('deleteConsumerState', () => {
    it('should delete consumer state', async () => {
      const consumerId = 'consumer-123';
      cacheService.delete.mockResolvedValue(undefined);

      await service.deleteConsumerState(consumerId);

      expect(cacheService.delete).toHaveBeenCalledWith(
        expect.stringContaining('hl8:messaging:consumer:')
      );
    });
  });
});
