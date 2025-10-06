/**
 * 租户创建事件
 *
 * @description 当租户被创建时发布的领域事件
 * 表示租户聚合根的生命周期开始
 *
 * ## 业务规则
 *
 * ### 事件触发条件
 * - 租户聚合根创建成功
 * - 租户基本信息验证通过
 * - 租户管理员分配完成
 *
 * ### 事件数据规则
 * - 租户ID必须有效
 * - 租户代码必须唯一
 * - 租户名称不能为空
 * - 租户类型必须有效
 * - 管理员ID必须有效
 *
 * @example
 * ```typescript
 * // 在聚合根中发布事件
 * this.addDomainEvent(new TenantCreatedEvent(
 *   this.tenantId,
 *   this.tenant.getCode(),
 *   this.tenant.getName(),
 *   this.tenant.getType(),
 *   this.tenant.getAdminId()
 * ));
 * ```
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { TenantType } from '@hl8/hybrid-archi';

/**
 * 租户创建事件
 *
 * @description 租户创建时发布的领域事件
 */
export class TenantCreatedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param aggregateId - 租户聚合根ID
   * @param aggregateVersion - 聚合根版本
   * @param tenantId - 租户ID（用于多租户隔离）
   * @param code - 租户代码
   * @param name - 租户名称
   * @param type - 租户类型
   * @param adminId - 管理员ID
   */
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly adminId: string
  ) {
    super(aggregateId, aggregateVersion, tenantId, 1);
  }

  /**
   * 获取事件类型
   *
   * @description 返回事件的类型标识
   *
   * @returns 事件类型
   *
   * @since 1.0.0
   */
  public get eventType(): string {
    return 'TenantCreated';
  }

  /**
   * 获取事件数据
   *
   * @description 返回事件的所有数据
   *
   * @returns 事件数据对象
   *
   * @since 1.0.0
   */
  public override get eventData(): Record<string, unknown> {
    return {
      code: this.code,
      name: this.name,
      type: this.type,
      adminId: this.adminId
    };
  }
}
