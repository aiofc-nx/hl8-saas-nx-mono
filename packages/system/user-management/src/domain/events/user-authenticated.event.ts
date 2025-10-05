/**
 * 用户认证事件
 *
 * 当用户成功认证时触发的领域事件。
 *
 * @description 用户认证事件是用户聚合根发布的重要领域事件。
 * 当用户成功通过认证时，聚合根会发布此事件。
 * 事件包含用户认证的上下文信息。
 *
 * ## 业务规则
 *
 * ### 事件触发规则
 * - 用户成功认证后触发
 * - 认证失败不触发事件
 * - 事件发布是原子操作
 * - 事件包含认证上下文
 *
 * ### 事件数据规则
 * - 包含用户ID信息
 * - 包含认证时间戳
 * - 包含认证来源信息
 * - 不包含敏感信息
 *
 * @example
 * ```typescript
 * // 事件发布
 * const event = new UserAuthenticatedEvent(userId);
 *
 * // 事件处理
 * @EventsHandler(UserAuthenticatedEvent)
 * export class UserAuthenticatedHandler {
 *   async handle(event: UserAuthenticatedEvent) {
 *     // 记录登录日志
 *     await this.auditService.logUserLogin(event.userId);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';

/**
 * 用户认证事件
 *
 * @description 当用户成功认证时触发
 */
export class UserAuthenticatedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @description 创建用户认证事件实例
   * @param userId - 用户ID
   */
  constructor(public readonly userId: UserId) {
    super(EntityId.fromString(userId.value), 1, '');
  }

  /**
   * 获取事件类型
   *
   * @description 返回事件的类型标识
   * @returns 事件类型
   */
  public override get eventType(): string {
    return 'UserAuthenticated';
  }

  /**
   * 获取事件版本
   *
   * @description 返回事件的版本号
   * @returns 事件版本
   */
  public getEventVersion(): number {
    return 1;
  }

  /**
   * 获取事件数据
   *
   * @description 返回事件的序列化数据
   * @returns 事件数据
   */
  public getEventData(): object {
    return {
      userId: this.userId.value,
      timestamp: this.occurredAt,
    };
  }
}
