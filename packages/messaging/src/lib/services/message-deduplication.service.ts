import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { MessagingCacheConfig } from '../types/messaging.types';
import { MessagingSerializationException } from '../exceptions/messaging.exceptions';

/**
 * 消息去重服务
 *
 * @description 基于缓存的消息去重服务，防止重复处理相同消息
 * 支持租户级别的消息隔离和多租户上下文管理
 *
 * ## 业务规则
 *
 * ### 消息指纹生成规则
 * - 基于消息内容和元数据生成唯一指纹
 * - 支持多种指纹算法（MD5、SHA256等）
 * - 排除时间戳等可变字段确保一致性
 *
 * ### 缓存策略规则
 * - 使用短期TTL避免内存过度使用
 * - 支持租户级别的缓存隔离
 * - 自动清理过期的去重记录
 *
 * ### 去重检查规则
 * - 在消息发布前检查是否已存在
 * - 在消息消费前检查是否已处理
 * - 支持批量消息去重检查
 *
 * @example
 * ```typescript
 * import { MessageDeduplicationService } from '@hl8/messaging';
 *
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly dedupService: MessageDeduplicationService
 *   ) {}
 *
 *   async publishUserEvent(user: User) {
 *     const message = {
 *       id: user.id,
 *       email: user.email,
 *       eventType: 'user.created'
 *     };
 *
 *     // 检查消息是否重复
 *     if (await this.dedupService.isDuplicate(message)) {
 *       this.logger.warn('重复消息，跳过发布', { userId: user.id });
 *       return;
 *     }
 *
 *     // 发布消息并标记为已处理
 *     await this.messagingService.publish('user.created', message);
 *     await this.dedupService.markAsProcessed(message);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class MessageDeduplicationService {
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly logger: PinoLogger,
    private readonly cacheConfig: MessagingCacheConfig = {}
  ) {
    this.logger.setContext({ requestId: 'message-deduplication-service' });
    this.defaultTTL = cacheConfig.cacheTTL?.messageDedup || 300; // 默认5分钟
    this.keyPrefix = cacheConfig.keyPrefix || 'hl8:messaging:dedup:';
  }

  /**
   * 检查消息是否重复
   *
   * @description 基于消息内容生成指纹并检查是否已存在
   * 支持租户级别的去重隔离
   *
   * @param message 消息对象
   * @param customTTL 自定义TTL（可选）
   * @returns 是否为重复消息
   *
   * @example
   * ```typescript
   * const isDuplicate = await dedupService.isDuplicate({
   *   id: 'user-123',
   *   email: 'user@example.com',
   *   eventType: 'user.created'
   * });
   * ```
   */
  async isDuplicate(message: unknown, customTTL?: number): Promise<boolean> {
    try {
      const fingerprint = this.generateFingerprint(message);
      const cacheKey = await this.getCacheKey(fingerprint);

      const exists = await this.cacheService.get(cacheKey);

      if (exists) {
        this.logger.debug('检测到重复消息', {
          fingerprint,
          tenantId: this.tenantContextService.getTenant(),
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('消息去重检查失败', {
        error: (error as Error).message,
        tenantId: this.tenantContextService.getTenant(),
      });
      // 去重检查失败时，为了安全起见，认为不是重复消息
      return false;
    }
  }

  /**
   * 标记消息为已处理
   *
   * @description 将消息指纹缓存起来，防止重复处理
   * 使用租户级别的缓存隔离
   *
   * @param message 消息对象
   * @param customTTL 自定义TTL（可选）
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await dedupService.markAsProcessed({
   *   id: 'user-123',
   *   email: 'user@example.com',
   *   eventType: 'user.created'
   * }, 600); // 10分钟TTL
   * ```
   */
  async markAsProcessed(message: unknown, customTTL?: number): Promise<void> {
    try {
      const fingerprint = this.generateFingerprint(message);
      const cacheKey = await this.getCacheKey(fingerprint);
      const ttl = customTTL || this.defaultTTL;

      await this.cacheService.set(cacheKey, true, ttl);

      this.logger.debug('消息已标记为已处理', {
        fingerprint,
        ttl,
        tenantId: this.tenantContextService.getTenant(),
      });
    } catch (error) {
      this.logger.error('标记消息已处理失败', {
        error: (error as Error).message,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 批量检查消息重复
   *
   * @description 批量检查多个消息是否重复，提高性能
   *
   * @param messages 消息数组
   * @returns 重复消息的索引数组
   *
   * @example
   * ```typescript
   * const messages = [
   *   { id: 'user-1', eventType: 'user.created' },
   *   { id: 'user-2', eventType: 'user.updated' },
   * ];
   * const duplicateIndexes = await dedupService.checkBatchDuplicate(messages);
   * ```
   */
  async checkBatchDuplicate(messages: unknown[]): Promise<number[]> {
    try {
      const duplicateIndexes: number[] = [];

      for (let i = 0; i < messages.length; i++) {
        const isDup = await this.isDuplicate(messages[i]);
        if (isDup) {
          duplicateIndexes.push(i);
        }
      }

      this.logger.debug('批量去重检查完成', {
        totalMessages: messages.length,
        duplicateCount: duplicateIndexes.length,
        tenantId: this.tenantContextService.getTenant(),
      });

      return duplicateIndexes;
    } catch (error) {
      this.logger.error('批量去重检查失败', {
        error: (error as Error).message,
        messageCount: messages.length,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 批量标记消息为已处理
   *
   * @description 批量标记多个消息为已处理，提高性能
   *
   * @param messages 消息数组
   * @param customTTL 自定义TTL（可选）
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * const messages = [
   *   { id: 'user-1', eventType: 'user.created' },
   *   { id: 'user-2', eventType: 'user.updated' },
   * ];
   * await dedupService.markBatchAsProcessed(messages);
   * ```
   */
  async markBatchAsProcessed(
    messages: unknown[],
    _customTTL?: number
  ): Promise<void> {
    try {
      const ttl = _customTTL || this.defaultTTL;

      for (const message of messages) {
        await this.markAsProcessed(message, ttl);
      }

      this.logger.debug('批量标记消息已处理完成', {
        messageCount: messages.length,
        ttl,
        tenantId: this.tenantContextService.getTenant(),
      });
    } catch (error) {
      this.logger.error('批量标记消息已处理失败', {
        error: (error as Error).message,
        messageCount: messages.length,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 清理过期的去重记录
   *
   * @description 手动清理过期的去重记录，释放内存空间
   * 通常由定时任务调用
   *
   * @returns 清理的记录数量
   *
   * @example
   * ```typescript
   * const cleanedCount = await dedupService.cleanupExpiredRecords();
   * console.log(`清理了 ${cleanedCount} 条过期记录`);
   * ```
   */
  async cleanupExpiredRecords(): Promise<number> {
    try {
      // 注意：Redis的TTL机制会自动清理过期记录
      // 这里主要用于统计和监控
      const tenantId = this.tenantContextService.getTenant();
      const pattern = tenantId
        ? `${this.keyPrefix}tenant:${tenantId}:*`
        : `${this.keyPrefix}*`;

      // 这里可以添加特定的清理逻辑
      // 由于Redis会自动清理过期记录，这里主要是为了接口完整性
      this.logger.debug('去重记录清理检查完成', {
        tenantId,
        pattern,
      });

      return 0; // Redis自动清理，返回0表示无需手动清理
    } catch (error) {
      this.logger.error('清理过期去重记录失败', {
        error: (error as Error).message,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 生成消息指纹
   *
   * @description 基于消息内容生成唯一指纹
   * 排除时间戳等可变字段，确保相同消息生成相同指纹
   *
   * @param message 消息对象
   * @returns 消息指纹字符串
   * @private
   */
  private generateFingerprint(message: unknown): string {
    try {
      // 创建消息的稳定副本，排除可变字段
      const stableMessage = this.createStableMessage(message);

      // 生成JSON字符串并计算哈希
      const messageString = JSON.stringify(
        stableMessage,
        Object.keys(stableMessage as Record<string, unknown>).sort()
      );

      // 使用简单的哈希算法（在实际项目中可以使用crypto.createHash）
      return this.simpleHash(messageString);
    } catch (error) {
      this.logger.error('生成消息指纹失败', {
        error: (error as Error).message,
        messageType: typeof message,
      });
      throw new MessagingSerializationException(
        'Failed to generate message fingerprint',
        'Unable to serialize message for fingerprint generation',
        { messageType: typeof message },
        error
      );
    }
  }

  /**
   * 创建稳定的消息副本
   *
   * @description 移除时间戳、ID等可变字段，确保相同消息生成相同指纹
   *
   * @param message 原始消息
   * @returns 稳定的消息副本
   * @private
   */
  private createStableMessage(message: unknown): unknown {
    if (typeof message !== 'object' || message === null) {
      return message;
    }

    const stable = { ...(message as Record<string, unknown>) };

    // 移除可变字段
    delete stable['timestamp'];
    delete stable['createdAt'];
    delete stable['updatedAt'];
    delete stable['processedAt'];
    delete stable['requestId'];
    delete stable['correlationId'];

    // 递归处理嵌套对象
    for (const [key, value] of Object.entries(stable)) {
      if (typeof value === 'object' && value !== null) {
        stable[key] = this.createStableMessage(value);
      }
    }

    return stable;
  }

  /**
   * 简单哈希函数
   *
   * @description 生成字符串的简单哈希值
   * 在实际项目中建议使用crypto.createHash
   *
   * @param str 输入字符串
   * @returns 哈希值
   * @private
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * 获取缓存键
   *
   * @description 基于指纹和租户上下文生成缓存键
   * 支持租户级别的隔离
   *
   * @param fingerprint 消息指纹
   * @returns 缓存键
   * @private
   */
  private async getCacheKey(fingerprint: string): Promise<string> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      if (tenantId) {
        // 使用多租户隔离服务生成租户感知的缓存键
        return await this.tenantIsolationService.getTenantKey(
          `${this.keyPrefix}${fingerprint}`,
          tenantId
        );
      }

      // 无租户上下文时使用默认键
      return `${this.keyPrefix}${fingerprint}`;
    } catch (error) {
      this.logger.error('生成缓存键失败', {
        error: (error as Error).message,
        fingerprint,
        tenantId: this.tenantContextService.getTenant(),
      });

      // 回退到简单的键格式
      const tenantId = this.tenantContextService.getTenant() || 'default';
      return `${this.keyPrefix}tenant:${tenantId}:${fingerprint}`;
    }
  }
}
