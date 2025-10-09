/**
 * 租户感知聚合根基类
 *
 * 为多租户SAAS应用提供租户相关的通用功能。
 * 所有需要多租户支持的聚合根都应继承此类。
 *
 * ## 通用功能
 *
 * ### 租户验证
 * - 自动验证租户ID的有效性
 * - 确保聚合根必须属于某个租户
 * - 提供租户上下文访问方法
 *
 * ### 租户事件
 * - 简化租户相关事件的创建
 * - 自动注入租户ID到领域事件
 * - 支持租户级别的事件过滤
 *
 * ### 租户业务规则
 * - 验证操作者是否属于同一租户
 * - 检查租户状态是否允许操作
 * - 支持跨租户操作的权限检查
 *
 * @description 为多租户SAAS应用提供聚合根级别的租户功能支持。
 * 整合 multi-tenancy 模块的租户上下文服务，提供租户验证、租户事件发布、
 * 租户日志记录等通用功能，为业务聚合根提供统一的租户能力。
 *
 * ## 业务规则
 *
 * ### 租户上下文规则
 * - 聚合根必须在租户上下文中创建和操作
 * - 租户ID在聚合根生命周期内不可变更
 * - 租户上下文验证应在操作入口统一执行
 * - 租户上下文信息包含在所有日志和事件中
 *
 * ### 租户一致性规则
 * - 聚合内部的所有实体必须属于同一租户
 * - 跨聚合操作时必须验证租户一致性
 * - 禁止跨租户的数据访问和操作
 * - 租户一致性检查应在业务逻辑执行前完成
 *
 * ### 租户事件规则
 * - 所有领域事件必须包含租户ID
 * - 租户事件自动注入聚合根ID、版本号、租户ID
 * - 租户事件用于租户级别的审计和追踪
 * - 租户事件发布遵循事务一致性
 *
 * ### 租户日志规则
 * - 所有租户操作必须记录日志
 * - 日志包含租户ID、聚合根ID、操作类型等信息
 * - 日志用于审计、调试和性能分析
 * - 敏感信息不应出现在日志中
 *
 * ## 业务逻辑流程
 *
 * 1. **聚合根创建**：验证租户上下文 → 创建聚合根实例 → 发布创建事件
 * 2. **业务操作**：验证租户上下文 → 验证租户一致性 → 执行业务逻辑 → 发布事件
 * 3. **跨聚合操作**：验证租户一致性 → 协调聚合间交互 → 发布事件
 * 4. **租户切换**：验证切换权限 → 更新租户上下文 → 记录审计日志
 *
 * @example
 * ```typescript
 * // 租户聚合根示例
 * export class TenantAggregate extends TenantAwareAggregateRoot {
 *   private _tenant: Tenant;
 *
 *   constructor(
 *     id: EntityId,
 *     tenant: Tenant,
 *     auditInfo: IPartialAuditInfo,
 *     logger?: PinoLogger
 *   ) {
 *     super(id, auditInfo, logger);
 *     this._tenant = tenant;
 *   }
 *
 *   public updateName(name: string, updatedBy: string): void {
 *     // ✅ 自动验证租户上下文
 *     this.ensureTenantContext();
 *
 *     // 执行业务逻辑
 *     this._tenant.updateName(name, updatedBy);
 *
 *     // ✅ 简化事件创建（自动注入tenantId）
 *     this.publishTenantEvent((id, version, tenantId) =>
 *       new TenantNameUpdatedEvent(id, version, tenantId, name)
 *     );
 *   }
 *
 *   public addUser(userId: EntityId, userTenantId: EntityId): void {
 *     // ✅ 验证租户一致性
 *     this.ensureSameTenant(userTenantId, 'User');
 *
 *     // 执行业务逻辑
 *     // ...
 *   }
 * }
 *
 * // 用户聚合根示例
 * export class UserAggregate extends TenantAwareAggregateRoot {
 *   private _user: User;
 *
 *   public assignRole(roleId: EntityId, role: Role): void {
 *     // ✅ 验证角色属于同一租户
 *     this.ensureSameTenant(role.tenantId, 'Role');
 *
 *     // 执行业务逻辑
 *     this._user.assignRole(roleId);
 *
 *     // ✅ 发布租户事件
 *     this.publishTenantEvent((id, version, tenantId) =>
 *       new UserRoleAssignedEvent(id, version, tenantId, roleId)
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.1.0
 */

