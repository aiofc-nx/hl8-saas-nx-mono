/**
 * 权限状态枚举
 *
 * @description 定义权限的生命周期状态
 *
 * ## 业务规则
 *
 * ### 权限状态
 * - ACTIVE: 活跃 - 权限可正常使用
 * - INACTIVE: 停用 - 权限暂时停用，不可授予角色
 * - DELETED: 已删除 - 权限已软删除
 *
 * ### 状态转换
 * - ACTIVE ⇄ INACTIVE（可相互切换）
 * - ANY → DELETED（任何状态都可以删除）
 * - DELETED → 无转换（删除后不可恢复状态）
 * - 系统权限（isSystem=true）不可删除
 *
 * @example
 * ```typescript
 * const status = PermissionStatus.ACTIVE;
 * console.log(PermissionStatusUtils.getDisplayName(status)); // '活跃'
 * ```
 *
 * @enum {string}
 * @since 1.0.0
 */
export enum PermissionStatus {
  /** 活跃 - 权限可正常使用 */
  ACTIVE = 'ACTIVE',

  /** 停用 - 权限暂时停用 */
  INACTIVE = 'INACTIVE',

  /** 已删除 - 软删除 */
  DELETED = 'DELETED',
}

/**
 * 权限状态辅助工具
 *
 * @class PermissionStatusUtils
 */
export class PermissionStatusUtils {
  /**
   * 获取所有权限状态
   *
   * @static
   * @returns {PermissionStatus[]}
   */
  public static getAllStatuses(): PermissionStatus[] {
    return Object.values(PermissionStatus);
  }

  /**
   * 检查是否为有效的权限状态
   *
   * @static
   * @param {string} status - 待验证的状态
   * @returns {boolean}
   */
  public static isValidStatus(status: string): status is PermissionStatus {
    return Object.values(PermissionStatus).includes(status as PermissionStatus);
  }

  /**
   * 从字符串转换为权限状态
   *
   * @static
   * @param {string} status - 状态字符串
   * @returns {PermissionStatus}
   * @throws {Error} 当状态无效时抛出错误
   */
  public static fromString(status: string): PermissionStatus {
    if (!this.isValidStatus(status)) {
      throw new Error(`无效的权限状态: ${status}`);
    }
    return status as PermissionStatus;
  }

  /**
   * 获取权限状态的显示名称
   *
   * @static
   * @param {PermissionStatus} status - 权限状态
   * @returns {string}
   */
  public static getDisplayName(status: PermissionStatus): string {
    const names: Record<PermissionStatus, string> = {
      [PermissionStatus.ACTIVE]: '活跃',
      [PermissionStatus.INACTIVE]: '停用',
      [PermissionStatus.DELETED]: '已删除',
    };
    return names[status];
  }

  /**
   * 检查状态是否可以转换为目标状态
   *
   * @static
   * @param {PermissionStatus} currentStatus - 当前状态
   * @param {PermissionStatus} targetStatus - 目标状态
   * @returns {boolean}
   */
  public static canTransitionTo(
    currentStatus: PermissionStatus,
    targetStatus: PermissionStatus,
  ): boolean {
    // 定义允许的状态转换
    const transitions: Record<PermissionStatus, PermissionStatus[]> = {
      [PermissionStatus.ACTIVE]: [PermissionStatus.INACTIVE, PermissionStatus.DELETED],
      [PermissionStatus.INACTIVE]: [PermissionStatus.ACTIVE, PermissionStatus.DELETED],
      [PermissionStatus.DELETED]: [], // 已删除状态不可转换
    };

    return transitions[currentStatus]?.includes(targetStatus) || false;
  }

  /**
   * 检查权限是否可用（活跃状态）
   *
   * @static
   * @param {PermissionStatus} status - 权限状态
   * @returns {boolean}
   */
  public static isAvailable(status: PermissionStatus): boolean {
    return status === PermissionStatus.ACTIVE;
  }

  /**
   * 检查权限是否已删除
   *
   * @static
   * @param {PermissionStatus} status - 权限状态
   * @returns {boolean}
   */
  public static isDeleted(status: PermissionStatus): boolean {
    return status === PermissionStatus.DELETED;
  }
}

