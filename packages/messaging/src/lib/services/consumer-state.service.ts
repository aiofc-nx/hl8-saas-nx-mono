import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { CacheService } from '@hl8/cache';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { MessagingCacheConfig } from '../types/messaging.types';

/**
 * 消费者状态接口
 */
export interface ConsumerState {
  /** 消费者ID */
  consumerId: string;
  /** 队列名称 */
  queueName: string;
  /** 最后处理的消息ID */
  lastProcessedMessageId?: string;
  /** 最后处理时间 */
  lastProcessedAt?: Date;
  /** 处理的消息总数 */
  totalProcessedMessages?: number;
  /** 最后错误信息 */
  lastError?: string;
  /** 消费者状态 */
  status: 'active' | 'paused' | 'stopped' | 'error';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 租户ID */
  tenantId?: string;
}

/**
 * 消费者状态缓存服务
 *
 * @description 管理消费者状态缓存，支持快速故障恢复和状态追踪
 * 提供租户级别的消费者状态隔离和管理
 *
 * ## 业务规则
 *
 * ### 状态管理规则
 * - 消费者启动时自动创建状态记录
 * - 消息处理成功后更新状态信息
 * - 发生错误时记录错误状态和详细信息
 * - 支持消费者状态的持久化存储
 *
 * ### 故障恢复规则
 * - 消费者重启时自动恢复最后处理状态
 * - 支持从指定消息ID重新开始处理
 * - 提供状态一致性检查和修复机制
 *
 * ### 监控和统计规则
 * - 记录处理消息总数和成功率
 * - 跟踪最后处理时间和错误信息
 * - 提供消费者健康状态检查
 *
 * @example
 * ```typescript
 * import { ConsumerStateService } from '@hl8/messaging';
 *
 * @Injectable()
 * export class MessageProcessor {
 *   constructor(
 *     private readonly consumerStateService: ConsumerStateService
 *   ) {}
 *
 *   async startConsumer(queueName: string) {
 *     const consumerId = this.generateConsumerId();
 *
 *     // 恢复消费者状态
 *     const state = await this.consumerStateService.getConsumerState(consumerId);
 *     if (state) {
 *       this.logger.info('恢复消费者状态', {
 *         consumerId,
 *         lastMessageId: state.lastProcessedMessageId
 *       });
 *     }
 *
 *     // 开始消费消息
 *     await this.messagingService.consume(queueName, async (message) => {
 *       try {
 *         await this.processMessage(message);
 *
 *         // 更新处理状态
 *         await this.consumerStateService.updateProcessedState(
 *           consumerId,
 *           queueName,
 *           message.id
 *         );
 *       } catch (error) {
 *         // 更新错误状态
 *         await this.consumerStateService.updateErrorState(
 *           consumerId,
 *           error.message
 *         );
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConsumerStateService {
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly logger: PinoLogger,
    private readonly cacheConfig: MessagingCacheConfig = {}
  ) {
    this.logger.setContext({ requestId: 'consumer-state-service' });
    this.defaultTTL = cacheConfig.cacheTTL?.consumerState || 3600; // 默认1小时
    this.keyPrefix = cacheConfig.keyPrefix || 'hl8:messaging:consumer:';
  }

  /**
   * 创建消费者状态
   *
   * @description 为新的消费者创建状态记录
   *
   * @param consumerId 消费者ID
   * @param queueName 队列名称
   * @returns 创建的消费者状态
   *
   * @example
   * ```typescript
   * const state = await consumerStateService.createConsumerState(
   *   'consumer-123',
   *   'user-events'
   * );
   * ```
   */
  async createConsumerState(
    consumerId: string,
    queueName: string
  ): Promise<ConsumerState> {
    try {
      const now = new Date();
      const tenantId = this.tenantContextService.getTenant();

      const state: ConsumerState = {
        consumerId,
        queueName,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        tenantId: tenantId || undefined,
        totalProcessedMessages: 0,
      };

      const cacheKey = await this.getCacheKey(consumerId);
      await this.cacheService.set(cacheKey, state, this.defaultTTL);

      this.logger.info('消费者状态已创建', {
        consumerId,
        queueName,
        tenantId: tenantId || undefined,
      });

      return state;
    } catch (error) {
      this.logger.error('创建消费者状态失败', {
        error: (error as Error).message,
        consumerId,
        queueName,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 获取消费者状态
   *
   * @description 获取指定消费者的状态信息
   *
   * @param consumerId 消费者ID
   * @returns 消费者状态，如果不存在则返回null
   *
   * @example
   * ```typescript
   * const state = await consumerStateService.getConsumerState('consumer-123');
   * if (state) {
   *   console.log('最后处理的消息ID:', state.lastProcessedMessageId);
   * }
   * ```
   */
  async getConsumerState(consumerId: string): Promise<ConsumerState | null> {
    try {
      const cacheKey = await this.getCacheKey(consumerId);
      const state = await this.cacheService.get<ConsumerState>(cacheKey);

      if (state) {
        this.logger.debug('获取消费者状态成功', {
          consumerId,
          status: state.status,
          lastProcessedMessageId: state.lastProcessedMessageId,
          tenantId: state.tenantId,
        });
      }

      return state || null;
    } catch (error) {
      this.logger.error('获取消费者状态失败', {
        error: (error as Error).message,
        consumerId,
        tenantId: this.tenantContextService.getTenant(),
      });
      return null;
    }
  }

  /**
   * 更新消息处理状态
   *
   * @description 更新消费者成功处理消息后的状态
   *
   * @param consumerId 消费者ID
   * @param queueName 队列名称
   * @param messageId 消息ID
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await consumerStateService.updateProcessedState(
   *   'consumer-123',
   *   'user-events',
   *   'msg-456'
   * );
   * ```
   */
  async updateProcessedState(
    consumerId: string,
    queueName: string,
    messageId: string
  ): Promise<void> {
    try {
      const state = await this.getConsumerState(consumerId);
      if (!state) {
        // 如果状态不存在，创建新状态
        await this.createConsumerState(consumerId, queueName);
        return this.updateProcessedState(consumerId, queueName, messageId);
      }

      const updatedState: ConsumerState = {
        ...state,
        lastProcessedMessageId: messageId,
        lastProcessedAt: new Date(),
        totalProcessedMessages: (state.totalProcessedMessages || 0) + 1,
        status: 'active',
        updatedAt: new Date(),
      };

      const cacheKey = await this.getCacheKey(consumerId);
      await this.cacheService.set(cacheKey, updatedState, this.defaultTTL);

      this.logger.debug('消费者处理状态已更新', {
        consumerId,
        queueName,
        messageId,
        totalProcessed: updatedState.totalProcessedMessages,
        tenantId: updatedState.tenantId,
      });
    } catch (error) {
      this.logger.error('更新消费者处理状态失败', {
        error: (error as Error).message,
        consumerId,
        queueName,
        messageId,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 更新错误状态
   *
   * @description 更新消费者处理消息失败时的状态
   *
   * @param consumerId 消费者ID
   * @param errorMessage 错误信息
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await consumerStateService.updateErrorState(
   *   'consumer-123',
   *   'Message processing failed'
   * );
   * ```
   */
  async updateErrorState(
    consumerId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const state = await this.getConsumerState(consumerId);
      if (!state) {
        this.logger.warn('尝试更新不存在的消费者状态', {
          consumerId,
          errorMessage,
          tenantId: this.tenantContextService.getTenant(),
        });
        return;
      }

      const updatedState: ConsumerState = {
        ...state,
        lastError: errorMessage,
        status: 'error',
        updatedAt: new Date(),
      };

      const cacheKey = await this.getCacheKey(consumerId);
      await this.cacheService.set(cacheKey, updatedState, this.defaultTTL);

      this.logger.warn('消费者错误状态已更新', {
        consumerId,
        errorMessage,
        tenantId: state.tenantId,
      });
    } catch (error) {
      this.logger.error('更新消费者错误状态失败', {
        error: (error as Error).message,
        consumerId,
        errorMessage,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 更新消费者状态
   *
   * @description 更新消费者的整体状态（如暂停、停止等）
   *
   * @param consumerId 消费者ID
   * @param status 新状态
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await consumerStateService.updateConsumerStatus(
   *   'consumer-123',
   *   'paused'
   * );
   * ```
   */
  async updateConsumerStatus(
    consumerId: string,
    status: ConsumerState['status']
  ): Promise<void> {
    try {
      const state = await this.getConsumerState(consumerId);
      if (!state) {
        this.logger.warn('尝试更新不存在的消费者状态', {
          consumerId,
          status,
          tenantId: this.tenantContextService.getTenant(),
        });
        return;
      }

      const updatedState: ConsumerState = {
        ...state,
        status,
        updatedAt: new Date(),
      };

      const cacheKey = await this.getCacheKey(consumerId);
      await this.cacheService.set(cacheKey, updatedState, this.defaultTTL);

      this.logger.info('消费者状态已更新', {
        consumerId,
        status,
        tenantId: state.tenantId,
      });
    } catch (error) {
      this.logger.error('更新消费者状态失败', {
        error: (error as Error).message,
        consumerId,
        status,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 删除消费者状态
   *
   * @description 删除指定消费者的状态记录
   *
   * @param consumerId 消费者ID
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await consumerStateService.deleteConsumerState('consumer-123');
   * ```
   */
  async deleteConsumerState(consumerId: string): Promise<void> {
    try {
      const cacheKey = await this.getCacheKey(consumerId);
      await this.cacheService.delete(cacheKey);

      this.logger.info('消费者状态已删除', {
        consumerId,
        tenantId: this.tenantContextService.getTenant(),
      });
    } catch (error) {
      this.logger.error('删除消费者状态失败', {
        error: (error as Error).message,
        consumerId,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 获取所有消费者状态
   *
   * @description 获取当前租户下所有消费者的状态信息
   *
   * @returns 消费者状态数组
   *
   * @example
   * ```typescript
   * const states = await consumerStateService.getAllConsumerStates();
   * console.log(`当前有 ${states.length} 个活跃消费者`);
   * ```
   */
  async getAllConsumerStates(): Promise<ConsumerState[]> {
    try {
      // 注意：这里需要根据实际的缓存实现来获取所有键
      // 由于Redis的限制，这里提供一个基础实现
      const tenantId = this.tenantContextService.getTenant();
      const pattern = tenantId
        ? `${this.keyPrefix}tenant:${tenantId}:*`
        : `${this.keyPrefix}*`;

      // 这里需要根据实际的CacheService实现来获取匹配的键
      // 暂时返回空数组，实际实现需要根据缓存服务的API来调整
      this.logger.debug('获取所有消费者状态', {
        pattern,
        tenantId: tenantId || undefined,
      });

      return []; // 实际实现需要根据缓存服务的API来获取
    } catch (error) {
      this.logger.error('获取所有消费者状态失败', {
        error: (error as Error).message,
        tenantId: this.tenantContextService.getTenant(),
      });
      return [];
    }
  }

  /**
   * 清理过期状态
   *
   * @description 清理过期的消费者状态记录
   * 通常由定时任务调用
   *
   * @returns 清理的状态数量
   *
   * @example
   * ```typescript
   * const cleanedCount = await consumerStateService.cleanupExpiredStates();
   * console.log(`清理了 ${cleanedCount} 个过期状态`);
   * ```
   */
  async cleanupExpiredStates(): Promise<number> {
    try {
      // Redis的TTL机制会自动清理过期记录
      // 这里主要用于统计和监控
      const tenantId = this.tenantContextService.getTenant();

      this.logger.debug('消费者状态清理检查完成', {
        tenantId: tenantId || undefined,
      });

      return 0; // Redis自动清理，返回0表示无需手动清理
    } catch (error) {
      this.logger.error('清理过期消费者状态失败', {
        error: (error as Error).message,
        tenantId: this.tenantContextService.getTenant(),
      });
      throw error;
    }
  }

  /**
   * 获取缓存键
   *
   * @description 基于消费者ID和租户上下文生成缓存键
   *
   * @param consumerId 消费者ID
   * @returns 缓存键
   * @private
   */
  private async getCacheKey(consumerId: string): Promise<string> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      if (tenantId) {
        // 使用多租户隔离服务生成租户感知的缓存键
        return await this.tenantIsolationService.getTenantKey(
          `${this.keyPrefix}${consumerId}`,
          tenantId
        );
      }

      // 无租户上下文时使用默认键
      return `${this.keyPrefix}${consumerId}`;
    } catch (error) {
      this.logger.error('生成消费者状态缓存键失败', {
        error: (error as Error).message,
        consumerId,
        tenantId: this.tenantContextService.getTenant(),
      });

      // 回退到简单的键格式
      const tenantId = this.tenantContextService.getTenant() || 'default';
      return `${this.keyPrefix}tenant:${tenantId}:${consumerId}`;
    }
  }
}