import { EntityId } from '../../value-objects/entity-id';
import { IPartialAuditInfo } from '../../entities/base/audit-info';
import { PinoLogger } from '@hl8/logger';
import { BaseAggregateRoot } from './base-aggregate-root';
import { BaseDomainEvent } from '../../events/base/base-domain-event';
import {
  GeneralBadRequestException,
} from '@hl8/common';

/**
 * 租户感知聚合根基类
 *
 * @description 为多租户SAAS应用提供聚合根级别的租户功能支持
 *
 * ## 核心功能
 *
 * ### 1. 租户验证
 * - ensureTenantContext(): 确保租户上下文存在
 * - ensureSameTenant(): 确保实体属于同一租户
 *
 * ### 2. 租户事件
 * - publishTenantEvent(): 简化租户事件的创建和发布
 *
 * ### 3. 租户日志
 * - logTenantOperation(): 记录包含租户信息的日志
 *
 * ### 4. 租户检查
 * - belongsToTenant(): 检查是否属于指定租户
 * - getTenantId(): 获取租户ID
 *
 * @example
 * ```typescript
 * export class OrderAggregate extends TenantAwareAggregateRoot {
 *   public addProduct(productId: EntityId, productTenantId: EntityId): void {
 *     this.ensureTenantContext();
 *     this.ensureSameTenant(productTenantId, 'Product');
 *     // 业务逻辑...
 *   }
 * }
 * ```
 */
export abstract class TenantAwareAggregateRoot extends BaseAggregateRoot {
  /**
   * 构造函数
   *
   * @description 创建租户感知聚合根实例，验证租户上下文的有效性
   *
   * ## 业务规则
   *
   * ### 租户ID验证规则
   * - 租户ID必须存在且有效
   * - 租户ID格式必须符合EntityId规范
   * - 租户ID在聚合根生命周期内不可变更
   * - 租户ID验证失败时抛出明确异常
   *
   * ### 初始化规则
   * - 聚合根创建时立即验证租户上下文
   * - 租户ID来自审计信息（auditInfo.tenantId）
   * - 日志记录器可选，默认使用全局日志
   * - 初始化失败时抛出异常，防止创建无效聚合根
   *
   * @param id - 聚合根唯一标识符
   * @param auditInfo - 审计信息（必须包含有效的tenantId）
   * @param logger - 日志记录器（可选）
   *
   * @throws {GeneralBadRequestException} 当租户上下文无效时
   *
   * @example
   * ```typescript
   * const aggregate = new TenantAggregate(
   *   EntityId.generate(),
   *   { tenantId: EntityId.fromString('tenant-123'), createdBy: 'user-456' },
   *   logger
   * );
   * ```
   */
  protected constructor(
    id: EntityId,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);

