import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';
import {
  MessagingModuleOptions,
  MessagingAdapterType,
  MESSAGING_MODULE_OPTIONS,
  IMessagingAdapter,
} from './types/messaging.types';

describe('MessagingService', () => {
  let service: MessagingService;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let tenantIsolationService: jest.Mocked<TenantIsolationService>;
  let mockAdapter: jest.Mocked<IMessagingAdapter>;
  let mockLogger: PinoLogger;

  beforeEach(async () => {
    // 创建模拟的适配器
    mockAdapter = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      getConnectionInfo: jest.fn().mockReturnValue({
        connected: true,
        connectedAt: new Date(),
      }),
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      cancelConsumer: jest.fn(),
      createQueue: jest.fn(),
      deleteQueue: jest.fn(),
      purgeQueue: jest.fn(),
      getQueueInfo: jest.fn().mockResolvedValue({
        name: 'test-queue',
        messageCount: 0,
        consumerCount: 0,
        durable: true,
        exclusive: false,
        autoDelete: false,
      }),
      getAdapterType: jest.fn().mockReturnValue(MessagingAdapterType.MEMORY),
      getAdapterInfo: jest.fn().mockReturnValue({
        type: MessagingAdapterType.MEMORY,
        name: 'Memory',
        version: '1.0.0',
        description: 'Memory adapter',
        config: {},
        status: 'healthy' as unknown,
      }),
    };

    // 创建模拟的租户上下文服务
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

    // 创建模拟的租户隔离服务
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

    // 创建模拟的日志服务
    mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    } as unknown as PinoLogger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: TenantIsolationService,
          useValue: mockTenantIsolationService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: MESSAGING_MODULE_OPTIONS,
          useValue: {
            adapter: MessagingAdapterType.MEMORY,
            enableTenantIsolation: true,
            keyPrefix: 'test:',
          } as MessagingModuleOptions,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    tenantContextService = module.get(TenantContextService);
    tenantIsolationService = module.get(TenantIsolationService);
    mockLogger = module.get(PinoLogger);

    // 设置默认适配器
    (service as unknown).defaultAdapter = mockAdapter;
    (service as unknown).adapters.set(MessagingAdapterType.MEMORY, mockAdapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should publish message with tenant context', async () => {
      const topic = 'user.created';
      const message = { userId: 'user-123' };

      await service.publish(topic, message);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        topic,
        'tenant-123'
      );
      expect(mockAdapter.publish).toHaveBeenCalledWith(
        'tenant:tenant-123:user.created',
        message,
        undefined
      );
    });

    it('should publish message without tenant context', async () => {
      tenantContextService.getTenant.mockReturnValue(null);

      const topic = 'user.created';
      const message = { userId: 'user-123' };

      await service.publish(topic, message);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).not.toHaveBeenCalled();
      expect(mockAdapter.publish).toHaveBeenCalledWith(
        topic,
        message,
        undefined
      );
    });

    it('should handle publish errors', async () => {
      mockAdapter.publish.mockRejectedValue(new Error('Publish failed'));

      const topic = 'user.created';
      const message = { userId: 'user-123' };

      await expect(service.publish(topic, message)).rejects.toThrow(
        'Publish failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should subscribe to topic with tenant context', async () => {
      const topic = 'user.created';
      const handler = jest.fn();

      await service.subscribe(topic, handler);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        topic,
        'tenant-123'
      );
      expect(mockAdapter.subscribe).toHaveBeenCalledWith(
        'tenant:tenant-123:user.created',
        handler
      );
    });

    it('should handle subscribe errors', async () => {
      mockAdapter.subscribe.mockRejectedValue(new Error('Subscribe failed'));

      const topic = 'user.created';
      const handler = jest.fn();

      await expect(service.subscribe(topic, handler)).rejects.toThrow(
        'Subscribe failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendToQueue', () => {
    it('should send message to queue with tenant context', async () => {
      const queue = 'email.queue';
      const message = { to: 'user@example.com' };

      await service.sendToQueue(queue, message);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        queue,
        'tenant-123'
      );
      expect(mockAdapter.sendToQueue).toHaveBeenCalledWith(
        'tenant:tenant-123:email.queue',
        message,
        undefined
      );
    });

    it('should handle sendToQueue errors', async () => {
      mockAdapter.sendToQueue.mockRejectedValue(new Error('Send failed'));

      const queue = 'email.queue';
      const message = { to: 'user@example.com' };

      await expect(service.sendToQueue(queue, message)).rejects.toThrow(
        'Send failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('consume', () => {
    it('should consume from queue with tenant context', async () => {
      const queue = 'email.queue';
      const handler = jest.fn();

      await service.consume(queue, handler);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        queue,
        'tenant-123'
      );
      expect(mockAdapter.consume).toHaveBeenCalledWith(
        'tenant:tenant-123:email.queue',
        handler
      );
    });

    it('should handle consume errors', async () => {
      mockAdapter.consume.mockRejectedValue(new Error('Consume failed'));

      const queue = 'email.queue';
      const handler = jest.fn();

      await expect(service.consume(queue, handler)).rejects.toThrow(
        'Consume failed'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('connection management', () => {
    it('should connect to messaging service', async () => {
      await service.connect();

      expect(mockAdapter.connect).toHaveBeenCalled();
    });

    it('should disconnect from messaging service', async () => {
      await service.disconnect();

      expect(mockAdapter.disconnect).toHaveBeenCalled();
    });

    it('should check connection status', () => {
      const isConnected = service.isConnected();

      expect(isConnected).toBe(true);
      expect(mockAdapter.isConnected).toHaveBeenCalled();
    });

    it('should get connection info', () => {
      const connectionInfo = service.getConnectionInfo();

      expect(connectionInfo).toEqual({
        connected: true,
        connectedAt: expect.any(Date),
      });
      expect(mockAdapter.getConnectionInfo).toHaveBeenCalled();
    });
  });

  describe('queue management', () => {
    it('should create queue with tenant context', async () => {
      const queue = 'test.queue';

      await service.createQueue(queue);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        queue,
        'tenant-123'
      );
      expect(mockAdapter.createQueue).toHaveBeenCalledWith(
        'tenant:tenant-123:test.queue',
        undefined
      );
    });

    it('should delete queue with tenant context', async () => {
      const queue = 'test.queue';

      await service.deleteQueue(queue);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        queue,
        'tenant-123'
      );
      expect(mockAdapter.deleteQueue).toHaveBeenCalledWith(
        'tenant:tenant-123:test.queue'
      );
    });

    it('should purge queue with tenant context', async () => {
      const queue = 'test.queue';

      await service.purgeQueue(queue);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        queue,
        'tenant-123'
      );
      expect(mockAdapter.purgeQueue).toHaveBeenCalledWith(
        'tenant:tenant-123:test.queue'
      );
    });

    it('should get queue info with tenant context', async () => {
      const queue = 'test.queue';

      await service.getQueueInfo(queue);

      expect(tenantContextService.getTenant).toHaveBeenCalled();
      expect(tenantIsolationService.getTenantKey).toHaveBeenCalledWith(
        queue,
        'tenant-123'
      );
      expect(mockAdapter.getQueueInfo).toHaveBeenCalledWith(
        'tenant:tenant-123:test.queue'
      );
    });
  });

  describe('tenant context', () => {
    it('should get current tenant', () => {
      const tenant = service.getCurrentTenant();

      expect(tenant).toBe('tenant-123');
      expect(tenantContextService.getTenant).toHaveBeenCalled();
    });

    it('should check tenant context', () => {
      const hasContext = service.hasTenantContext();

      expect(hasContext).toBe(true);
      expect(tenantContextService.getTenant).toHaveBeenCalled();
    });

    it('should return false when no tenant context', () => {
      tenantContextService.getTenant.mockReturnValue(null);

      const hasContext = service.hasTenantContext();

      expect(hasContext).toBe(false);
    });
  });
});
