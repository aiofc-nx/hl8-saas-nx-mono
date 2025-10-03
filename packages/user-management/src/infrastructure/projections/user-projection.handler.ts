/**
 * 用户投影处理器
 *
 * @description 处理用户领域事件，更新读模型
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { IEventHandler } from '@hl8/hybrid-archi';
import { IUserReadModelRepository } from './user-read-model.repository.interface';
import { UserReadModel } from './user-read-model.repository.interface';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { UserProfileUpdatedEvent } from '../../domain/events/user-profile-updated.event';
import { UserAssignedToTenantEvent } from '../../domain/events/user-assigned-to-tenant.event';
import { UserDisabledEvent } from '../../domain/events/user-disabled.event';
import { UserEnabledEvent } from '../../domain/events/user-enabled.event';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';

/**
 * 用户投影处理器
 *
 * @description 处理用户领域事件，更新读模型
 *
 * ## 业务规则
 *
 * ### 投影处理职责
 * - 处理用户领域事件
 * - 更新读模型数据
 * - 维护数据一致性
 * - 支持事件重放
 *
 * ### 事件处理规则
 * - 幂等性处理
 * - 错误恢复
 * - 性能优化
 * - 数据验证
 */
@Injectable()
export class UserProjectionHandler
  implements
    IEventHandler<
      | UserRegisteredEvent
      | UserProfileUpdatedEvent
      | UserAssignedToTenantEvent
      | UserDisabledEvent
      | UserEnabledEvent
      | UserDeletedEvent
    >
{
  constructor(
    private readonly userReadModelRepository: IUserReadModelRepository // TODO: 注入其他依赖 // private readonly logger: ILoggerService,
  ) // private readonly cacheService: ICacheService
  {}

  /**
   * 处理用户注册事件
   *
   * @description 处理用户注册事件，创建读模型
   * @param event - 用户注册事件
   */
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    try {
      const userReadModel: UserReadModel = {
        id: event.userId.value,
        email: event.email.value,
        username: '', // 需要从其他事件获取
        firstName: '', // 需要从其他事件获取
        lastName: '', // 需要从其他事件获取
        status: 'pending',
        tenantId: event.tenantId,
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
      };

      await this.userReadModelRepository.createUser(userReadModel);

      console.log('User read model created for registered event', {
        userId: event.userId.value,
        email: event.email.value,
      });
    } catch (error) {
      console.error('Failed to handle user registered event', {
        userId: event.userId.value,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理用户配置文件更新事件
   *
   * @description 处理用户配置文件更新事件，更新读模型
   * @param event - 用户配置文件更新事件
   */
  async handleUserProfileUpdated(
    event: UserProfileUpdatedEvent
  ): Promise<void> {
    try {
      const updates: Partial<UserReadModel> = {
        firstName: event.profile.firstName,
        lastName: event.profile.lastName,
        avatar: event.profile.avatar,
        phone: event.profile.phone,
        updatedAt: event.occurredAt,
      };

      await this.userReadModelRepository.updateUser(
        event.userId.value,
        updates
      );

      console.log('User read model updated for profile updated event', {
        userId: event.userId.value,
        updates,
      });
    } catch (error) {
      console.error('Failed to handle user profile updated event', {
        userId: event.userId.value,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理用户分配到租户事件
   *
   * @description 处理用户分配到租户事件，更新读模型
   * @param event - 用户分配到租户事件
   */
  async handleUserAssignedToTenant(
    event: UserAssignedToTenantEvent
  ): Promise<void> {
    try {
      const updates: Partial<UserReadModel> = {
        tenantId: event.tenantId,
        updatedAt: event.occurredAt,
      };

      await this.userReadModelRepository.updateUser(
        event.userId.value,
        updates
      );

      console.log('User read model updated for assigned to tenant event', {
        userId: event.userId.value,
        tenantId: event.tenantId,
      });
    } catch (error) {
      console.error('Failed to handle user assigned to tenant event', {
        userId: event.userId.value,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理用户禁用事件
   *
   * @description 处理用户禁用事件，更新读模型
   * @param event - 用户禁用事件
   */
  async handleUserDisabled(event: UserDisabledEvent): Promise<void> {
    try {
      const updates: Partial<UserReadModel> = {
        status: 'disabled',
        updatedAt: event.occurredAt,
      };

      await this.userReadModelRepository.updateUser(
        event.userId.value,
        updates
      );

      console.log('User read model updated for disabled event', {
        userId: event.userId.value,
      });
    } catch (error) {
      console.error('Failed to handle user disabled event', {
        userId: event.userId.value,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理用户启用事件
   *
   * @description 处理用户启用事件，更新读模型
   * @param event - 用户启用事件
   */
  async handleUserEnabled(event: UserEnabledEvent): Promise<void> {
    try {
      const updates: Partial<UserReadModel> = {
        status: 'active',
        updatedAt: event.occurredAt,
      };

      await this.userReadModelRepository.updateUser(
        event.userId.value,
        updates
      );

      console.log('User read model updated for enabled event', {
        userId: event.userId.value,
      });
    } catch (error) {
      console.error('Failed to handle user enabled event', {
        userId: event.userId.value,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理用户删除事件
   *
   * @description 处理用户删除事件，更新读模型
   * @param event - 用户删除事件
   */
  async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    try {
      await this.userReadModelRepository.deleteUser(event.userId.value);

      console.log('User read model deleted for deleted event', {
        userId: event.userId.value,
      });
    } catch (error) {
      console.error('Failed to handle user deleted event', {
        userId: event.userId.value,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 处理领域事件
   *
   * @description 处理用户领域事件，更新读模型
   * @param event - 领域事件
   */
  async handle(event: any): Promise<void> {
    try {
      switch (event.eventType) {
        case 'UserRegistered':
          await this.handleUserRegistered(event as UserRegisteredEvent);
          break;
        case 'UserProfileUpdated':
          await this.handleUserProfileUpdated(event as UserProfileUpdatedEvent);
          break;
        case 'UserAssignedToTenant':
          await this.handleUserAssignedToTenant(
            event as UserAssignedToTenantEvent
          );
          break;
        case 'UserDisabled':
          await this.handleUserDisabled(event as UserDisabledEvent);
          break;
        case 'UserEnabled':
          await this.handleUserEnabled(event as UserEnabledEvent);
          break;
        case 'UserDeleted':
          await this.handleUserDeleted(event as UserDeletedEvent);
          break;
        default:
          console.warn(`Unknown event type: ${event.eventType}`);
      }
    } catch (error) {
      console.error('Failed to handle domain event', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取处理器名称
   *
   * @description 获取事件处理器的名称
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return 'UserProjectionHandler';
  }
}