    // 验证租户ID必须存在
    this.ensureTenantContext();
  }

  /**
   * 确保租户上下文存在
   *
   * @description 验证聚合根必须关联到有效的租户。
   * 此方法应在所有租户敏感操作的入口处调用，确保操作在租户上下文中执行。
   *
   * ## 业务规则
   *
   * ### 验证规则
   * - 租户ID不能为null或undefined
   * - 租户ID的value不能为空字符串
   * - 租户ID的value不能只包含空白字符
   * - 验证失败时抛出明确的异常，包含上下文信息
   *
   * ### 调用时机
   * - 聚合根构造函数中自动调用
   * - 所有租户敏感操作的入口处调用
   * - 跨租户操作前必须调用
   * - 可以在业务方法开始时调用以确保安全
   *
   * ### 异常处理
   * - 抛出 GeneralBadRequestException 异常
   * - 异常消息清晰描述问题原因
   * - 异常详情包含聚合根类型和ID
   * - 便于调试和问题追踪
   *
   * @throws {GeneralBadRequestException} 当租户ID无效时
   *
   * @protected
   *
   * @example
   * ```typescript
   * export class TenantAggregate extends TenantAwareAggregateRoot {
   *   public updateTenant(name: string): void {
   *     // 确保在租户上下文中执行
   *     this.ensureTenantContext();
   *
   *     // 执行业务逻辑
   *     this._tenant.updateName(name);
   *   }
   * }
   * ```
   */
  protected ensureTenantContext(): void {
    if (
      !this.tenantId ||
      !this.tenantId.value ||
      this.tenantId.value.trim() === ''
    ) {
      throw new GeneralBadRequestException(
        'Tenant context required',
        '租户上下文缺失，所有操作必须在租户上下文中执行',
        {
          aggregateType: this.constructor.name,
          aggregateId: this.id.toString(),
          reason: 'Missing or invalid tenant ID',
        }
      );
    }
  }

  /**
   * 确保实体属于同一租户
   *
   * @description 验证另一个实体或ID是否属于同一租户。
   * 用于跨实体操作时的租户隔离验证，防止跨租户数据访问和操作。
   *
   * ## 业务规则
   *
   * ### 租户一致性规则
   * - 聚合内部的所有实体必须属于同一租户
   * - 跨聚合操作时必须验证租户一致性
   * - 不同租户的实体不能直接交互
   * - 租户不一致时抛出明确的禁止访问异常
   *
   * ### 验证规则
   * - 使用 EntityId.equals() 方法比较租户ID
   * - 比较基于租户ID的值，而非引用
   * - 租户ID必须完全相等，不支持部分匹配
   * - 验证失败时提供详细的错误信息
   *
   * ### 使用场景
   * - 聚合根添加实体时验证
   * - 实体间建立关联时验证
   * - 跨聚合引用时验证
   * - 任何可能涉及多个租户的操作
   *
   * ### 异常处理
   * - 抛出 GeneralBadRequestException 异常
   * - 异常消息描述跨租户操作被禁止
   * - 异常详情包含双方租户ID和实体类型
   * - 支持审计和安全监控
   *
   * @param entityTenantId - 要比较的租户ID
   * @param entityType - 实体类型（用于错误消息，可选，默认为'Entity'）
   *
   * @throws {GeneralBadRequestException} 当不属于同一租户时
   *
   * @protected
   *
   * @example
   * ```typescript
   * export class OrganizationAggregate extends TenantAwareAggregateRoot {
   *   public addDepartment(department: Department): void {
   *     // 验证部门属于同一租户
   *     this.ensureSameTenant(department.tenantId, 'Department');
   *
   *     // 执行业务逻辑
   *     this._departments.push(department);
   *   }
   *
   *   public addUser(userId: EntityId, user: User): void {
   *     // 验证用户属于同一租户
   *     this.ensureSameTenant(user.tenantId, 'User');
   *
   *     // 执行业务逻辑
   *     this._members.push(user);
   *   }
   * }
   * ```
   */
  protected ensureSameTenant(
    entityTenantId: EntityId,
    entityType: string = 'Entity'
  ): void {
    if (!this.tenantId.equals(entityTenantId)) {
      throw new GeneralBadRequestException(
        'Cross-tenant operation not allowed',
        `无法操作其他租户的${entityType}，数据隔离策略禁止跨租户操作`,
        {
          aggregateType: this.constructor.name,
          aggregateId: this.id.toString(),
          aggregateTenantId: this.tenantId.toString(),
          entityTenantId: entityTenantId.toString(),
          entityType,
          operation: 'cross-tenant-check',
        }
      );
    }
  }

  /**
   * 发布租户事件
   *
   * @description 创建并发布租户相关的领域事件。
   * 自动注入聚合根ID、版本号、租户ID，简化事件创建过程。
   *
   * ## 业务规则
   *
   * ### 事件创建规则
   * - 事件工厂函数接收聚合根ID、版本号、租户ID
   * - 事件工厂函数返回创建好的事件实例
   * - 事件自动包含租户信息，用于审计和追踪
   * - 事件创建失败时抛出异常
   *
   * ### 事件发布规则
   * - 事件通过 addDomainEvent() 添加到事件列表
   * - 事件在聚合根保存时统一发布
   * - 事件发布遵循事务一致性
   * - 事件发布失败时支持重试机制
   *
   * ### 事件内容规则
   * - 事件必须包含聚合根ID（aggregateId）
   * - 事件必须包含版本号（version）
   * - 事件必须包含租户ID（tenantId）
   * - 事件可以包含业务相关的其他信息
   *
   * ### 使用场景
   * - 简化租户事件的创建
   * - 确保事件包含必要的租户信息
   * - 减少重复代码，提高代码可读性
   * - 统一事件创建模式
   *
   * @param eventFactory - 事件工厂函数，接收aggregateId, version, tenantId，返回事件实例
   *
   * @protected
   *
   * @example
   * ```typescript
   * export class TenantAggregate extends TenantAwareAggregateRoot {
   *   public updateName(name: string): void {
   *     this._tenant.updateName(name);
   *
   *     // ✅ 简化的事件发布
   *     this.publishTenantEvent((id, version, tenantId) =>
   *       new TenantNameUpdatedEvent(id, version, tenantId, name)
   *     );
   *
   *     // 等价于以下代码：
   *     // this.addDomainEvent(
   *     //   new TenantNameUpdatedEvent(
   *     //     this.id,
   *     //     this.version,
   *     //     this.tenantId,
   *     //     name
   *     //   )
   *     // );
   *   }
   * }
   * ```
   */
  protected publishTenantEvent(
    eventFactory: (
      aggregateId: EntityId,
      version: number,
      tenantId: EntityId
    ) => BaseDomainEvent
  ): void {
    const event = eventFactory(this.id, this.version, this.tenantId);
    this.addDomainEvent(event);
  }

  /**
   * 获取租户ID（便捷方法）
   *
   * @description 返回聚合根的租户ID。
   * 这是一个便捷方法，直接访问继承自BaseEntity的tenantId属性。
   *
   * ## 业务规则
   *
   * ### 访问规则
   * - 租户ID来自审计信息（auditInfo.tenantId）
   * - 租户ID在聚合根生命周期内不可变更
   * - 租户ID保证非空（构造函数已验证）
   * - 返回的是EntityId值对象，非原始字符串
   *
   * ### 使用场景
   * - 获取当前聚合根的租户ID
   * - 用于租户一致性比较
   * - 用于日志记录和审计
   * - 用于权限验证
   *
   * @returns 租户ID
   *
   * @public
   *
   * @example
   * ```typescript
   * const aggregate = new TenantAggregate(...);
   * const tenantId = aggregate.getTenantId();
   * console.log('Tenant ID:', tenantId.toString());
   * ```
   */
  public getTenantId(): EntityId {
    return this.tenantId;
  }

  /**
   * 检查是否属于指定租户
   *
   * @description 检查聚合根是否属于指定的租户。
   * 使用EntityId的equals方法进行值比较。
   *
   * ## 业务规则
   *
   * ### 比较规则
   * - 使用EntityId.equals()进行值比较
   * - 比较基于租户ID的值，而非引用
   * - 租户ID必须完全相等
   * - 支持安全的跨租户检查
   *
   * ### 使用场景
   * - 权限验证时检查租户归属
   * - 查询过滤时验证租户
   * - 业务规则中判断租户归属
   * - 审计日志中记录租户信息
   *
   * ### 返回值
   * - true: 聚合根属于指定租户
   * - false: 聚合根不属于指定租户
   *
   * @param tenantId - 要检查的租户ID
   * @returns 如果属于指定租户返回true，否则返回false
   *
   * @public
   *
   * @example
   * ```typescript
   * const aggregate = new TenantAggregate(...);
   * const currentTenantId = EntityId.fromString('tenant-123');
   *
   * if (aggregate.belongsToTenant(currentTenantId)) {
   *   console.log('聚合根属于当前租户');
   * } else {
   *   console.log('聚合根属于其他租户');
   * }
   * ```
   */
  public belongsToTenant(tenantId: EntityId): boolean {
    return this.tenantId.equals(tenantId);
  }

  /**
   * 记录租户级别的日志
   *
   * @description 记录包含租户信息的日志，用于审计、调试和监控。
   * 自动包含聚合根类型、聚合根ID、租户ID等上下文信息。
   *
   * ## 业务规则
   *
   * ### 日志内容规则
   * - 日志必须包含租户ID
   * - 日志必须包含聚合根类型
   * - 日志必须包含聚合根ID
   * - 日志可以包含业务相关的其他数据
   *
   * ### 日志级别规则
   * - 使用info级别记录正常操作
   * - 敏感信息不应出现在日志中
   * - 日志应清晰描述操作内容
   * - 日志应便于查询和分析
   *
   * ### 使用场景
   * - 记录重要的业务操作
   * - 审计租户级别的操作
   * - 调试租户相关问题
   * - 性能分析和监控
   *
   * ### 日志格式
   * - message: 日志消息，描述操作内容
   * - aggregateType: 聚合根类型名称
   * - aggregateId: 聚合根ID
   * - tenantId: 租户ID
   * - data: 附加的业务数据
   *
   * @param message - 日志消息
   * @param data - 附加数据（可选）
   *
   * @protected
   *
   * @example
   * ```typescript
   * export class TenantAggregate extends TenantAwareAggregateRoot {
   *   public updateName(name: string): void {
   *     this._tenant.updateName(name);
   *
   *     // 记录租户操作日志
   *     this.logTenantOperation('租户名称已更新', {
   *       oldName: this._tenant.getName(),
   *       newName: name,
   *       operation: 'update-name',
   *     });
   *   }
   * }
   * ```
   */
  protected logTenantOperation(
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.logger.info(message, {
      aggregateType: this.constructor.name,
      aggregateId: this.id.toString(),
      tenantId: this.tenantId.toString(),
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * 序列化时包含租户信息
   *
   * @description 序列化聚合根时自动包含租户信息。
   * 租户信息已包含在super.toData()中（来自BaseEntity），
   * 这里保持一致性，确保租户信息正确序列化。
   *
   * ## 业务规则
   *
   * ### 序列化规则
   * - 租户信息来自BaseEntity.toData()
   * - 租户ID以字符串形式序列化
   * - 序列化结果包含所有审计信息
   * - 序列化结果可用于持久化和传输
   *
   * ### 使用场景
   * - 持久化聚合根到数据库
   * - 序列化聚合根用于消息传递
   * - 导出聚合根数据
   * - API响应中返回聚合根数据
   *
   * @returns 包含租户信息的数据对象
   *
   * @public
   *
   * @example
   * ```typescript
   * const aggregate = new TenantAggregate(...);
   * const data = aggregate.toData();
   * console.log(data);
   * // {
   * //   id: 'aggregate-123',
   * //   tenantId: 'tenant-456',
   * //   createdAt: '2025-10-08T...',
   * //   updatedAt: '2025-10-08T...',
   * //   version: 1,
   * //   ...
   * // }
   * ```
   */
  public override toData(): Record<string, unknown> {
    return {
      ...super.toData(),
      // 租户信息已包含在super.toData()中
      // 这里可以添加租户相关的额外信息（如需要）
    };
  }
}

