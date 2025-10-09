/**
 * 租户实体
 *
 * @description 租户核心实体，包含租户的基本信息和业务逻辑
 *
 * ## 业务规则
 *
 * ### 租户标识
 * - 租户代码：全局唯一，3-20字符，小写字母+数字
 * - 租户域名：全局唯一，符合域名格式
 * - 租户ID：系统自动生成的唯一标识
 *
 * ### 租户类型
 * - FREE: 免费版（5用户/100MB/1组织）
 * - BASIC: 基础版（50用户/1GB/2组织）
 * - PROFESSIONAL: 专业版（500用户/10GB/10组织）
 * - ENTERPRISE: 企业版（5000用户/100GB/100组织）
 * - CUSTOM: 定制版（无限制）
 *
 * ### 租户状态
 * - TRIAL: 试用中
 * - ACTIVE: 活跃
 * - SUSPENDED: 暂停
 * - EXPIRED: 过期
 * - DELETED: 已删除
 *
 * ### 状态转换规则
 * - TRIAL → ACTIVE（激活）
 * - ACTIVE ⇄ SUSPENDED（暂停/恢复）
 * - ANY → EXPIRED（过期）
 * - ANY → DELETED（删除）
 *
 * @example
 * ```typescript
 * const tenant = Tenant.create(
 *   EntityId.generate(),
 *   TenantCode.create('acme2024'),
 *   'Acme Corporation',
 *   TenantDomain.create('acme.example.com'),
 *   TenantStatus.TRIAL,
 *   { createdBy: 'system' }
 * );
 *
 * // 更新租户名称
 * tenant.updateName('New Acme Corp', 'admin-123');
 *
 * // 激活租户
 * tenant.activate('admin-123');
 * ```
 *
 * @class Tenant
 * @since 1.0.0
 */

import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { TenantStatus } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { TenantCode } from '../value-objects/tenant-code.vo';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { TenantType } from '../value-objects/tenant-type.enum';
import { TENANT_STATUS_TRANSITIONS } from '../../../constants/tenant.constants';

/**
 * 租户实体
 *
 * @class Tenant
 * @extends {BaseEntity}
 */
export class Tenant extends BaseEntity {
  /**
   * 构造函数
   *
   * @param {EntityId} id - 租户ID
   * @param {TenantCode} code - 租户代码
   * @param {string} name - 租户名称
   * @param {TenantDomain} domain - 租户域名
   * @param {TenantType} type - 租户类型
   * @param {TenantStatus} status - 租户状态
   * @param {Date} [trialEndsAt] - 试用结束时间
   * @param {Date} [activatedAt] - 激活时间
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @param {PinoLogger} [logger] - 日志记录器
   */
  constructor(
    id: EntityId,
    private _code: TenantCode,
    private _name: string,
    private _domain: TenantDomain,
    private _type: TenantType,
    private _status: TenantStatus,
    private _trialEndsAt: Date | null = null,
    private _activatedAt: Date | null = null,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger,
  ) {
    super(id, auditInfo, logger);
    this.validate();
  }

