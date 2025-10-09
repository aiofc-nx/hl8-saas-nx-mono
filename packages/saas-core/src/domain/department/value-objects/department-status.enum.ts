/**
 * 部门状态枚举
 *
 * @description 定义部门的生命周期状态
 *
 * ## 业务规则
 *
 * ### 部门状态
 * - ACTIVE: 活跃 - 部门正常运作
 * - INACTIVE: 停用 - 部门暂时停用，不接受新成员
 * - DELETED: 已删除 - 部门已软删除
 *
 * ### 状态转换
 * - ACTIVE ⇄ INACTIVE（可相互切换）
 * - ANY → DELETED（任何状态都可以删除）
 * - DELETED → 无转换（删除后不可恢复状态）
 *
 * @example
 * ```typescript
 * const status = DepartmentStatus.ACTIVE;
 * console.log(DepartmentStatusUtils.getDisplayName(status)); // '活跃'
 * ```
 *
 * @enum {string}
 * @since 1.0.0
 */
export enum DepartmentStatus {
  /** 活跃 - 部门正常运作 */
  ACTIVE = 'ACTIVE',

  /** 停用 - 部门暂时停用 */
  INACTIVE = 'INACTIVE',

  /** 已删除 - 软删除 */
  DELETED = 'DELETED',
}

/**
 * 部门状态辅助工具
 *
 * @class DepartmentStatusUtils
 */
export class DepartmentStatusUtils {
  /**
   * 获取所有部门状态
   *
   * @static
   * @returns {DepartmentStatus[]}
   */
  public static getAllStatuses(): DepartmentStatus[] {
    return Object.values(DepartmentStatus);
  }

  /**
   * 检查是否为有效的部门状态
   *
   * @static
   * @param {string} status - 待验证的状态
   * @returns {boolean}
   */
  public static isValidStatus(status: string): status is DepartmentStatus {
    return Object.values(DepartmentStatus).includes(status as DepartmentStatus);
  }

  /**
   * 从字符串转换为部门状态
   *
   * @static
   * @param {string} status - 状态字符串
   * @returns {DepartmentStatus}
   * @throws {Error} 当状态无效时抛出错误
   */
  public static fromString(status: string): DepartmentStatus {
    if (!this.isValidStatus(status)) {
      throw new Error(`无效的部门状态: ${status}`);
    }
    return status as DepartmentStatus;
  }

  /**
   * 获取部门状态的显示名称
   *
   * @static
   * @param {DepartmentStatus} status - 部门状态
   * @returns {string}
   */
  public static getDisplayName(status: DepartmentStatus): string {
    const names: Record<DepartmentStatus, string> = {
      [DepartmentStatus.ACTIVE]: '活跃',
      [DepartmentStatus.INACTIVE]: '停用',
      [DepartmentStatus.DELETED]: '已删除',
    };
    return names[status];
  }

  /**
   * 检查状态是否可以转换为目标状态
   *
   * @static
   * @param {DepartmentStatus} currentStatus - 当前状态
   * @param {DepartmentStatus} targetStatus - 目标状态
   * @returns {boolean}
   */
  public static canTransitionTo(
    currentStatus: DepartmentStatus,
    targetStatus: DepartmentStatus,
  ): boolean {
    // 定义允许的状态转换
    const transitions: Record<DepartmentStatus, DepartmentStatus[]> = {
      [DepartmentStatus.ACTIVE]: [DepartmentStatus.INACTIVE, DepartmentStatus.DELETED],
      [DepartmentStatus.INACTIVE]: [DepartmentStatus.ACTIVE, DepartmentStatus.DELETED],
      [DepartmentStatus.DELETED]: [], // 已删除状态不可转换
    };

    return transitions[currentStatus]?.includes(targetStatus) || false;
  }

  /**
   * 检查部门是否可用（活跃状态）
   *
   * @static
   * @param {DepartmentStatus} status - 部门状态
   * @returns {boolean}
   */
  public static isAvailable(status: DepartmentStatus): boolean {
    return status === DepartmentStatus.ACTIVE;
  }

  /**
   * 检查部门是否已删除
   *
   * @static
   * @param {DepartmentStatus} status - 部门状态
   * @returns {boolean}
   */
  public static isDeleted(status: DepartmentStatus): boolean {
    return status === DepartmentStatus.DELETED;
  }
}

