/**
 * 租户创建事件
 *
 * @description 当新租户被创建时发布的领域事件
 *
 * ## 业务规则
 *
 * ### 事件触发时机
 * - 租户聚合根创建成功后
 * - 租户配置和配额已设置
 * - 初始状态为 TRIAL
 *
 * ### 事件用途
 * - 通知其他子系统新租户创建
 * - 触发欢迎邮件发送
 * - 创建默认组织和根部门
 * - 记录审计日志
 *
 * @example
 * ```typescript
 * const event = new TenantCreatedEvent(
 *   aggregateId,
 *   1,
 *   tenantId,
 *   tenantCode,
 *   tenantName,
 *   tenantType
 * );
 * ```
 *
 * @class TenantCreatedEvent
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { TenantType } from '../value-objects/tenant-type.enum';

/**
 * 租户创建事件
 *
 * @class TenantCreatedEvent
 * @extends {BaseDomainEvent}
 */
export class TenantCreatedEvent extends BaseDomainEvent {
  /**
   * 构造函数
   *
   * @param {EntityId} aggregateId - 聚合根ID（租户ID）
   * @param {number} version - 聚合根版本号
   * @param {EntityId} tenantId - 租户ID
   * @param {string} code - 租户代码
   * @param {string} name - 租户名称
   * @param {TenantType} type - 租户类型
   */
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'TenantCreated';
  }

  /**
   * 转换为 JSON
   *
   * @returns {object} 事件数据对象
   */
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      code: this.code,
      name: this.name,
      type: this.type,
    };
  }
}

