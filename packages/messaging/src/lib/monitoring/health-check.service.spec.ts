import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from './health-check.service';
import { MessagingMonitor } from './messaging-monitor.service';
import { MessagingService } from '../messaging.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';
import {
  HealthCheck,
  HealthStatus,
  ConnectionHealthCheck,
  TenantContextHealthCheck,
  MessagingQueueHealthCheck,
  MonitoringHealthCheck,
} from '../types/messaging.types';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let monitorService: jest.Mocked<MessagingMonitor>;
  let messagingService: jest.Mocked<MessagingService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let logger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const mockMonitorService = {
      getMessageStats: jest.fn(),
      getQueueStats: jest.fn(),
      getTopicStats: jest.fn(),
      getThroughputStats: jest.fn(),
      getLatencyStats: jest.fn(),
      getErrorStats: jest.fn(),
      getTenantStats: jest.fn(),
      getConnectionStats: jest.fn(),
      getAdapterStats: jest.fn(),
      checkHealth: jest.fn(),
      recordMessage: jest.fn(),
      recordLatency: jest.fn(),
      recordError: jest.fn(),
    };

    const mockMessagingService = {
      isConnected: jest.fn(),
      getConnectionStats: jest.fn(),
      getAdapterStats: jest.fn(),
      getMessageStats: jest.fn(),
      getQueueStats: jest.fn(),
      getTopicStats: jest.fn(),
      getThroughputStats: jest.fn(),
      getLatencyStats: jest.fn(),
      getErrorStats: jest.fn(),
      getTenantStats: jest.fn(),
      checkHealth: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn(),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      createQueue: jest.fn(),
      deleteQueue: jest.fn(),
      purgeQueue: jest.fn(),
      getQueueInfo: jest.fn(),
      getCurrentTenant: jest.fn(),
      hasTenantContext: jest.fn(),
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
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

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
    logger = module.get(PinoLogger);
  });

  describe('checkHealth', () => {
    it('should return healthy status when all checks pass', async () => {
      const mockConnectionCheck: ConnectionHealthCheck = {
        status: HealthStatus.HEALTHY,
        message: 'Connection is healthy',
        timestamp: new Date(),
        details: {
          isConnected: true,
          adapterType: 'memory',
          connectionCount: 1,
          lastConnectedAt: new Date(),
          reconnectCount: 0,
        },
      };

      const mockTenantContextCheck: TenantContextHealthCheck = {
        status: HealthStatus.HEALTHY,
        message: 'Tenant context is available',
        timestamp: new Date(),
        details: {
          hasTenantContext: true,
          currentTenant: 'tenant-1',
          contextValid: true,
        },
      };

      const mockMessagingQueueCheck: MessagingQueueHealthCheck = {
        status: HealthStatus.HEALTHY,
        message: 'Messaging queue is healthy',
        timestamp: new Date(),
        details: {
          totalQueues: 5,
          activeQueues: 3,
          totalMessages: 100,
          averageQueueSize: 20,
          largestQueue: 'user-queue',
          largestQueueSize: 50,
        },
      };

      const mockMonitoringCheck: MonitoringHealthCheck = {
        status: HealthStatus.HEALTHY,
        message: 'Monitoring is active',
        timestamp: new Date(),
        details: {
          monitoringActive: true,
          lastHealthCheck: new Date(),
          healthCheckInterval: 30000,
        },
      };

      messagingService.isConnected.mockResolvedValue(true);
      messagingService.getConnectionStats.mockResolvedValue({
        isConnected: true,
        adapterType: 'memory',
        connectionCount: 1,
        lastConnectedAt: new Date(),
        reconnectCount: 0,
      });

      tenantContextService.hasContext.mockReturnValue(true);
      tenantContextService.getTenant.mockReturnValue('tenant-1');

      messagingService.getQueueStats.mockResolvedValue({
        totalQueues: 5,
        activeQueues: 3,
        totalMessages: 100,
        averageQueueSize: 20,
        largestQueue: 'user-queue',
        largestQueueSize: 50,
        queueStats: {},
      });

      monitorService.checkHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        checks: {
          connection: { status: 'healthy', message: 'Connected' },
          messaging: { status: 'healthy', message: 'Working' },
          monitoring: { status: 'healthy', message: 'Monitoring active' },
        },
        summary: {
          totalChecks: 3,
          passedChecks: 3,
          failedChecks: 0,
        },
      });

      const result = await service.checkHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.timestamp).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.checks.connection).toBeDefined();
      expect(result.checks.tenantContext).toBeDefined();
      expect(result.checks.messagingQueue).toBeDefined();
      expect(result.checks.monitoring).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalChecks).toBe(4);
      expect(result.summary.passedChecks).toBe(4);
      expect(result.summary.failedChecks).toBe(0);
    });

    it('should return unhealthy status when connection fails', async () => {
      messagingService.isConnected.mockResolvedValue(false);
      messagingService.getConnectionStats.mockResolvedValue({
        isConnected: false,
        adapterType: 'memory',
        connectionCount: 0,
        lastConnectedAt: new Date(),
        reconnectCount: 5,
      });

      tenantContextService.hasContext.mockReturnValue(true);
      tenantContextService.getTenant.mockReturnValue('tenant-1');

      messagingService.getQueueStats.mockResolvedValue({
        totalQueues: 0,
        activeQueues: 0,
        totalMessages: 0,
        averageQueueSize: 0,
        largestQueue: '',
        largestQueueSize: 0,
        queueStats: {},
      });

      monitorService.checkHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        checks: {
          connection: { status: 'healthy', message: 'Connected' },
          messaging: { status: 'healthy', message: 'Working' },
          monitoring: { status: 'healthy', message: 'Monitoring active' },
        },
        summary: {
          totalChecks: 3,
          passedChecks: 3,
          failedChecks: 0,
        },
      });

      const result = await service.checkHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.checks.connection.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.summary.failedChecks).toBe(1);
    });

    it('should return unhealthy status when tenant context fails', async () => {
      messagingService.isConnected.mockResolvedValue(true);
      messagingService.getConnectionStats.mockResolvedValue({
        isConnected: true,
        adapterType: 'memory',
        connectionCount: 1,
        lastConnectedAt: new Date(),
        reconnectCount: 0,
      });

      tenantContextService.hasContext.mockReturnValue(false);
      tenantContextService.getTenant.mockReturnValue(null);

      messagingService.getQueueStats.mockResolvedValue({
        totalQueues: 5,
        activeQueues: 3,
        totalMessages: 100,
        averageQueueSize: 20,
        largestQueue: 'user-queue',
        largestQueueSize: 50,
        queueStats: {},
      });

      monitorService.checkHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        checks: {
          connection: { status: 'healthy', message: 'Connected' },
          messaging: { status: 'healthy', message: 'Working' },
          monitoring: { status: 'healthy', message: 'Monitoring active' },
        },
        summary: {
          totalChecks: 3,
          passedChecks: 3,
          failedChecks: 0,
        },
      });

      const result = await service.checkHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.checks.tenantContext.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.summary.failedChecks).toBe(1);
    });

    it('should return unhealthy status when messaging queue fails', async () => {
      messagingService.isConnected.mockResolvedValue(true);
      messagingService.getConnectionStats.mockResolvedValue({
        isConnected: true,
        adapterType: 'memory',
        connectionCount: 1,
        lastConnectedAt: new Date(),
        reconnectCount: 0,
      });

      tenantContextService.hasContext.mockReturnValue(true);
      tenantContextService.getTenant.mockReturnValue('tenant-1');

      messagingService.getQueueStats.mockRejectedValue(
        new Error('Queue service unavailable')
      );

      monitorService.checkHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        checks: {
          connection: { status: 'healthy', message: 'Connected' },
          messaging: { status: 'healthy', message: 'Working' },
          monitoring: { status: 'healthy', message: 'Monitoring active' },
        },
        summary: {
          totalChecks: 3,
          passedChecks: 3,
          failedChecks: 0,
        },
      });

      const result = await service.checkHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.checks.messagingQueue.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.summary.failedChecks).toBe(1);
    });

    it('should return unhealthy status when monitoring fails', async () => {
      messagingService.isConnected.mockResolvedValue(true);
      messagingService.getConnectionStats.mockResolvedValue({
        isConnected: true,
        adapterType: 'memory',
        connectionCount: 1,
        lastConnectedAt: new Date(),
        reconnectCount: 0,
      });

      tenantContextService.hasContext.mockReturnValue(true);
      tenantContextService.getTenant.mockReturnValue('tenant-1');

      messagingService.getQueueStats.mockResolvedValue({
        totalQueues: 5,
        activeQueues: 3,
        totalMessages: 100,
        averageQueueSize: 20,
        largestQueue: 'user-queue',
        largestQueueSize: 50,
        queueStats: {},
      });

      monitorService.checkHealth.mockRejectedValue(
        new Error('Monitoring service unavailable')
      );

      const result = await service.checkHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.checks.monitoring.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.summary.failedChecks).toBe(1);
    });

    it('should handle errors during health check', async () => {
      messagingService.isConnected.mockRejectedValue(
        new Error('Connection check failed')
      );

      await expect(service.checkHealth()).rejects.toThrow(
        'Connection check failed'
      );
    });
  });

  describe('checkConnection', () => {
    it('should return healthy connection status', async () => {
      messagingService.isConnected.mockResolvedValue(true);
      messagingService.getConnectionStats.mockResolvedValue({
        isConnected: true,
        adapterType: 'memory',
        connectionCount: 1,
        lastConnectedAt: new Date(),
        reconnectCount: 0,
      });

      const result = await service.checkConnection();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('healthy');
      expect(result.details).toBeDefined();
      expect(result.details.isConnected).toBe(true);
      expect(result.details.adapterType).toBe('memory');
    });

    it('should return unhealthy connection status', async () => {
      messagingService.isConnected.mockResolvedValue(false);
      messagingService.getConnectionStats.mockResolvedValue({
        isConnected: false,
        adapterType: 'memory',
        connectionCount: 0,
        lastConnectedAt: new Date(),
        reconnectCount: 5,
      });

      const result = await service.checkConnection();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('unhealthy');
      expect(result.details).toBeDefined();
      expect(result.details.isConnected).toBe(false);
      expect(result.details.reconnectCount).toBe(5);
    });

    it('should handle connection check errors', async () => {
      messagingService.isConnected.mockRejectedValue(
        new Error('Connection failed')
      );

      await expect(service.checkConnection()).rejects.toThrow(
        'Connection failed'
      );
    });
  });

  describe('checkTenantContext', () => {
    it('should return healthy tenant context status', async () => {
      tenantContextService.hasContext.mockReturnValue(true);
      tenantContextService.getTenant.mockReturnValue('tenant-1');

      const result = await service.checkTenantContext();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('available');
      expect(result.details).toBeDefined();
      expect(result.details.hasTenantContext).toBe(true);
      expect(result.details.currentTenant).toBe('tenant-1');
    });

    it('should return unhealthy tenant context status', async () => {
      tenantContextService.hasContext.mockReturnValue(false);
      tenantContextService.getTenant.mockReturnValue(null);

      const result = await service.checkTenantContext();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('unavailable');
      expect(result.details).toBeDefined();
      expect(result.details.hasTenantContext).toBe(false);
      expect(result.details.currentTenant).toBe(null);
    });
  });

  describe('checkMessagingQueue', () => {
    it('should return healthy messaging queue status', async () => {
      messagingService.getQueueStats.mockResolvedValue({
        totalQueues: 5,
        activeQueues: 3,
        totalMessages: 100,
        averageQueueSize: 20,
        largestQueue: 'user-queue',
        largestQueueSize: 50,
        queueStats: {},
      });

      const result = await service.checkMessagingQueue();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('healthy');
      expect(result.details).toBeDefined();
      expect(result.details.totalQueues).toBe(5);
      expect(result.details.activeQueues).toBe(3);
    });

    it('should return unhealthy messaging queue status', async () => {
      messagingService.getQueueStats.mockRejectedValue(
        new Error('Queue service unavailable')
      );

      const result = await service.checkMessagingQueue();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('unhealthy');
      expect(result.details).toBeDefined();
    });
  });

  describe('checkMonitoring', () => {
    it('should return healthy monitoring status', async () => {
      monitorService.checkHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        checks: {
          connection: { status: 'healthy', message: 'Connected' },
          messaging: { status: 'healthy', message: 'Working' },
          monitoring: { status: 'healthy', message: 'Monitoring active' },
        },
        summary: {
          totalChecks: 3,
          passedChecks: 3,
          failedChecks: 0,
        },
      });

      const result = await service.checkMonitoring();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toContain('active');
      expect(result.details).toBeDefined();
      expect(result.details.monitoringActive).toBe(true);
    });

    it('should return unhealthy monitoring status', async () => {
      monitorService.checkHealth.mockRejectedValue(
        new Error('Monitoring service unavailable')
      );

      const result = await service.checkMonitoring();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toContain('unhealthy');
      expect(result.details).toBeDefined();
      expect(result.details.monitoringActive).toBe(false);
    });
  });
});
