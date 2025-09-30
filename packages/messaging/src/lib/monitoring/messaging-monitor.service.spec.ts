import { Test, TestingModule } from '@nestjs/testing';
import { MessagingMonitor } from './messaging-monitor.service';
import { MessagingService } from '../messaging.service';
import { TenantContextService } from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';
import {
  MessagingStats,
  TenantMessagingStats,
  QueueStats,
  TopicStats,
  ThroughputStats,
  LatencyStats,
  ErrorStats,
} from '../types/messaging.types';

describe('MessagingMonitor', () => {
  let service: MessagingMonitor;
  let messagingService: jest.Mocked<MessagingService>;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let logger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    const mockMessagingService = {
      getConnectionStats: jest.fn(),
      getAdapterStats: jest.fn(),
      getMessageStats: jest.fn(),
      getQueueStats: jest.fn(),
      getTopicStats: jest.fn(),
      getThroughputStats: jest.fn(),
      getLatencyStats: jest.fn(),
      getErrorStats: jest.fn(),
      getTenantStats: jest.fn(),
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
    messagingService = module.get(MessagingService);
    tenantContextService = module.get(TenantContextService);
    logger = module.get(PinoLogger);
  });

  describe('getConnectionStats', () => {
    it('should return connection stats', async () => {
      const mockStats = {
        isConnected: true,
        adapterType: 'memory',
        connectionCount: 1,
        lastConnectedAt: new Date(),
        reconnectCount: 0,
      };

      messagingService.getConnectionStats.mockResolvedValue(mockStats);

      const result = await service.getConnectionStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getConnectionStats).toHaveBeenCalledTimes(1);
    });

    it('should handle connection stats errors', async () => {
      const error = new Error('Connection failed');
      messagingService.getConnectionStats.mockRejectedValue(error);

      await expect(service.getConnectionStats()).rejects.toThrow('Connection failed');
    });
  });

  describe('getAdapterStats', () => {
    it('should return adapter stats', async () => {
      const mockStats = {
        adapterType: 'memory',
        version: '1.0.0',
        uptime: 3600000,
        memoryUsage: {
          used: 1024,
          total: 8192,
        },
        connectionPool: {
          active: 5,
          idle: 10,
          total: 15,
        },
      };

      messagingService.getAdapterStats.mockResolvedValue(mockStats);

      const result = await service.getAdapterStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getAdapterStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMessageStats', () => {
    it('should return message stats', async () => {
      const mockStats: MessagingStats = {
        totalMessages: 1000,
        messagesPerSecond: 10,
        averageMessageSize: 1024,
        totalBytes: 1024000,
        messagesByType: {
          event: 500,
          task: 300,
          notification: 200,
        },
        messagesByStatus: {
          published: 800,
          consumed: 750,
          failed: 50,
        },
        lastMessageAt: new Date(),
        lastMessageType: 'event',
        messageRate: {
          published: 10,
          consumed: 9,
          failed: 1,
        },
      };

      messagingService.getMessageStats.mockResolvedValue(mockStats);

      const result = await service.getMessageStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getMessageStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue stats', async () => {
      const mockStats: QueueStats = {
        totalQueues: 5,
        activeQueues: 3,
        totalMessages: 100,
        averageQueueSize: 20,
        largestQueue: 'user-queue',
        largestQueueSize: 50,
        queueStats: {
          'user-queue': {
            messageCount: 50,
            consumerCount: 2,
            averageProcessingTime: 100,
            lastMessageAt: new Date(),
          },
          'order-queue': {
            messageCount: 30,
            consumerCount: 1,
            averageProcessingTime: 200,
            lastMessageAt: new Date(),
          },
        },
      };

      messagingService.getQueueStats.mockResolvedValue(mockStats);

      const result = await service.getQueueStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getQueueStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTopicStats', () => {
    it('should return topic stats', async () => {
      const mockStats: TopicStats = {
        totalTopics: 10,
        activeTopics: 8,
        totalSubscribers: 15,
        averageSubscribersPerTopic: 1.5,
        mostPopularTopic: 'user-events',
        mostPopularTopicSubscribers: 5,
        topicStats: {
          'user-events': {
            subscriberCount: 5,
            messageCount: 100,
            lastMessageAt: new Date(),
          },
          'order-events': {
            subscriberCount: 3,
            messageCount: 80,
            lastMessageAt: new Date(),
          },
        },
      };

      messagingService.getTopicStats.mockResolvedValue(mockStats);

      const result = await service.getTopicStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getTopicStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getThroughputStats', () => {
    it('should return throughput stats', async () => {
      const mockStats: ThroughputStats = {
        messagesPerSecond: 100,
        bytesPerSecond: 102400,
        peakThroughput: {
          messagesPerSecond: 200,
          bytesPerSecond: 204800,
          timestamp: new Date(),
        },
        averageThroughput: {
          messagesPerSecond: 80,
          bytesPerSecond: 81920,
        },
        throughputByHour: {
          '2024-01-01T00:00:00Z': {
            messagesPerSecond: 50,
            bytesPerSecond: 51200,
          },
          '2024-01-01T01:00:00Z': {
            messagesPerSecond: 75,
            bytesPerSecond: 76800,
          },
        },
      };

      messagingService.getThroughputStats.mockResolvedValue(mockStats);

      const result = await service.getThroughputStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getThroughputStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLatencyStats', () => {
    it('should return latency stats', async () => {
      const mockStats: LatencyStats = {
        averageLatency: 50,
        minLatency: 10,
        maxLatency: 200,
        p95Latency: 80,
        p99Latency: 150,
        latencyByType: {
          event: 45,
          task: 60,
          notification: 40,
        },
        latencyByQueue: {
          'user-queue': 50,
          'order-queue': 70,
        },
        latencyByTopic: {
          'user-events': 45,
          'order-events': 55,
        },
      };

      messagingService.getLatencyStats.mockResolvedValue(mockStats);

      const result = await service.getLatencyStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getLatencyStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getErrorStats', () => {
    it('should return error stats', async () => {
      const mockStats: ErrorStats = {
        totalErrors: 25,
        errorsPerSecond: 0.5,
        errorRate: 0.025,
        errorsByType: {
          connection: 10,
          timeout: 8,
          validation: 5,
          processing: 2,
        },
        errorsByQueue: {
          'user-queue': 15,
          'order-queue': 10,
        },
        errorsByTopic: {
          'user-events': 12,
          'order-events': 13,
        },
        lastErrorAt: new Date(),
        lastErrorType: 'connection',
        errorTrend: {
          '2024-01-01T00:00:00Z': 5,
          '2024-01-01T01:00:00Z': 3,
        },
      };

      messagingService.getErrorStats.mockResolvedValue(mockStats);

      const result = await service.getErrorStats();

      expect(result).toEqual(mockStats);
      expect(messagingService.getErrorStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTenantStats', () => {
    it('should return tenant stats', async () => {
      const mockStats: TenantMessagingStats = {
        tenantId: 'tenant-1',
        totalMessages: 500,
        messagesPerSecond: 5,
        totalBytes: 512000,
        messagesByType: {
          event: 300,
          task: 150,
          notification: 50,
        },
        messagesByStatus: {
          published: 450,
          consumed: 400,
          failed: 50,
        },
        queueStats: {
          'user-queue': {
            messageCount: 200,
            consumerCount: 2,
            averageProcessingTime: 100,
            lastMessageAt: new Date(),
          },
        },
        topicStats: {
          'user-events': {
            subscriberCount: 3,
            messageCount: 150,
            lastMessageAt: new Date(),
          },
        },
        lastActivityAt: new Date(),
        errorCount: 5,
        errorRate: 0.01,
      };

      messagingService.getTenantStats.mockResolvedValue(mockStats);

      const result = await service.getTenantStats('tenant-1');

      expect(result).toEqual(mockStats);
      expect(messagingService.getTenantStats).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status', async () => {
      const mockHealth = {
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
      };

      messagingService.checkHealth.mockResolvedValue(mockHealth);

      const result = await service.checkHealth();

      expect(result).toEqual(mockHealth);
      expect(messagingService.checkHealth).toHaveBeenCalledTimes(1);
    });

    it('should handle health check errors', async () => {
      const error = new Error('Health check failed');
      messagingService.checkHealth.mockRejectedValue(error);

      await expect(service.checkHealth()).rejects.toThrow('Health check failed');
    });
  });

  describe('recordMessage', () => {
    it('should record message metrics', () => {
      service.recordMessage('event', 1024, 'tenant-1');

      // Verify that the method doesn't throw
      expect(true).toBe(true);
    });

    it('should record message with different types', () => {
      service.recordMessage('task', 2048, 'tenant-2');
      service.recordMessage('notification', 512, 'tenant-3');

      // Verify that the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('recordLatency', () => {
    it('should record latency metrics', () => {
      service.recordLatency('event', 50, 'tenant-1');

      // Verify that the method doesn't throw
      expect(true).toBe(true);
    });

    it('should record latency for different types', () => {
      service.recordLatency('task', 100, 'tenant-2');
      service.recordLatency('notification', 30, 'tenant-3');

      // Verify that the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('recordError', () => {
    it('should record error metrics', () => {
      const error = new Error('Test error');
      service.recordError('connection', error, 'tenant-1');

      // Verify that the method doesn't throw
      expect(true).toBe(true);
    });

    it('should record error for different types', () => {
      const error1 = new Error('Timeout error');
      const error2 = new Error('Validation error');

      service.recordError('timeout', error1, 'tenant-2');
      service.recordError('validation', error2, 'tenant-3');

      // Verify that the method doesn't throw
      expect(true).toBe(true);
    });
  });
});
