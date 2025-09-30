import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { TenantContextService } from '@hl8/multi-tenancy';
import { MessagingService } from '../messaging.service';
import {
  IMessagingMonitor,
  MessagingAdapterType,
  ConnectionStats,
  AdapterStats,
  MessageStats,
  QueueStats,
  TopicStats,
  ThroughputStats,
  LatencyStats,
  ErrorStats,
  TenantMessagingStats,
  HealthStatus,
} from '../types/messaging.types';

/**
 * 消息队列监控服务
 *
 * 集成@hl8/multi-tenancy的消息队列监控服务，提供完整的监控统计和健康检查功能。
 *
 * @description 此服务提供消息队列的全面监控能力。
 * 包括连接监控、消息统计、性能监控、租户监控等。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 监控功能规则
 * - 支持连接状态监控
 * - 支持消息统计监控
 * - 支持性能指标监控
 * - 支持错误统计监控
 *
 * ### 租户监控规则
 * - 支持租户级别的监控统计
 * - 支持租户级别的性能分析
 * - 支持租户级别的健康检查
 * - 支持租户级别的告警管理
 *
 * ### 健康检查规则
 * - 支持适配器健康检查
 * - 支持连接健康检查
 * - 支持队列健康检查
 * - 支持整体健康评估
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class HealthController {
 *   constructor(private readonly messagingMonitor: MessagingMonitor) {}
 * 
 *   @Get('health')
 *   async getHealth(): Promise<HealthStatus> {
 *     return await this.messagingMonitor.healthCheck();
 *   }
 * 
 *   @Get('stats')
 *   async getStats(): Promise<MessageStats> {
 *     return await this.messagingMonitor.getMessageStats();
 *   }
 * }
 * ```
 */
@Injectable()
export class MessagingMonitor implements IMessagingMonitor {
  private stats: {
    messages: MessageStats;
    connections: ConnectionStats;
    adapters: Map<MessagingAdapterType, AdapterStats>;
    queues: Map<string, QueueStats>;
    topics: Map<string, TopicStats>;
    throughput: ThroughputStats;
    latency: LatencyStats;
    errors: ErrorStats;
    tenants: Map<string, TenantMessagingStats>;
  } = {
    messages: {
      totalMessages: 0,
      sentMessages: 0,
      receivedMessages: 0,
      processedMessages: 0,
      failedMessages: 0,
      retriedMessages: 0,
      deadLetterMessages: 0,
      throughput: 0,
      averageProcessingTime: 0,
    },
    connections: {
      connectionCount: 0,
      activeConnectionCount: 0,
      totalConnectionTime: 0,
      averageConnectionTime: 0,
      connectionErrorCount: 0,
    },
    adapters: new Map(),
    queues: new Map(),
    topics: new Map(),
    throughput: {
      messageThroughput: 0,
      byteThroughput: 0,
      peakMessageThroughput: 0,
      peakByteThroughput: 0,
      averageMessageThroughput: 0,
      averageByteThroughput: 0,
    },
    latency: {
      averageLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      latencyDistribution: {},
    },
    errors: {
      totalErrors: 0,
      connectionErrors: 0,
      sendErrors: 0,
      receiveErrors: 0,
      processingErrors: 0,
      timeoutErrors: 0,
      errorTypeDistribution: {},
      errorRate: 0,
    },
    tenants: new Map(),
  };

