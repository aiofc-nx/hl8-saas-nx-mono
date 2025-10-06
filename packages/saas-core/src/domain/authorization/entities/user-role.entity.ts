import { BaseEntity, EntityId } from '@hl8/hybrid-archi';

/**
 * 用户角色关联实体
 *
 * @description 管理用户与角色的多对多关系
 * 包含角色分配时间、有效期、分配者等业务信息
 * 采用充血模型，包含完整的业务逻辑
 *
 * ## 业务规则
 *
 * ### 角色分配规则
 * - 用户可以被分配多个角色
 * - 角色可以分配给多个用户
 * - 角色分配可以设置有效期
 * - 角色分配可以指定分配者
 *
 * ### 角色有效期规则
 * - 角色可以设置有效期
 * - 过期角色自动失效
 * - 永久角色不设置过期时间
 * - 可以延长角色有效期
 *
 * ### 角色管理规则
 * - 只有有权限的用户才能分配角色
 * - 系统角色不能被移除
 * - 角色分配需要记录审计日志
 *
 * @example
 * ```typescript
 * const userRole = new UserRole(
 *   userRoleId,
 *   userId,
 *   roleId,
 *   assignedBy,
 *   new Date(),
 *   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
 * );
 * 
 * userRole.extendExpiration(60); // 延长60天
 * const isExpired = userRole.isExpired(); // 检查是否过期
 * ```
 *
 * @since 1.0.0
 */
export class UserRole extends BaseEntity {
  /**
   * 构造函数
   *
   * @description 创建用户角色关联实体实例
   * 所有属性都是私有的，通过方法访问和修改
   *
   * @param id - 用户角色关联ID
   * @param _userId - 用户ID
   * @param _roleId - 角色ID
   * @param _assignedBy - 分配者ID
   * @param _assignedAt - 分配时间
   * @param _expiresAt - 过期时间（可选）
   * @param _isActive - 是否激活
   */
  constructor(
    id: EntityId,
    private readonly _userId: EntityId,
    private readonly _roleId: EntityId,
    private readonly _assignedBy: EntityId,
    private readonly _assignedAt: Date,
    private _expiresAt?: Date,
    private _isActive = true
  ) {
    super(id, { createdBy: _assignedBy.toString() });
  }

  /**
   * 创建用户角色关联
   *
   * @description 工厂方法，创建新的用户角色关联
   *
   * @param id - 用户角色关联ID
   * @param userId - 用户ID
   * @param roleId - 角色ID
   * @param assignedBy - 分配者ID
   * @param expiresInDays - 有效期天数（可选）
   * @returns 用户角色关联实例
   *
   * @example
   * ```typescript
   * const userRole = UserRole.create(
   *   userRoleId,
   *   userId,
   *   roleId,
   *   assignedBy,
   *   30 // 30天后过期
   * );
   * ```
   *
   * @since 1.0.0
   */
  public static create(
    id: EntityId,
    userId: EntityId,
    roleId: EntityId,
    assignedBy: EntityId,
    expiresInDays?: number
  ): UserRole {
    const assignedAt = new Date();
    const expiresAt = expiresInDays 
      ? new Date(assignedAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    return new UserRole(
      id,
      userId,
      roleId,
      assignedBy,
      assignedAt,
      expiresAt
    );
  }

  /**
   * 延长角色有效期
   *
   * @description 延长角色的有效期
   * 如果角色已过期，则从当前时间开始计算新的有效期
   *
   * @param days - 延长的天数
   * @throws {InvalidExpirationException} 当延长天数无效时抛出异常
   *
   * @example
   * ```typescript
   * userRole.extendExpiration(30); // 延长30天
   * ```
   *
   * @since 1.0.0
   */
  public extendExpiration(days: number): void {
    if (days <= 0) {
      throw new InvalidExpirationException('延长天数必须大于0');
    }

    const now = new Date();
    const currentExpiresAt = this._expiresAt || now;
    
    // 如果已过期，从当前时间开始计算
    const baseTime = currentExpiresAt > now ? currentExpiresAt : now;
    this._expiresAt = new Date(baseTime.getTime() + days * 24 * 60 * 60 * 1000);
    
    this.updateTimestamp();
  }

  /**
   * 设置永久有效
   *
   * @description 将角色设置为永久有效
   * 移除过期时间限制
   *
   * @example
   * ```typescript
   * userRole.setPermanent();
   * ```
   *
   * @since 1.0.0
   */
  public setPermanent(): void {
    this._expiresAt = undefined;
    this.updateTimestamp();
  }

  /**
   * 激活角色
   *
   * @description 激活用户角色关联
   * 使角色生效
   *
   * @example
   * ```typescript
   * userRole.activate();
   * ```
   *
   * @since 1.0.0
   */
  public activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  /**
   * 停用角色
   *
   * @description 停用用户角色关联
   * 使角色失效
   *
   * @example
   * ```typescript
   * userRole.deactivate();
   * ```
   *
   * @since 1.0.0
   */
  public deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }

