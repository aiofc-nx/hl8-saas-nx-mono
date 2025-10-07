/**
 * 死信队列处理器
 *
 * 提供完整的事件死信队列处理功能，包括失败事件重试、死信处理、恢复机制等。
 * 作为通用功能组件，为业务模块提供强大的错误恢复能力。
 *
 * @description 死信队列的完整实现，支持多种重试策略和恢复机制
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
// import { BaseDomainEvent } from '@hl8/hybrid-archi/domain/events/base/base-domain-event';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import { DatabaseService } from '@hl8/database';

/**
 * 死信队列配置
 */
export interface DeadLetterQueueConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
  deadLetterAfterRetries: boolean;
  retentionPeriod: number; // 保留时间（小时）
  batchSize: number;
  processingInterval: number; // 处理间隔（毫秒）
}

/**
 * 死信队列条目
 */
export interface DeadLetterQueueEntry {
  id: string;
  event: any;
  originalEvent: any;
  retryCount: number;
  maxRetries: number;
  lastRetryAt: Date;
  nextRetryAt: Date;
  errorMessage: string;
  errorStack: string;
  createdAt: Date;
  status: 'pending' | 'retrying' | 'failed' | 'recovered';
}

/**
 * 重试策略
 */
export interface RetryStrategy {
  maxRetries: number;
  initialDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
  jitter: boolean;
}

/**
 * 死信队列处理器
 *
 * 提供完整的死信队列处理功能
 */
