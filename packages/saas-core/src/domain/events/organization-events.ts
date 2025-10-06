/**
 * 组织领域事件
 *
 * @description 定义组织相关的领域事件
 * 包括组织创建、更新、状态变更等事件
 *
 * ## 事件设计原则
 *
 * ### 事件命名规范
 * - 使用过去时态：OrganizationCreated, OrganizationUpdated
 * - 事件名称清晰表达业务含义
 * - 事件包含必要的业务数据
 *
 * ### 事件发布时机
 * - 聚合根状态变更时发布
 * - 业务规则验证通过后发布
 * - 事件包含完整的业务上下文
 *
 * @since 1.0.0
 */

import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { OrganizationType } from '../organization/value-objects/organization-type.vo';
import { 
  OrganizationCreatedEventData,
  OrganizationNameUpdatedEventData,
  OrganizationDescriptionUpdatedEventData,
  OrganizationActivatedEventData,
  OrganizationDeactivatedEventData,
  OrganizationDeletedEventData
} from '../types/event-data.types';

/**
 * 组织创建事件
 *
 * @description 当组织被创建时发布的事件
 * 包含组织的基本信息，用于后续的权限初始化和通知
 *
 * @since 1.0.0
 */
export class OrganizationCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly organizationId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string,
    public readonly type: OrganizationType,
    tenantId: EntityId
  ) {
    super(organizationId, 1, tenantId.toString());
  }

  get eventType(): string {
    return 'OrganizationCreated';
  }

  override get eventData(): OrganizationCreatedEventData {
    return {
      organizationId: this.organizationId.toString(),
      code: this.code,
      name: this.name,
      description: this.description,
      type: this.type,
      tenantId: this.tenantId
    };
  }
}

/**
 * 组织名称更新事件
 *
 * @description 当组织名称被更新时发布的事件
 * 用于组织变更审计
 *
 * @since 1.0.0
 */
export class OrganizationNameUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly organizationId: EntityId,
    public readonly newName: string,
    tenantId: string
  ) {
    super(organizationId, 1, tenantId);
  }

  get eventType(): string {
    return 'OrganizationNameUpdated';
  }

  override get eventData(): OrganizationNameUpdatedEventData {
    return {
      organizationId: this.organizationId.toString(),
      newName: this.newName
    };
  }
}

/**
 * 组织描述更新事件
 *
 * @description 当组织描述被更新时发布的事件
 * 用于组织变更审计
 *
 * @since 1.0.0
 */
export class OrganizationDescriptionUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly organizationId: EntityId,
    public readonly newDescription: string,
    tenantId: string
  ) {
    super(organizationId, 1, tenantId);
  }

  get eventType(): string {
    return 'OrganizationDescriptionUpdated';
  }

  override get eventData(): OrganizationDescriptionUpdatedEventData {
    return {
      organizationId: this.organizationId.toString(),
      newDescription: this.newDescription
    };
  }
}

/**
 * 组织激活事件
 *
 * @description 当组织被激活时发布的事件
 * 用于组织状态变更追踪
 *
 * @since 1.0.0
 */
export class OrganizationActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly organizationId: EntityId,
    tenantId: string
  ) {
    super(organizationId, 1, tenantId);
  }

  get eventType(): string {
    return 'OrganizationActivated';
  }

  override get eventData(): OrganizationActivatedEventData {
    return {
      organizationId: this.organizationId.toString()
    };
  }
}

/**
 * 组织停用事件
 *
 * @description 当组织被停用时发布的事件
 * 用于组织状态变更追踪
 *
 * @since 1.0.0
 */
export class OrganizationDeactivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly organizationId: EntityId,
    public readonly reason: string,
    tenantId: string
  ) {
    super(organizationId, 1, tenantId);
  }

  get eventType(): string {
    return 'OrganizationDeactivated';
  }

  override get eventData(): OrganizationDeactivatedEventData {
    return {
      organizationId: this.organizationId.toString(),
      reason: this.reason
    };
  }
}

/**
 * 组织删除事件
 *
 * @description 当组织被删除时发布的事件
 * 用于组织变更审计
 *
 * @since 1.0.0
 */
export class OrganizationDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly organizationId: EntityId,
    public readonly organizationCode: string,
    tenantId: string
  ) {
    super(organizationId, 1, tenantId);
  }

  get eventType(): string {
    return 'OrganizationDeleted';
  }

  override get eventData(): OrganizationDeletedEventData {
    return {
      organizationId: this.organizationId.toString(),
      organizationCode: this.organizationCode
    };
  }
}
