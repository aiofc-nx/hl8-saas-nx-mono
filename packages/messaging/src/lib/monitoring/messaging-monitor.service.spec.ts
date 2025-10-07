import { Test, TestingModule } from '@nestjs/testing';
import { MessagingMonitor } from './messaging-monitor.service';
import { MessagingService } from '../messaging.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';

describe('MessagingMonitor', () => {
  let service: MessagingMonitor;

  beforeEach(async () => {
    const mockMessagingService = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      cancelConsumer: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      createQueue: jest.fn(),
      deleteQueue: jest.fn(),
      purgeQueue: jest.fn(),
      getQueueInfo: jest.fn(),
      isConnected: jest.fn(),
    };

    const mockTenantContextService = {
      getTenant: jest.fn(),
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

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      log: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      isLevelEnabled: jest.fn(),
      child: jest.fn(),
      bindings: jest.fn(),
      flush: jest.fn(),
      level: 'info',
      silent: jest.fn(),
    } as unknown as jest.Mocked<PinoLogger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingMonitor,
        {
          provide: MessagingService,
          useValue: mockMessagingService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<MessagingMonitor>(MessagingMonitor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic monitoring', () => {
    it('should get connection stats', async () => {
      const result = await service.getConnectionStats();

      expect(result).toBeDefined();
    });

    it('should get message stats', async () => {
      const result = await service.getMessageStats();

      expect(result).toBeDefined();
    });

    it('should get queue stats', async () => {
      const result = await service.getQueueStats('test-queue');

      expect(result).toBeDefined();
    });

    it('should get topic stats', async () => {
      const result = await service.getTopicStats('test-topic');

      expect(result).toBeDefined();
    });

    it('should get throughput stats', async () => {
      const result = await service.getThroughputStats();

      expect(result).toBeDefined();
    });

    it('should get latency stats', async () => {
      const result = await service.getLatencyStats();

      expect(result).toBeDefined();
    });

    it('should get error stats', async () => {
      const result = await service.getErrorStats();

      expect(result).toBeDefined();
    });

    it('should get tenant stats', async () => {
      const result = await service.getTenantStats('tenant-1');

      expect(result).toBeDefined();
    });

    it('should perform health check', async () => {
      const result = await service.healthCheck();

      expect(result).toBeDefined();
    });
  });
});
