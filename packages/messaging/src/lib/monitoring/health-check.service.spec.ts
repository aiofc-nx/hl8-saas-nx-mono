import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from './health-check.service';
import { MessagingMonitor } from './messaging-monitor.service';
import { MessagingService } from '../messaging.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let monitorService: jest.Mocked<MessagingMonitor>;
  let messagingService: jest.Mocked<MessagingService>;
  let tenantContextService: jest.Mocked<TenantContextService>;

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
        HealthCheckService,
        {
          provide: MessagingMonitor,
          useValue: mockMonitorService,
        },
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

    service = module.get<HealthCheckService>(HealthCheckService);
    monitorService = module.get(MessagingMonitor);
    messagingService = module.get(MessagingService);
    tenantContextService = module.get(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic health check', () => {
    it('should perform basic health check', async () => {
      messagingService.isConnected.mockReturnValue(true);
      tenantContextService.getContext = jest.fn().mockReturnValue({
        tenantId: 'test-tenant',
        userId: 'test-user',
        requestId: 'test-request'
      });
      monitorService.healthCheck.mockResolvedValue('healthy' as any);

      const result = await service.performHealthChecks();

      expect(result).toBeDefined();
      expect(messagingService.isConnected).toHaveBeenCalled();
      expect(tenantContextService.getContext).toHaveBeenCalled();
      expect(monitorService.healthCheck).toHaveBeenCalled();
    });
  });
});
