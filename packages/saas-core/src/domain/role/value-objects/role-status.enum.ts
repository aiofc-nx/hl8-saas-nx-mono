/**
 * 角色状态枚举
 *
 * @description 定义角色的生命周期状态
 *
 * ## 业务规则
 *
 * ### 角色状态
 * - ACTIVE: 活跃 - 角色可正常使用
 * - INACTIVE: 停用 - 角色暂时停用，不可分配给用户
 * - DELETED: 已删除 - 角色已软删除
 *
 * ### 状态转换
 * - ACTIVE ⇄ INACTIVE（可相互切换）
 * - ANY → DELETED（任何状态都可以删除）
 * - DELETED → 无转换（删除后不可恢复状态）
 * - 系统角色（isSystem=true）不可删除
 *
 * @example
 * ```typescript
 * const status = RoleStatus.ACTIVE;
 * console.log(RoleStatusUtils.getDisplayName(status)); // '活跃'
 * ```
 *
 * @enum {string}
 * @since 1.0.0
 */
export enum RoleStatus {
  /** 活跃 - 角色可正常使用 */
  ACTIVE = 'ACTIVE',

  /** 停用 - 角色暂时停用 */
  INACTIVE = 'INACTIVE',

  /** 已删除 - 软删除 */
  DELETED = 'DELETED',
}

/**
 * 角色状态辅助工具
 *
 * @class RoleStatusUtils
 */
export class RoleStatusUtils {
  /**
   * 获取所有角色状态
   *
   * @static
   * @returns {RoleStatus[]}
   */
  public static getAllStatuses(): RoleStatus[] {
    return Object.values(RoleStatus);
  }

  /**
   * 检查是否为有效的角色状态
   *
   * @static
   * @param {string} status - 待验证的状态
   * @returns {boolean}
   */
  public static isValidStatus(status: string): status is RoleStatus {
    return Object.values(RoleStatus).includes(status as RoleStatus);
  }

  /**
   * 从字符串转换为角色状态
   *
   * @static
   * @param {string} status - 状态字符串
   * @returns {RoleStatus}
   * @throws {Error} 当状态无效时抛出错误
   */
  public static fromString(status: string): RoleStatus {
    if (!this.isValidStatus(status)) {
      throw new Error(`无效的角色状态: ${status}`);
    }
    return status as RoleStatus;
  }

  /**
   * 获取角色状态的显示名称
   *
   * @static
   * @param {RoleStatus} status - 角色状态
   * @returns {string}
   */
  public static getDisplayName(status: RoleStatus): string {
    const names: Record<RoleStatus, string> = {
      [RoleStatus.ACTIVE]: '活跃',
      [RoleStatus.INACTIVE]: '停用',
      [RoleStatus.DELETED]: '已删除',
    };
    return names[status];
  }

  /**
   * 检查状态是否可以转换为目标状态
   *
   * @static
   * @param {RoleStatus} currentStatus - 当前状态
   * @param {RoleStatus} targetStatus - 目标状态
   * @returns {boolean}
   */
  public static canTransitionTo(currentStatus: RoleStatus, targetStatus: RoleStatus): boolean {
    // 定义允许的状态转换
    const transitions: Record<RoleStatus, RoleStatus[]> = {
      [RoleStatus.ACTIVE]: [RoleStatus.INACTIVE, RoleStatus.DELETED],
      [RoleStatus.INACTIVE]: [RoleStatus.ACTIVE, RoleStatus.DELETED],
      [RoleStatus.DELETED]: [], // 已删除状态不可转换
    };

    return transitions[currentStatus]?.includes(targetStatus) || false;
  }

  /**
   * 检查角色是否可用（活跃状态）
   *
   * @static
   * @param {RoleStatus} status - 角色状态
   * @returns {boolean}
   */
  public static isAvailable(status: RoleStatus): boolean {
    return status === RoleStatus.ACTIVE;
  }

  /**
   * 检查角色是否已删除
   *
   * @static
   * @param {RoleStatus} status - 角色状态
   * @returns {boolean}
   */
  public static isDeleted(status: RoleStatus): boolean {
    return status === RoleStatus.DELETED;
  }
}

