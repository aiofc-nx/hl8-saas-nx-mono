/**
 * 租户降级事件
 *
 * @description 当租户类型降级时发布的领域事件
 *
 * ## 业务规则
 *
 * ### 事件触发时机
 * - 租户从高级别降级到低级别
 * - 配额同步缩减
 * - 需要验证现有数据不超限
 *
 * ### 事件用途
 * - 通知租户降级
 * - 发送降级通知邮件
 * - 更新计费系统
 * - 触发数据清理（如果超限）
 *
 * @class TenantDowngradedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { TenantType } from '../value-objects/tenant-type.enum';

/**
 * 租户降级事件
 *
 * @class TenantDowngradedEvent
 * @extends {BaseDomainEvent}
 */
export class TenantDowngradedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param {EntityId} aggregateId - 聚合根ID（租户ID）
   * @param {number} version - 聚合根版本号
   * @param {EntityId} tenantId - 租户ID
   * @param {TenantType} fromType - 原类型
   * @param {TenantType} toType - 新类型
   * @param {string} [reason] - 降级原因
   */
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly fromType: TenantType,
    public readonly toType: TenantType,
    public readonly reason?: string,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'TenantDowngraded';
  }

  /**
   * 转换为 JSON
   *
   * @returns {object} 事件数据对象
   */
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      fromType: this.fromType,
      toType: this.toType,
      reason: this.reason,
    };
  }
}