  constructor(
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'messaging-monitor' });
    this.initializeStats();
  }

  /**
   * 获取连接统计
   *
   * @description 获取消息队列连接统计信息
   *
   * @returns 连接统计
   */
  async getConnectionStats(): Promise<ConnectionStats> {
    try {
      const connectionInfo = this.messagingService.getConnectionInfo();

      this.stats.connections = {
        ...this.stats.connections,
        activeConnectionCount: connectionInfo.connected ? 1 : 0,
        lastConnectedAt: connectionInfo.connectedAt,
        lastDisconnectedAt: connectionInfo.disconnectedAt,
      };

      return this.stats.connections;
    } catch (error) {
      this.logger.error('获取连接统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取适配器统计
   *
   * @description 获取指定适配器的统计信息
   *
   * @param adapterType 适配器类型
   * @returns 适配器统计
   */
  async getAdapterStats(
    adapterType: MessagingAdapterType
  ): Promise<AdapterStats> {
    try {
      let adapterStats = this.stats.adapters.get(adapterType);

      if (!adapterStats) {
        adapterStats = {
          adapterType,
          connected: this.messagingService.isConnected(),
          messagesSent: 0,
          messagesReceived: 0,
          sendErrorCount: 0,
          receiveErrorCount: 0,
          queueCount: 0,
          topicCount: 0,
          consumerCount: 0,
          producerCount: 0,
        };
        this.stats.adapters.set(adapterType, adapterStats);
      }

      return adapterStats;
    } catch (error) {
      this.logger.error('获取适配器统计失败', {
        adapterType,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取消息统计
   *
   * @description 获取消息处理统计信息
   *
   * @returns 消息统计
   */
  async getMessageStats(): Promise<MessageStats> {
    try {
      return this.stats.messages;
    } catch (error) {
      this.logger.error('获取消息统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取队列统计
   *
   * @description 获取指定队列的统计信息
   *
   * @param queueName 队列名称
   * @returns 队列统计
   */
  async getQueueStats(queueName: string): Promise<QueueStats> {
    try {
      let queueStats = this.stats.queues.get(queueName);

      if (!queueStats) {
        queueStats = {
          queueName,
          messageCount: 0,
          consumerCount: 0,
          processingRate: 0,
          averageProcessingTime: 0,
          errorCount: 0,
          retryCount: 0,
        };
        this.stats.queues.set(queueName, queueStats);
      }

      return queueStats;
    } catch (error) {
      this.logger.error('获取队列统计失败', {
        queueName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取主题统计
   *
   * @description 获取指定主题的统计信息
   *
   * @param topicName 主题名称
   * @returns 主题统计
   */
  async getTopicStats(topicName: string): Promise<TopicStats> {
    try {
      let topicStats = this.stats.topics.get(topicName);

      if (!topicStats) {
        topicStats = {
          topicName,
          partitionCount: 1,
          messageCount: 0,
          consumerCount: 0,
          processingRate: 0,
          averageProcessingTime: 0,
          errorCount: 0,
        };
        this.stats.topics.set(topicName, topicStats);
      }

      return topicStats;
    } catch (error) {
      this.logger.error('获取主题统计失败', {
        topicName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取吞吐量统计
   *
   * @description 获取消息吞吐量统计信息
   *
   * @returns 吞吐量统计
   */
  async getThroughputStats(): Promise<ThroughputStats> {
    try {
      return this.stats.throughput;
    } catch (error) {
      this.logger.error('获取吞吐量统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取延迟统计
   *
   * @description 获取消息延迟统计信息
   *
   * @returns 延迟统计
   */
  async getLatencyStats(): Promise<LatencyStats> {
    try {
      return this.stats.latency;
    } catch (error) {
      this.logger.error('获取延迟统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取错误统计
   *
   * @description 获取错误统计信息
   *
   * @returns 错误统计
   */
  async getErrorStats(): Promise<ErrorStats> {
    try {
      return this.stats.errors;
    } catch (error) {
      this.logger.error('获取错误统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取租户统计
   *
   * @description 获取指定租户的消息统计信息
   *
   * @param tenantId 租户ID
   * @returns 租户统计
   */
  async getTenantStats(tenantId: string): Promise<TenantMessagingStats> {
    try {
      let tenantStats = this.stats.tenants.get(tenantId);

      if (!tenantStats) {
        tenantStats = {
          tenantId,
          messageCount: 0,
          queueCount: 0,
          topicCount: 0,
          consumerCount: 0,
          producerCount: 0,
          throughput: 0,
          averageProcessingTime: 0,
          errorCount: 0,
          retryCount: 0,
          deadLetterCount: 0,
        };
        this.stats.tenants.set(tenantId, tenantStats);
      }

      return tenantStats;
    } catch (error) {
      this.logger.error('获取租户统计失败', {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取所有租户统计
   *
   * @description 获取所有租户的消息统计信息
   *
   * @returns 租户统计映射
   */
  async getAllTenantStats(): Promise<Map<string, TenantMessagingStats>> {
    try {
      return new Map(this.stats.tenants);
    } catch (error) {
      this.logger.error('获取所有租户统计失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 健康检查
   *
   * @description 检查消息队列服务的健康状态
   *
   * @returns 健康状态
   */
  async healthCheck(): Promise<HealthStatus> {
    try {
      const isConnected = this.messagingService.isConnected();
      const _hasTenantContext = this.tenantContextService.getTenant() !== null;

      if (!isConnected) {
        return HealthStatus.UNHEALTHY;
      }

      if (this.stats.errors.errorRate > 0.1) {
        // 错误率超过10%
        return HealthStatus.DEGRADED;
      }

      return HealthStatus.HEALTHY;
    } catch (error) {
      this.logger.error('健康检查失败', {
        error: (error as Error).message,
      });
      return HealthStatus.UNHEALTHY;
    }
  }

  /**
   * 适配器健康检查
   *
   * @description 检查指定适配器的健康状态
   *
   * @param adapterType 适配器类型
   * @returns 健康状态
   */
  async adapterHealthCheck(
    adapterType: MessagingAdapterType
  ): Promise<HealthStatus> {
    try {
      const adapterStats = await this.getAdapterStats(adapterType);

      if (!adapterStats.connected) {
        return HealthStatus.UNHEALTHY;
      }

      if (
        adapterStats.sendErrorCount > 0 ||
        adapterStats.receiveErrorCount > 0
      ) {
        return HealthStatus.DEGRADED;
      }

      return HealthStatus.HEALTHY;
    } catch (error) {
      this.logger.error('适配器健康检查失败', {
        adapterType,
        error: (error as Error).message,
      });
      return HealthStatus.UNHEALTHY;
    }
  }

  /**
   * 记录消息发送
   *
   * @description 记录消息发送统计
   *
   * @param adapterType 适配器类型
   * @param tenantId 租户ID
   *
   * @internal
   */
  recordMessageSent(
    adapterType: MessagingAdapterType,
    tenantId?: string
  ): void {
    this.stats.messages.sentMessages++;
    this.stats.messages.totalMessages++;

    const adapterStats = this.stats.adapters.get(adapterType);
    if (adapterStats) {
      adapterStats.messagesSent++;
    }

    if (tenantId) {
      const tenantStats = this.stats.tenants.get(tenantId);
      if (tenantStats) {
        tenantStats.messageCount++;
      }
    }
  }

  /**
   * 记录消息接收
   *
   * @description 记录消息接收统计
   *
   * @param adapterType 适配器类型
   * @param tenantId 租户ID
   *
   * @internal
   */
  recordMessageReceived(
    adapterType: MessagingAdapterType,
    tenantId?: string
  ): void {
    this.stats.messages.receivedMessages++;

    const adapterStats = this.stats.adapters.get(adapterType);
    if (adapterStats) {
      adapterStats.messagesReceived++;
    }

    if (tenantId) {
      const tenantStats = this.stats.tenants.get(tenantId);
      if (tenantStats) {
        tenantStats.messageCount++;
      }
    }
  }

  /**
   * 记录消息处理成功
   *
   * @description 记录消息处理成功统计
   *
   * @param processingTime 处理时间（毫秒）
   * @param tenantId 租户ID
   *
   * @internal
   */
  recordMessageProcessed(processingTime: number, tenantId?: string): void {
    this.stats.messages.processedMessages++;

    // 更新平均处理时间
    const totalProcessed = this.stats.messages.processedMessages;
    this.stats.messages.averageProcessingTime =
      (this.stats.messages.averageProcessingTime * (totalProcessed - 1) +
        processingTime) /
      totalProcessed;

    // 更新延迟统计
    this.updateLatencyStats(processingTime);

    if (tenantId) {
      const tenantStats = this.stats.tenants.get(tenantId);
      if (tenantStats) {
        tenantStats.averageProcessingTime =
          (tenantStats.averageProcessingTime * (tenantStats.messageCount - 1) +
            processingTime) /
          tenantStats.messageCount;
      }
    }
  }

  /**
   * 记录消息处理失败
   *
   * @description 记录消息处理失败统计
   *
   * @param error 错误信息
   * @param tenantId 租户ID
   *
   * @internal
   */
  recordMessageFailed(error: Error, tenantId?: string): void {
    this.stats.messages.failedMessages++;
    this.stats.errors.totalErrors++;
    this.stats.errors.processingErrors++;

    // 更新错误类型分布
    const errorType = error.constructor.name;
    this.stats.errors.errorTypeDistribution[errorType] =
      (this.stats.errors.errorTypeDistribution[errorType] || 0) + 1;

    // 更新错误率
    this.updateErrorRate();

    if (tenantId) {
      const tenantStats = this.stats.tenants.get(tenantId);
      if (tenantStats) {
        tenantStats.errorCount++;
      }
    }
  }

  /**
   * 初始化统计信息
   *
   * @description 初始化监控统计信息
   *
   * @private
   */
  private initializeStats(): void {
    // 启动定期统计更新
    setInterval(() => {
      this.updateThroughputStats();
    }, 60000); // 每分钟更新一次
  }

  /**
   * 更新延迟统计
   *
   * @description 更新延迟统计信息
   *
   * @param latency 延迟时间（毫秒）
   *
   * @private
   */
  private updateLatencyStats(latency: number): void {
    if (
      this.stats.latency.minLatency === 0 ||
      latency < this.stats.latency.minLatency
    ) {
      this.stats.latency.minLatency = latency;
    }

    if (latency > this.stats.latency.maxLatency) {
      this.stats.latency.maxLatency = latency;
    }

    // 更新平均延迟
    const totalMessages = this.stats.messages.processedMessages;
    this.stats.latency.averageLatency =
      (this.stats.latency.averageLatency * (totalMessages - 1) + latency) /
      totalMessages;
  }

  /**
   * 更新吞吐量统计
   *
   * @description 更新吞吐量统计信息
   *
   * @private
   */
  private updateThroughputStats(): void {
    const now = Date.now();
    const _oneMinuteAgo = now - 60000;

    // 这里应该从实际的消息记录中计算吞吐量
    // 简化实现，使用当前统计
    this.stats.throughput.messageThroughput = this.stats.messages.sentMessages;
    this.stats.throughput.averageMessageThroughput =
      this.stats.messages.sentMessages;

    if (
      this.stats.throughput.messageThroughput >
      this.stats.throughput.peakMessageThroughput
    ) {
      this.stats.throughput.peakMessageThroughput =
        this.stats.throughput.messageThroughput;
    }
  }

  /**
   * 更新错误率
   *
   * @description 更新错误率统计
   *
   * @private
   */
  private updateErrorRate(): void {
    const totalOperations =
      this.stats.messages.sentMessages + this.stats.messages.receivedMessages;
    this.stats.errors.errorRate =
      totalOperations > 0 ? this.stats.errors.totalErrors / totalOperations : 0;
  }
}
