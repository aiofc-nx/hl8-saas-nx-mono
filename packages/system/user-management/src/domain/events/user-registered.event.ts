/**
 * 用户注册事件
 *
 * 当用户成功注册时触发的领域事件。
 *
 * @description 用户注册事件是用户聚合根发布的重要领域事件。
 * 当用户完成注册流程时，聚合根会发布此事件。
 * 事件包含用户注册的完整上下文信息。
 *
 * ## 业务规则
 *
 * ### 事件触发规则
 * - 用户完成注册流程后触发
 * - 用户状态从Pending变为Active时触发
 * - 事件发布是原子操作
 * - 事件包含完整的用户信息
 *
 * ### 事件数据规则
 * - 包含用户ID和邮箱信息
 * - 包含租户ID（如果适用）
 * - 包含注册时间戳
 * - 包含注册来源信息
 *
 * @example
 * ```typescript
 * // 事件发布
 * const event = new UserRegisteredEvent(
 *   userId,
 *   email,
 *   tenantId
 * );
 *
 * // 事件处理
 * @EventsHandler(UserRegisteredEvent)
 * export class UserRegisteredHandler {
 *   async handle(event: UserRegisteredEvent) {
 *     // 发送欢迎邮件
 *     await this.emailService.sendWelcomeEmail(event.email);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { UserId } from '../value-objects/user-id.vo';
import { Email } from '@hl8/hybrid-archi';
// 临时使用string类型，后续可以创建TenantId值对象
type TenantId = string;

/**
 * 用户注册事件
 *
 * @description 当用户成功注册时触发
 */
export class UserRegisteredEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @description 创建用户注册事件实例
   * @param userId - 用户ID
   * @param email - 用户邮箱
   * @param tenantId - 租户ID
   */
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    private readonly _eventTenantId?: TenantId
  ) {
    super(EntityId.fromString(userId.value), 1, _eventTenantId || '');
  }

  /**
   * 获取租户ID
   *
   * @description 重写基类的tenantId getter
   * @returns 租户ID
   */
  public override get tenantId(): string {
    return this._eventTenantId || '';
  }

  /**
   * 获取事件类型
   *
   * @description 返回事件的类型标识
   * @returns 事件类型
   */
  public override get eventType(): string {
    return 'UserRegistered';
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
      email: this.email.value,
      tenantId: this.tenantId,
      timestamp: this.occurredAt,
    };
  }
}