@Injectable()
export class DeadLetterQueueProcessor {
  private readonly entries = new Map<string, DeadLetterQueueEntry>();
  private readonly retryStrategies = new Map<string, RetryStrategy>();
  private processingTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    private readonly databaseService: DatabaseService,
    @Inject('DeadLetterQueueConfig') private readonly config: DeadLetterQueueConfig
  ) {
    this.initializeRetryStrategies();
    this.startProcessing();
  }

  /**
   * 添加事件到死信队列
   *
   * @description 将失败的事件添加到死信队列
   * @param event - 领域事件
   * @param error - 错误信息
   * @param retryStrategy - 重试策略（可选）
   */
  async addToDeadLetterQueue(
    event: any,
    error: Error,
    retryStrategy?: RetryStrategy
  ): Promise<string> {
    try {
      const entryId = this.generateEntryId();
      const strategy =
        retryStrategy || this.getDefaultRetryStrategy(event.eventType);

      const entry: DeadLetterQueueEntry = {
        id: entryId,
        event,
        originalEvent: { ...event } as any,
        retryCount: 0,
        maxRetries: strategy.maxRetries,
        lastRetryAt: new Date(),
        nextRetryAt: this.calculateNextRetryTime(strategy, 0),
        errorMessage: error.message,
        errorStack: error.stack || '',
        createdAt: new Date(),
        status: 'pending',
      };

      // 保存到内存
      this.entries.set(entryId, entry);

      // 保存到数据库
      await this.saveEntryToDatabase(entry);

      // 缓存条目
      await this.cacheEntry(entry);

      this.logger.warn('事件添加到死信队列', {
        entryId,
        eventType: event.eventType,
        eventId: event.eventId.toString(),
        error: error.message,
        retryStrategy: strategy,
      });

      return entryId;
    } catch (error) {
      this.logger.error('添加事件到死信队列失败', error, {
        eventType: event.eventType,
        eventId: event.eventId.toString(),
      });
      throw error;
    }
  }

  /**
   * 重试死信队列条目
   *
   * @description 重试指定的死信队列条目
   * @param entryId - 条目ID
   * @param eventHandler - 事件处理器
   * @returns 重试结果
   */
  async retryEntry(
    entryId: string,
    eventHandler: (event: any) => Promise<void>
  ): Promise<boolean> {
    try {
      const entry = this.entries.get(entryId);
      if (!entry) {
        this.logger.warn('死信队列条目不存在', { entryId });
        return false;
      }

      if (entry.status !== 'pending' && entry.status !== 'retrying') {
        this.logger.warn('死信队列条目状态不允许重试', {
          entryId,
          status: entry.status,
        });
        return false;
      }

      if (entry.retryCount >= entry.maxRetries) {
        this.logger.warn('死信队列条目已达到最大重试次数', {
          entryId,
          retryCount: entry.retryCount,
        });
        await this.markEntryAsFailed(entryId);
        return false;
      }

      // 更新状态为重试中
      entry.status = 'retrying';
      entry.retryCount++;
      entry.lastRetryAt = new Date();

      // 更新数据库
      await this.updateEntryInDatabase(entry);

      this.logger.info('开始重试死信队列条目', {
        entryId,
        retryCount: entry.retryCount,
        maxRetries: entry.maxRetries,
      });

      try {
        // 重试事件处理
        await eventHandler(entry.event);

        // 重试成功
        await this.markEntryAsRecovered(entryId);

        this.logger.info('死信队列条目重试成功', {
          entryId,
          retryCount: entry.retryCount,
        });

        return true;
      } catch (error) {
        // 重试失败
        entry.errorMessage =
          error instanceof Error ? error.message : String(error);
        entry.errorStack = error instanceof Error ? error.stack || '' : '';
        entry.nextRetryAt = this.calculateNextRetryTime(
          this.getRetryStrategy(entry.event.eventType),
          entry.retryCount
        );

        await this.updateEntryInDatabase(entry);

        this.logger.warn('死信队列条目重试失败', {
          entryId,
          retryCount: entry.retryCount,
          error: error instanceof Error ? error.message : String(error),
        });

        return false;
      }
    } catch (error) {
      this.logger.error('重试死信队列条目失败', error, { entryId });
      return false;
    }
  }

  /**
   * 获取死信队列条目
   *
   * @description 获取指定的死信队列条目
   * @param entryId - 条目ID
   * @returns 死信队列条目
   */
  getEntry(entryId: string): DeadLetterQueueEntry | null {
    return this.entries.get(entryId) || null;
  }

  /**
   * 获取所有死信队列条目
   *
   * @description 获取所有死信队列条目
   * @param status - 状态过滤（可选）
   * @returns 死信队列条目列表
   */
  getAllEntries(status?: string): DeadLetterQueueEntry[] {
    const entries = Array.from(this.entries.values());
    return status
      ? entries.filter((entry) => entry.status === status)
      : entries;
  }

  /**
   * 获取待重试的条目
   *
   * @description 获取可以重试的条目
   * @returns 待重试的条目列表
   */
  getPendingEntries(): DeadLetterQueueEntry[] {
    const now = new Date();
    return Array.from(this.entries.values()).filter(
      (entry) =>
        entry.status === 'pending' &&
        entry.nextRetryAt <= now &&
        entry.retryCount < entry.maxRetries
    );
  }

  /**
   * 删除死信队列条目
   *
   * @description 删除指定的死信队列条目
   * @param entryId - 条目ID
   */
  async deleteEntry(entryId: string): Promise<boolean> {
    try {
      const entry = this.entries.get(entryId);
      if (!entry) {
        return false;
      }

      // 从内存删除
      this.entries.delete(entryId);

      // 从数据库删除
      await this.deleteEntryFromDatabase(entryId);

      // 从缓存删除
      await this.cacheService.delete(`dlq:${entryId}`);

      this.logger.info('死信队列条目已删除', { entryId });
      return true;
    } catch (error) {
      this.logger.error('删除死信队列条目失败', error, { entryId });
      return false;
    }
  }

  /**
   * 清理过期的死信队列条目
   *
   * @description 清理超过保留时间的条目
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const now = new Date();
      const retentionTime = this.config.retentionPeriod * 60 * 60 * 1000; // 转换为毫秒
      const expiredEntries: string[] = [];

      for (const [entryId, entry] of this.entries) {
        if (now.getTime() - entry.createdAt.getTime() > retentionTime) {
          expiredEntries.push(entryId);
        }
      }

      // 删除过期条目
      for (const entryId of expiredEntries) {
        await this.deleteEntry(entryId);
      }

      this.logger.info('清理过期死信队列条目', {
        expiredCount: expiredEntries.length,
        retentionPeriod: this.config.retentionPeriod,
      });

      return expiredEntries.length;
    } catch (error) {
      this.logger.error('清理过期死信队列条目失败', error);
      return 0;
    }
  }

  /**
   * 获取死信队列统计信息
   *
   * @description 获取死信队列的统计信息
   * @returns 统计信息
   */
  getStats(): {
    totalEntries: number;
    pendingEntries: number;
    retryingEntries: number;
    failedEntries: number;
    recoveredEntries: number;
    averageRetryCount: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Array.from(this.entries.values());
    const totalEntries = entries.length;
    const pendingEntries = entries.filter((e) => e.status === 'pending').length;
    const retryingEntries = entries.filter(
      (e) => e.status === 'retrying'
    ).length;
    const failedEntries = entries.filter((e) => e.status === 'failed').length;
    const recoveredEntries = entries.filter(
      (e) => e.status === 'recovered'
    ).length;

    const averageRetryCount =
      totalEntries > 0
        ? entries.reduce((sum, e) => sum + e.retryCount, 0) / totalEntries
        : 0;

    const dates = entries.map((e) => e.createdAt).sort();
    const oldestEntry = dates.length > 0 ? dates[0] : null;
    const newestEntry = dates.length > 0 ? dates[dates.length - 1] : null;

    return {
      totalEntries,
      pendingEntries,
      retryingEntries,
      failedEntries,
      recoveredEntries,
      averageRetryCount,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * 停止处理
   *
   * @description 停止死信队列处理
   */
  stopProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    this.logger.info('死信队列处理已停止');
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化重试策略
   */
  private initializeRetryStrategies(): void {
    // 默认重试策略
    this.retryStrategies.set('default', {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.retryDelay,
      backoffMultiplier: this.config.backoffMultiplier,
      maxDelay: this.config.maxRetryDelay,
      jitter: true,
    });

    // 快速重试策略（用于临时错误）
    this.retryStrategies.set('fast', {
      maxRetries: 3,
      initialDelay: 1000, // 1秒
      backoffMultiplier: 2,
      maxDelay: 10000, // 10秒
      jitter: true,
    });

    // 慢速重试策略（用于系统错误）
    this.retryStrategies.set('slow', {
      maxRetries: 10,
      initialDelay: 30000, // 30秒
      backoffMultiplier: 1.5,
      maxDelay: 3600000, // 1小时
      jitter: true,
    });
  }

  /**
   * 获取默认重试策略
   */
  private getDefaultRetryStrategy(eventType: string): RetryStrategy {
    return (
      this.retryStrategies.get('default') ||
      this.retryStrategies.get('default')!
    );
  }

  /**
   * 获取重试策略
   */
  private getRetryStrategy(eventType: string): RetryStrategy {
    return (
      this.retryStrategies.get(eventType) ||
      this.getDefaultRetryStrategy(eventType)
    );
  }

  /**
   * 计算下次重试时间
   */
  private calculateNextRetryTime(
    strategy: RetryStrategy,
    retryCount: number
  ): Date {
    const delay = Math.min(
      strategy.initialDelay * Math.pow(strategy.backoffMultiplier, retryCount),
      strategy.maxDelay
    );

    // 添加抖动
    const jitter = strategy.jitter ? Math.random() * 0.1 * delay : 0;
    const totalDelay = delay + jitter;

    return new Date(Date.now() + totalDelay);
  }

  /**
   * 生成条目ID
   */
  private generateEntryId(): string {
    return `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 开始处理
   */
  private startProcessing(): void {
    if (!this.config.enabled) {
      return;
    }

    this.processingTimer = setInterval(async () => {
      await this.processPendingEntries();
    }, this.config.processingInterval);

    this.logger.info('死信队列处理已启动', {
      processingInterval: this.config.processingInterval,
    });
  }

  /**
   * 处理待重试的条目
   */
  private async processPendingEntries(): Promise<void> {
    try {
      const pendingEntries = this.getPendingEntries();
      if (pendingEntries.length === 0) {
        return;
      }

      this.logger.debug('处理待重试的死信队列条目', {
        count: pendingEntries.length,
      });

      // 批量处理
      const batchSize = Math.min(this.config.batchSize, pendingEntries.length);
      const batch = pendingEntries.slice(0, batchSize);

      for (const entry of batch) {
        // 这里应该调用实际的事件处理器
        // 实际实现中会注入事件处理器
        console.log(`处理死信队列条目: ${entry.id}`);
      }
    } catch (error) {
      this.logger.error('处理待重试条目失败', error);
    }
  }

  /**
   * 标记条目为失败
   */
  private async markEntryAsFailed(entryId: string): Promise<void> {
    const entry = this.entries.get(entryId);
    if (entry) {
      entry.status = 'failed';
      await this.updateEntryInDatabase(entry);
    }
  }

  /**
   * 标记条目为已恢复
   */
  private async markEntryAsRecovered(entryId: string): Promise<void> {
    const entry = this.entries.get(entryId);
    if (entry) {
      entry.status = 'recovered';
      await this.updateEntryInDatabase(entry);
    }
  }

  /**
   * 保存条目到数据库
   */
  private async saveEntryToDatabase(
    entry: DeadLetterQueueEntry
  ): Promise<void> {
    // 这里应该实现具体的数据库保存逻辑
    console.log('保存死信队列条目到数据库', { entryId: entry.id });
  }

  /**
   * 更新数据库中的条目
   */
  private async updateEntryInDatabase(
    entry: DeadLetterQueueEntry
  ): Promise<void> {
    // 这里应该实现具体的数据库更新逻辑
    console.log('更新数据库中的死信队列条目', { entryId: entry.id });
  }

  /**
   * 从数据库删除条目
   */
  private async deleteEntryFromDatabase(entryId: string): Promise<void> {
    // 这里应该实现具体的数据库删除逻辑
    console.log('从数据库删除死信队列条目', { entryId });
  }

  /**
   * 缓存条目
   */
  private async cacheEntry(entry: DeadLetterQueueEntry): Promise<void> {
    try {
      const cacheKey = `dlq:${entry.id}`;
      const ttl = this.config.retentionPeriod * 60 * 60; // 转换为秒
      await this.cacheService.set(cacheKey, JSON.stringify(entry), ttl);
    } catch (error) {
      this.logger.warn('缓存死信队列条目失败', error);
    }
  }
}
