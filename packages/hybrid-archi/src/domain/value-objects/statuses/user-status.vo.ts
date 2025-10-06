/**
 * 用户状态枚举
 *
 * @description 定义用户的生命周期状态
 * 用户状态转换遵循严格的业务规则，确保数据一致性
 *
 * ## 业务规则
 *
 * ### 状态转换规则
 * - PENDING: 用户注册后的初始状态，等待激活
 * - ACTIVE: 用户正常使用状态，可以执行所有业务操作
 * - SUSPENDED: 用户被暂停，不能执行业务操作但数据保留
 * - DISABLED: 用户被禁用，完全不能使用
 * - LOCKED: 用户被锁定，通常由于安全原因
 * - EXPIRED: 用户权限已过期
 * - DELETED: 用户被删除，数据标记删除但物理保留
 *
 * ### 状态转换矩阵
 * ```
 * PENDING → ACTIVE, DISABLED
 * ACTIVE → SUSPENDED, DISABLED, LOCKED, EXPIRED
 * SUSPENDED → ACTIVE, DISABLED
 * DISABLED → ACTIVE
 * LOCKED → ACTIVE, DISABLED
 * EXPIRED → ACTIVE, DISABLED
 * DELETED → (终态，不可转换)
 * ```
 *
 * @example
 * ```typescript
 * const status = UserStatus.PENDING;
 * const canActivate = UserStatusUtils.canTransitionTo(status, UserStatus.ACTIVE); // true
 * const canDelete = UserStatusUtils.canTransitionTo(status, UserStatus.DELETED); // false
 * ```
 *
 * @since 1.0.0
 */
export enum UserStatus {
  /**
   * 待激活状态
   * 
   * @description 用户注册后的初始状态
   * 此时用户已注册但尚未激活，不能执行业务操作
   */
  PENDING = 'PENDING',

  /**
   * 活跃状态
   * 
   * @description 用户正常使用状态
   * 可以执行所有业务操作，是用户的主要工作状态
   */
  ACTIVE = 'ACTIVE',

  /**
   * 暂停状态
   * 
   * @description 用户被临时暂停
   * 不能执行业务操作但数据完整保留，可随时恢复
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * 禁用状态
   * 
   * @description 用户被禁用
   * 完全不能使用，但数据保留，可重新激活
   */
  DISABLED = 'DISABLED',

  /**
   * 锁定状态
   * 
   * @description 用户被锁定
   * 通常由于安全原因（如密码错误次数过多），需要管理员解锁
   */
  LOCKED = 'LOCKED',

  /**
   * 过期状态
   * 
   * @description 用户权限已过期
   * 需要重新激活或续期才能继续使用
   */
  EXPIRED = 'EXPIRED',

  /**
   * 删除状态
   * 
   * @description 用户被标记删除
   * 数据标记删除但物理保留，不可恢复
   */
  DELETED = 'DELETED',

  /**
   * 拒绝状态
   * 
   * @description 用户申请被拒绝
   * 用户申请未通过审核，可以重新申请
   */
  REJECTED = 'REJECTED'
}

/**
 * 用户状态工具类
 *
 * @description 提供用户状态相关的工具方法
 * 包括状态转换验证、状态描述等功能
 *
 * @since 1.0.0
 */
export class UserStatusUtils {
  /**
   * 状态转换矩阵
   * 
   * @description 定义允许的状态转换关系
   * 键为当前状态，值为可转换的目标状态数组
   */
  private static readonly TRANSITION_MATRIX: Record<UserStatus, UserStatus[]> = {
    [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.DISABLED],
    [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.DISABLED, UserStatus.LOCKED, UserStatus.EXPIRED],
    [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
    [UserStatus.DISABLED]: [UserStatus.ACTIVE],
    [UserStatus.LOCKED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
    [UserStatus.EXPIRED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
    [UserStatus.DELETED]: [], // 终态，不可转换
    [UserStatus.REJECTED]: [UserStatus.PENDING] // 可以重新申请
  };

  /**
   * 检查状态转换是否有效
   *
   * @description 验证从当前状态转换到目标状态是否被允许
   *
   * @param fromStatus - 当前状态
   * @param toStatus - 目标状态
   * @returns 是否允许转换
   *
   * @example
   * ```typescript
   * const isValid = UserStatusUtils.canTransitionTo(
   *   UserStatus.PENDING, 
   *   UserStatus.ACTIVE
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static canTransitionTo(fromStatus: UserStatus, toStatus: UserStatus): boolean {
    const allowedTransitions = this.TRANSITION_MATRIX[fromStatus];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * 获取状态的中文描述
   *
   * @description 返回状态的中文描述，用于界面显示
   *
   * @param status - 用户状态
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = UserStatusUtils.getDescription(UserStatus.ACTIVE);
   * // "活跃"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(status: UserStatus): string {
    const descriptions: Record<UserStatus, string> = {
      [UserStatus.PENDING]: '待激活',
      [UserStatus.ACTIVE]: '活跃',
      [UserStatus.SUSPENDED]: '暂停',
      [UserStatus.DISABLED]: '禁用',
      [UserStatus.LOCKED]: '锁定',
      [UserStatus.EXPIRED]: '过期',
      [UserStatus.DELETED]: '已删除',
      [UserStatus.REJECTED]: '已拒绝'
    };

    return descriptions[status];
  }

  /**
   * 检查状态是否为终态
   *
   * @description 判断状态是否为终态（不可再转换的状态）
   *
   * @param status - 用户状态
   * @returns 是否为终态
   *
   * @example
   * ```typescript
   * const isTerminal = UserStatusUtils.isTerminal(UserStatus.DELETED);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isTerminal(status: UserStatus): boolean {
    return this.TRANSITION_MATRIX[status].length === 0;
  }

  /**
   * 获取所有可转换的状态
   *
   * @description 返回从指定状态可以转换到的所有状态
   *
   * @param status - 当前状态
   * @returns 可转换的状态数组
   *
   * @example
   * ```typescript
   * const transitions = UserStatusUtils.getAvailableTransitions(UserStatus.PENDING);
   * // [UserStatus.ACTIVE, UserStatus.DISABLED]
   * ```
   *
   * @since 1.0.0
   */
  public static getAvailableTransitions(status: UserStatus): UserStatus[] {
    return [...this.TRANSITION_MATRIX[status]];
  }

  /**
   * 检查状态是否允许登录
   *
   * @description 判断用户状态是否允许登录
   * 只有ACTIVE状态的用户才能登录
   *
   * @param status - 用户状态
   * @returns 是否允许登录
   *
   * @example
   * ```typescript
   * const canLogin = UserStatusUtils.canLogin(UserStatus.ACTIVE); // true
   * const cannotLogin = UserStatusUtils.canLogin(UserStatus.SUSPENDED); // false
   * ```
   *
   * @since 1.0.0
   */
  public static canLogin(status: UserStatus): boolean {
    return status === UserStatus.ACTIVE;
  }

  /**
   * 检查状态是否可用
   *
   * @description 判断用户状态是否可用（非禁用和删除状态）
   *
   * @param status - 用户状态
   * @returns 是否可用
   *
   * @example
   * ```typescript
   * const isAvailable = UserStatusUtils.isAvailable(UserStatus.ACTIVE); // true
   * const notAvailable = UserStatusUtils.isAvailable(UserStatus.DELETED); // false
   * ```
   *
   * @since 1.0.0
   */
  public static isAvailable(status: UserStatus): boolean {
    return status !== UserStatus.DISABLED && status !== UserStatus.DELETED;
  }
}
