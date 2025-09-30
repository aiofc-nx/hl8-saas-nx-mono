import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { MessagingMonitor } from './messaging-monitor.service';
import { MessageStats, ErrorStats } from '../types/messaging.types';

/**
 * 消息队列统计服务
 *
 * 提供消息队列的详细统计信息和分析功能
 *
 * @description 统计服务提供消息队列的详细统计和分析
 * 包括性能分析、趋势分析、异常检测等功能
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class StatsController {
 *   constructor(private readonly statsService: MessagingStatsService) {}
 *
 *   @Get('performance')
 *   async getPerformanceReport(): Promise<PerformanceReport> {
 *     return await this.statsService.getPerformanceReport();
 *   }
 * }
 * ```
 */
@Injectable()
export class MessagingStatsService {
  constructor(
    private readonly monitor: MessagingMonitor,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'messaging-stats-service' });
  }

  /**
   * 获取性能报告
   *
   * @description 生成消息队列的性能分析报告
   *
   * @returns 性能报告
   */
  async getPerformanceReport(): Promise<Record<string, unknown>> {
    try {
      const [messageStats, throughputStats, latencyStats, errorStats] =
        await Promise.all([
          this.monitor.getMessageStats(),
          this.monitor.getThroughputStats(),
          this.monitor.getLatencyStats(),
          this.monitor.getErrorStats(),
        ]);

      return {
        summary: {
          totalMessages: messageStats.totalMessages,
          successRate: this.calculateSuccessRate(messageStats),
          averageProcessingTime: messageStats.averageProcessingTime,
          errorRate: errorStats.errorRate,
        },
        performance: {
          throughput: throughputStats,
          latency: latencyStats,
        },
        errors: errorStats,
        recommendations: this.generateRecommendations(messageStats, errorStats),
      };
    } catch (error) {
      this.logger.error('获取性能报告失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 计算成功率
   *
   * @description 计算消息处理的成功率
   *
   * @param messageStats 消息统计
   * @returns 成功率
   *
   * @private
   */
  private calculateSuccessRate(messageStats: MessageStats): number {
    const totalProcessed =
      messageStats.processedMessages + messageStats.failedMessages;
    return totalProcessed > 0
      ? messageStats.processedMessages / totalProcessed
      : 0;
  }

  /**
   * 生成建议
   *
   * @description 根据统计信息生成优化建议
   *
   * @param messageStats 消息统计
   * @param errorStats 错误统计
   * @returns 建议数组
   *
   * @private
   */
  private generateRecommendations(
    messageStats: MessageStats,
    errorStats: ErrorStats
  ): string[] {
    const recommendations: string[] = [];

    if (errorStats.errorRate > 0.1) {
      recommendations.push('错误率过高，建议检查消息处理逻辑');
    }

    if (messageStats.averageProcessingTime > 5000) {
      recommendations.push('平均处理时间过长，建议优化处理逻辑');
    }

    if (messageStats.retriedMessages > messageStats.processedMessages * 0.2) {
      recommendations.push('重试消息过多，建议检查消息格式和网络连接');
    }

    return recommendations;
  }
}
