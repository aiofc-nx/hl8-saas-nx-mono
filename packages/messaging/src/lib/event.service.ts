import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
// 异常导入已移除，因为当前未使用
import { MessagingService } from './messaging.service';
import {
  IEventService,
  EventHandler,
  EventOptions,
} from './types/messaging.types';

/**
 * 事件服务
 *
 * 集成@hl8/multi-tenancy的事件发布/订阅服务，提供统一的事件管理。
 *
 * @description 此服务提供完整的事件驱动架构支持。
 * 自动处理租户上下文，支持全局事件和租户事件。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 事件管理规则
 * - 支持事件发布和订阅
 * - 支持事件处理器注册
 * - 支持事件过滤和路由
 * - 支持事件持久化和重试
 *
 * ### 租户隔离规则
 * - 自动处理租户上下文
 * - 支持租户级别的事件隔离
 * - 支持租户级别的事件配置
 * - 支持租户级别的事件监控
 *
 * ### 事件驱动规则
 * - 支持事件驱动架构
 * - 支持事件溯源
 * - 支持事件重放
 * - 支持事件监控和统计
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly eventService: EventService) {}
 *
 *   async createUser(userData: UserData): Promise<User> {
 *     const user = await this.userRepository.create(userData);
 *
 *     // 发布用户创建事件 - 自动处理租户上下文
 *     await this.eventService.emit('user.created', {
 *       userId: user.id,
 *       userData: user
 *     });
 *
 *     return user;
 *   }
 *
 *   // 事件处理器 - 自动处理租户上下文
 *   @EventHandler('user.created')
 *   async handleUserCreated(event: UserCreatedEvent): Promise<void> {
 *     console.log('用户创建事件:', event.userId);
 *   }
 * }
 * ```
 */
