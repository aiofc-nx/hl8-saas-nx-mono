import { BaseAggregateRoot, EntityId, BaseDomainEvent } from '@hl8/hybrid-archi';
import { ITenantContext } from '@hl8/multi-tenancy';
import { Organization } from '../entities/organization.entity';
import { OrganizationType } from '../value-objects/organization-type.vo';
import { OrganizationStatus } from '@hl8/hybrid-archi';
import { 
  OrganizationCreatedEvent, 
  OrganizationNameUpdatedEvent, 
  OrganizationDescriptionUpdatedEvent, 
  OrganizationActivatedEvent, 
  OrganizationDeactivatedEvent, 
  OrganizationDeletedEvent 
} from '../../events/organization-events';

/**
 * 组织聚合根
 *
 * @description 组织聚合的管理者，负责协调内部实体操作
 * 实现聚合根的管理职责：管理聚合一致性边界、协调内部实体操作、发布领域事件、验证业务规则
 *
 * ## 业务规则
 *
 * ### 聚合根职责
 * - 管理聚合一致性边界：确保组织聚合内数据一致性
 * - 协调内部实体操作：通过指令模式协调组织实体
 * - 发布领域事件：管理事件的生命周期
 * - 验证业务规则：确保业务规则的正确执行
 *
 * ### 指令模式实现
 * - 聚合根发出指令 → 实体执行指令 → 返回执行结果
 * - 聚合根不直接操作实体属性，而是调用实体的业务方法
 * - 实体执行具体业务逻辑，聚合根负责协调和事件发布
 *
 * @example
 * ```typescript
 * // 创建组织聚合根
 * const organizationAggregate = OrganizationAggregate.create(
 *   organizationId,
 *   'TECH_COMMITTEE',
 *   '技术委员会',
 *   '负责技术决策和标准制定',
 *   OrganizationType.COMMITTEE,
 *   tenantId
 * );
 * 
 * // 激活组织（聚合根协调实体）
 * organizationAggregate.activate();
 * 
 * // 获取组织实体
 * const organization = organizationAggregate.getOrganization();
 * ```
 *
 * @since 1.0.0
 */
