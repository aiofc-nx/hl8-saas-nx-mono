import { Test, TestingModule } from '@nestjs/testing';
import { MessagingStatsService } from './messaging-stats.service';
import { MessagingMonitor } from './messaging-monitor.service';
import { PinoLogger } from '@hl8/logger';
import {
  MessagingStats,
  TenantMessagingStats,
  QueueStats,
  TopicStats,
  ThroughputStats,
  LatencyStats,
  ErrorStats,
  PerformanceReport,
  StatsSummary,
  StatsTimeWindow,
} from '../types/messaging.types';

describe('MessagingStatsService', () => {
  let service: MessagingStatsService;
  let monitorService: jest.Mocked<MessagingMonitor>;
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

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingStatsService,
        {
          provide: MessagingMonitor,
          useValue: mockMonitorService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<MessagingStatsService>(MessagingStatsService);
    monitorService = module.get(MessagingMonitor);
    logger = module.get(PinoLogger);
  });

  describe('generatePerformanceReport', () => {
    it('should generate performance report', async () => {
      const mockMessageStats: MessagingStats = {
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

      const mockQueueStats: QueueStats = {
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
        },
      };

      const mockThroughputStats: ThroughputStats = {
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
        throughputByHour: {},
      };

      const mockLatencyStats: LatencyStats = {
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
        },
        latencyByTopic: {
          'user-events': 45,
        },
      };

      const mockErrorStats: ErrorStats = {
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
        },
        errorsByTopic: {
          'user-events': 12,
        },
        lastErrorAt: new Date(),
        lastErrorType: 'connection',
        errorTrend: {},
      };

      monitorService.getMessageStats.mockResolvedValue(mockMessageStats);
      monitorService.getQueueStats.mockResolvedValue(mockQueueStats);
      monitorService.getThroughputStats.mockResolvedValue(mockThroughputStats);
      monitorService.getLatencyStats.mockResolvedValue(mockLatencyStats);
      monitorService.getErrorStats.mockResolvedValue(mockErrorStats);

      const result = await service.generatePerformanceReport();

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.throughput).toBeDefined();
      expect(result.latency).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.queues).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.generatedAt).toBeDefined();

      expect(monitorService.getMessageStats).toHaveBeenCalledTimes(1);
      expect(monitorService.getQueueStats).toHaveBeenCalledTimes(1);
      expect(monitorService.getThroughputStats).toHaveBeenCalledTimes(1);
      expect(monitorService.getLatencyStats).toHaveBeenCalledTimes(1);
      expect(monitorService.getErrorStats).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during report generation', async () => {
      const error = new Error('Failed to get stats');
      monitorService.getMessageStats.mockRejectedValue(error);

      await expect(service.generatePerformanceReport()).rejects.toThrow(
        'Failed to get stats'
      );
    });
  });

  describe('calculateSuccessRate', () => {
    it('should calculate success rate correctly', () => {
      const stats: MessagingStats = {
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

      const result = service.calculateSuccessRate(stats);

      expect(result).toBe(0.95); // 750 consumed / 800 published
    });

    it('should handle zero published messages', () => {
      const stats: MessagingStats = {
        totalMessages: 0,
        messagesPerSecond: 0,
        averageMessageSize: 0,
        totalBytes: 0,
        messagesByType: {},
        messagesByStatus: {
          published: 0,
          consumed: 0,
          failed: 0,
        },
        lastMessageAt: new Date(),
        lastMessageType: 'event',
        messageRate: {
          published: 0,
          consumed: 0,
          failed: 0,
        },
      };

      const result = service.calculateSuccessRate(stats);

      expect(result).toBe(0);
    });

    it('should handle all messages failed', () => {
      const stats: MessagingStats = {
        totalMessages: 100,
        messagesPerSecond: 1,
        averageMessageSize: 1024,
        totalBytes: 102400,
        messagesByType: {
          event: 100,
        },
        messagesByStatus: {
          published: 100,
          consumed: 0,
          failed: 100,
        },
        lastMessageAt: new Date(),
        lastMessageType: 'event',
        messageRate: {
          published: 1,
          consumed: 0,
          failed: 1,
        },
      };

      const result = service.calculateSuccessRate(stats);

      expect(result).toBe(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for high error rate', () => {
      const stats: MessagingStats = {
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
          consumed: 400,
          failed: 400,
        },
        lastMessageAt: new Date(),
        lastMessageType: 'event',
        messageRate: {
          published: 10,
          consumed: 5,
          failed: 5,
        },
      };

      const result = service.generateRecommendations(stats);

      expect(result).toContain('error');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for low throughput', () => {
      const stats: MessagingStats = {
        totalMessages: 100,
        messagesPerSecond: 1,
        averageMessageSize: 1024,
        totalBytes: 102400,
        messagesByType: {
          event: 100,
        },
        messagesByStatus: {
          published: 100,
          consumed: 100,
          failed: 0,
        },
        lastMessageAt: new Date(),
        lastMessageType: 'event',
        messageRate: {
          published: 1,
          consumed: 1,
          failed: 0,
        },
      };

      const result = service.generateRecommendations(stats);

      expect(result).toContain('throughput');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for high latency', () => {
      const latencyStats: LatencyStats = {
        averageLatency: 5000,
        minLatency: 100,
        maxLatency: 10000,
        p95Latency: 8000,
        p99Latency: 9500,
        latencyByType: {
          event: 5000,
        },
        latencyByQueue: {
          'user-queue': 5000,
        },
        latencyByTopic: {
          'user-events': 5000,
        },
      };

      const result = service.generateRecommendations(
        {} as MessagingStats,
        {} as QueueStats,
        {} as TopicStats,
        {} as ThroughputStats,
        latencyStats,
        {} as ErrorStats
      );

      expect(result).toContain('latency');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for queue backlog', () => {
      const queueStats: QueueStats = {
        totalQueues: 5,
        activeQueues: 3,
        totalMessages: 10000,
        averageQueueSize: 2000,
        largestQueue: 'user-queue',
        largestQueueSize: 8000,
        queueStats: {
          'user-queue': {
            messageCount: 8000,
            consumerCount: 1,
            averageProcessingTime: 1000,
            lastMessageAt: new Date(),
          },
        },
      };

      const result = service.generateRecommendations(
        {} as MessagingStats,
        queueStats,
        {} as TopicStats,
        {} as ThroughputStats,
        {} as LatencyStats,
        {} as ErrorStats
      );

      expect(result).toContain('queue');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for healthy system', () => {
      const stats: MessagingStats = {
        totalMessages: 1000,
        messagesPerSecond: 100,
        averageMessageSize: 1024,
        totalBytes: 1024000,
        messagesByType: {
          event: 500,
          task: 300,
          notification: 200,
        },
        messagesByStatus: {
          published: 1000,
          consumed: 1000,
          failed: 0,
        },
        lastMessageAt: new Date(),
        lastMessageType: 'event',
        messageRate: {
          published: 100,
          consumed: 100,
          failed: 0,
        },
      };

      const result = service.generateRecommendations(stats);

      expect(result).toContain('healthy');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getStatsSummary', () => {
    it('should return stats summary', async () => {
      const mockMessageStats: MessagingStats = {
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

      const mockQueueStats: QueueStats = {
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
        },
      };

      monitorService.getMessageStats.mockResolvedValue(mockMessageStats);
      monitorService.getQueueStats.mockResolvedValue(mockQueueStats);

      const result = await service.getStatsSummary();

      expect(result).toBeDefined();
      expect(result.totalMessages).toBe(1000);
      expect(result.totalQueues).toBe(5);
      expect(result.successRate).toBe(0.9375); // 750/800
      expect(result.generatedAt).toBeDefined();

      expect(monitorService.getMessageStats).toHaveBeenCalledTimes(1);
      expect(monitorService.getQueueStats).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during summary generation', async () => {
      const error = new Error('Failed to get stats');
      monitorService.getMessageStats.mockRejectedValue(error);

      await expect(service.getStatsSummary()).rejects.toThrow(
        'Failed to get stats'
      );
    });
  });

  describe('getTenantStatsSummary', () => {
    it('should return tenant stats summary', async () => {
      const mockTenantStats: TenantMessagingStats = {
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

      monitorService.getTenantStats.mockResolvedValue(mockTenantStats);

      const result = await service.getTenantStatsSummary('tenant-1');

      expect(result).toBeDefined();
      expect(result.tenantId).toBe('tenant-1');
      expect(result.totalMessages).toBe(500);
      expect(result.successRate).toBe(0.8889); // 400/450
      expect(result.generatedAt).toBeDefined();

      expect(monitorService.getTenantStats).toHaveBeenCalledWith('tenant-1');
    });

    it('should handle errors during tenant summary generation', async () => {
      const error = new Error('Failed to get tenant stats');
      monitorService.getTenantStats.mockRejectedValue(error);

      await expect(service.getTenantStatsSummary('tenant-1')).rejects.toThrow(
        'Failed to get tenant stats'
      );
    });
  });
});
