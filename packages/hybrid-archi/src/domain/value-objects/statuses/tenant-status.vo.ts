/**
 * 租户状态枚举
 *
 * @description 定义租户的生命周期状态
 * 租户状态转换遵循严格的业务规则，确保数据一致性
 *
 * ## 业务规则
 *
 * ### 状态转换规则
 * - PENDING: 租户创建后的初始状态，等待激活
 * - ACTIVE: 租户正常使用状态，可以执行所有业务操作
 * - SUSPENDED: 租户被暂停，不能执行业务操作但数据保留
 * - DISABLED: 租户被禁用，完全不能使用
 * - DELETED: 租户被删除，数据标记删除但物理保留
 *
 * ### 状态转换矩阵
 * ```
 * PENDING → ACTIVE, DISABLED
 * ACTIVE → SUSPENDED, DISABLED
 * SUSPENDED → ACTIVE, DISABLED
 * DISABLED → ACTIVE
 * DELETED → (终态，不可转换)
 * ```
 *
 * @example
 * ```typescript
 * const status = TenantStatus.PENDING;
 * const canActivate = TenantStatus.canTransitionTo(status, TenantStatus.ACTIVE); // true
 * const canDelete = TenantStatus.canTransitionTo(status, TenantStatus.DELETED); // false
 * ```
 *
 * @since 1.0.0
 */
export enum TenantStatus {
  /**
   * 创建中状态
   * 
   * @description 租户正在创建过程中
   * 此时租户正在初始化，不能执行业务操作
   */
  CREATING = 'CREATING',

  /**
   * 待激活状态
   * 
   * @description 租户创建后的初始状态
   * 此时租户已创建但尚未激活，不能执行业务操作
   */
  PENDING = 'PENDING',

  /**
   * 活跃状态
   * 
   * @description 租户正常使用状态
   * 可以执行所有业务操作，是租户的主要工作状态
   */
  ACTIVE = 'ACTIVE',

  /**
   * 暂停状态
   * 
   * @description 租户被临时暂停
   * 不能执行业务操作但数据完整保留，可随时恢复
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * 禁用状态
   * 
   * @description 租户被禁用
   * 完全不能使用，但数据保留，可重新激活
   */
  DISABLED = 'DISABLED',

  /**
   * 删除状态
   * 
   * @description 租户被标记删除
   * 数据标记删除但物理保留，不可恢复
   */
  DELETED = 'DELETED'
}

/**
 * 租户状态工具类
 *
 * @description 提供租户状态相关的工具方法
 * 包括状态转换验证、状态描述等功能
 *
 * @since 1.0.0
 */
export class TenantStatusUtils {
  /**
   * 状态转换矩阵
   * 
   * @description 定义允许的状态转换关系
   * 键为当前状态，值为可转换的目标状态数组
   */
  private static readonly TRANSITION_MATRIX: Record<TenantStatus, TenantStatus[]> = {
    [TenantStatus.CREATING]: [TenantStatus.PENDING, TenantStatus.DISABLED],
    [TenantStatus.PENDING]: [TenantStatus.ACTIVE, TenantStatus.DISABLED],
    [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.DISABLED],
    [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.DISABLED],
    [TenantStatus.DISABLED]: [TenantStatus.ACTIVE],
    [TenantStatus.DELETED]: [] // 终态，不可转换
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
   * const isValid = TenantStatusUtils.canTransitionTo(
   *   TenantStatus.PENDING, 
   *   TenantStatus.ACTIVE
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static canTransitionTo(fromStatus: TenantStatus, toStatus: TenantStatus): boolean {
    const allowedTransitions = this.TRANSITION_MATRIX[fromStatus];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * 获取状态的中文描述
   *
   * @description 返回状态的中文描述，用于界面显示
   *
   * @param status - 租户状态
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = TenantStatusUtils.getDescription(TenantStatus.ACTIVE);
   * // "活跃"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(status: TenantStatus): string {
    const descriptions: Record<TenantStatus, string> = {
      [TenantStatus.CREATING]: '创建中',
      [TenantStatus.PENDING]: '待激活',
      [TenantStatus.ACTIVE]: '活跃',
      [TenantStatus.SUSPENDED]: '暂停',
      [TenantStatus.DISABLED]: '禁用',
      [TenantStatus.DELETED]: '已删除'
    };

    return descriptions[status];
  }

  /**
   * 检查状态是否为终态
   *
   * @description 判断状态是否为终态（不可再转换的状态）
   *
   * @param status - 租户状态
   * @returns 是否为终态
   *
   * @example
   * ```typescript
   * const isTerminal = TenantStatusUtils.isTerminal(TenantStatus.DELETED);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isTerminal(status: TenantStatus): boolean {
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
   * const transitions = TenantStatusUtils.getAvailableTransitions(TenantStatus.PENDING);
   * // [TenantStatus.ACTIVE, TenantStatus.DISABLED]
   * ```
   *
   * @since 1.0.0
   */
  public static getAvailableTransitions(status: TenantStatus): TenantStatus[] {
    return [...this.TRANSITION_MATRIX[status]];
  }
}