  /**
   * 创建租户实体
   *
   * @description 工厂方法，创建新的租户实体
   *
   * @static
   * @param {EntityId} id - 租户ID
   * @param {TenantCode} code - 租户代码
   * @param {string} name - 租户名称
   * @param {TenantDomain} domain - 租户域名
   * @param {TenantType} type - 租户类型
   * @param {IPartialAuditInfo} auditInfo - 审计信息
   * @returns {Tenant} 租户实体
   */
  public static create(
    id: EntityId,
    code: TenantCode,
    name: string,
    domain: TenantDomain,
    type: TenantType,
    auditInfo: IPartialAuditInfo,
  ): Tenant {
    // 新租户默认为试用状态
    const status = TenantStatus.TRIAL;
    
    // 如果是试用状态，设置试用结束时间（30天后）
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    return new Tenant(
      id,
      code,
      name,
      domain,
      type,
      status,
      trialEndsAt,
      null,
      auditInfo,
    );
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * 获取租户代码
   *
   * @returns {TenantCode}
   */
  public getCode(): TenantCode {
    return this._code;
  }

  /**
   * 获取租户名称
   *
   * @returns {string}
   */
  public getName(): string {
    return this._name;
  }

  /**
   * 获取租户域名
   *
   * @returns {TenantDomain}
   */
  public getDomain(): TenantDomain {
    return this._domain;
  }

  /**
   * 获取租户类型
   *
   * @returns {TenantType}
   */
  public getType(): TenantType {
    return this._type;
  }

  /**
   * 获取租户状态
   *
   * @returns {TenantStatus}
   */
  public getStatus(): TenantStatus {
    return this._status;
  }

  /**
   * 获取试用结束时间
   *
   * @returns {Date | null}
   */
  public getTrialEndsAt(): Date | null {
    return this._trialEndsAt;
  }

  /**
   * 获取激活时间
   *
   * @returns {Date | null}
   */
  public getActivatedAt(): Date | null {
    return this._activatedAt;
  }

  // ============================================================================
  // 业务方法
  // ============================================================================

  /**
   * 更新租户名称
   *
   * @description 修改租户的显示名称
   *
   * @param {string} name - 新名称
   * @param {string} [updatedBy] - 更新人ID
   * @throws {Error} 当名称无效时抛出错误
   */
  public updateName(name: string, updatedBy?: string): void {
    this.validateName(name);
    this._name = name;
    this.updateTimestamp(updatedBy);
  }

  /**
   * 更新租户类型
   *
   * @description 修改租户的订阅类型（通常通过升级/降级操作）
   *
   * @param {TenantType} type - 新类型
   * @param {string} [updatedBy] - 更新人ID
   */
  public updateType(type: TenantType, updatedBy?: string): void {
    this._type = type;
    this.updateTimestamp(updatedBy);
  }

  /**
   * 激活租户
   *
   * @description 将试用租户转为活跃状态
   *
   * ## 业务规则
   * - 只有 TRIAL 或 EXPIRED 状态可以激活
   * - 激活后设置激活时间
   * - 清除试用结束时间
   *
   * @param {string} [updatedBy] - 更新人ID
   * @throws {Error} 当状态转换不允许时抛出错误
   */
  public activate(updatedBy?: string): void {
    this.validateStatusTransition(TenantStatus.ACTIVE);
    this._status = TenantStatus.ACTIVE;
    this._activatedAt = new Date();
    this._trialEndsAt = null;
    this.updateTimestamp(updatedBy);
  }

  /**
   * 暂停租户
   *
   * @description 临时暂停租户的服务访问
   *
   * ## 业务规则
   * - 只有 ACTIVE 状态可以暂停
   * - 暂停期间租户无法访问服务
   *
   * @param {string} reason - 暂停原因
   * @param {string} [updatedBy] - 更新人ID
   * @throws {Error} 当状态转换不允许时抛出错误
   */
  public suspend(reason: string, updatedBy?: string): void {
    this.validateStatusTransition(TenantStatus.SUSPENDED);
    this._status = TenantStatus.SUSPENDED;
    this.updateTimestamp(updatedBy);
    
    // 记录暂停原因到日志
    this.logger.warn({
      message: '租户已暂停',
      tenantId: this.id.toString(),
      reason,
      updatedBy,
    });
  }

  /**
   * 恢复租户
   *
   * @description 从暂停状态恢复为活跃状态
   *
   * @param {string} [updatedBy] - 更新人ID
   * @throws {Error} 当当前状态不是 SUSPENDED 时抛出错误
   */
  public resume(updatedBy?: string): void {
    if (this._status !== TenantStatus.SUSPENDED) {
      throw new Error('只有暂停状态的租户可以恢复');
    }
    this._status = TenantStatus.ACTIVE;
    this.updateTimestamp(updatedBy);
  }

  /**
   * 标记租户过期
   *
   * @description 将租户标记为过期状态
   *
   * @param {string} [updatedBy] - 更新人ID
   */
  public expire(updatedBy?: string): void {
    this.validateStatusTransition(TenantStatus.EXPIRED);
    this._status = TenantStatus.EXPIRED;
    this.updateTimestamp(updatedBy);
  }

  // ============================================================================
  // 验证方法
  // ============================================================================

  /**
   * 验证租户数据
   *
   * @private
   * @throws {Error} 当数据无效时抛出错误
   */
  private validate(): void {
    this.validateName(this._name);
  }

  /**
   * 验证租户名称
   *
   * @private
   * @param {string} name - 租户名称
   * @throws {Error} 当名称无效时抛出错误
   */
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('租户名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('租户名称不能超过100字符');
    }
  }

  /**
   * 验证状态转换
   *
   * @private
   * @param {TenantStatus} targetStatus - 目标状态
   * @throws {Error} 当状态转换不允许时抛出错误
   */
  private validateStatusTransition(targetStatus: TenantStatus): void {
    const allowedTransitions = TENANT_STATUS_TRANSITIONS[this._status];
    if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
      throw new Error(
        `不允许从 ${this._status} 状态转换到 ${targetStatus} 状态`,
      );
    }
  }

  // ============================================================================
  // 查询方法
  // ============================================================================

  /**
   * 检查租户是否活跃
   *
   * @returns {boolean}
   */
  public isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  /**
   * 检查租户是否试用中
   *
   * @returns {boolean}
   */
  public isTrial(): boolean {
    return this._status === TenantStatus.TRIAL;
  }

  /**
   * 检查租户是否已暂停
   *
   * @returns {boolean}
   */
  public isSuspended(): boolean {
    return this._status === TenantStatus.SUSPENDED;
  }

  /**
   * 检查租户是否已过期
   *
   * @returns {boolean}
   */
  public isExpired(): boolean {
    return this._status === TenantStatus.EXPIRED;
  }

  /**
   * 检查试用是否即将到期
   *
   * @description 检查试用期是否在7天内到期
   *
   * @returns {boolean}
   */
  public isTrialExpiringSoon(): boolean {
    if (!this.isTrial() || !this._trialEndsAt) {
      return false;
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (this._trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysRemaining <= 7 && daysRemaining > 0;
  }

  /**
   * 获取试用剩余天数
   *
   * @returns {number | null} 剩余天数，如果不是试用状态则返回null
   */
  public getTrialDaysRemaining(): number | null {
    if (!this.isTrial() || !this._trialEndsAt) {
      return null;
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (this._trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, daysRemaining);
  }

  /**
   * 转换为纯对象
   *
   * @returns {object} 租户数据对象
   */
  public toObject(): object {
    return {
      id: this.id.toString(),
      code: this._code.value,
      name: this._name,
      domain: this._domain.value,
      type: this._type,
      status: this._status,
      trialEndsAt: this._trialEndsAt?.toISOString(),
      activatedAt: this._activatedAt?.toISOString(),
      tenantId: this.tenantId.toString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt?.toISOString(),
      version: this.version,
    };
  }
}

