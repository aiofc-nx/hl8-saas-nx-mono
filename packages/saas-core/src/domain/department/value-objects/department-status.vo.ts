/**
 * 部门状态枚举
 *
 * @description 定义部门的生命周期状态
 * 部门状态转换遵循严格的业务规则，确保数据一致性
 *
 * ## 业务规则
 *
 * ### 状态转换规则
 * - PENDING: 部门创建后的初始状态，等待激活
 * - ACTIVE: 部门正常使用状态，可以执行所有业务操作
 * - SUSPENDED: 部门被暂停，不能执行业务操作但数据保留
 * - DISABLED: 部门被禁用，完全不能使用
 * - ARCHIVED: 部门被归档，历史数据保留但不再使用
 * - DELETED: 部门被删除，数据标记删除但物理保留
 *
 * ### 状态转换矩阵
 * ```
 * PENDING → ACTIVE, DISABLED
 * ACTIVE → SUSPENDED, DISABLED, ARCHIVED
 * SUSPENDED → ACTIVE, DISABLED, ARCHIVED
 * DISABLED → ACTIVE
 * ARCHIVED → ACTIVE
 * DELETED → (终态，不可转换)
 * ```
 *
 * @example
 * ```typescript
 * const status = DepartmentStatus.PENDING;
 * const canActivate = DepartmentStatusUtils.canTransitionTo(status, DepartmentStatus.ACTIVE); // true
 * const canDelete = DepartmentStatusUtils.canTransitionTo(status, DepartmentStatus.DELETED); // false
 * ```
 *
 * @since 1.0.0
 */
export enum DepartmentStatus {
  /**
   * 待激活状态
   * 
   * @description 部门创建后的初始状态
   * 此时部门已创建但尚未激活，不能执行业务操作
   */
  PENDING = 'PENDING',

  /**
   * 活跃状态
   * 
   * @description 部门正常使用状态
   * 可以执行所有业务操作，是部门的主要工作状态
   */
  ACTIVE = 'ACTIVE',

  /**
   * 非活跃状态
   * 
   * @description 部门被停用
   * 不能执行业务操作但数据完整保留，可重新激活
   */
  INACTIVE = 'INACTIVE',

  /**
   * 暂停状态
   * 
   * @description 部门被临时暂停
   * 不能执行业务操作但数据完整保留，可随时恢复
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * 禁用状态
   * 
   * @description 部门被禁用
   * 完全不能使用，但数据保留，可重新激活
   */
  DISABLED = 'DISABLED',

  /**
   * 归档状态
   * 
   * @description 部门被归档
   * 历史数据保留但不再使用，可重新激活
   */
  ARCHIVED = 'ARCHIVED',

  /**
   * 删除状态
   * 
   * @description 部门被标记删除
   * 数据标记删除但物理保留，不可恢复
   */
  DELETED = 'DELETED'
}

/**
 * 部门状态工具类
 *
 * @description 提供部门状态相关的工具方法
 * 包括状态转换验证、状态描述等功能
 *
 * @since 1.0.0
 */
export class DepartmentStatusUtils {
  /**
   * 状态转换矩阵
   * 
   * @description 定义允许的状态转换关系
   * 键为当前状态，值为可转换的目标状态数组
   */
  private static readonly TRANSITION_MATRIX: Record<DepartmentStatus, DepartmentStatus[]> = {
    [DepartmentStatus.PENDING]: [DepartmentStatus.ACTIVE, DepartmentStatus.DISABLED],
    [DepartmentStatus.ACTIVE]: [DepartmentStatus.INACTIVE, DepartmentStatus.SUSPENDED, DepartmentStatus.DISABLED, DepartmentStatus.ARCHIVED],
    [DepartmentStatus.INACTIVE]: [DepartmentStatus.ACTIVE, DepartmentStatus.DISABLED],
    [DepartmentStatus.SUSPENDED]: [DepartmentStatus.ACTIVE, DepartmentStatus.DISABLED, DepartmentStatus.ARCHIVED],
    [DepartmentStatus.DISABLED]: [DepartmentStatus.ACTIVE],
    [DepartmentStatus.ARCHIVED]: [DepartmentStatus.ACTIVE],
    [DepartmentStatus.DELETED]: [] // 终态，不可转换
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
   * const isValid = DepartmentStatusUtils.canTransitionTo(
   *   DepartmentStatus.PENDING, 
   *   DepartmentStatus.ACTIVE
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static canTransitionTo(fromStatus: DepartmentStatus, toStatus: DepartmentStatus): boolean {
    const allowedTransitions = this.TRANSITION_MATRIX[fromStatus];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * 获取状态的中文描述
   *
   * @description 返回状态的中文描述，用于界面显示
   *
   * @param status - 部门状态
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = DepartmentStatusUtils.getDescription(DepartmentStatus.ACTIVE);
   * // "活跃"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(status: DepartmentStatus): string {
    const descriptions: Record<DepartmentStatus, string> = {
      [DepartmentStatus.PENDING]: '待激活',
      [DepartmentStatus.ACTIVE]: '活跃',
      [DepartmentStatus.INACTIVE]: '非活跃',
      [DepartmentStatus.SUSPENDED]: '暂停',
      [DepartmentStatus.DISABLED]: '禁用',
      [DepartmentStatus.ARCHIVED]: '已归档',
      [DepartmentStatus.DELETED]: '已删除'
    };

    return descriptions[status];
  }

  /**
   * 检查状态是否为终态
   *
   * @description 判断状态是否为终态（不可再转换的状态）
   *
   * @param status - 部门状态
   * @returns 是否为终态
   *
   * @example
   * ```typescript
   * const isTerminal = DepartmentStatusUtils.isTerminal(DepartmentStatus.DELETED);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isTerminal(status: DepartmentStatus): boolean {
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
   * const transitions = DepartmentStatusUtils.getAvailableTransitions(DepartmentStatus.PENDING);
   * // [DepartmentStatus.ACTIVE, DepartmentStatus.DISABLED]
   * ```
   *
   * @since 1.0.0
   */
  public static getAvailableTransitions(status: DepartmentStatus): DepartmentStatus[] {
    return [...this.TRANSITION_MATRIX[status]];
  }

  /**
   * 检查状态是否可用
   *
   * @description 判断部门状态是否可用（非禁用和删除状态）
   *
   * @param status - 部门状态
   * @returns 是否可用
   *
   * @example
   * ```typescript
   * const isAvailable = DepartmentStatusUtils.isAvailable(DepartmentStatus.ACTIVE); // true
   * const notAvailable = DepartmentStatusUtils.isAvailable(DepartmentStatus.DELETED); // false
   * ```
   *
   * @since 1.0.0
   */
  public static isAvailable(status: DepartmentStatus): boolean {
    return status !== DepartmentStatus.DISABLED && status !== DepartmentStatus.DELETED;
  }

  /**
   * 检查状态是否活跃
   *
   * @description 判断部门状态是否为活跃状态
   *
   * @param status - 部门状态
   * @returns 是否活跃
   *
   * @example
   * ```typescript
   * const isActive = DepartmentStatusUtils.isActive(DepartmentStatus.ACTIVE); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isActive(status: DepartmentStatus): boolean {
    return status === DepartmentStatus.ACTIVE;
  }
}