  /**
   * 检查角色是否过期
   *
   * @description 检查角色是否已过期
   * 永久角色不会过期
   *
   * @returns 是否过期
   *
   * @example
   * ```typescript
   * const isExpired = userRole.isExpired(); // false
   * ```
   *
   * @since 1.0.0
   */
  public isExpired(): boolean {
    if (!this._expiresAt) {
      return false; // 永久角色不过期
    }

    return new Date() > this._expiresAt;
  }

  /**
   * 检查角色是否有效
   *
   * @description 检查角色是否有效
   * 角色必须激活且未过期才有效
   *
   * @returns 是否有效
   *
   * @example
   * ```typescript
   * const isValid = userRole.isValid(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isValid(): boolean {
    return this._isActive && !this.isExpired();
  }

  /**
   * 检查是否为永久角色
   *
   * @description 检查角色是否为永久有效
   *
   * @returns 是否为永久角色
   *
   * @example
   * ```typescript
   * const isPermanent = userRole.isPermanent(); // false
   * ```
   *
   * @since 1.0.0
   */
  public isPermanent(): boolean {
    return this._expiresAt === undefined;
  }

  /**
   * 获取剩余有效天数
   *
   * @description 获取角色剩余的有效天数
   * 永久角色返回-1
   *
   * @returns 剩余天数，永久角色返回-1
   *
   * @example
   * ```typescript
   * const remainingDays = userRole.getRemainingDays(); // 25
   * ```
   *
   * @since 1.0.0
   */
  public getRemainingDays(): number {
    if (!this._expiresAt) {
      return -1; // 永久角色
    }

    const now = new Date();
    const diff = this._expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 0; // 已过期
    }

    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  /**
   * 检查是否可以管理
   *
   * @description 检查指定用户是否可以管理此角色分配
   * 基于权限和分配者关系进行判断
   *
   * @param userId - 用户ID
   * @returns 是否可以管理
   *
   * @example
   * ```typescript
   * const canManage = userRole.canBeManagedBy(userId); // true
   * ```
   *
   * @since 1.0.0
   */
  public canBeManagedBy(userId: EntityId): boolean {
    // 分配者可以管理自己分配的角色
    if (this._assignedBy.equals(userId)) {
      return true;
    }

    // 用户自己可以查看自己的角色
    if (this._userId.equals(userId)) {
      return true;
    }

    // 其他情况需要特殊权限
    return false;
  }

  // Getter 方法
  public getUserId(): EntityId { return this._userId; }
  public getRoleId(): EntityId { return this._roleId; }
  public getAssignedBy(): EntityId { return this._assignedBy; }
  public getAssignedAt(): Date { return this._assignedAt; }
  public getExpiresAt(): Date | undefined { return this._expiresAt; }
  public getIsActive(): boolean { return this._isActive; }
}

/**
 * 无效过期时间异常
 *
 * @description 当过期时间设置无效时抛出的异常
 *
 * @since 1.0.0
 */
export class InvalidExpirationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidExpirationException';
  }
}