export class OrganizationAggregate extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建组织聚合根实例
   * 聚合根包含组织实体，通过指令模式协调实体操作
   *
   * @param organizationId - 组织ID
   * @param organization - 组织实体
   */
  constructor(
    private readonly organizationId: EntityId,
    private readonly organization: Organization
  ) {
    super(organizationId, { createdBy: 'system' });
  }

  /**
   * 创建组织聚合根
   *
   * @description 工厂方法，创建新的组织聚合根
   * 组织初始状态为激活
   *
   * @param id - 组织ID
   * @param code - 组织代码
   * @param name - 组织名称
   * @param description - 组织描述
   * @param type - 组织类型
   * @param tenantId - 所属租户ID
   * @returns 组织聚合根实例
   *
   * @example
   * ```typescript
   * const organizationAggregate = OrganizationAggregate.create(
   *   organizationId,
   *   'TECH_COMMITTEE',
   *   '技术委员会',
   *   '负责技术决策和标准制定',
   *   OrganizationType.COMMITTEE,
   *   tenantId
   * );
   * ```
   *
   * @since 1.0.0
   */
  public static create(
    id: EntityId,
    code: string,
    name: string,
    description: string,
    type: OrganizationType,
    tenantId: EntityId,
    adminId: string
  ): OrganizationAggregate {
    // 1. 创建组织实体
    const organization = new Organization(
      id,
      tenantId,
      name,
      type,
      OrganizationStatus.PENDING, // 初始状态为待激活
      adminId,
      description
    );

    // 2. 创建聚合根
    const aggregate = new OrganizationAggregate(id, organization);
    
    // 3. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new OrganizationCreatedEvent(
      id,
      code,
      name,
      description,
      type,
      tenantId
    ));

    return aggregate;
  }

  /**
   * 更新组织名称
   *
   * @description 聚合根协调内部实体执行名称更新操作
   * 指令模式：聚合根发出指令给实体，实体执行具体业务逻辑
   *
   * @param newName - 新的组织名称
   *
   * @example
   * ```typescript
   * organizationAggregate.updateName('新的组织名称');
   * ```
   *
   * @since 1.0.0
   */
  public updateName(newName: string): void {
    // 指令模式：聚合根发出指令给实体
    this.organization.updateName(newName);
    
    // 发布领域事件（聚合根职责）- 包含租户上下文
    this.addTenantEvent(new OrganizationNameUpdatedEvent(
      this.organizationId, 
      newName, 
      this.organization.getTenantId().toString()
    ));
  }

  /**
   * 更新组织描述
   *
   * @description 聚合根协调内部实体执行描述更新操作
   *
   * @param newDescription - 新的描述
   *
   * @example
   * ```typescript
   * organizationAggregate.updateDescription('新的组织描述');
   * ```
   *
   * @since 1.0.0
   */
  public updateDescription(newDescription: string): void {
    // 指令模式：聚合根发出指令给实体
    this.organization.updateDescription(newDescription);
    
    // 发布领域事件（聚合根职责）- 包含租户上下文
    this.addTenantEvent(new OrganizationDescriptionUpdatedEvent(
      this.organizationId, 
      newDescription, 
      this.organization.getTenantId().toString()
    ));
  }

  /**
   * 激活组织
   *
   * @description 聚合根协调内部实体执行组织激活操作
   *
   * @example
   * ```typescript
   * organizationAggregate.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    // 指令模式：聚合根发出指令给实体
    this.organization.activate();
    
    // 发布领域事件（聚合根职责）- 包含租户上下文
    this.addTenantEvent(new OrganizationActivatedEvent(
      this.organizationId, 
      this.organization.getTenantId().toString()
    ));
  }

  /**
   * 停用组织
   *
   * @description 聚合根协调内部实体执行组织停用操作
   *
   * @param reason - 停用原因
   * @example
   * ```typescript
   * organizationAggregate.disable('组织重组');
   * ```
   *
   * @since 1.0.0
   */
  public disable(reason: string): void {
    // 指令模式：聚合根发出指令给实体
    this.organization.disable(reason);
    
    // 发布领域事件（聚合根职责）- 包含租户上下文
    this.addTenantEvent(new OrganizationDeactivatedEvent(
      this.organizationId, 
      reason, 
      this.organization.getTenantId().toString()
    ));
  }

  /**
   * 删除组织
   *
   * @description 聚合根协调内部实体执行组织删除操作
   *
   * @example
   * ```typescript
   * organizationAggregate.delete();
   * ```
   *
   * @since 1.0.0
   */
  public delete(): void {
    // 发布领域事件（聚合根职责）- 包含租户上下文
    this.addTenantEvent(new OrganizationDeletedEvent(
      this.organizationId,
      this.organization.getName(),
      this.organization.getTenantId().toString()
    ));
  }

  /**
   * 获取组织实体
   *
   * @description 聚合根管理内部实体访问
   * 外部只能通过聚合根访问内部实体
   *
   * @returns 组织实体
   *
   * @example
   * ```typescript
   * const organization = organizationAggregate.getOrganization();
   * const isActive = organization.isActive();
   * ```
   *
   * @since 1.0.0
   */
  public getOrganization(): Organization {
    return this.organization;
  }

  /**
   * 获取组织ID
   *
   * @description 获取聚合根的标识符
   *
   * @returns 组织ID
   *
   * @since 1.0.0
   */
  public getOrganizationId(): EntityId {
    return this.organizationId;
  }

  /**
   * 从事件流重建聚合状态
   *
   * @description 事件溯源支持：从历史事件重建聚合状态
   * 这是事件溯源架构的核心功能，允许从事件流完全重建聚合状态
   *
   * @param events - 历史事件列表
   * @returns 重建的聚合根实例
   *
   * @example
   * ```typescript
   * const events = await eventStore.getEvents(organizationId);
   * const aggregate = OrganizationAggregate.fromEvents(events);
   * ```
   *
   * @since 1.0.0
   */
  public static fromEvents(events: BaseDomainEvent[]): OrganizationAggregate {
    if (events.length === 0) {
      throw new EmptyEventStreamException('事件流不能为空');
    }

    // 按事件版本排序
    const sortedEvents = events.sort((a, b) => a.aggregateVersion - b.aggregateVersion);
    
    // 获取第一个事件（创建事件）来初始化聚合
    const firstEvent = sortedEvents[0];
    if (!(firstEvent instanceof OrganizationCreatedEvent)) {
      throw new InvalidEventStreamException('第一个事件必须是组织创建事件');
    }

    // 创建组织实体
    const organization = new Organization(
      firstEvent.organizationId,
      EntityId.fromString(firstEvent.tenantId),
      firstEvent.name,
      firstEvent.type,
      OrganizationStatus.PENDING, // 初始状态
      'system', // 默认管理员
      firstEvent.description
    );

    // 创建聚合根
    const aggregate = new OrganizationAggregate(firstEvent.organizationId, organization);

    // 应用后续事件
    for (let i = 1; i < sortedEvents.length; i++) {
      aggregate.applyEvent(sortedEvents[i]);
    }

    // 清除未提交事件（这些是历史事件）
    aggregate.clearUncommittedEvents();

    return aggregate;
  }

  /**
   * 应用领域事件
   *
   * @description 事件溯源支持：应用单个事件到聚合状态
   * 根据事件类型更新聚合内部状态
   *
   * @param event - 要应用的领域事件
   *
   * @since 1.0.0
   */
  protected override applyEvent(event: BaseDomainEvent): void {
    if (event instanceof OrganizationNameUpdatedEvent) {
      this.organization.updateName(event.newName);
    } else if (event instanceof OrganizationDescriptionUpdatedEvent) {
      this.organization.updateDescription(event.newDescription);
    } else if (event instanceof OrganizationActivatedEvent) {
      this.organization.activate();
    } else if (event instanceof OrganizationDeactivatedEvent) {
      this.organization.disable(event.reason);
    } else if (event instanceof OrganizationDeletedEvent) {
      // 删除事件的处理逻辑
      // 这里可以标记聚合为已删除状态
    }
  }

  /**
   * 获取聚合快照
   *
   * @description 事件溯源支持：创建聚合状态的快照
   * 快照用于优化性能，避免从所有事件重建状态
   *
   * @returns 聚合快照数据
   *
   * @example
   * ```typescript
   * const snapshot = aggregate.createSnapshot();
   * await snapshotStore.save(aggregate.getId(), snapshot);
   * ```
   *
   * @since 1.0.0
   */
  public createSnapshot(): OrganizationSnapshot {
    return {
      organizationId: this.organizationId.toString(),
      tenantId: this.organization.getTenantId().toString(),
      name: this.organization.getName(),
      type: this.organization.getType(),
      status: this.organization.getStatus(),
      adminId: this.organization.getAdminId(),
      description: this.organization.getDescription(),
      managedDepartmentIds: this.organization.getManagedDepartmentIds(),
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 从快照重建聚合
   *
   * @description 事件溯源支持：从快照重建聚合状态
   * 这是性能优化机制，避免从所有事件重建状态
   *
   * @param snapshot - 聚合快照
   * @returns 重建的聚合根实例
   *
   * @example
   * ```typescript
   * const snapshot = await snapshotStore.get(organizationId);
   * const aggregate = OrganizationAggregate.fromSnapshot(snapshot);
   * ```
   *
   * @since 1.0.0
   */
  public static fromSnapshot(snapshot: OrganizationSnapshot): OrganizationAggregate {
    // 创建组织实体
    const organization = new Organization(
      EntityId.fromString(snapshot.organizationId),
      EntityId.fromString(snapshot.tenantId),
      snapshot.name,
      snapshot.type,
      snapshot.status,
      snapshot.adminId,
      snapshot.description,
      snapshot.managedDepartmentIds
    );

    // 创建聚合根
    const aggregate = new OrganizationAggregate(
      EntityId.fromString(snapshot.organizationId),
      organization
    );

    // 注意：版本和时间戳在构造函数中已经设置，这里不需要再次设置

    return aggregate;
  }

  /**
   * 验证事件版本连续性
   *
   * @description 事件溯源支持：验证事件流的版本连续性
   * 确保事件流没有缺失或重复的事件
   *
   * @param events - 事件列表
   * @returns 是否版本连续
   *
   * @since 1.0.0
   */
  public static validateEventStream(events: BaseDomainEvent[]): boolean {
    if (events.length === 0) {
      return true;
    }

    const sortedEvents = events.sort((a, b) => a.aggregateVersion - b.aggregateVersion);
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      if (sortedEvents[i + 1].aggregateVersion !== sortedEvents[i].aggregateVersion + 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * 添加租户事件
   *
   * @description 多租户支持：确保领域事件包含租户上下文
   * 这是多租户架构的关键功能，确保事件在正确的租户边界内处理
   *
   * @param event - 领域事件
   *
   * @example
   * ```typescript
   * this.addTenantEvent(new OrganizationActivatedEvent(this.organizationId));
   * ```
   *
   * @since 1.0.0
   */
  private addTenantEvent(event: BaseDomainEvent): void {
    // 租户上下文将由 BaseAggregateRoot.addDomainEvent 自动处理
    // 添加事件到聚合根
    this.addDomainEvent(event);
  }

  /**
   * 验证租户边界
   *
   * @description 多租户支持：验证操作是否在正确的租户边界内
   * 防止跨租户的数据泄露和操作
   *
   * @param tenantId - 租户ID
   * @throws {CrossTenantOperationException} 当跨租户操作时抛出异常
   *
   * @since 1.0.0
   */
  private validateTenantBoundary(tenantId: EntityId): void {
    if (!this.organization.getTenantId().equals(tenantId)) {
      throw new CrossTenantOperationException(
        `跨租户操作被拒绝：当前租户 ${this.organization.getTenantId().toString()}，请求租户 ${tenantId.toString()}`
      );
    }
  }

  /**
   * 获取租户上下文
   *
   * @description 多租户支持：获取聚合的租户上下文信息
   * 用于事件处理和权限验证
   *
   * @returns 租户上下文
   *
   * @since 1.0.0
   */
  public override getTenantContext(): ITenantContext | null {
    return {
      tenantId: this.organization.getTenantId().toString(),
      timestamp: new Date()
    };
  }
}

/**
 * 组织聚合快照
 *
 * @description 用于事件溯源的聚合状态快照
 * 包含聚合的完整状态信息，用于性能优化
 *
 * @since 1.0.0
 */
export interface OrganizationSnapshot {
  organizationId: string;
  tenantId: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  adminId: string;
  description: string;
  managedDepartmentIds: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 空事件流异常
 *
 * @description 当尝试从空事件流重建聚合时抛出
 *
 * @since 1.0.0
 */
export class EmptyEventStreamException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmptyEventStreamException';
  }
}

/**
 * 无效事件流异常
 *
 * @description 当事件流格式不正确时抛出
 *
 * @since 1.0.0
 */
export class InvalidEventStreamException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEventStreamException';
  }
}

/**
 * 跨租户操作异常
 *
 * @description 当尝试跨租户操作时抛出
 *
 * @since 1.0.0
 */
export class CrossTenantOperationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrossTenantOperationException';
  }
}

/**
 * 租户上下文
 *
 * @description 多租户支持：定义租户上下文信息
 * 包含租户和组织的基本信息，用于事件处理和权限验证
 *
 * @since 1.0.0
 */
export interface TenantContext {
  /** 租户ID */
  tenantId: string;
  /** 组织ID */
  organizationId: string;
  /** 组织名称 */
  organizationName: string;
  /** 组织类型 */
  organizationType: OrganizationType;
}