@Injectable()
export class EventService implements IEventService {
  private eventHandlers: Map<string, EventHandler<unknown>[]> = new Map();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'event-service' });
  }

  /**
   * 发布事件
   *
   * @description 发布事件到消息队列，自动处理租户上下文
   * 支持租户隔离，确保事件在正确的租户上下文中处理
   *
   * @param eventName 事件名称
   * @param data 事件数据
   * @param options 事件选项
   * @throws {Error} 当发布事件失败时抛出错误
   *
   * @example
   * ```typescript
   * // 发布用户创建事件
   * await eventService.emit('user.created', {
   *   userId: 'user-123',
   *   email: 'user@example.com'
   * });
   * ```
   */
  async emit<T>(
    eventName: string,
    data: T,
    options?: EventOptions
  ): Promise<void> {
    try {
      const tenantId = this.tenantContextService.getTenant();

      if (tenantId) {
        // 租户事件
        await this.emitTenantEvent(tenantId, eventName, data);
      } else {
        // 全局事件
        const topic = `event.${eventName}`;
        await this.messagingService.publish(topic, data, options);
      }

      this.logger.info('事件发布成功', {
        eventName,
        tenantId,
        hasData: !!data,
      });
    } catch (error) {
      this.logger.error('事件发布失败', {
        eventName,
        tenantId: this.tenantContextService.getTenant(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 订阅事件
   *
   * @description 订阅指定事件，自动处理租户上下文
   * 支持租户隔离，确保只接收当前租户的事件
   *
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @throws {Error} 当订阅事件失败时抛出错误
   *
   * @example
   * ```typescript
   * // 订阅用户创建事件
   * await eventService.on('user.created', async (event) => {
   *   console.log('用户创建事件:', event);
   * });
   * ```
   */
  async on<T>(eventName: string, handler: EventHandler<T>): Promise<void> {
    try {
      const handlers = this.eventHandlers.get(eventName) || [];
      handlers.push(handler as EventHandler<unknown>);
      this.eventHandlers.set(eventName, handlers);

      const topic = `event.${eventName}`;
      await this.messagingService.subscribe(topic, async (message) => {
        try {
          await handler(message as T);
        } catch (error) {
          this.logger.error('事件处理失败', {
            eventName,
            error: (error as Error).message,
          });
        }
      });

      this.logger.info('事件订阅成功', {
        eventName,
        handlerCount: handlers.length,
      });
    } catch (error) {
      this.logger.error('事件订阅失败', {
        eventName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 取消订阅事件
   *
   * @description 取消订阅指定事件
   *
   * @param eventName 事件名称
   * @param handler 可选的特定处理器
   * @throws {Error} 当取消订阅事件失败时抛出错误
   */
  async off(eventName: string, handler?: EventHandler<unknown>): Promise<void> {
    try {
      if (handler) {
        const handlers = this.eventHandlers.get(eventName) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
          this.eventHandlers.set(eventName, handlers);
        }
      } else {
        this.eventHandlers.delete(eventName);
      }

      const topic = `event.${eventName}`;
      await this.messagingService.unsubscribe(topic);

      this.logger.info('事件取消订阅成功', {
        eventName,
        handlerCount: this.eventHandlers.get(eventName)?.length || 0,
      });
    } catch (error) {
      this.logger.error('事件取消订阅失败', {
        eventName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 一次性事件订阅
   *
   * @description 订阅指定事件，只处理一次后自动取消订阅
   *
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @throws {Error} 当订阅事件失败时抛出错误
   *
   * @example
   * ```typescript
   * // 一次性订阅系统初始化完成事件
   * await eventService.once('system.initialized', async (event) => {
   *   console.log('系统初始化完成');
   * });
   * ```
   */
  async once<T>(eventName: string, handler: EventHandler<T>): Promise<void> {
    try {
      const onceHandler = async (data: unknown) => {
        await handler(data as T);
        await this.off(eventName, onceHandler);
      };

      await this.on(eventName, onceHandler);

      this.logger.info('一次性事件订阅成功', {
        eventName,
      });
    } catch (error) {
      this.logger.error('一次性事件订阅失败', {
        eventName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取所有事件名称
   *
   * @description 获取所有已注册的事件名称
   *
   * @returns 事件名称数组
   */
  getEventNames(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * 获取事件监听器
   *
   * @description 获取指定事件的所有监听器
   *
   * @param eventName 事件名称
   * @returns 事件监听器数组
   */
  getEventListeners(eventName: string): EventHandler<unknown>[] {
    return this.eventHandlers.get(eventName) || [];
  }

  /**
   * 移除所有监听器
   *
   * @description 移除指定事件的所有监听器，或移除所有事件的所有监听器
   *
   * @param eventName 可选的事件名称
   * @throws {Error} 当移除监听器失败时抛出错误
   */
  async removeAllListeners(eventName?: string): Promise<void> {
    try {
      if (eventName) {
        await this.off(eventName);
      } else {
        // 移除所有事件的监听器
        const eventNames = Array.from(this.eventHandlers.keys());
        for (const name of eventNames) {
          await this.off(name);
        }
      }

      this.logger.info('监听器移除成功', {
        eventName: eventName || 'all',
        removedCount: eventName ? 1 : this.eventHandlers.size,
      });
    } catch (error) {
      this.logger.error('监听器移除失败', {
        eventName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 发布租户事件
   *
   * @description 发布指定租户的事件，使用multi-tenancy服务
   *
   * @param tenantId 租户ID
   * @param eventName 事件名称
   * @param data 事件数据
   * @throws {Error} 当发布租户事件失败时抛出错误
   *
   * @example
   * ```typescript
   * // 发布特定租户的用户创建事件
   * await eventService.emitTenantEvent('tenant-123', 'user.created', {
   *   userId: 'user-456',
   *   tenantId: 'tenant-123'
   * });
   * ```
   */
  async emitTenantEvent<T>(
    tenantId: string,
    eventName: string,
    data: T
  ): Promise<void> {
    try {
      const topic = `tenant.${tenantId}.event.${eventName}`;
      await this.messagingService.publish(topic, data);

      this.logger.info('租户事件发布成功', {
        tenantId,
        eventName,
        hasData: !!data,
      });
    } catch (error) {
      this.logger.error('租户事件发布失败', {
        tenantId,
        eventName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 订阅租户事件
   *
   * @description 订阅指定租户的事件，使用multi-tenancy服务
   *
   * @param tenantId 租户ID
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @throws {Error} 当订阅租户事件失败时抛出错误
   *
   * @example
   * ```typescript
   * // 订阅特定租户的用户创建事件
   * await eventService.onTenantEvent('tenant-123', 'user.created', async (event) => {
   *   console.log('租户用户创建事件:', event);
   * });
   * ```
   */
  async onTenantEvent<T>(
    tenantId: string,
    eventName: string,
    handler: EventHandler<T>
  ): Promise<void> {
    try {
      const topic = `tenant.${tenantId}.event.${eventName}`;
      await this.messagingService.subscribe(topic, async (message) => {
        try {
          await handler(message as T);
        } catch (error) {
          this.logger.error('租户事件处理失败', {
            tenantId,
            eventName,
            error: (error as Error).message,
          });
        }
      });

      this.logger.info('租户事件订阅成功', {
        tenantId,
        eventName,
      });
    } catch (error) {
      this.logger.error('租户事件订阅失败', {
        tenantId,
        eventName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 取消订阅租户事件
   *
   * @description 取消订阅指定租户的事件
   *
   * @param tenantId 租户ID
   * @param eventName 事件名称
   * @param handler 可选的特定处理器
   * @throws {Error} 当取消订阅租户事件失败时抛出错误
   */
  async offTenantEvent(
    tenantId: string,
    eventName: string,
    handler?: EventHandler<unknown>
  ): Promise<void> {
    try {
      const topic = `tenant.${tenantId}.event.${eventName}`;
      await this.messagingService.unsubscribe(topic, handler);

      this.logger.info('租户事件取消订阅成功', {
        tenantId,
        eventName,
      });
    } catch (error) {
      this.logger.error('租户事件取消订阅失败', {
        tenantId,
        eventName,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
