import { Test, TestingModule } from '@nestjs/testing';
import { MessagingStatsService } from './messaging-stats.service';
import { MessagingMonitor } from './messaging-monitor.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';

describe('MessagingStatsService', () => {
  let service: MessagingStatsService;
  let monitorService: jest.Mocked<MessagingMonitor>;

  beforeEach(async () => {
    const mockMonitorService = {
      getConnectionStats: jest.fn(),
      getMessageStats: jest.fn(),
      getQueueStats: jest.fn(),
      getTopicStats: jest.fn(),
      getThroughputStats: jest.fn(),
      getLatencyStats: jest.fn(),
      getErrorStats: jest.fn(),
      getTenantStats: jest.fn(),
      healthCheck: jest.fn(),
      recordMessageSent: jest.fn(),
      recordMessageReceived: jest.fn(),
      recordLatency: jest.fn(),
      recordError: jest.fn(),
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
        MessagingStatsService,
        {
          provide: MessagingMonitor,
          useValue: mockMonitorService,
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

    service = module.get<MessagingStatsService>(MessagingStatsService);
    monitorService = module.get(MessagingMonitor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic stats', () => {
    it('should get performance report', async () => {
      const result = await service.getPerformanceReport();

      expect(result).toBeDefined();
    });

    it('should handle performance report errors', async () => {
      monitorService.getConnectionStats.mockRejectedValue(new Error('Stats error'));

      await expect(service.getPerformanceReport()).rejects.toThrow('Stats error');
    });
  });
});
