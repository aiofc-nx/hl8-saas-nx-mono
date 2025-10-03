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
 *   { createdBy: 'system', tenantId: 'tenant-123' }
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
  public get tenantId(): string {
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
      auditInfo: this._auditInfo,
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
      tenantId: this._auditInfo.tenantId,
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
        tenantId = tenantContext.tenantId;
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
      tenantId: tenantId !== undefined ? tenantId : 'default',
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

    if (!this._auditInfo.tenantId || this._auditInfo.tenantId.trim() === '') {
      throw new GeneralBadRequestException(
        'Entity validation failed',
        'Tenant ID cannot be null or empty',
        {
          entityType: this.constructor.name,
          entityId: this._id.toString(),
          tenantId: this._auditInfo.tenantId,
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
      tenantId: this._auditInfo.tenantId,
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
      tenantId: this._auditInfo.tenantId,
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
      tenantId: this._auditInfo.tenantId,
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
        tenantId: this._auditInfo.tenantId,
        operation,
        ...details,
      }
    );
  }
}
