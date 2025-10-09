/**
 * 基础实体类
 *
 * 实体是领域驱动设计中的核心概念，具有唯一标识符和生命周期。
 * 实体的相等性基于其标识符，而不是属性值。
 *
 * 作为通用功能组件，提供业务模块所需的基础实体能力。
 *
 * ## 通用功能规则
 *
 * ### 标识符规则
 * - 每个实体必须具有唯一的标识符
 * - 标识符在实体生命周期内不可变更
 * - 标识符用于实体的相等性比较
 * - 标识符必须符合 EntityId 的格式要求
 *
 * ### 时间戳规则
 * - 创建时间在实体创建时设置，不可修改
 * - 更新时间在实体状态变更时自动更新
 * - 时间戳采用 UTC 时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 *
 * ### 相等性规则
 * - 实体的相等性基于标识符比较，而非属性值
 * - 相同类型且相同标识符的实体被视为相等
 * - 不同类型但相同标识符的实体被视为不相等
 * - null 和 undefined 与任何实体都不相等
 *
 * ### 生命周期规则
 * - 实体创建后具有完整的生命周期管理
 * - 实体状态变更会触发相应的事件
 * - 实体支持序列化和反序列化操作
 * - 实体变更会记录操作时间和上下文
 *
 * @description 所有实体的基类，提供业务模块所需的基础实体功能
 * @example
 * ```typescript
 * class User extends BaseEntity {
 *   constructor(
 *     id: EntityId,
 *     private name: string,
 *     private email: string,
 *     auditInfo: Partial<AuditInfo>
 *   ) {
 *     super(id, auditInfo);
 *   }
 *
 *   getName(): string {
 *     return this.name;
 *   }
 *
 *   updateName(newName: string): void {
 *     this.name = newName;
 *     this.updateTimestamp(); // 自动更新修改时间
 *   }
 * }
 *
 * // 创建用户实体
 * const user = new User(
 *   EntityId.generate(),
 *   '张三',
 *   'zhangsan@example.com',
 *   { createdBy: 'system', tenantId: EntityId.fromString('tenant-123') }
 * );
 *
 * // 更新用户信息
 * user.updateName('李四');
 * ```
 *
 * @since 1.0.0
 */
import { EntityId } from '../../value-objects/entity-id';
import { IAuditInfo, IPartialAuditInfo } from './audit-info';
import { IEntity } from './entity.interface';
import { TenantContextService, ITenantContext } from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';
import {
  GeneralBadRequestException,
  GeneralInternalServerException,
} from '@hl8/common';
import { ENTITY_OPERATIONS, ENTITY_ERROR_CODES } from '../../../constants';

export abstract class BaseEntity implements IEntity {
  private readonly _id: EntityId;
  private readonly _auditInfo: IAuditInfo;
  protected readonly logger: PinoLogger;

