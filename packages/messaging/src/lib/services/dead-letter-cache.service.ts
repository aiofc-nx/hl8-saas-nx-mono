import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { MessagingCacheConfig } from '../types/messaging.types';

/**
 * 死信队列缓存服务
 *
 * @description 管理失败消息的死信队列缓存，提供消息重试、分析和清理功能
 * 支持租户隔离、TTL管理、统计分析等企业级功能
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MessageProcessor {
 *   constructor(
 *     private readonly deadLetterCache: DeadLetterCacheService
 *   ) {}
 *
 *   async processMessage(message: unknown) {
 *     try {
 *       // 处理消息
 *       await this.handleMessage(message);
 *     } catch (error) {
 *       // 失败时存储到死信队列
 *       await this.deadLetterCache.storeDeadMessage(message, error);
 *     }
 *   }
 * }
 * ```
 */
@Injectable()
export class DeadLetterCacheService {
  private readonly logger = new PinoLogger();
  private readonly cacheTTL: number;
  private readonly keyPrefix: string;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly cacheConfig: MessagingCacheConfig
  ) {
    this.logger.setContext({ requestId: 'dead-letter-cache-service' });
    this.cacheTTL = this.cacheConfig.cacheTTL?.deadLetter || 86400; // 默认24小时
    this.keyPrefix =
      this.cacheConfig.keyPrefix || 'hl8:messaging:cache:dead-letter:';
  }

  /**
   * 存储死信消息
   *
   * @description 将失败的消息存储到死信队列缓存中，包含错误信息和重试信息
   *
   * @param message 原始消息
   * @param error 错误信息
   * @param retryCount 重试次数
   * @param tenantId 租户ID（可选）
   * @returns 存储的键
   */
  async storeDeadMessage(
    message: unknown,
    error: Error,
    retryCount = 0,
    tenantId?: string
  ): Promise<string> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const messageId = this.generateMessageId(message);
      const timestamp = new Date().toISOString();

      const deadLetterData: DeadLetterData = {
        messageId,
        originalMessage: message,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        retryCount,
        tenantId: currentTenantId || undefined,
        timestamp,
        retryable: this.isRetryableError(error),
        nextRetryAt: this.calculateNextRetry(retryCount).toISOString(),
      };

      const cacheKey = await this.generateCacheKey(
        messageId,
        currentTenantId || 'default'
      );
      await this.cacheService.set(cacheKey, deadLetterData, this.cacheTTL);

      // 更新死信队列统计
      await this.updateDeadLetterStats(currentTenantId || 'default', 'stored');

      this.logger.warn('死信消息已存储', {
        messageId,
        tenantId: currentTenantId,
        retryCount,
        error: error.message,
        cacheKey,
      });

      return cacheKey;
    } catch (cacheError) {
      this.logger.error('存储死信消息失败', {
        error: (cacheError as Error).message,
        originalError: error.message,
        message,
      });
      throw cacheError;
    }
  }

  /**
   * 获取死信消息
   *
   * @description 根据消息ID获取死信队列中的消息
   *
   * @param messageId 消息ID
   * @param tenantId 租户ID（可选）
   * @returns 死信消息数据
   */
  async getDeadMessage(
    messageId: string,
    tenantId?: string
  ): Promise<DeadLetterData | null> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const cacheKey = await this.generateCacheKey(
        messageId,
        currentTenantId || 'default'
      );

      const deadLetterData = await this.cacheService.get<DeadLetterData>(
        cacheKey
      );

      if (deadLetterData) {
        this.logger.debug('获取死信消息', {
          messageId,
          tenantId: currentTenantId,
          retryCount: deadLetterData.retryCount,
        });
      }

      return deadLetterData;
    } catch (error) {
      this.logger.error('获取死信消息失败', {
        error: (error as Error).message,
        messageId,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 重试死信消息
   *
   * @description 重新处理死信队列中的消息
   *
   * @param messageId 消息ID
   * @param handler 消息处理器函数
   * @param tenantId 租户ID（可选）
   * @returns 重试结果
   */
  async retryDeadMessage(
    messageId: string,
    handler: (message: unknown) => Promise<void>,
    tenantId?: string
  ): Promise<RetryResult> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const deadLetterData = await this.getDeadMessage(
        messageId,
        currentTenantId || undefined
      );

      if (!deadLetterData) {
        return {
          success: false,
          message: '死信消息不存在',
          messageId,
        };
      }

      if (!deadLetterData.retryable) {
        return {
          success: false,
          message: '消息不可重试',
          messageId,
          retryCount: deadLetterData.retryCount,
        };
      }

      // 检查是否到达重试时间
      const now = new Date();
      const nextRetryAt = new Date(deadLetterData.nextRetryAt);
      if (now < nextRetryAt) {
        return {
          success: false,
          message: '未到达重试时间',
          messageId,
          nextRetryAt: deadLetterData.nextRetryAt,
        };
      }

      // 重试消息处理
      try {
        await handler(deadLetterData.originalMessage);

        // 重试成功，删除死信消息
        await this.removeDeadMessage(messageId, currentTenantId || 'default');

        // 更新统计
        await this.updateDeadLetterStats(
          currentTenantId || 'default',
          'retried_success'
        );

        this.logger.info('死信消息重试成功', {
          messageId,
          tenantId: currentTenantId,
          retryCount: deadLetterData.retryCount,
        });

        return {
          success: true,
          message: '重试成功',
          messageId,
          retryCount: deadLetterData.retryCount,
        };
      } catch (retryError) {
        // 重试失败，更新重试次数
        const newRetryCount = deadLetterData.retryCount + 1;
        const updatedData = {
          ...deadLetterData,
          retryCount: newRetryCount,
          nextRetryAt: this.calculateNextRetry(newRetryCount).toISOString(),
          lastRetryAt: new Date().toISOString(),
          lastRetryError: {
            message: (retryError as Error).message,
            stack: (retryError as Error).stack,
            name: (retryError as Error).name,
          },
        };

        const cacheKey = await this.generateCacheKey(
          messageId,
          currentTenantId || 'default'
        );
        await this.cacheService.set(cacheKey, updatedData, this.cacheTTL);

        // 更新统计
        await this.updateDeadLetterStats(
          currentTenantId || 'default',
          'retried_failed'
        );

        this.logger.warn('死信消息重试失败', {
          messageId,
          tenantId: currentTenantId,
          retryCount: newRetryCount,
          error: (retryError as Error).message,
        });

        return {
          success: false,
          message: '重试失败',
          messageId,
          retryCount: newRetryCount,
          error: (retryError as Error).message,
        };
      }
    } catch (error) {
      this.logger.error('重试死信消息失败', {
        error: (error as Error).message,
        messageId,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 批量重试死信消息
   *
   * @description 批量重试多个死信消息
   *
   * @param messageIds 消息ID列表
   * @param handler 消息处理器函数
   * @param tenantId 租户ID（可选）
   * @returns 批量重试结果
   */
  async batchRetryDeadMessages(
    messageIds: string[],
    handler: (message: unknown) => Promise<void>,
    tenantId?: string
  ): Promise<BatchRetryResult> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const results: RetryResult[] = [];
      const promises = messageIds.map((messageId) =>
        this.retryDeadMessage(messageId, handler, currentTenantId || 'default')
      );

      const retryResults = await Promise.allSettled(promises);

      retryResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            message: '重试处理失败',
            messageId: messageIds[index],
            error: (result.reason as Error).message,
          });
        }
      });

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      this.logger.info('批量重试死信消息完成', {
        tenantId: currentTenantId,
        totalCount: messageIds.length,
        successCount,
        failureCount,
      });

      return {
        totalCount: messageIds.length,
        successCount,
        failureCount,
        results,
      };
    } catch (error) {
      this.logger.error('批量重试死信消息失败', {
        error: (error as Error).message,
        messageIds,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 删除死信消息
   *
   * @description 从死信队列中删除指定的消息
   *
   * @param messageId 消息ID
   * @param tenantId 租户ID（可选）
   * @returns 删除结果
   */
  async removeDeadMessage(
    messageId: string,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const cacheKey = await this.generateCacheKey(
        messageId,
        currentTenantId || 'default'
      );

      await this.cacheService.delete(cacheKey);

      // 更新统计
      await this.updateDeadLetterStats(currentTenantId || 'default', 'removed');

      this.logger.info('死信消息已删除', {
        messageId,
        tenantId: currentTenantId,
        cacheKey,
      });

      return true;
    } catch (error) {
      this.logger.error('删除死信消息失败', {
        error: (error as Error).message,
        messageId,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 清理过期的死信消息
   *
   * @description 清理已过期的死信消息
   *
   * @param tenantId 租户ID（可选）
   * @param beforeDate 清理此日期之前的消息（可选）
   * @returns 清理结果
   */
  async cleanupExpiredDeadMessages(
    tenantId?: string,
    beforeDate?: Date
  ): Promise<CleanupResult> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const cutoffDate =
        beforeDate || new Date(Date.now() - this.cacheTTL * 1000);

      // 获取所有死信消息的键
      const pattern = await this.generateCacheKeyPattern(
        currentTenantId || 'default'
      );
      const keys = await this.cacheService.keys(pattern);

      let cleanedCount = 0;
      let errorCount = 0;

      for (const key of keys) {
        try {
          const deadLetterData = await this.cacheService.get<DeadLetterData>(
            key
          );
          if (deadLetterData) {
            const messageDate = new Date(deadLetterData.timestamp);
            if (messageDate < cutoffDate) {
              await this.cacheService.delete(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          errorCount++;
          this.logger.warn('清理死信消息时出错', {
            key,
            error: (error as Error).message,
          });
        }
      }

      // 更新统计
      await this.updateDeadLetterStats(
        currentTenantId || 'default',
        'cleaned',
        cleanedCount
      );

      this.logger.info('清理过期死信消息完成', {
        tenantId: currentTenantId,
        cutoffDate: cutoffDate.toISOString(),
        totalKeys: keys.length,
        cleanedCount,
        errorCount,
      });

      return {
        totalKeys: keys.length,
        cleanedCount,
        errorCount,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      this.logger.error('清理过期死信消息失败', {
        error: (error as Error).message,
        tenantId,
        beforeDate,
      });
      throw error;
    }
  }

  /**
   * 获取死信队列统计信息
   *
   * @description 获取指定租户的死信队列统计信息
   *
   * @param tenantId 租户ID（可选）
   * @returns 统计信息
   */
  async getDeadLetterStats(tenantId?: string): Promise<DeadLetterStats> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      const statsKey = await this.generateStatsKey(
        currentTenantId || 'default'
      );

      const stats = (await this.cacheService.get<DeadLetterStats>(
        statsKey
      )) || {
        totalStored: 0,
        totalRetried: 0,
        totalRemoved: 0,
        totalCleaned: 0,
        retrySuccessCount: 0,
        retryFailureCount: 0,
        lastUpdated: new Date().toISOString(),
      };

      // 获取当前死信消息数量
      const pattern = await this.generateCacheKeyPattern(
        currentTenantId || 'default'
      );
      const keys = await this.cacheService.keys(pattern);
      stats.currentCount = keys.length;

      return stats;
    } catch (error) {
      this.logger.error('获取死信队列统计失败', {
        error: (error as Error).message,
        tenantId,
      });
      throw error;
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(message: unknown): string {
    if ((message as any).id) return (message as any).id;
    if ((message as any).messageId) return (message as any).messageId;
    if ((message as any).correlationId) return (message as any).correlationId;

    // 生成基于内容的哈希ID
    const content = JSON.stringify(message);
    return `msg_${Buffer.from(content)
      .toString('base64')
      .substring(0, 16)}_${Date.now()}`;
  }

  /**
   * 生成缓存键
   */
  private async generateCacheKey(
    messageId: string,
    tenantId: string
  ): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}${messageId}`,
        tenantId
      );
    } catch (error) {
      // 回退到简单键前缀
      return `${this.keyPrefix}${tenantId}:${messageId}`;
    }
  }

  /**
   * 生成缓存键模式
   */
  private async generateCacheKeyPattern(tenantId: string): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}*`,
        tenantId
      );
    } catch (error) {
      // 回退到简单键前缀
      return `${this.keyPrefix}${tenantId}:*`;
    }
  }

  /**
   * 生成统计键
   */
  private async generateStatsKey(tenantId: string): Promise<string> {
    try {
      return await this.tenantIsolationService.getTenantKey(
        `${this.keyPrefix}stats`,
        tenantId
      );
    } catch (error) {
      // 回退到简单键前缀
      return `${this.keyPrefix}stats:${tenantId}`;
    }
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: Error): boolean {
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError',
      'InvalidInputError',
    ];

    return !nonRetryableErrors.includes(error.name);
  }

  /**
   * 计算下次重试时间
   */
  private calculateNextRetry(retryCount: number): Date {
    // 指数退避策略：1分钟、2分钟、4分钟、8分钟、16分钟、30分钟
    const delays = [60, 120, 240, 480, 960, 1800]; // 秒
    const delay = delays[Math.min(retryCount, delays.length - 1)];

    return new Date(Date.now() + delay * 1000);
  }

  /**
   * 更新死信队列统计
   */
  private async updateDeadLetterStats(
    tenantId: string,
    action: string,
    count = 1
  ): Promise<void> {
    try {
      const statsKey = await this.generateStatsKey(tenantId);
      const stats = (await this.cacheService.get<DeadLetterStats>(
        statsKey
      )) || {
        totalStored: 0,
        totalRetried: 0,
        totalRemoved: 0,
        totalCleaned: 0,
        retrySuccessCount: 0,
        retryFailureCount: 0,
        lastUpdated: new Date().toISOString(),
      };

      switch (action) {
        case 'stored':
          stats.totalStored += count;
          break;
        case 'retried_success':
          stats.totalRetried += count;
          stats.retrySuccessCount += count;
          break;
        case 'retried_failed':
          stats.totalRetried += count;
          stats.retryFailureCount += count;
          break;
        case 'removed':
          stats.totalRemoved += count;
          break;
        case 'cleaned':
          stats.totalCleaned += count;
          break;
      }

      stats.lastUpdated = new Date().toISOString();

      await this.cacheService.set(statsKey, stats, this.cacheTTL);
    } catch (error) {
      this.logger.warn('更新死信队列统计失败', {
        error: (error as Error).message,
        tenantId,
        action,
        count,
      });
    }
  }
}

// 类型定义
interface DeadLetterData {
  messageId: string;
  originalMessage: unknown;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  retryCount: number;
  tenantId?: string;
  timestamp: string;
  retryable: boolean;
  nextRetryAt: string;
  lastRetryAt?: string;
  lastRetryError?: {
    message: string;
    stack?: string;
    name: string;
  };
}

interface RetryResult {
  success: boolean;
  message: string;
  messageId: string;
  retryCount?: number;
  error?: string;
  nextRetryAt?: string;
}

interface BatchRetryResult {
  totalCount: number;
  successCount: number;
  failureCount: number;
  results: RetryResult[];
}

interface CleanupResult {
  totalKeys: number;
  cleanedCount: number;
  errorCount: number;
  cutoffDate: string;
}

interface DeadLetterStats {
  totalStored: number;
  totalRetried: number;
  totalRemoved: number;
  totalCleaned: number;
  retrySuccessCount: number;
  retryFailureCount: number;
  currentCount?: number;
  lastUpdated: string;
}
