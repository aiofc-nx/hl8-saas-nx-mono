/**
 * 租户升级事件
 *
 * @description 当租户类型升级时发布的领域事件
 *
 * ## 业务规则
 *
 * ### 事件触发时机
 * - 租户从低级别升级到高级别
 * - 配额同步更新
 * - 功能权限扩展
 *
 * ### 事件用途
 * - 通知租户升级成功
 * - 发送升级确认邮件
 * - 更新计费系统
 * - 记录升级历史
 *
 * @class TenantUpgradedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { TenantType } from '../value-objects/tenant-type.enum';

/**
 * 租户升级事件
 *
 * @class TenantUpgradedEvent
 * @extends {BaseDomainEvent}
 */
export class TenantUpgradedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param {EntityId} aggregateId - 聚合根ID（租户ID）
   * @param {number} version - 聚合根版本号
   * @param {EntityId} tenantId - 租户ID
   * @param {TenantType} fromType - 原类型
   * @param {TenantType} toType - 新类型
   */
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly fromType: TenantType,
    public readonly toType: TenantType,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'TenantUpgraded';
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
    };
  }
}

