/**
 * 组织状态枚举
 *
 * @description 定义组织的生命周期状态
 * 组织状态转换遵循严格的业务规则，确保数据一致性
 *
 * ## 业务规则
 *
 * ### 状态转换规则
 * - PENDING: 组织创建后的初始状态，等待激活
 * - ACTIVE: 组织正常使用状态，可以执行所有业务操作
 * - SUSPENDED: 组织被暂停，不能执行业务操作但数据保留
 * - DISABLED: 组织被禁用，完全不能使用
 * - ARCHIVED: 组织被归档，历史数据保留但不再使用
 * - DELETED: 组织被删除，数据标记删除但物理保留
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
 * const status = OrganizationStatus.PENDING;
 * const canActivate = OrganizationStatusUtils.canTransitionTo(status, OrganizationStatus.ACTIVE); // true
 * const canDelete = OrganizationStatusUtils.canTransitionTo(status, OrganizationStatus.DELETED); // false
 * ```
 *
 * @since 1.0.0
 */
export enum OrganizationStatus {
  /**
   * 待激活状态
   * 
   * @description 组织创建后的初始状态
   * 此时组织已创建但尚未激活，不能执行业务操作
   */
  PENDING = 'PENDING',

  /**
   * 活跃状态
   * 
   * @description 组织正常使用状态
   * 可以执行所有业务操作，是组织的主要工作状态
   */
  ACTIVE = 'ACTIVE',

  /**
   * 暂停状态
   * 
   * @description 组织被临时暂停
   * 不能执行业务操作但数据完整保留，可随时恢复
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * 禁用状态
   * 
   * @description 组织被禁用
   * 完全不能使用，但数据保留，可重新激活
   */
  DISABLED = 'DISABLED',

  /**
   * 归档状态
   * 
   * @description 组织被归档
   * 历史数据保留但不再使用，可重新激活
   */
  ARCHIVED = 'ARCHIVED',

  /**
   * 删除状态
   * 
   * @description 组织被标记删除
   * 数据标记删除但物理保留，不可恢复
   */
  DELETED = 'DELETED',

  /**
   * 拒绝状态
   * 
   * @description 组织申请被拒绝
   * 组织申请未通过审核，可以重新申请
   */
  REJECTED = 'REJECTED'
}

/**
 * 组织状态工具类
 *
 * @description 提供组织状态相关的工具方法
 * 包括状态转换验证、状态描述等功能
 *
 * @since 1.0.0
 */
export class OrganizationStatusUtils {
  /**
   * 状态转换矩阵
   * 
   * @description 定义允许的状态转换关系
   * 键为当前状态，值为可转换的目标状态数组
   */
  private static readonly TRANSITION_MATRIX: Record<OrganizationStatus, OrganizationStatus[]> = {
    [OrganizationStatus.PENDING]: [OrganizationStatus.ACTIVE, OrganizationStatus.DISABLED],
    [OrganizationStatus.ACTIVE]: [OrganizationStatus.SUSPENDED, OrganizationStatus.DISABLED, OrganizationStatus.ARCHIVED],
    [OrganizationStatus.SUSPENDED]: [OrganizationStatus.ACTIVE, OrganizationStatus.DISABLED, OrganizationStatus.ARCHIVED],
    [OrganizationStatus.DISABLED]: [OrganizationStatus.ACTIVE],
    [OrganizationStatus.ARCHIVED]: [OrganizationStatus.ACTIVE],
    [OrganizationStatus.DELETED]: [], // 终态，不可转换
    [OrganizationStatus.REJECTED]: [OrganizationStatus.PENDING] // 可以重新申请
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
   * const isValid = OrganizationStatusUtils.canTransitionTo(
   *   OrganizationStatus.PENDING, 
   *   OrganizationStatus.ACTIVE
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static canTransitionTo(fromStatus: OrganizationStatus, toStatus: OrganizationStatus): boolean {
    const allowedTransitions = this.TRANSITION_MATRIX[fromStatus];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * 获取状态的中文描述
   *
   * @description 返回状态的中文描述，用于界面显示
   *
   * @param status - 组织状态
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = OrganizationStatusUtils.getDescription(OrganizationStatus.ACTIVE);
   * // "活跃"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(status: OrganizationStatus): string {
    const descriptions: Record<OrganizationStatus, string> = {
      [OrganizationStatus.PENDING]: '待激活',
      [OrganizationStatus.ACTIVE]: '活跃',
      [OrganizationStatus.SUSPENDED]: '暂停',
      [OrganizationStatus.DISABLED]: '禁用',
      [OrganizationStatus.ARCHIVED]: '已归档',
      [OrganizationStatus.DELETED]: '已删除',
      [OrganizationStatus.REJECTED]: '已拒绝'
    };

    return descriptions[status];
  }

  /**
   * 检查状态是否为终态
   *
   * @description 判断状态是否为终态（不可再转换的状态）
   *
   * @param status - 组织状态
   * @returns 是否为终态
   *
   * @example
   * ```typescript
   * const isTerminal = OrganizationStatusUtils.isTerminal(OrganizationStatus.DELETED);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isTerminal(status: OrganizationStatus): boolean {
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
   * const transitions = OrganizationStatusUtils.getAvailableTransitions(OrganizationStatus.PENDING);
   * // [OrganizationStatus.ACTIVE, OrganizationStatus.DISABLED]
   * ```
   *
   * @since 1.0.0
   */
  public static getAvailableTransitions(status: OrganizationStatus): OrganizationStatus[] {
    return [...this.TRANSITION_MATRIX[status]];
  }

  /**
   * 检查状态是否可用
   *
   * @description 判断组织状态是否可用（非禁用和删除状态）
   *
   * @param status - 组织状态
   * @returns 是否可用
   *
   * @example
   * ```typescript
   * const isAvailable = OrganizationStatusUtils.isAvailable(OrganizationStatus.ACTIVE); // true
   * const notAvailable = OrganizationStatusUtils.isAvailable(OrganizationStatus.DELETED); // false
   * ```
   *
   * @since 1.0.0
   */
  public static isAvailable(status: OrganizationStatus): boolean {
    return status !== OrganizationStatus.DISABLED && status !== OrganizationStatus.DELETED;
  }

  /**
   * 检查状态是否活跃
   *
   * @description 判断组织状态是否为活跃状态
   *
   * @param status - 组织状态
   * @returns 是否活跃
   *
   * @example
   * ```typescript
   * const isActive = OrganizationStatusUtils.isActive(OrganizationStatus.ACTIVE); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isActive(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.ACTIVE;
  }
}