  /**
   * 构造函数
   *
   * @param id - 实体唯一标识符
   * @param auditInfo - 审计信息，可以是完整的或部分的
   * @param logger - 日志记录器，可选
   */
  protected constructor(
    id: EntityId,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    this._id = id;
    this._auditInfo = this.buildAuditInfo(auditInfo);
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * 获取实体标识符
   *
   * @returns 实体唯一标识符
   */
  public get id(): EntityId {
    return this._id;
  }

  /**
   * 获取审计信息
   *
   * @returns 完整的审计信息
   */
  public get auditInfo(): IAuditInfo {
    return this._auditInfo;
  }

  /**
   * 获取创建时间
   *
   * @returns 创建时间
   */
  public get createdAt(): Date {
    return this._auditInfo.createdAt;
  }

  /**
   * 获取最后更新时间
   *
   * @returns 最后更新时间
   */
  public get updatedAt(): Date {
    return this._auditInfo.updatedAt;
  }

  /**
   * 获取删除时间
   *
   * @returns 删除时间，如果实体未被删除则返回 null
   */
  public get deletedAt(): Date | null {
    return this._auditInfo.deletedAt;
  }

  /**
   * 获取租户标识符
   *
   * @returns 租户标识符
   */
  public get tenantId(): EntityId {
    return this._auditInfo.tenantId;
  }

  /**
   * 获取版本号
   *
   * @returns 版本号
   */
  public get version(): number {
    return this._auditInfo.version;
  }

  /**
   * 检查实体是否被删除
   *
   * @returns 如果实体被删除则返回 true，否则返回 false
   */
  public get isDeleted(): boolean {
    return this._auditInfo.deletedAt !== null;
  }

  /**
   * 获取创建者标识符
   *
   * @returns 创建者标识符
   */
  public get createdBy(): string {
    return this._auditInfo.createdBy;
  }

  /**
   * 获取最后更新者标识符
   *
   * @returns 最后更新者标识符
   */
  public get updatedBy(): string {
    return this._auditInfo.updatedBy;
  }

  /**
   * 获取删除者标识符
   *
   * @returns 删除者标识符，如果实体未被删除则返回 null
   */
  public get deletedBy(): string | null {
    return this._auditInfo.deletedBy;
  }

  /**
   * 软删除实体
   *
   * @description 将实体标记为已删除，但不从存储中移除
   * 软删除会记录删除时间、删除者和删除原因
   *
   * @param deletedBy - 删除者标识符，可选，默认使用当前用户
   * @param deleteReason - 删除原因，可选
   * @param operationContext - 操作上下文，可选
   *
   * @throws {GeneralBadRequestException} 当实体已被删除时
   *
   * @example
   * ```typescript
   * // 基本软删除
   * entity.markAsDeleted();
   *
   * // 带删除原因的软删除
   * entity.markAsDeleted('user-123', '用户主动删除');
   *
   * // 带完整上下文的软删除
   * entity.markAsDeleted('user-123', '数据清理', {
   *   ip: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...',
   *   source: 'WEB'
   * });
   * ```
   */
  public markAsDeleted(
    deletedBy?: string,
    deleteReason?: string,
    operationContext?: {
      ip?: string | null;
      userAgent?: string | null;
      source?: 'WEB' | 'API' | 'CLI' | 'SYSTEM' | null;
    }
  ): void {
    if (this.isDeleted) {
      throw new GeneralBadRequestException(
        'Entity already deleted',
        'Cannot delete an entity that is already deleted',
        {
          entityType: this.constructor.name,
          entityId: this._id.toString(),
          errorCode: ENTITY_ERROR_CODES.ALREADY_DELETED,
        }
      );
    }

    const now = new Date();
    const actualDeletedBy = deletedBy || this.getCurrentUserId();

    // 更新审计信息
    this._auditInfo.deletedAt = now;
    this._auditInfo.deletedBy = actualDeletedBy;
    this._auditInfo.deleteReason = deleteReason || null;
    this._auditInfo.updatedAt = now;
    this._auditInfo.updatedBy = actualDeletedBy;
    this._auditInfo.lastOperation = ENTITY_OPERATIONS.DELETE;
    this._auditInfo.version++;

    // 更新操作上下文
    if (operationContext) {
      this._auditInfo.lastOperationIp = operationContext.ip || null;
      this._auditInfo.lastOperationUserAgent = operationContext.userAgent || null;
      this._auditInfo.lastOperationSource = operationContext.source || null;
    }

    this.logger.info(`Entity marked as deleted`, {
      entityType: this.constructor.name,
      entityId: this._id.toString(),
      deletedBy: actualDeletedBy,
      deleteReason,
    });
  }

  /**
   * 恢复已删除的实体
   *
   * @description 将软删除的实体恢复为正常状态
   * 恢复会清除删除时间、删除者和删除原因
   *
   * @param restoredBy - 恢复者标识符，可选，默认使用当前用户
   * @param operationContext - 操作上下文，可选
   *
   * @throws {GeneralBadRequestException} 当实体未被删除时
   *
   * @example
   * ```typescript
   * // 基本恢复
   * entity.restore();
   *
   * // 带恢复者的恢复
   * entity.restore('admin-123');
   * ```
   */
  public restore(
    restoredBy?: string,
    operationContext?: {
      ip?: string | null;
      userAgent?: string | null;
      source?: 'WEB' | 'API' | 'CLI' | 'SYSTEM' | null;
    }
  ): void {
    if (!this.isDeleted) {
      throw new GeneralBadRequestException(
        'Entity not deleted',
        'Cannot restore an entity that is not deleted',
        {
          entityType: this.constructor.name,
          entityId: this._id.toString(),
          errorCode: ENTITY_ERROR_CODES.NOT_DELETED,
        }
      );
    }

    const now = new Date();
    const actualRestoredBy = restoredBy || this.getCurrentUserId();

    // 清除删除信息
    this._auditInfo.deletedAt = null;
    this._auditInfo.deletedBy = null;
    this._auditInfo.deleteReason = null;
    this._auditInfo.updatedAt = now;
    this._auditInfo.updatedBy = actualRestoredBy;
    this._auditInfo.lastOperation = ENTITY_OPERATIONS.RESTORE;
    this._auditInfo.version++;

    // 更新操作上下文
    if (operationContext) {
      this._auditInfo.lastOperationIp = operationContext.ip || null;
      this._auditInfo.lastOperationUserAgent = operationContext.userAgent || null;
      this._auditInfo.lastOperationSource = operationContext.source || null;
    }

    this.logger.info(`Entity restored`, {
      entityType: this.constructor.name,
      entityId: this._id.toString(),
      restoredBy: actualRestoredBy,
    });
  }

  /**
   * 检查两个实体是否相等
   *
   * 实体的相等性基于标识符比较，而不是属性值。
   *
   * @param other - 要比较的另一个实体
   * @returns 如果两个实体相等则返回 true，否则返回 false
   */
  public equals(other: IEntity | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (!(other instanceof this.constructor)) {
      return false;
    }

    return this._id.equals(other.id);
  }

  /**
   * 获取实体的哈希码
   *
   * 用于在 Map 或 Set 中使用实体作为键。
   *
   * @returns 哈希码字符串
   */
  public getHashCode(): string {
    return this._id.getHashCode();
  }

  /**
   * 将实体转换为字符串表示
   *
   * @returns 字符串表示
   */
  public toString(): string {
    return `${this.constructor.name}(${this._id.toString()})`;
  }

  /**
   * 将实体转换为 JSON 表示
   *
   * @returns JSON 表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this._id.toString(),
      type: this.constructor.name,
      auditInfo: {
        ...this._auditInfo,
        tenantId: this._auditInfo.tenantId.toString(),
      },
    };
  }

  /**
   * 获取实体的类型名称
   *
   * @returns 类型名称
   */
  public getTypeName(): string {
    return this.constructor.name;
  }

  /**
   * 比较两个实体的大小
   *
   * 基于标识符进行比较。
   *
   * @param other - 要比较的另一个实体
   * @returns 比较结果：-1 表示小于，0 表示等于，1 表示大于
   */
  public compareTo(other: BaseEntity): number {
    if (other === null || other === undefined) {
      return 1;
    }

    return this._id.compareTo(other._id);
  }

  /**
   * 获取实体的业务标识符
   *
   * @returns 业务标识符字符串
   */
  public getBusinessIdentifier(): string {
    return `${this.constructor.name}(${this._id.toString()})`;
  }

  /**
   * 转换为纯数据对象
   *
   * @returns 包含所有实体数据的纯对象
   */
  public toData(): Record<string, unknown> {
    return {
      id: this._id.toString(),
      type: this.constructor.name,
      createdAt: this._auditInfo.createdAt,
      updatedAt: this._auditInfo.updatedAt,
      version: this._auditInfo.version,
      tenantId: this._auditInfo.tenantId.toString(), // 序列化为string
      isDeleted: this._auditInfo.deletedAt !== null,
    };
  }

  /**
   * 检查实体是否为新创建的
   *
   * @returns 如果是新创建的返回true，否则返回false
   */
  public isNew(): boolean {
    // 如果版本为1且创建时间和更新时间相同，认为是新创建的
    return (
      this._auditInfo.version === 1 &&
      this._auditInfo.createdAt.getTime() ===
        this._auditInfo.updatedAt.getTime()
    );
  }

  /**
   * 获取实体版本
   *
   * @returns 实体版本号
   */
  public getVersion(): number {
    return this._auditInfo.version;
  }

  /**
   * 构建完整的审计信息
   *
   * @param partialAuditInfo - 部分审计信息
   * @returns 完整的审计信息
   */
  private buildAuditInfo(partialAuditInfo: IPartialAuditInfo): IAuditInfo {
    const now = new Date();

    // 尝试从多租户上下文获取租户信息
    let tenantId = partialAuditInfo.tenantId;
    let createdBy = partialAuditInfo.createdBy || 'system';

    try {
      // 如果存在多租户上下文，优先使用上下文中的信息
      const tenantContext = this.getTenantContext();
      if (tenantContext) {
        // 从上下文获取tenantId（现在是EntityId类型）
        tenantId = EntityId.fromString(tenantContext.tenantId.toString());
        createdBy = tenantContext.userId || createdBy;
      }
    } catch (error) {
      // 如果获取上下文失败，使用默认值
      console.warn(
        'Failed to get tenant context, using default values:',
        error
      );
    }

    return {
      createdBy,
      updatedBy: partialAuditInfo.updatedBy || createdBy,
      deletedBy: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      tenantId: tenantId !== undefined ? tenantId : EntityId.generate(),
      version: partialAuditInfo.version || 1,
      lastOperation: partialAuditInfo.lastOperation || ENTITY_OPERATIONS.CREATE,
      lastOperationIp: partialAuditInfo.lastOperationIp || null,
      lastOperationUserAgent: partialAuditInfo.lastOperationUserAgent || null,
      lastOperationSource: partialAuditInfo.lastOperationSource || null,
      deleteReason: partialAuditInfo.deleteReason || null,
    };
  }

  /**
   * 获取当前租户上下文
   *
   * @returns 租户上下文信息，如果不存在则返回 null
   * @protected
   */
  protected getTenantContext(): ITenantContext | null {
    try {
      // 这里需要注入 TenantContextService，但在实体中直接注入不太合适
      // 建议通过构造函数传入或使用静态方法
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取当前用户ID
   *
   * @description 获取当前操作用户的ID，用于审计追踪
   * @returns 当前用户ID，如果无法获取则返回 'system'
   */
  protected getCurrentUserId(): string {
    try {
      const tenantContext = this.getTenantContext();
      return tenantContext?.userId || 'system';
    } catch (error) {
      return 'system';
    }
  }

  /**
   * 更新实体的时间戳
   *
   * 在实体状态变更时调用此方法以更新最后修改时间。
   * 此方法应该在子类中重写以实现具体的更新逻辑。
   *
   * @protected
   */
  protected updateTimestamp(): void {
    // 子类应该重写此方法以实现具体的更新逻辑
    // 这里只是提供一个接口，实际的更新应该在子类中实现
  }

  /**
   * 验证实体的有效性
   *
   * 子类应该重写此方法以实现具体的验证逻辑。
   *
   * @throws {GeneralBadRequestException} 当实体无效时
   * @protected
   */
  protected validate(): void {
    if (!this._id || this._id.isEmpty()) {
      throw new GeneralBadRequestException(
        'Entity validation failed',
        'Entity ID cannot be null or empty',
        {
          entityType: this.constructor.name,
          entityId: this._id?.toString(),
          validationError: ENTITY_ERROR_CODES.VALIDATION_ERROR,
        }
      );
    }

    if (!this._auditInfo.tenantId || !this._auditInfo.tenantId.value || this._auditInfo.tenantId.value.trim() === '') {
      throw new GeneralBadRequestException(
        'Entity validation failed',
        'Tenant ID cannot be null or empty',
        {
          entityType: this.constructor.name,
          entityId: this._id.toString(),
          tenantId: this._auditInfo.tenantId?.toString() || 'null',
          validationError: ENTITY_ERROR_CODES.TENANT_VALIDATION_ERROR,
        }
      );
    }
  }

  /**
   * 创建默认日志记录器
   *
   * @returns 默认的日志记录器实例
   * @protected
   */
  protected createDefaultLogger(): PinoLogger {
    return new PinoLogger({
      level: 'info',
    });
  }

  /**
   * 记录实体操作日志
   *
   * @param operation - 操作名称
   * @param details - 操作详情
   * @protected
   */
  protected logOperation(
    operation: string,
    details?: Record<string, unknown>
  ): void {
    this.logger.info(`Entity ${operation}`, {
      entityId: this._id.toString(),
      entityType: this.constructor.name,
      tenantId: this._auditInfo.tenantId.toString(),
      operation,
      details,
    });
  }

  /**
   * 记录实体错误日志
   *
   * @param operation - 操作名称
   * @param error - 错误信息
   * @param details - 错误详情
   * @protected
   */
  protected logError(
    operation: string,
    error: Error,
    details?: Record<string, unknown>
  ): void {
    this.logger.error(`Entity ${operation} failed`, {
      entityId: this._id.toString(),
      entityType: this.constructor.name,
      tenantId: this._auditInfo.tenantId.toString(),
      operation,
      error: error.message,
      stack: error.stack,
      details,
    });
  }

  /**
   * 抛出实体验证异常
   *
   * @param message - 错误消息
   * @param validationError - 验证错误类型
   * @param details - 附加详情
   * @protected
   */
  protected throwValidationError(
    message: string,
    validationError: string,
    details?: Record<string, unknown>
  ): never {
    throw new GeneralBadRequestException('Entity validation failed', message, {
      entityType: this.constructor.name,
      entityId: this._id.toString(),
      tenantId: this._auditInfo.tenantId.toString(),
      validationError,
      ...details,
    });
  }

  /**
   * 抛出实体操作异常
   *
   * @param operation - 操作名称
   * @param message - 错误消息
   * @param details - 附加详情
   * @protected
   */
  protected throwOperationError(
    operation: string,
    message: string,
    details?: Record<string, unknown>
  ): never {
    throw new GeneralInternalServerException(
      `Entity ${operation} failed`,
      message,
      {
        entityType: this.constructor.name,
        entityId: this._id.toString(),
        tenantId: this._auditInfo.tenantId.toString(),
        operation,
        ...details,
      }
    );
  }
}
